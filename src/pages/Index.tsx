import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { aiModelManager } from '@/lib/aiModels';

const Index = () => {
  const [activeModel, setActiveModel] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatuses, setModelStatuses] = useState({});

  const textModels = [
    { id: 'Llama-3.1-8B', name: 'Llama 3.1 8B', type: 'text', size: '4.7GB', status: 'available', description: 'Мощная открытая языковая модель Meta', category: 'Общение' },
    { id: 'Phi-3.5-mini', name: 'Phi-3.5 Mini', type: 'text', size: '800MB', status: 'available', description: 'Компактная быстрая модель Microsoft', category: 'Быстрый чат' },
    { id: 'Gemma-2B', name: 'Gemma 2B', type: 'text', size: '1.4GB', status: 'available', description: 'Легковесная модель от Google', category: 'Быстрый чат' },
    { id: 'CodeLlama-7B', name: 'Code Llama 7B', type: 'text', size: '3.8GB', status: 'available', description: 'Специализированная модель для программирования', category: 'Программирование' },
    { id: 'Mistral-7B', name: 'Mistral 7B', type: 'text', size: '4.1GB', status: 'available', description: 'Европейская открытая модель с высокой производительностью', category: 'Общение' },
    { id: 'TinyLlama-1.1B', name: 'TinyLlama 1.1B', type: 'text', size: '637MB', status: 'available', description: 'Сверхлегкая модель для слабых устройств', category: 'Легкий' },
    { id: 'Qwen-1.8B', name: 'Qwen 1.8B', type: 'text', size: '1.0GB', status: 'available', description: 'Многоязычная модель от Alibaba', category: 'Многоязычный' },
    { id: 'Yi-6B-Chat', name: 'Yi 6B Chat', type: 'text', size: '3.4GB', status: 'available', description: 'Продвинутая китайская модель для диалогов', category: 'Общение' },
  ];

  const imageModels = [
    { id: 'FLUX.1-dev', name: 'FLUX.1 Dev', type: 'image', size: '11.9GB', status: 'available', description: 'Высококачественная генерация изображений от Black Forest Labs', category: 'Высокое качество' },
    { id: 'Stable-Diffusion-XL', name: 'Stable Diffusion XL', type: 'image', size: '6.9GB', status: 'available', description: 'Популярная модель для создания изображений', category: 'Универсальная' },
    { id: 'SDXL-Turbo', name: 'SDXL Turbo', type: 'image', size: '6.9GB', status: 'available', description: 'Быстрая версия Stable Diffusion XL', category: 'Скорость' },
    { id: 'Kandinsky-2.2', name: 'Kandinsky 2.2', type: 'image', size: '5.2GB', status: 'available', description: 'Российская модель с уникальным стилем', category: 'Художественный' },
    { id: 'DALLE-mini', name: 'DALL-E mini', type: 'image', size: '1.3GB', status: 'available', description: 'Легкая версия DALL-E для быстрой генерации', category: 'Легкий' },
    { id: 'Waifu-Diffusion', name: 'Waifu Diffusion', type: 'image', size: '4.3GB', status: 'available', description: 'Специализированная модель для аниме-стиля', category: 'Аниме' },
    { id: 'Midjourney-v6', name: 'Midjourney v6', type: 'image', size: '8.7GB', status: 'available', description: 'Имитация стиля Midjourney', category: 'Художественный' },
    { id: 'Realistic-Vision', name: 'Realistic Vision', type: 'image', size: '7.1GB', status: 'available', description: 'Модель для создания фотореалистичных изображений', category: 'Реализм' },
  ];

  const allModels = [...textModels, ...imageModels];

  useEffect(() => {
    // Инициализируем статусы моделей
    const initialStatuses = {};
    allModels.forEach(model => {
      initialStatuses[model.id] = {
        status: 'available',
        progress: 0
      };
    });
    setModelStatuses(initialStatuses);
  }, []);

  const sendMessage = async () => {
    if (inputMessage.trim() && activeModel) {
      setChatMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
      setIsLoading(true);
      
      try {
        // Проверяем, что модель загружена
        if (modelStatuses[activeModel.id]?.status !== 'ready') {
          // Начинаем загрузку модели
          setModelStatuses(prev => ({
            ...prev,
            [activeModel.id]: { status: 'downloading', progress: 0 }
          }));

          // Устанавливаем callback для отслеживания прогресса
          aiModelManager.setDownloadCallback(activeModel.id, (progress) => {
            setModelStatuses(prev => ({
              ...prev,
              [activeModel.id]: { status: 'downloading', progress }
            }));
          });
        }

        const response = await aiModelManager.generateText(activeModel.id, inputMessage);
        
        setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
        
        // Обновляем статус модели как готовую
        setModelStatuses(prev => ({
          ...prev,
          [activeModel.id]: { status: 'ready', progress: 100 }
        }));
        
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Ошибка: ${error.message}. Убедитесь, что WebGPU поддерживается в вашем браузере.` 
        }]);
        
        setModelStatuses(prev => ({
          ...prev,
          [activeModel.id]: { status: 'error', progress: 0 }
        }));
      } finally {
        setIsLoading(false);
        setInputMessage('');
        aiModelManager.removeDownloadCallback(activeModel.id);
      }
    }
  };

  const generateImage = async () => {
    if (imagePrompt.trim() && activeModel?.type === 'image') {
      setIsLoading(true);
      
      try {
        // Проверяем, что модель загружена
        if (modelStatuses[activeModel.id]?.status !== 'ready') {
          setModelStatuses(prev => ({
            ...prev,
            [activeModel.id]: { status: 'downloading', progress: 0 }
          }));

          aiModelManager.setDownloadCallback(activeModel.id, (progress) => {
            setModelStatuses(prev => ({
              ...prev,
              [activeModel.id]: { status: 'downloading', progress }
            }));
          });
        }

        const imageUrl = await aiModelManager.generateImage(activeModel.id, imagePrompt);
        
        const newImage = {
          id: Date.now(),
          prompt: imagePrompt,
          url: imageUrl,
          model: activeModel.name
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        
        setModelStatuses(prev => ({
          ...prev,
          [activeModel.id]: { status: 'ready', progress: 100 }
        }));
        
      } catch (error) {
        console.error('Ошибка генерации изображения:', error);
        
        // Показываем placeholder в случае ошибки
        const newImage = {
          id: Date.now(),
          prompt: imagePrompt,
          url: 'https://v3.fal.media/files/rabbit/eaSJ0ghtmgQdr9ebB9M_y_output.png',
          model: activeModel.name,
          error: `Ошибка: ${error.message}`
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        
        setModelStatuses(prev => ({
          ...prev,
          [activeModel.id]: { status: 'error', progress: 0 }
        }));
      } finally {
        setIsLoading(false);
        setImagePrompt('');
        aiModelManager.removeDownloadCallback(activeModel.id);
      }
    }
  };

  const ModelCard = ({ model }) => {
    const currentStatus = modelStatuses[model.id] || { status: 'available', progress: 0 };
    
    return (
      <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
        activeModel?.id === model.id ? 'ring-2 ring-primary border-primary' : ''
      }`} onClick={() => setActiveModel(model)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name={model.type === 'text' ? 'MessageSquare' : 'Image'} size={20} className="text-primary" />
              <div>
                <CardTitle className="text-base">{model.name}</CardTitle>
                <div className="text-xs text-muted-foreground">{model.category}</div>
              </div>
            </div>
            <Badge variant={
              currentStatus.status === 'ready' ? 'default' : 
              currentStatus.status === 'downloading' ? 'secondary' : 
              currentStatus.status === 'error' ? 'destructive' : 'outline'
            }>
              {currentStatus.status === 'ready' ? 'Готово' : 
               currentStatus.status === 'downloading' ? 'Загрузка' : 
               currentStatus.status === 'error' ? 'Ошибка' : 'Доступно'}
            </Badge>
          </div>
          <CardDescription className="text-sm">{model.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Размер: {model.size}</span>
              <span className="capitalize">{model.type === 'text' ? 'Текст' : 'Изображения'}</span>
            </div>
            {currentStatus.status === 'downloading' && (
              <div className="space-y-1">
                <Progress value={currentStatus.progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">{currentStatus.progress}%</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Icon name="Brain" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">DinoTidusNeiroSite</h1>
                <p className="text-xs text-slate-500">Браузерные нейросети</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Icon name="Upload" size={16} className="mr-2" />
                Импорт модели
              </Button>
              <Button variant="outline" size="sm">
                <Icon name="Settings" size={16} className="mr-2" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Левая панель - Каталог моделей */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Библиотека моделей</h2>
              <p className="text-slate-600 text-sm mb-6">Выберите модель для работы</p>
            </div>
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="text-xs">Все ({allModels.length})</TabsTrigger>
                <TabsTrigger value="text" className="text-xs">Текст ({textModels.length})</TabsTrigger>
                <TabsTrigger value="image" className="text-xs">Фото ({imageModels.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-3 mt-4">
                {allModels.map(model => <ModelCard key={model.id} model={model} />)}
              </TabsContent>
              
              <TabsContent value="text" className="space-y-3 mt-4">
                {textModels.map(model => <ModelCard key={model.id} model={model} />)}
              </TabsContent>
              
              <TabsContent value="image" className="space-y-3 mt-4">
                {imageModels.map(model => <ModelCard key={model.id} model={model} />)}
              </TabsContent>
            </Tabs>
          </div>

          {/* Правая панель - Рабочая область */}
          <div className="lg:col-span-2">
            {!activeModel ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <Icon name="Sparkles" size={48} className="text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Выберите модель</h3>
                  <p className="text-slate-500">Для начала работы выберите модель из библиотеки слева</p>
                </CardContent>
              </Card>
            ) : activeModel.type === 'text' ? (
              /* Интерфейс чата */
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="MessageSquare" size={20} />
                        Чат с {activeModel.name}
                      </CardTitle>
                      <CardDescription>Текстовая языковая модель</CardDescription>
                    </div>
                    <Badge variant="outline">{activeModel.size}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 mb-4 min-h-[400px] overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                          <Icon name="MessageCircle" size={32} className="mx-auto mb-2 opacity-50" />
                          <p>Начните диалог с моделью</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message, idx) => (
                          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === 'user' 
                                ? 'bg-primary text-white' 
                                : 'bg-white border border-slate-200'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Введите ваше сообщение..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={isLoading}
                    />
                    <Button onClick={sendMessage} disabled={isLoading}>
                      <Icon name="Send" size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Интерфейс генерации изображений */
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="Image" size={20} />
                        Генерация с {activeModel.name}
                      </CardTitle>
                      <CardDescription>Модель создания изображений</CardDescription>
                    </div>
                    <Badge variant="outline">{activeModel.size}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <Textarea 
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Опишите изображение, которое хотите создать..."
                        rows={3}
                        disabled={isLoading}
                      />
                      <Button 
                        onClick={generateImage} 
                        disabled={isLoading}
                        className="self-end"
                      >
                        {isLoading ? (
                          <Icon name="Loader2" size={16} className="animate-spin" />
                        ) : (
                          <Icon name="Sparkles" size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 overflow-y-auto">
                    {generatedImages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                          <Icon name="ImagePlus" size={32} className="mx-auto mb-2 opacity-50" />
                          <p>Сгенерированные изображения появятся здесь</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedImages.map((image) => (
                          <div key={image.id} className="bg-white rounded-lg p-3 border border-slate-200">
                            <img 
                              src={image.url} 
                              alt={image.prompt}
                              className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                            <p className="text-xs text-slate-600 mb-2">{image.prompt}</p>
                            <div className="flex justify-between items-center">
                              <Badge variant="secondary" className="text-xs">{image.model}</Badge>
                              <Button variant="ghost" size="sm">
                                <Icon name="Download" size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;