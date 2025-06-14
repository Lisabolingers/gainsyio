import React, { useState, useEffect } from 'react';
import { FileTemplate, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface ListingTemplate {
  id: string;
  user_id: string;
  name: string;
  title_template: string;
  description_template: string;
  tags_template: string[];
  price_template?: number;
  category: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  store_url?: string;
  is_active: boolean;
  api_credentials: any;
}

interface EtsyDraftListing {
  id: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  category: string;
  images: string[];
  created_date: string;
}

const ListingTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ListingTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [draftListings, setDraftListings] = useState<EtsyDraftListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<EtsyDraftListing | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadStores();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Listing template\'ler yükleniyor...');
      
      const { data, error } = await supabase
        .from('listing_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} listing template yüklendi`);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template yükleme genel hatası:', error);
    } finally {
      setLoading(false);
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
      
      // İlk mağazayı otomatik seç
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Mağaza yükleme genel hatası:', error);
    }
  };

  const loadDraftListings = async (storeId: string) => {
    if (!storeId) return;
    
    try {
      setLoadingDrafts(true);
      console.log(`🔄 ${storeId} mağazası için draft listeler yükleniyor...`);
      
      // TODO: Etsy API entegrasyonu geldiğinde burası aktif olacak
      // Şimdilik mock data kullanıyoruz
      const mockDrafts: EtsyDraftListing[] = [
        {
          id: '1',
          title: 'Vintage Style Poster Design - Digital Download',
          description: 'Beautiful vintage-style poster perfect for home decoration. High-quality digital download ready for printing.',
          tags: ['vintage', 'poster', 'digital download', 'printable', 'wall art', 'home decor', 'retro', 'design'],
          price: 4.99,
          category: 'Art & Collectibles',
          images: ['https://via.placeholder.com/400x400'],
          created_date: '2024-01-15'
        },
        {
          id: '2',
          title: 'Modern Typography Print - Instant Download',
          description: 'Clean and modern typography design. Perfect for office or home decoration. Instant digital download.',
          tags: ['typography', 'modern', 'print', 'instant download', 'office decor', 'minimalist', 'black white'],
          price: 3.99,
          category: 'Art & Collectibles',
          images: ['https://via.placeholder.com/400x400'],
          created_date: '2024-01-10'
        },
        {
          id: '3',
          title: 'Botanical Illustration Set - Digital Art',
          description: 'Set of 4 botanical illustrations. High-resolution files perfect for printing and framing.',
          tags: ['botanical', 'illustration', 'nature', 'plants', 'digital art', 'set', 'printable', 'green'],
          price: 7.99,
          category: 'Art & Collectibles',
          images: ['https://via.placeholder.com/400x400'],
          created_date: '2024-01-05'
        }
      ];
      
      setDraftListings(mockDrafts);
      console.log(`✅ ${mockDrafts.length} draft liste yüklendi (mock data)`);
    } catch (error) {
      console.error('❌ Draft liste yükleme hatası:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      loadDraftListings(selectedStore);
    }
  }, [selectedStore]);

  const createTemplateFromDraft = async (draft: EtsyDraftListing) => {
    try {
      console.log('🔄 Draft\'tan template oluşturuluyor:', draft.title);
      
      const templateData = {
        user_id: user?.id,
        name: `Template: ${draft.title}`,
        title_template: draft.title,
        description_template: draft.description,
        tags_template: draft.tags,
        price_template: draft.price,
        category: draft.category,
        is_default: false
      };

      const { data, error } = await supabase
        .from('listing_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Template oluşturma hatası:', error);
        throw error;
      }

      console.log('✅ Template başarıyla oluşturuldu:', data);
      await loadTemplates();
      setShowDraftModal(false);
      setSelectedDraft(null);
      
      alert('Template başarıyla oluşturuldu! 🎉');
    } catch (error) {
      console.error('❌ Template oluşturma genel hatası:', error);
      alert('Template oluşturulurken hata oluştu.');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Bu template\'i silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('listing_templates')
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

  const duplicateTemplate = async (template: ListingTemplate) => {
    try {
      const { error } = await supabase
        .from('listing_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Kopya)`,
          title_template: template.title_template,
          description_template: template.description_template,
          tags_template: template.tags_template,
          price_template: template.price_template,
          category: template.category,
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
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.title_template.toLowerCase().includes(searchTerm.toLowerCase())
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
        .from('listing_templates')
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
            <FileTemplate className="h-6 w-6 mr-2 text-orange-500" />
            Listing Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Etsy draft listelerinden template oluşturun ve yönetin ({templates.length} template)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowDraftModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            disabled={!selectedStore || stores.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Draft\'tan Oluştur</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Manuel Oluştur</span>
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
          {selectedStore && (
            <Button
              onClick={() => loadDraftListings(selectedStore)}
              variant="secondary"
              size="sm"
              disabled={loadingDrafts}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingDrafts ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </Button>
          )}
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
          <FileTemplate className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Template bulunamadı' : 'Henüz listing template yok'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Arama terimlerinizi değiştirmeyi deneyin'
              : 'Etsy draft listelerinizden template oluşturmaya başlayın'
            }
          </p>
          {!searchTerm && (
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setShowDraftModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
                disabled={!selectedStore}
              >
                <Plus className="h-4 w-4" />
                <span>Draft\'tan Oluştur</span>
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Manuel Oluştur</span>
              </Button>
            </div>
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
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Başlık:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.title_template}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Açıklama:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {template.description_template}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Etiketler:</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.tags_template.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags_template.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                              +{template.tags_template.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Kategori: {template.category}</span>
                        {template.price_template && (
                          <span>Fiyat: ${template.price_template}</span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Oluşturulma: {formatDate(template.created_at)}
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
                      Başlık
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Etiket Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fiyat
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {template.title_template}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.tags_template.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {template.price_template ? `$${template.price_template}` : '-'}
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

      {/* Draft Listings Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Etsy Draft Listeleri
                </h2>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Seçili mağazanızdan draft listeleri seçin ve template olarak kaydedin
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loadingDrafts ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : draftListings.length === 0 ? (
                <div className="text-center py-8">
                  <FileTemplate className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Bu mağazada draft liste bulunamadı
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftListings.map((draft) => (
                    <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                            {draft.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {draft.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {draft.tags.slice(0, 4).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400"
                              >
                                {tag}
                              </span>
                            ))}
                            {draft.tags.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                                +{draft.tags.length - 4}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{draft.category}</span>
                            <span>${draft.price}</span>
                          </div>
                          
                          <Button
                            onClick={() => createTemplateFromDraft(draft)}
                            className="w-full"
                            size="sm"
                          >
                            Template Olarak Kaydet
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal - TODO: Implement manual template creation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Manuel Template Oluştur
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Manuel template oluşturma özelliği yakında eklenecek...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingTemplatesPage;