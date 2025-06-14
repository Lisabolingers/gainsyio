import React, { useState, useEffect } from 'react';
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

  // Create Modal States
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [designType, setDesignType] = useState<'black' | 'white'>('black');

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
        design_areas: [],
        text_areas: [],
        logo_area: null,
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

      {/* Create Modal - ESKİ HALİNE GETİRİLDİ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
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
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  {backgroundPreview ? (
                    <div className="space-y-4">
                      <img
                        src={backgroundPreview}
                        alt="Preview"
                        className="max-w-full h-48 object-contain mx-auto rounded"
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
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Görsel yüklemek için tıklayın
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="background-upload"
                      />
                      <label
                        htmlFor="background-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        Dosya Seç
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Design Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🎨 Tasarım Tipi Seçin:
                </label>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex space-x-4">
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
                        <div className="w-6 h-6 bg-black rounded border-2 border-gray-300"></div>
                        <span className="font-medium text-gray-900 dark:text-white">Black Design</span>
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
                        <div className="w-6 h-6 bg-white rounded border-2 border-gray-300"></div>
                        <span className="font-medium text-gray-900 dark:text-white">White Design</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-2">
                    Bu mockup için siyah tasarım kullanılacak
                  </p>
                </div>
              </div>

              {/* Area Addition Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alan Ekle:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center space-x-2 p-3"
                    disabled
                  >
                    <span className="material-icons text-lg">design_services</span>
                    <span className="text-sm">Tasarım Alanı</span>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center space-x-2 p-3"
                    disabled
                  >
                    <span className="material-icons text-lg">text_fields</span>
                    <span className="text-sm">Yazı Alanı Ekle</span>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    className="flex items-center justify-center space-x-2 p-3"
                    disabled
                  >
                    <span className="material-icons text-lg">image</span>
                    <span className="text-sm">Logo Alanı</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  * Alan ekleme özellikleri template kaydedildikten sonra aktif olacak
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={saveTemplate}
                  className="flex-1"
                  disabled={!templateName.trim() || !backgroundImage}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Template\'i Kaydet
                </Button>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockupTemplatesPage;