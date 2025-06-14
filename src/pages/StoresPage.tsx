import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit, Trash2, ExternalLink, RefreshCw, Search, CheckCircle, Clock, X, Link as LinkIcon } from 'lucide-react';
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
  const { user } = useAuth();
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
    setEditingStore(null);
    setFormData({
      store_name: '',
      store_url: ''
    });
    setShowAddModal(true);
  };

  const handleEditStore = (store: StoreData) => {
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
      alert('Store name is required!');
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
        api_credentials: {}, // Empty for now, will be filled by Etsy integration
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
      
      alert(`Etsy store ${editingStore ? 'updated' : 'added'} successfully! 🎉`);

    } catch (error) {
      console.error('❌ Store save general error:', error);
      alert('Store could not be saved: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure you want to delete this Etsy store? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setStores(prev => prev.filter(s => s.id !== storeId));
      alert('Etsy store deleted successfully!');
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

  const connectToEtsy = async (storeId: string) => {
    try {
      // TODO: Implement Etsy OAuth integration
      // This will redirect to Etsy OAuth and handle the callback
      console.log('🔗 Connecting to Etsy for store:', storeId);
      
      // For now, just update the sync timestamp
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

      alert('Etsy connection initiated! (Integration coming soon)');
    } catch (error) {
      console.error('Etsy connection error:', error);
      alert('Error occurred while connecting to Etsy');
    }
  };

  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const isStoreConnected = (store: StoreData) => {
    return store.last_sync_at && store.is_active;
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
            Etsy Stores
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect and manage your Etsy stores ({stores.length} stores)
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

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search Etsy stores..."
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
            {searchTerm ? 'No stores found' : 'No Etsy stores connected yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Connect your first Etsy store to start managing your products'
            }
          </p>
          {!searchTerm && (
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Connection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Connected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
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
                            <span>View Store</span>
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
                        title={store.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
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
                        {store.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {isStoreConnected(store) ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Not Connected
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
                          onClick={() => connectToEtsy(store.id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                          title="Sync store data"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Sync</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => connectToEtsy(store.id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                          title="Connect to Etsy"
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span>Connect</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditStore(store)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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
                  {editingStore ? 'Edit Etsy Store' : 'Add Etsy Store'}
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
                  Store Name *
                </label>
                <Input
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  placeholder="Enter your Etsy store name"
                  required
                />
              </div>

              {/* Store URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store URL (Optional)
                </label>
                <Input
                  value={formData.store_url}
                  onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                  placeholder="https://your-store.etsy.com"
                  type="url"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-500 mt-0.5">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                      Etsy Integration
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      After adding your store, you'll be able to connect it to Etsy using our secure integration. 
                      No need to provide API keys manually.
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