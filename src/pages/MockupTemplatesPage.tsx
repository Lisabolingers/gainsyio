import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Grid, List, Upload, Move, RotateCcw, Save, Eye, Store, Settings, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: DesignArea[];
  text_areas: TextArea[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface DesignArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name: string;
}

interface TextArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  font_size: number;
  max_chars: number;
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
  const [defaultTemplates, setDefaultTemplates] = useState<MockupTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [showDefaultTemplates, setShowDefaultTemplates] = useState(false);

  // Create/Edit Modal States
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Canvas States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadDefaultTemplates();
      loadStores();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Mockup template\'ler yükleniyor...');
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_default', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} kullanıcı template\'i yüklendi`);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template yükleme genel hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultTemplates = async () => {
    try {
      console.log('🔄 Default template\'ler yükleniyor...');
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Default template yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} default template yüklendi`);
      setDefaultTemplates(data || []);
    } catch (error) {
      console.error('❌ Default template yükleme genel hatası:', error);
    }
  };

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addDesignArea = () => {
    const newArea: DesignArea = {
      id: `design-${Date.now()}`,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      name: `Tasarım Alanı ${designAreas.length + 1}`
    };
    setDesignAreas([...designAreas, newArea]);
  };

  const addTextArea = () => {
    const newArea: TextArea = {
      id: `text-${Date.now()}`,
      x: 100,
      y: 300,
      width: 300,
      height: 50,
      name: `Yazı Alanı ${textAreas.length + 1}`,
      font_size: 24,
      max_chars: 100
    };
    setTextAreas([...textAreas, newArea]);
  };

  const updateDesignArea = (id: string, updates: Partial<DesignArea>) => {
    setDesignAreas(prev => prev.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ));
  };

  const updateTextArea = (id: string, updates: Partial<TextArea>) => {
    setTextAreas(prev => prev.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ));
  };

  const deleteArea = (id: string) => {
    setDesignAreas(prev => prev.filter(area => area.id !== id));
    setTextAreas(prev => prev.filter(area => area.id !== id));
    if (selectedArea === id) {
      setSelectedArea(null);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template adı gerekli!');
      return;
    }

    if (!backgroundImage && !editingTemplate) {
      alert('Background görsel gerekli!');
      return;
    }

    try {
      setIsCreating(true);
      console.log('💾 Template kaydediliyor...');

      let imageUrl = editingTemplate?.image_url || '';

      // Yeni görsel yüklendiyse
      if (backgroundImage) {
        // TODO: Supabase Storage'a yükle
        // Şimdilik base64 olarak saklayacağız
        const reader = new FileReader();
        reader.onload = async (e) => {
          imageUrl = e.target?.result as string;
          await saveTemplateToDatabase(imageUrl);
        };
        reader.readAsDataURL(backgroundImage);
      } else {
        await saveTemplateToDatabase(imageUrl);
      }
    } catch (error) {
      console.error('❌ Template kaydetme hatası:', error);
      alert('Template kaydedilemedi!');
      setIsCreating(false);
    }
  };

  const saveTemplateToDatabase = async (imageUrl: string) => {
    const templateData = {
      user_id: user?.id,
      name: templateName,
      image_url: imageUrl,
      design_areas: designAreas,
      text_areas: textAreas,
      is_default: false
    };

    if (editingTemplate) {
      // Güncelleme
      const { error } = await supabase
        .from('mockup_templates')
        .update(templateData)
        .eq('id', editingTemplate.id)
        .eq('user_id', user?.id);

      if (error) throw error;
    } else {
      // Yeni oluşturma
      const { error } = await supabase
        .from('mockup_templates')
        .insert(templateData);

      if (error) throw error;
    }

    console.log('✅ Template başarıyla kaydedildi');
    await loadTemplates();
    resetModal();
    alert('Template başarıyla kaydedildi! 🎉');
  };

  const resetModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingTemplate(null);
    setTemplateName('');
    setBackgroundImage(null);
    setBackgroundPreview('');
    setDesignAreas([]);
    setTextAreas([]);
    setSelectedArea(null);
    setIsCreating(false);
  };

  const editTemplate = (template: MockupTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setBackgroundPreview(template.image_url);
    setDesignAreas(template.design_areas || []);
    setTextAreas(template.text_areas || []);
    setShowEditModal(true);
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
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Template kopyalama hatası:', error);
      alert('Template kopyalanırken hata oluştu');
    }
  };

  const useDefaultTemplate = async (defaultTemplate: MockupTemplate) => {
    try {
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${defaultTemplate.name} (Kopyam)`,
          image_url: defaultTemplate.image_url,
          design_areas: defaultTemplate.design_areas,
          text_areas: defaultTemplate.text_areas,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
      alert('Default template kopyalandı! 🎉');
    } catch (error) {
      console.error('Default template kopyalama hatası:', error);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ürün mockupları için template oluşturun ve yönetin ({templates.length} template)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowDefaultTemplates(!showDefaultTemplates)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Star className="h-4 w-4" />
            <span>Default Templates ({defaultTemplates.length})</span>
          </Button>
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
                <option value="">Mağaza seçin...</option>
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

      {/* Default Templates Section */}
      {showDefaultTemplates && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Default Templates
          </h2>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            Hazır template'lerden birini seçip kendi koleksiyonunuza ekleyebilirsiniz.
          </p>
          
          {defaultTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-600 dark:text-blue-400">
                Henüz default template eklenmemiş
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-700">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Tasarım: {template.design_areas?.length || 0}</span>
                        <span>Yazı: {template.text_areas?.length || 0}</span>
                      </div>
                      
                      <Button
                        onClick={() => useDefaultTemplate(template)}
                        className="w-full"
                        size="sm"
                      >
                        Koleksiyonuma Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

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
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Tasarım Alanı: {template.design_areas?.length || 0}</span>
                        <span>Yazı Alanı: {template.text_areas?.length || 0}</span>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Oluşturulma: {formatDate(template.created_at)}
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button 
                        onClick={() => editTemplate(template)}
                        size="sm" 
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button variant="secondary" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Önizle
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
                      Yazı Alanları
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
                        <div className="w-16 h-12 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.design_areas?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.text_areas?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(template.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => editTemplate(template)}
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTemplate ? 'Template Düzenle' : 'Yeni Mockup Template'}
                </h2>
                <button
                  onClick={resetModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Settings */}
                <div className="space-y-6">
                  {/* Template Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Adı:
                    </label>
                    <Input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template adını girin..."
                      className="w-full"
                    />
                  </div>

                  {/* Background Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Background Görsel:
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="background-upload"
                      />
                      <label htmlFor="background-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Görsel yüklemek için tıklayın
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Design Areas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tasarım Alanları:
                      </label>
                      <Button onClick={addDesignArea} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ekle
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {designAreas.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{area.name}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setSelectedArea(area.id)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Düzenle"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteArea(area.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Sil"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Text Areas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Yazı Alanları:
                      </label>
                      <Button onClick={addTextArea} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ekle
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {textAreas.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{area.name}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setSelectedArea(area.id)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Düzenle"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteArea(area.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Sil"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Area Properties */}
                  {selectedArea && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Alan Özellikleri
                      </h4>
                      {(() => {
                        const area = [...designAreas, ...textAreas].find(a => a.id === selectedArea);
                        if (!area) return null;

                        const isDesignArea = designAreas.some(a => a.id === selectedArea);
                        
                        return (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">İsim:</label>
                              <Input
                                type="text"
                                value={area.name}
                                onChange={(e) => {
                                  if (isDesignArea) {
                                    updateDesignArea(area.id, { name: e.target.value });
                                  } else {
                                    updateTextArea(area.id, { name: e.target.value });
                                  }
                                }}
                                className="text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X:</label>
                                <Input
                                  type="number"
                                  value={area.x}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (isDesignArea) {
                                      updateDesignArea(area.id, { x: value });
                                    } else {
                                      updateTextArea(area.id, { x: value });
                                    }
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y:</label>
                                <Input
                                  type="number"
                                  value={area.y}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (isDesignArea) {
                                      updateDesignArea(area.id, { y: value });
                                    } else {
                                      updateTextArea(area.id, { y: value });
                                    }
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Genişlik:</label>
                                <Input
                                  type="number"
                                  value={area.width}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (isDesignArea) {
                                      updateDesignArea(area.id, { width: value });
                                    } else {
                                      updateTextArea(area.id, { width: value });
                                    }
                                  }}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Yükseklik:</label>
                                <Input
                                  type="number"
                                  value={area.height}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (isDesignArea) {
                                      updateDesignArea(area.id, { height: value });
                                    } else {
                                      updateTextArea(area.id, { height: value });
                                    }
                                  }}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            
                            {isDesignArea && 'rotation' in area && (
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Döndürme (derece):</label>
                                <Input
                                  type="number"
                                  value={area.rotation}
                                  onChange={(e) => updateDesignArea(area.id, { rotation: parseInt(e.target.value) })}
                                  className="text-sm"
                                />
                              </div>
                            )}
                            
                            {!isDesignArea && 'font_size' in area && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Boyutu:</label>
                                  <Input
                                    type="number"
                                    value={area.font_size}
                                    onChange={(e) => updateTextArea(area.id, { font_size: parseInt(e.target.value) })}
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Karakter:</label>
                                  <Input
                                    type="number"
                                    value={area.max_chars}
                                    onChange={(e) => updateTextArea(area.id, { max_chars: parseInt(e.target.value) })}
                                    className="text-sm"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Right Panel - Canvas Preview */}
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Önizleme</h4>
                    <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      {backgroundPreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={backgroundPreview}
                            alt="Background"
                            className="w-full h-full object-contain"
                          />
                          
                          {/* Design Areas Overlay */}
                          {designAreas.map((area) => (
                            <div
                              key={area.id}
                              className={`absolute border-2 border-blue-500 bg-blue-500/20 cursor-move ${
                                selectedArea === area.id ? 'border-orange-500 bg-orange-500/20' : ''
                              }`}
                              style={{
                                left: `${(area.x / canvasSize.width) * 100}%`,
                                top: `${(area.y / canvasSize.height) * 100}%`,
                                width: `${(area.width / canvasSize.width) * 100}%`,
                                height: `${(area.height / canvasSize.height) * 100}%`,
                                transform: `rotate(${area.rotation}deg)`
                              }}
                              onClick={() => setSelectedArea(area.id)}
                            >
                              <div className="absolute -top-6 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                                {area.name}
                              </div>
                            </div>
                          ))}
                          
                          {/* Text Areas Overlay */}
                          {textAreas.map((area) => (
                            <div
                              key={area.id}
                              className={`absolute border-2 border-green-500 bg-green-500/20 cursor-move ${
                                selectedArea === area.id ? 'border-orange-500 bg-orange-500/20' : ''
                              }`}
                              style={{
                                left: `${(area.x / canvasSize.width) * 100}%`,
                                top: `${(area.y / canvasSize.height) * 100}%`,
                                width: `${(area.width / canvasSize.width) * 100}%`,
                                height: `${(area.height / canvasSize.height) * 100}%`
                              }}
                              onClick={() => setSelectedArea(area.id)}
                            >
                              <div className="absolute -top-6 left-0 text-xs bg-green-500 text-white px-1 rounded">
                                {area.name}
                              </div>
                              <div className="text-xs text-gray-600 p-1">
                                Örnek yazı ({area.font_size}px)
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                          <div className="text-center">
                            <Image className="h-12 w-12 mx-auto mb-2" />
                            <p>Background görsel yükleyin</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500/50 border border-blue-500"></div>
                          <span>Tasarım Alanı</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500/50 border border-green-500"></div>
                          <span>Yazı Alanı</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <Button onClick={resetModal} variant="secondary">
                İptal
              </Button>
              <Button 
                onClick={saveTemplate} 
                disabled={isCreating || !templateName.trim()}
                className="flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingTemplate ? 'Güncelle' : 'Kaydet'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockupTemplatesPage;