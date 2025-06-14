import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit, Trash2, Settings, ExternalLink, RefreshCw, Search, Filter, Grid, List, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface StoreData {
  id: string;
  user_id: string;
  platform: 'etsy' | 'shopify' | 'amazon' | 'ebay' | 'wallart';
  store_name: string;
  store_url?: string;
  api_credentials: Record<string, any>;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

interface StoreFormData {
  platform: 'etsy' | 'shopify' | 'amazon' | 'ebay' | 'wallart';
  store_name: string;
  store_url: string;
  api_key?: string;
  api_secret?: string;
  shop_id?: string;
  access_token?: string;
}

const StoresPage: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    platform: 'etsy',
    store_name: '',
    store_url: '',
    api_key: '',
    api_secret: '',
    shop_id: '',
    access_token: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  const platforms = [
    { id: 'etsy', name: 'Etsy', icon: '🛍️', color: 'bg-orange-500' },
    { id: 'shopify', name: 'Shopify', icon: '🛒', color: 'bg-green-500' },
    { id: 'amazon', name: 'Amazon', icon: '📦', color: 'bg-yellow-500' },
    { id: 'ebay', name: 'eBay', icon: '🏪', color: 'bg-blue-500' },
    { id: 'wallart', name: 'Wall Art', icon: '🎨', color: 'bg-purple-500' }
  ];

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  const loadStores = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading stores...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Store loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} stores loaded`);
      setStores(data || []);
    } catch (error) {
      console.error('❌ Store loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = () => {
    setEditingStore(null);
    setFormData({
      platform: 'etsy',
      store_name: '',
      store_url: '',
      api_key: '',
      api_secret: '',
      shop_id: '',
      access_token: ''
    });
    setShowAddModal(true);
  };

  const handleEditStore = (store: StoreData) => {
    setEditingStore(store);
    setFormData({
      platform: store.platform,
      store_name: store.store_name,
      store_url: store.store_url || '',
      api_key: store.api_credentials?.api_key || '',
      api_secret: store.api_credentials?.api_secret || '',
      shop_id: store.api_credentials?.shop_id || '',
      access_token: store.api_credentials?.access_token || ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.store_name.trim()) {
      alert('Store name is required!');
      return;
    }

    try {
      setFormLoading(true);
      console.log('💾 Saving store...');

      const storeData = {
        user_id: user?.id,
        platform: formData.platform,
        store_name: formData.store_name.trim(),
        store_url: formData.store_url.trim() || null,
        api_credentials: {
          api_key: formData.api_key?.trim() || null,
          api_secret: formData.api_secret?.trim() || null,
          shop_id: formData.shop_id?.trim() || null,
          access_token: formData.access_token?.trim() || null
        },
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
        alert('Store could not be saved: ' + result.error.message);
        return;
      }

      console.log('✅ Store saved successfully:', result.data);
      await loadStores();
      setShowAddModal(false);
      
      alert(`Store ${editingStore ? 'updated' : 'added'} successfully! 🎉`);

    } catch (error) {
      console.error('❌ Store save general error:', error);
      alert('Store could not be saved: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setStores(prev => prev.filter(s => s.id !== storeId));
      alert('Store deleted successfully!');
    } catch (error) {
      console.error('Store deletion error:', error);
      alert('Error occurred while deleting store');
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
      alert('Error occurred while updating store status');
    }
  };

  const syncStore = async (storeId: string) => {
    try {
      // TODO: Implement actual sync logic when API integrations are ready
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

      alert('Store synced successfully!');
    } catch (error) {
      console.error('Store sync error:', error);
      alert('Error occurred while syncing store');
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || store.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformInfo = (platform: string) => {
    return platforms.find(p => p.id === platform) || platforms[0];
  };

  const getStoreStatusIcon = (store: StoreData) => {
    if (!store.is_active) {
      return <AlertCircle className="h-4 w-4 text-red-500" title="Inactive" />;
    }
    if (store.last_sync_at) {
      return <CheckCircle className="h-4 w-4 text-green-500" title="Synced" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" title="Not synced" />;
  };

  const getRequiredFields = (platform: string) => {
    switch (platform) {
      case 'etsy':
        return ['api_key', 'shop_id'];
      case 'shopify':
        return ['api_key', 'api_secret', 'shop_id'];
      case 'amazon':
        return ['api_key', 'api_secret', 'access_token'];
      case 'ebay':
        return ['api_key', 'access_token'];
      case 'wallart':
        return ['api_key'];
      default:
        return [];
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
            <Store className="h-6 w-6 mr-2 text-orange-500" />
            Stores
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect and manage your marketplace stores ({stores.length} stores)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={handleAddStore}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Store</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
          
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

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {platforms.map((platform) => {
          const count = stores.filter(s => s.platform === platform.id).length;
          const activeCount = stores.filter(s => s.platform === platform.id && s.is_active).length;
          
          return (
            <Card key={platform.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-2xl">{platform.icon}</span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">{platform.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {count} stores ({activeCount} active)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stores Display */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || selectedPlatform !== 'all' ? 'No stores found' : 'No stores connected yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || selectedPlatform !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Connect your first marketplace store to get started'
            }
          </p>
          {!searchTerm && selectedPlatform === 'all' && (
            <Button
              onClick={handleAddStore}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Store</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => {
                const platformInfo = getPlatformInfo(store.platform);
                return (
                  <Card key={store.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${platformInfo.color} rounded-lg flex items-center justify-center`}>
                            <span className="text-lg">{platformInfo.icon}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">{store.store_name}</CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {platformInfo.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStoreStatusIcon(store)}
                          <button
                            onClick={() => toggleStoreStatus(store.id, store.is_active)}
                            className={`w-8 h-4 rounded-full transition-colors ${
                              store.is_active ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            title={store.is_active ? 'Active' : 'Inactive'}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                              store.is_active ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {store.store_url && (
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                            <a
                              href={store.store_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
                            >
                              {store.store_url}
                            </a>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{formatDate(store.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Sync:</span>
                            <span>{formatDate(store.last_sync_at)}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button
                            onClick={() => syncStore(store.id)}
                            size="sm"
                            variant="secondary"
                            className="flex-1 flex items-center space-x-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Sync</span>
                          </Button>
                          <Button
                            onClick={() => handleEditStore(store)}
                            size="sm"
                            className="flex-1 flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            onClick={() => deleteStore(store.id)}
                            size="sm"
                            variant="danger"
                            className="p-2"
                            title="Delete store"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Sync
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStores.map((store) => {
                    const platformInfo = getPlatformInfo(store.platform);
                    return (
                      <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${platformInfo.color} rounded-lg flex items-center justify-center`}>
                              <span className="text-sm">{platformInfo.icon}</span>
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
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {store.store_url}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {platformInfo.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStoreStatusIcon(store)}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              store.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(store.last_sync_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => syncStore(store.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Sync store"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditStore(store)}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                            title="Edit store"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteStore(store.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete store"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingStore ? 'Edit Store' : 'Add New Store'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform *
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, platform: platform.id as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        formData.platform === platform.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                        <span className="text-sm">{platform.icon}</span>
                      </div>
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {platform.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name *
                </label>
                <Input
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="Enter your store name"
                  required
                />
              </div>

              {/* Store URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store URL
                </label>
                <Input
                  value={formData.store_url}
                  onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                  placeholder="https://your-store-url.com"
                  type="url"
                />
              </div>

              {/* API Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  API Credentials
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Note:</strong> API credentials are required to sync data from your store. 
                    You can find these in your {getPlatformInfo(formData.platform).name} developer/API settings.
                  </p>
                </div>

                {/* Dynamic fields based on platform */}
                {getRequiredFields(formData.platform).includes('api_key') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key *
                    </label>
                    <Input
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Enter your API key"
                      type="password"
                    />
                  </div>
                )}

                {getRequiredFields(formData.platform).includes('api_secret') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Secret *
                    </label>
                    <Input
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      placeholder="Enter your API secret"
                      type="password"
                    />
                  </div>
                )}

                {getRequiredFields(formData.platform).includes('shop_id') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shop ID *
                    </label>
                    <Input
                      value={formData.shop_id}
                      onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                      placeholder="Enter your shop ID"
                    />
                  </div>
                )}

                {getRequiredFields(formData.platform).includes('access_token') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Access Token *
                    </label>
                    <Input
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="Enter your access token"
                      type="password"
                    />
                  </div>
                )}
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
                  {formLoading ? 'Saving...' : (editingStore ? 'Update Store' : 'Add Store')}
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="secondary"
                  className="flex-1"
                  disabled={formLoading}
                >
                  Cancel
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