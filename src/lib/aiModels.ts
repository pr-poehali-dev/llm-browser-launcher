import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { pipeline, env } from '@huggingface/transformers';

// Конфигурация для WebLLM
env.allowLocalModels = false;
env.allowRemoteModels = true;

export interface AIModel {
  id: string;
  name: string;
  type: 'text' | 'image';
  size: string;
  status: 'ready' | 'downloading' | 'available' | 'error';
  progress?: number;
  description: string;
  modelPath?: string;
  engine?: any;
}

class AIModelManager {
  private textModels: Map<string, any> = new Map();
  private imageModels: Map<string, any> = new Map();
  private downloadCallbacks: Map<string, (progress: number) => void> = new Map();

  // WebLLM модели
  private webLLMConfigs = {
    'Llama-3.1-8B-Instruct-q4f32_1-MLC': {
      model: 'https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC',
      model_id: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-3.1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm'
    },
    'Phi-3.5-mini-instruct-q4f16_1-MLC': {
      model: 'https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f16_1-MLC',
      model_id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
      model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Phi-3.5-mini-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm'
    }
  };

  async initializeTextModel(modelId: string): Promise<any> {
    try {
      if (this.textModels.has(modelId)) {
        return this.textModels.get(modelId);
      }

      console.log(`Инициализация модели: ${modelId}`);
      
      // Выбираем конфигурацию модели
      let engineConfig;
      if (modelId.includes('Llama')) {
        engineConfig = this.webLLMConfigs['Llama-3.1-8B-Instruct-q4f32_1-MLC'];
      } else {
        engineConfig = this.webLLMConfigs['Phi-3.5-mini-instruct-q4f16_1-MLC'];
      }

      const engine = await CreateMLCEngine(
        engineConfig.model_id,
        {
          initProgressCallback: (progress) => {
            console.log(`Загрузка ${modelId}: ${Math.round(progress.progress * 100)}%`);
            const callback = this.downloadCallbacks.get(modelId);
            if (callback) {
              callback(Math.round(progress.progress * 100));
            }
          }
        }
      );

      this.textModels.set(modelId, engine);
      return engine;
    } catch (error) {
      console.error(`Ошибка инициализации модели ${modelId}:`, error);
      throw error;
    }
  }

  async generateText(modelId: string, prompt: string): Promise<string> {
    try {
      const engine = await this.initializeTextModel(modelId);
      
      const messages = [
        { role: 'user', content: prompt }
      ];

      const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      return reply.choices[0]?.message?.content || 'Ошибка генерации ответа';
    } catch (error) {
      console.error(`Ошибка генерации текста:`, error);
      return `Ошибка: ${error.message}`;
    }
  }

  async initializeImageModel(modelId: string): Promise<any> {
    try {
      if (this.imageModels.has(modelId)) {
        return this.imageModels.get(modelId);
      }

      console.log(`Загрузка модели изображений: ${modelId}`);
      
      // Используем Transformers.js для генерации изображений
      let modelName;
      if (modelId.includes('FLUX')) {
        modelName = 'black-forest-labs/FLUX.1-schnell';
      } else if (modelId.includes('Stable')) {
        modelName = 'stabilityai/stable-diffusion-xl-base-1.0';
      } else {
        modelName = 'runwayml/stable-diffusion-v1-5';
      }

      const pipe = await pipeline('text-to-image', modelName, {
        progress_callback: (progress) => {
          console.log(`Загрузка ${modelId}: ${Math.round(progress.progress || 0)}%`);
          const callback = this.downloadCallbacks.get(modelId);
          if (callback) {
            callback(Math.round(progress.progress || 0));
          }
        }
      });

      this.imageModels.set(modelId, pipe);
      return pipe;
    } catch (error) {
      console.error(`Ошибка инициализации модели изображений ${modelId}:`, error);
      throw error;
    }
  }

  async generateImage(modelId: string, prompt: string): Promise<string> {
    try {
      const model = await this.initializeImageModel(modelId);
      
      const result = await model(prompt, {
        num_inference_steps: 20,
        guidance_scale: 7.5,
      });

      // Преобразуем результат в data URL
      if (result && result.images && result.images[0]) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = result.images[0];
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.putImageData(img, 0, 0);
        
        return canvas.toDataURL();
      }
      
      throw new Error('Не удалось сгенерировать изображение');
    } catch (error) {
      console.error(`Ошибка генерации изображения:`, error);
      throw error;
    }
  }

  setDownloadCallback(modelId: string, callback: (progress: number) => void) {
    this.downloadCallbacks.set(modelId, callback);
  }

  removeDownloadCallback(modelId: string) {
    this.downloadCallbacks.delete(modelId);
  }

  async checkWebGPUSupport(): Promise<boolean> {
    if (!navigator.gpu) {
      console.warn('WebGPU не поддерживается в этом браузере');
      return false;
    }
    
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch (error) {
      console.error('Ошибка проверки WebGPU:', error);
      return false;
    }
  }

  getModelStatus(modelId: string): 'ready' | 'loading' | 'error' | 'not_loaded' {
    if (this.textModels.has(modelId) || this.imageModels.has(modelId)) {
      return 'ready';
    }
    return 'not_loaded';
  }
}

export const aiModelManager = new AIModelManager();

// Проверяем поддержку WebGPU при загрузке
aiModelManager.checkWebGPUSupport().then(supported => {
  if (supported) {
    console.log('✅ WebGPU поддерживается - модели будут работать с ускорением');
  } else {
    console.log('⚠️ WebGPU не поддерживается - модели будут работать на CPU');
  }
});