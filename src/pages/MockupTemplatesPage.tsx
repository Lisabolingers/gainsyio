import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Upload, X, Store, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: any[];
  text_areas: any[];
  logo_area?: any;
  design_type?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  store_url?: string;
  is_active: boolean;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRetryBanner, setShowRetryBanner] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // CRITICAL: Canvas ve Design States - ESKİ HALİ
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [designType, setDesignType] = useState<'black' | 'white'>('black');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [designAreas, setDesignAreas] = useState<any[]>([]);
  const [textAreas, setTextAreas] = useState<any[]>([]);
  const [logoArea, setLogoArea] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadStores();
      loadTemplates();
    }
  }, [user]);

  const loadStores = async () => {
    try {
      console.log('🔄 Etsy mağazaları yükleniyor...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'etsy')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Mağaza yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy mağazası yüklendi`);
      setStores(data || []);
      
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Mağaza yükleme genel hatası:', error);
    }
  };

  const loadTemplates = async (showRetry = false) => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      if (showRetry) {
        setShowRetryBanner(true);
      }

      // Test connection first
      const connectionOk = await testSupabaseConnection();
      if (!connectionOk) {
        throw new Error('Supabase bağlantısı başarısız. Lütfen internet bağlantınızı kontrol edin.');
      }

      console.log('🔄 Mockup template\'ler yükleniyor...');
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup template yüklendi`);
      setTemplates(data || []);
      setShowRetryBanner(false);
      setRetryCount(0);
    } catch (error: any) {
      console.error('❌ Template yükleme genel hatası:', error);
      
      // Enhanced error handling
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error instanceof TypeError) {
        setConnectionError('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
      } else if (error.message?.includes('Supabase bağlantısı başarısız')) {
        setConnectionError('Veritabanı bağlantısı kurulamadı. Lütfen tekrar deneyin.');
      } else {
        setConnectionError(error.message || 'Bilinmeyen bir hata oluştu.');
      }
      
      // Set empty array as fallback
      setTemplates([]);
      setShowRetryBanner(false);
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = async () => {
    setRetryCount(prev => prev + 1);
    await loadTemplates(true);
  };

  // CRITICAL: Canvas Drawing Functions - ESKİ HALİ
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if exists
    if (backgroundPreview) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawAreas(ctx);
      };
      img.src = backgroundPreview;
    } else {
      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawAreas(ctx);
    }
  };

  const drawAreas = (ctx: CanvasRenderingContext2D) => {
    // Draw design areas
    designAreas.forEach((area, index) => {
      ctx.strokeStyle = selectedArea === `design-${index}` ? '#ff6b00' : '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // Label
      ctx.fillStyle = '#0066ff';
      ctx.font = '12px Arial';
      ctx.fillText(`Design ${index + 1}`, area.x + 5, area.y + 15);
    });

    // Draw text areas
    textAreas.forEach((area, index) => {
      ctx.strokeStyle = selectedArea === `text-${index}` ? '#ff6b00' : '#00aa00';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // Label
      ctx.fillStyle = '#00aa00';
      ctx.font = '12px Arial';
      ctx.fillText(`Text ${index + 1}`, area.x + 5, area.y + 15);
    });

    // Draw logo area
    if (logoArea) {
      ctx.strokeStyle = selectedArea === 'logo' ? '#ff6b00' : '#aa00aa';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 3]);
      ctx.strokeRect(logoArea.x, logoArea.y, logoArea.width, logoArea.height);
      
      // Label
      ctx.fillStyle = '#aa00aa';
      ctx.font = '12px Arial';
      ctx.fillText('Logo Area', logoArea.x + 5, logoArea.y + 15);
    }

    ctx.setLineDash([]); // Reset line dash
  };

  useEffect(() => {
    drawCanvas();
  }, [backgroundPreview, designAreas, textAreas, logoArea, selectedArea, canvasSize]);

  // CRITICAL: Area Management Functions - ESKİ HALİ
  const addDesignArea = () => {
    const newArea = {
      id: `design-${Date.now()}`,
      x: 50 + designAreas.length * 20,
      y: 50 + designAreas.length * 20,
      width: 150,
      height: 150,
      rotation: 0
    };
    setDesignAreas([...designAreas, newArea]);
    setSelectedArea(`design-${designAreas.length}`);
  };

  const addTextArea = () => {
    const newArea = {
      id: `text-${Date.now()}`,
      x: 100 + textAreas.length * 20,
      y: 100 + textAreas.length * 20,
      width: 200,
      height: 50,
      fontSize: 16,
      fontFamily: 'Arial',
      color: designType === 'black' ? '#000000' : '#ffffff'
    };
    setTextAreas([...textAreas, newArea]);
    setSelectedArea(`text-${textAreas.length}`);
  };

  const addLogoArea = () => {
    if (logoArea) {
      alert('Logo alanı zaten mevcut!');
      return;
    }
    
    const newLogoArea = {
      id: 'logo',
      x: 200,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0
    };
    setLogoArea(newLogoArea);
    setSelectedArea('logo');
  };

  // CRITICAL: Canvas Click Handler - ESKİ HALİ
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on any area
    let clickedArea = null;

    // Check design areas
    designAreas.forEach((area, index) => {
      if (x >= area.x && x <= area.x + area.width && 
          y >= area.y && y <= area.y + area.height) {
        clickedArea = `design-${index}`;
      }
    });

    // Check text areas
    textAreas.forEach((area, index) => {
      if (x >= area.x && x <= area.x + area.width && 
          y >= area.y && y <= area.y + area.height) {
        clickedArea = `text-${index}`;
      }
    });

    // Check logo area
    if (logoArea && x >= logoArea.x && x <= logoArea.x + logoArea.width && 
        y >= logoArea.y && y <= logoArea.y + logoArea.height) {
      clickedArea = 'logo';
    }

    setSelectedArea(clickedArea);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Lütfen template adı girin!');
      return;
    }

    if (!backgroundImage) {
      alert('Lütfen bir background görsel seçin!');
      return;
    }

    if (!user) {
      alert('Kullanıcı girişi gerekli!');
      return;
    }

    try {
      console.log('💾 Mockup template kaydediliyor...');

      // Convert image to base64
      const base64Image = await fileToBase64(backgroundImage);

      const templateData = {
        user_id: user.id,
        name: templateName,
        image_url: base64Image,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        is_default: false
      };

      const { data, error } = await supabase
        .from('mockup_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Template kaydetme hatası:', error);
        alert('Template kaydedilemedi: ' + error.message);
        return;
      }

      console.log('✅ Template başarıyla kaydedildi:', data);
      await loadTemplates();
      
      // Reset form
      setTemplateName('');
      setBackgroundImage(null);
      setBackgroundPreview('');
      setDesignType('black');
      setDesignAreas([]);
      setTextAreas([]);
      setLogoArea(null);
      setSelectedArea(null);
      setShowCreateModal(false);
      
      alert('Template başarıyla kaydedildi! 🎉');

    } catch (error: any) {
      console.error('❌ Template kaydetme genel hatası:', error);
      alert('Template kaydedilemedi: ' + error.message);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setBackgroundImage(file);
        const previewUrl = URL.createObjectURL(file);
        setBackgroundPreview(previewUrl);
      } else {
        alert('Lütfen geçerli bir resim dosyası seçin!');
      }
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Bu template\'i silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    } catch (error) {
      console.error('Template silme hatası:', error);
      alert('Template silinirken hata oluştu');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Kopya)`,
          image_url: template.image_url,
          design_areas: template.design_areas,
          text_areas: template.text_areas,
          logo_area: template.logo_area,
          design_type: template.design_type,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Template kopyalama hatası:', error);
      alert('Template kopyalanırken hata oluştu');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const selectAllTemplates = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;

    if (!window.confirm(`${selectedTemplates.length} template\'i silmek istediğinizden emin misiniz?`)) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('Template\'ler silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-red-500">
                <X className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Bağlantı Hatası
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {connectionError}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={retryConnection}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Tekrar Dene {retryCount > 0 && `(${retryCount})`}
              </Button>
              <button
                onClick={() => setConnectionError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retry Banner */}
      {showRetryBanner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <p className="text-blue-700 dark:text-blue-400">
              Bağlantı yeniden kuruluyor...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ürün mockup template'lerinizi oluşturun ve yönetin ({templates.length} template)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Template</span>
          </Button>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etsy Mağazası Seçin:
            </label>
            {stores.length > 0 ? (
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tüm mağazalar</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.store_name} {store.store_url && `(${store.store_url})`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Henüz Etsy mağazası eklenmemiş. 
                <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                  Mağaza ekleyin
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Template ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-l-lg`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-r-lg`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTemplates.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedTemplates.length} template seçildi
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Seçilenleri Sil
              </Button>
              <Button onClick={() => setSelectedTemplates([])} variant="secondary" size="sm">
                Seçimi Temizle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Template bulunamadı' : 'Henüz mockup template yok'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Arama terimlerinizi değiştirmeyi deneyin'
              : 'İlk mockup template\'inizi oluşturmaya başlayın'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Template\'i Oluştur</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={selectedTemplates.length === filteredTemplates.length}
              onChange={selectAllTemplates}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Tümünü seç ({filteredTemplates.length} template)
            </label>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={() => toggleTemplateSelection(template.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Template\'i kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Template\'i sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Template Preview */}
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Template Info */}
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Tasarım Alanları:</span>
                          <span>{template.design_areas?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Metin Alanları:</span>
                          <span>{template.text_areas?.length || 0}</span>
                        </div>
                        {template.design_type && (
                          <div className="flex justify-between">
                            <span>Tasarım Tipi:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              template.design_type === 'black' 
                                ? 'bg-gray-800 text-white' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.design_type === 'black' ? 'Siyah' : 'Beyaz'} Tasarım
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Oluşturulma:</span>
                          <span>{formatDate(template.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button variant="secondary" size="sm" className="flex-1">
                        Kullan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.length === filteredTemplates.length}
                        onChange={selectAllTemplates}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İsim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Önizleme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tasarım Alanları
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Metin Alanları
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tasarım Tipi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Oluşturulma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={() => toggleTemplateSelection(template.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-16 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.design_areas?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.text_areas?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {template.design_type && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            template.design_type === 'black' 
                              ? 'bg-gray-800 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.design_type === 'black' ? 'Siyah' : 'Beyaz'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(template.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CRITICAL: Create Modal - CANVAS VE YAN MENÜLERLE ESKİ HALİ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Yeni Mockup Template Oluştur
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* CRITICAL: Main Content - Canvas + Sidebar Layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* CRITICAL: Canvas Area - Sol Taraf */}
              <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
                {/* Canvas Header */}
                <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Canvas</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {canvasSize.width} × {canvasSize.height}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="bg-white rounded-lg shadow-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      onClick={handleCanvasClick}
                      className="border border-gray-300 dark:border-gray-600 cursor-crosshair"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>

                {/* Canvas Footer */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Genişlik:</label>
                        <Input
                          type="number"
                          value={canvasSize.width}
                          onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                          className="w-20 text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Yükseklik:</label>
                        <Input
                          type="number"
                          value={canvasSize.height}
                          onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                          className="w-20 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={saveTemplate}
                      disabled={!templateName.trim() || !backgroundImage}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Template\'i Kaydet
                    </Button>
                  </div>
                </div>
              </div>

              {/* CRITICAL: Sidebar - Sağ Taraf */}
              <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">Template Ayarları</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Template Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Adı:
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template adı girin..."
                      className="w-full"
                    />
                  </div>

                  {/* Background Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Background Görsel:
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      {backgroundPreview ? (
                        <div className="space-y-3">
                          <img
                            src={backgroundPreview}
                            alt="Preview"
                            className="max-w-full h-32 object-contain mx-auto rounded"
                          />
                          <Button
                            onClick={() => {
                              setBackgroundImage(null);
                              setBackgroundPreview('');
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            Görsel Değiştir
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">
                            Görsel yüklemek için tıklayın
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="secondary"
                            size="sm"
                          >
                            Dosya Seç
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Design Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      🎨 Tasarım Tipi:
                    </label>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="designType"
                            value="black"
                            checked={designType === 'black'}
                            onChange={(e) => setDesignType(e.target.value as 'black' | 'white')}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-black rounded border"></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Black Design</span>
                          </div>
                        </label>
                        
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="designType"
                            value="white"
                            checked={designType === 'white'}
                            onChange={(e) => setDesignType(e.target.value as 'black' | 'white')}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-white rounded border border-gray-300"></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">White Design</span>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                        Bu mockup için {designType === 'black' ? 'siyah' : 'beyaz'} tasarım kullanılacak
                      </p>
                    </div>
                  </div>

                  {/* Area Addition Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Alan Ekle:
                    </label>
                    <div className="space-y-2">
                      <Button
                        onClick={addDesignArea}
                        variant="secondary"
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <span className="material-icons text-lg">design_services</span>
                        <span>Tasarım Alanı Ekle</span>
                      </Button>
                      
                      <Button
                        onClick={addTextArea}
                        variant="secondary"
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <span className="material-icons text-lg">text_fields</span>
                        <span>Yazı Alanı Ekle</span>
                      </Button>
                      
                      <Button
                        onClick={addLogoArea}
                        variant="secondary"
                        className="w-full flex items-center justify-center space-x-2"
                        disabled={!!logoArea}
                      >
                        <span className="material-icons text-lg">image</span>
                        <span>Logo Alanı Ekle</span>
                      </Button>
                    </div>
                  </div>

                  {/* Area List */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Alanlar:
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {/* Design Areas */}
                      {designAreas.map((area, index) => (
                        <div
                          key={`design-${index}`}
                          className={`p-2 rounded border cursor-pointer ${
                            selectedArea === `design-${index}` 
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                          onClick={() => setSelectedArea(`design-${index}`)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              🎨 Tasarım Alanı {index + 1}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDesignAreas(prev => prev.filter((_, i) => i !== index));
                                if (selectedArea === `design-${index}`) {
                                  setSelectedArea(null);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Text Areas */}
                      {textAreas.map((area, index) => (
                        <div
                          key={`text-${index}`}
                          className={`p-2 rounded border cursor-pointer ${
                            selectedArea === `text-${index}` 
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                          onClick={() => setSelectedArea(`text-${index}`)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600 dark:text-green-400">
                              📝 Yazı Alanı {index + 1}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextAreas(prev => prev.filter((_, i) => i !== index));
                                if (selectedArea === `text-${index}`) {
                                  setSelectedArea(null);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Logo Area */}
                      {logoArea && (
                        <div
                          className={`p-2 rounded border cursor-pointer ${
                            selectedArea === 'logo' 
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                          onClick={() => setSelectedArea('logo')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-600 dark:text-purple-400">
                              🖼️ Logo Alanı
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLogoArea(null);
                                if (selectedArea === 'logo') {
                                  setSelectedArea(null);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Area Properties */}
                  {selectedArea && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Seçili Alan Özellikleri:
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedArea.includes('design') && '🎨 Tasarım Alanı'}
                          {selectedArea.includes('text') && '📝 Yazı Alanı'}
                          {selectedArea === 'logo' && '🖼️ Logo Alanı'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Canvas üzerinde seçili alanı sürükleyerek konumunu değiştirebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockupTemplatesPage;