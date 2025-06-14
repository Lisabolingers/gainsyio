import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit, Trash2, ExternalLink, RefreshCw, Search, CheckCircle, Clock, X, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface StoreData {
  id: string;
  user_id: string;
  platform: 'etsy';
  store_name: string;
  store_url?: string;
  api_credentials: Record<string, any>;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

interface StoreFormData {
  store_name: string;
  store_url: string;
}

const StoresPage: React.FC = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    store_name: '',
    store_url: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  // Handle OAuth callback from Etsy
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.error('❌ Etsy OAuth error:', error);
      alert('Etsy connection failed: ' + error);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      console.log('✅ Etsy OAuth callback received:', { code, state });
      handleEtsyCallback(code, state);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading Etsy stores...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'etsy')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Store loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy stores loaded`);
      setStores(data || []);
    } catch (error) {
      console.error('❌ Store loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = () => {
    // Eğer auth hatası varsa, kullanıcıyı bilgilendir
    if (authError) {
      alert('Bağlantı hatası: ' + authError + '\n\nLütfen sayfayı yenileyin ve tekrar deneyin.');
      return;
    }

    // Eğer kullanıcı yükleniyor durumundaysa, beklemesini söyle
    if (authLoading) {
      alert('Lütfen bekleyin, kullanıcı bilgileri yükleniyor...');
      return;
    }

    // Eğer kullanıcı yoksa, giriş yapmasını söyle
    if (!user) {
      alert('Mağaza eklemek için önce giriş yapmanız gerekiyor.');
      return;
    }

    setEditingStore(null);
    setFormData({
      store_name: '',
      store_url: ''
    });
    setShowAddModal(true);
  };

  const handleEditStore = (store: StoreData) => {
    // Aynı kontrolleri edit için de yap
    if (authError) {
      alert('Bağlantı hatası: ' + authError + '\n\nLütfen sayfayı yenileyin ve tekrar deneyin.');
      return;
    }

    if (authLoading) {
      alert('Lütfen bekleyin, kullanıcı bilgileri yükleniyor...');
      return;
    }

    if (!user) {
      alert('Mağaza düzenlemek için önce giriş yapmanız gerekiyor.');
      return;
    }

    setEditingStore(store);
    setFormData({
      store_name: store.store_name,
      store_url: store.store_url || ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.store_name.trim()) {
      alert('Mağaza adı gereklidir!');
      return;
    }

    try {
      setFormLoading(true);
      console.log('💾 Saving Etsy store...');

      const storeData = {
        user_id: user?.id,
        platform: 'etsy' as const,
        store_name: formData.store_name.trim(),
        store_url: formData.store_url.trim() || null,
        api_credentials: {}, // Empty for now, will be filled by Etsy OAuth
        is_active: true
      };

      let result;

      if (editingStore) {
        result = await supabase
          .from('stores')
          .update({
            ...storeData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStore.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('stores')
          .insert(storeData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Store save error:', result.error);
        alert('Mağaza kaydedilemedi: ' + result.error.message);
        return;
      }

      console.log('✅ Store saved successfully:', result.data);
      await loadStores();
      setShowAddModal(false);
      
      alert(`Etsy mağazası başarıyla ${editingStore ? 'güncellendi' : 'eklendi'}! 🎉`);

    } catch (error) {
      console.error('❌ Store save general error:', error);
      alert('Mağaza kaydedilemedi: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!window.confirm('Bu Etsy mağazasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setStores(prev => prev.filter(s => s.id !== storeId));
      alert('Etsy mağazası başarıyla silindi!');
    } catch (error) {
      console.error('Store deletion error:', error);
      alert('Mağaza silinirken hata oluştu');
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, is_active: !currentStatus }
          : store
      ));
    } catch (error) {
      console.error('Store status toggle error:', error);
      alert('Mağaza durumu güncellenirken hata oluştu');
    }
  };

  const generateEtsyOAuthURL = (storeId: string) => {
    // TODO: Replace with actual Etsy API credentials
    const CLIENT_ID = 'your_etsy_client_id'; // This will come from environment variables
    const REDIRECT_URI = `${window.location.origin}/admin/stores`; // Current page as callback
    const STATE = `${storeId}_${Date.now()}`; // Include store ID in state for identification
    const SCOPE = 'shops_r listings_r'; // Read shops and listings
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      state: STATE
    });

    return `https://www.etsy.com/oauth/connect?${params.toString()}`;
  };

  const connectToEtsy = async (storeId: string) => {
    try {
      console.log('🔗 Initiating Etsy OAuth for store:', storeId);
      
      // Store the store ID in localStorage for callback handling
      localStorage.setItem('etsy_connecting_store_id', storeId);
      
      // Generate OAuth URL and redirect
      const oauthUrl = generateEtsyOAuthURL(storeId);
      
      // Show info to user before redirect
      if (window.confirm('Etsy bağlantısı için yetkilendirme sayfasına yönlendirileceksiniz. Devam etmek istiyor musunuz?')) {
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error('Etsy OAuth initiation error:', error);
      alert('Etsy bağlantısı başlatılırken hata oluştu');
    }
  };

  const handleEtsyCallback = async (code: string, state: string) => {
    try {
      console.log('🔄 Processing Etsy OAuth callback...');
      
      // Extract store ID from state
      const storeId = state.split('_')[0];
      const storedStoreId = localStorage.getItem('etsy_connecting_store_id');
      
      if (storeId !== storedStoreId) {
        throw new Error('State mismatch - possible security issue');
      }

      // TODO: Exchange authorization code for access token
      // This should be done on the backend for security
      console.log('📝 Authorization code received:', code);
      console.log('🏪 Store ID:', storeId);
      
      // For now, just update the store as connected
      const { error } = await supabase
        .from('stores')
        .update({ 
          last_sync_at: new Date().toISOString(),
          api_credentials: { 
            connected: true, 
            connected_at: new Date().toISOString(),
            // TODO: Store actual tokens here after backend exchange
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Clean up localStorage
      localStorage.removeItem('etsy_connecting_store_id');
      
      // Reload stores to show updated status
      await loadStores();
      
      alert('🎉 Etsy mağazası başarıyla bağlandı!');
      
    } catch (error) {
      console.error('❌ Etsy callback processing error:', error);
      alert('Etsy bağlantısı işlenirken hata oluştu: ' + error.message);
      
      // Clean up localStorage on error
      localStorage.removeItem('etsy_connecting_store_id');
    }
  };

  const syncStoreData = async (storeId: string) => {
    try {
      console.log('🔄 Syncing store data for:', storeId);
      
      // TODO: Implement actual Etsy API data sync
      // This will fetch shop info, listings, etc.
      
      const { error } = await supabase
        .from('stores')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, last_sync_at: new Date().toISOString() }
          : store
      ));

      alert('Mağaza verileri başarıyla senkronize edildi!');
    } catch (error) {
      console.error('Store sync error:', error);
      alert('Mağaza verileri senkronize edilirken hata oluştu');
    }
  };

  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Hiçbir zaman';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isStoreConnected = (store: StoreData) => {
    return store.api_credentials?.connected && store.last_sync_at && store.is_active;
  };

  // Eğer auth hatası varsa, hata mesajını göster
  if (authError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">Bağlantı Hatası</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
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
            <Store className="h-6 w-6 mr-2 text-orange-500" />
            Etsy Mağazaları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Etsy mağazalarınızı bağlayın ve yönetin ({stores.length} mağaza)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={handleAddStore}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            disabled={authLoading || !!authError}
          >
            <Plus className="h-4 w-4" />
            <span>Mağaza Ekle</span>
          </Button>
        </div>
      </div>

      {/* OAuth Integration Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              Etsy Entegrasyon Durumu
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              <strong>Geliştirme Modu:</strong> OAuth entegrasyonu geliştirilmektedir. 
              Şu anda test için sahte bağlantı kullanılıyor. Gerçek Etsy API entegrasyonu yakında kullanılabilir olacak.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Etsy mağazalarında ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛍️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Mağaza bulunamadı' : 'Henüz Etsy mağazası bağlanmamış'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Arama terimlerinizi ayarlamayı deneyin'
              : 'Ürünlerinizi yönetmeye başlamak için ilk Etsy mağazanızı bağlayın'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={handleAddStore}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              disabled={authLoading || !!authError}
            >
              <Plus className="h-4 w-4" />
              <span>İlk Mağazayı Ekle</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mağaza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bağlantı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Son Bağlantı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-sm">🛍️</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {store.store_name}
                        </div>
                        {store.store_url && (
                          <a
                            href={store.store_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Mağazayı Görüntüle</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStoreStatus(store.id, store.is_active)}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          store.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={store.is_active ? 'Aktif - Devre dışı bırakmak için tıklayın' : 'Pasif - Aktifleştirmek için tıklayın'}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          store.is_active ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        store.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {store.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {isStoreConnected(store) ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Bağlı
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Bağlı Değil
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(store.last_sync_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      {isStoreConnected(store) ? (
                        <button
                          onClick={() => syncStoreData(store.id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                          title="Mağaza verilerini senkronize et"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Senkronize Et</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => connectToEtsy(store.id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                          title="OAuth ile Etsy'ye bağlan"
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span>Bağlan</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditStore(store)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Mağazayı düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteStore(store.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Mağazayı sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <span className="text-2xl mr-2">🛍️</span>
                  {editingStore ? 'Etsy Mağazasını Düzenle' : 'Etsy Mağazası Ekle'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mağaza Adı *
                </label>
                <Input
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="Etsy mağaza adınızı girin"
                  required
                />
              </div>

              {/* Store URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mağaza URL'si (Opsiyonel)
                </label>
                <Input
                  value={formData.store_url}
                  onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                  placeholder="https://your-store.etsy.com"
                  type="url"
                />
              </div>

              {/* OAuth Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-500 mt-0.5">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                      🔐 Güvenli OAuth Entegrasyonu
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Mağazanızı ekledikten sonra, Etsy'nin güvenli OAuth sistemi üzerinden yetkilendirme yapmak için "Bağlan" butonuna tıklayın. 
                      Etsy'ye yönlendirilecek, izinleri verecek ve otomatik olarak buraya geri döndürüleceksiniz.
                    </p>
                  </div>
                </div>
              </div>
            </form>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  onClick={handleFormSubmit}
                  className="flex-1"
                  disabled={formLoading || !formData.store_name.trim()}
                >
                  {formLoading ? 'Kaydediliyor...' : (editingStore ? 'Mağazayı Güncelle' : 'Mağaza Ekle')}
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="secondary"
                  className="flex-1"
                  disabled={formLoading}
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

export default StoresPage;