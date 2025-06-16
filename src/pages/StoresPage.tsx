import React, { useState, useEffect } from 'react';
import { Store, Plus, Edit, Trash2, ExternalLink, RefreshCw, Search, CheckCircle, Clock, X, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, executeWithTimeout, isConfigValid } from '../lib/supabase';
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

const StoresPage: React.FC = () => {
  const { user, loading: authLoading, error: authError, isDemoMode } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (user || isDemoMode) {
      loadStores();
    }
  }, [user, isDemoMode]);

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

  const loadDemoStores = () => {
    console.log('🎭 Loading demo stores...');
    const demoStores: StoreData[] = [
      {
        id: 'demo-store-1',
        user_id: user?.id || 'demo-user',
        platform: 'etsy',
        store_name: 'Demo Etsy Store',
        store_url: 'https://etsy.com/shop/demo-store',
        api_credentials: { connected: true, demo: true },
        is_active: true,
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-store-2',
        user_id: user?.id || 'demo-user',
        platform: 'etsy',
        store_name: 'Demo Craft Shop',
        store_url: 'https://etsy.com/shop/demo-craft',
        api_credentials: { connected: false, demo: true },
        is_active: false,
        last_sync_at: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    setStores(demoStores);
    setConnectionError('Using demo data - Supabase connection not available');
    setLoading(false);
  };

  const loadStores = async () => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      // If in demo mode or Supabase not configured, load demo data
      if (isDemoMode || !isConfigValid) {
        loadDemoStores();
        return;
      }

      console.log('🔄 Loading Etsy stores...');
      
      // Use executeWithTimeout for better error handling with increased timeout
      const { data, error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .select('*')
          .eq('user_id', user?.id)
          .eq('platform', 'etsy')
          .order('created_at', { ascending: false }),
        20000, // Increased timeout from 8000 to 20000 milliseconds (20 seconds)
        2 // 2 retries
      );

      if (error) {
        console.error('❌ Store loading error:', error);
        
        // Handle specific error types
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('timeout') ||
            error.message?.includes('signal timed out')) {
          setConnectionError('Database connection failed. Using demo data.');
          loadDemoStores();
          return;
        }
        
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy stores loaded`);
      setStores(data || []);
      
    } catch (error: any) {
      console.error('❌ Store loading general error:', error);
      
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('timeout') ||
          error.message?.includes('Query timeout') ||
          error.name === 'AbortError') {
        setConnectionError('Database connection timeout. Using demo data.');
        loadDemoStores();
      } else {
        setConnectionError(`Database error: ${error.message}. Using demo data.`);
        loadDemoStores();
      }
    } finally {
      setLoading(false);
    }
  };

  const generateEtsyOAuthURL = () => {
    // TODO: Replace with actual Etsy API credentials from environment variables
    const CLIENT_ID = import.meta.env.VITE_ETSY_CLIENT_ID || 'your_etsy_client_id';
    const REDIRECT_URI = `${window.location.origin}/admin/stores`; // Current page as callback
    const STATE = `new_store_${Date.now()}`; // Unique state for new store
    const SCOPE = 'shops_r listings_r listings_w'; // Read shops, read/write listings
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      state: STATE
    });

    return `https://www.etsy.com/oauth/connect?${params.toString()}`;
  };

  const handleAddStore = () => {
    // Check for auth errors
    if (authError && !isDemoMode) {
      alert('Connection error: ' + authError + '\n\nPlease refresh the page and try again.');
      return;
    }

    // Check if user is loading
    if (authLoading) {
      alert('Please wait, user information is loading...');
      return;
    }

    // Check if user is logged in (unless in demo mode)
    if (!user && !isDemoMode) {
      alert('You need to sign in to add a store.');
      return;
    }

    // If in demo mode, add demo store
    if (isDemoMode || !isConfigValid) {
      addDemoStore();
      return;
    }

    // Start Etsy OAuth flow directly
    initiateEtsyOAuth();
  };

  const addDemoStore = () => {
    const newDemoStore: StoreData = {
      id: `demo-store-${Date.now()}`,
      user_id: user?.id || 'demo-user',
      platform: 'etsy',
      store_name: `New Demo Store ${stores.length + 1}`,
      store_url: `https://etsy.com/shop/new-demo-${stores.length + 1}`,
      api_credentials: { connected: true, demo: true },
      is_active: true,
      last_sync_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setStores(prev => [newDemoStore, ...prev]);
    alert('🎭 Demo store added successfully!');
  };

  const initiateEtsyOAuth = async () => {
    try {
      console.log('🔗 Starting Etsy OAuth flow for new store...');
      
      // Store that we're adding a new store
      localStorage.setItem('etsy_oauth_action', 'add_new_store');
      localStorage.setItem('etsy_oauth_timestamp', Date.now().toString());
      
      // Generate OAuth URL and redirect
      const oauthUrl = generateEtsyOAuthURL();
      
      // Show info to user before redirect
      if (window.confirm('You will be redirected to Etsy to authorize your store connection. Do you want to continue?')) {
        console.log('🚀 Redirecting to Etsy OAuth:', oauthUrl);
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error('❌ Etsy OAuth initiation error:', error);
      alert('Error occurred while starting Etsy connection');
    }
  };

  const connectExistingStore = async (storeId: string) => {
    // If in demo mode, simulate connection
    if (isDemoMode || !isConfigValid) {
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { 
              ...store, 
              api_credentials: { ...store.api_credentials, connected: true },
              last_sync_at: new Date().toISOString(),
              is_active: true
            }
          : store
      ));
      alert('🎭 Demo store connected successfully!');
      return;
    }

    try {
      console.log('🔗 Initiating Etsy OAuth for existing store:', storeId);
      
      // Store the store ID for callback handling
      localStorage.setItem('etsy_oauth_action', 'connect_existing');
      localStorage.setItem('etsy_connecting_store_id', storeId);
      localStorage.setItem('etsy_oauth_timestamp', Date.now().toString());
      
      // Generate OAuth URL with store-specific state
      const CLIENT_ID = import.meta.env.VITE_ETSY_CLIENT_ID || 'your_etsy_client_id';
      const REDIRECT_URI = `${window.location.origin}/admin/stores`;
      const STATE = `existing_store_${storeId}_${Date.now()}`;
      const SCOPE = 'shops_r listings_r listings_w';
      
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
        state: STATE
      });

      const oauthUrl = `https://www.etsy.com/oauth/connect?${params.toString()}`;
      
      // Show info to user before redirect
      if (window.confirm('You will be redirected to Etsy authorization page. Do you want to continue?')) {
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error('❌ Etsy OAuth initiation error:', error);
      alert('Error occurred while initiating Etsy connection');
    }
  };

  const handleEtsyCallback = async (code: string, state: string) => {
    try {
      console.log('🔄 Processing Etsy OAuth callback...');
      
      const oauthAction = localStorage.getItem('etsy_oauth_action');
      const timestamp = localStorage.getItem('etsy_oauth_timestamp');
      
      // Security check: ensure callback is recent (within 10 minutes)
      if (!timestamp || Date.now() - parseInt(timestamp) > 600000) {
        throw new Error('OAuth session expired. Please try again.');
      }

      if (oauthAction === 'add_new_store') {
        await handleNewStoreCallback(code, state);
      } else if (oauthAction === 'connect_existing') {
        await handleExistingStoreCallback(code, state);
      } else {
        throw new Error('Invalid OAuth action');
      }

      // Clean up localStorage
      localStorage.removeItem('etsy_oauth_action');
      localStorage.removeItem('etsy_connecting_store_id');
      localStorage.removeItem('etsy_oauth_timestamp');
      
    } catch (error) {
      console.error('❌ Etsy callback processing error:', error);
      alert('Error occurred while processing Etsy connection: ' + error.message);
      
      // Clean up localStorage on error
      localStorage.removeItem('etsy_oauth_action');
      localStorage.removeItem('etsy_connecting_store_id');
      localStorage.removeItem('etsy_oauth_timestamp');
    }
  };

  const handleNewStoreCallback = async (code: string, state: string) => {
    console.log('🆕 Processing new store OAuth callback...');
    
    // TODO: Exchange authorization code for access token on backend
    // For now, we'll create a store with mock data
    
    try {
      // Extract shop info from state or make API call to get shop details
      // This would normally be done after token exchange
      const mockShopName = `Etsy Store ${Date.now()}`;
      
      const storeData = {
        user_id: user?.id,
        platform: 'etsy' as const,
        store_name: mockShopName, // This will come from Etsy API
        store_url: null, // This will come from Etsy API
        api_credentials: { 
          connected: true,
          connected_at: new Date().toISOString(),
          authorization_code: code,
          state: state,
          // TODO: Store actual tokens here after backend exchange
          // access_token: 'xxx',
          // refresh_token: 'xxx',
          // shop_id: 'xxx'
        },
        is_active: true,
        last_sync_at: new Date().toISOString()
      };

      const { data, error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .insert(storeData)
          .select()
          .single(),
        20000, // Increased timeout from 10000 to 20000 milliseconds (20 seconds)
        2 // 2 retries
      );

      if (error) throw error;

      console.log('✅ New Etsy store created:', data);
      await loadStores();
      
      alert('🎉 Etsy store connected successfully! You can now manage your products.');
      
    } catch (error) {
      console.error('❌ New store creation error:', error);
      throw error;
    }
  };

  const handleExistingStoreCallback = async (code: string, state: string) => {
    console.log('🔗 Processing existing store OAuth callback...');
    
    const storeId = localStorage.getItem('etsy_connecting_store_id');
    if (!storeId) {
      throw new Error('Store ID not found in callback');
    }

    // Extract store ID from state as additional security check
    const stateStoreId = state.split('_')[2];
    if (storeId !== stateStoreId) {
      throw new Error('State mismatch - possible security issue');
    }

    try {
      // TODO: Exchange authorization code for access token on backend
      const { error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .update({ 
            last_sync_at: new Date().toISOString(),
            api_credentials: { 
              connected: true, 
              connected_at: new Date().toISOString(),
              authorization_code: code,
              state: state,
              // TODO: Store actual tokens here after backend exchange
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId)
          .eq('user_id', user?.id),
        20000, // Increased timeout from 10000 to 20000 milliseconds (20 seconds)
        2 // 2 retries
      );

      if (error) throw error;

      console.log('✅ Existing store connected:', storeId);
      await loadStores();
      
      alert('🎉 Etsy store connected successfully!');
      
    } catch (error) {
      console.error('❌ Existing store connection error:', error);
      throw error;
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure you want to delete this Etsy store? This action cannot be undone.')) return;

    // If in demo mode, just remove from state
    if (isDemoMode || !isConfigValid) {
      setStores(prev => prev.filter(s => s.id !== storeId));
      alert('🎭 Demo store deleted successfully!');
      return;
    }

    try {
      const { error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .delete()
          .eq('id', storeId)
          .eq('user_id', user?.id),
        20000, // Increased timeout from 10000 to 20000 milliseconds (20 seconds)
        2 // 2 retries
      );

      if (error) throw error;

      setStores(prev => prev.filter(s => s.id !== storeId));
      alert('Etsy store deleted successfully!');
    } catch (error) {
      console.error('Store deletion error:', error);
      alert('Error occurred while deleting store');
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    // If in demo mode, just update state
    if (isDemoMode || !isConfigValid) {
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, is_active: !currentStatus }
          : store
      ));
      return;
    }

    try {
      const { error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .update({ 
            is_active: !currentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId)
          .eq('user_id', user?.id),
        20000, // Increased timeout from 10000 to 20000 milliseconds (20 seconds)
        2 // 2 retries
      );

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

  const syncStoreData = async (storeId: string) => {
    // If in demo mode, just update timestamp
    if (isDemoMode || !isConfigValid) {
      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, last_sync_at: new Date().toISOString() }
          : store
      ));
      alert('🎭 Demo store data synchronized successfully!');
      return;
    }

    try {
      console.log('🔄 Syncing store data for:', storeId);
      
      // TODO: Implement actual Etsy API data sync
      // This will fetch shop info, listings, etc.
      
      const { error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .update({ 
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId)
          .eq('user_id', user?.id),
        20000, // Increased timeout from 10000 to 20000 milliseconds (20 seconds)
        2 // 2 retries
      );

      if (error) throw error;

      setStores(prev => prev.map(store => 
        store.id === storeId 
          ? { ...store, last_sync_at: new Date().toISOString() }
          : store
      ));

      alert('Store data synchronized successfully!');
    } catch (error) {
      console.error('Store sync error:', error);
      alert('Error occurred while synchronizing store data');
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
    return store.api_credentials?.connected && store.last_sync_at && store.is_active;
  };

  // Show error message if auth error exists and not in demo mode
  if (authError && !isDemoMode) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
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
      {/* Connection Status Warning */}
      {connectionError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                Database Connection Notice
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                {connectionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Store className="h-6 w-6 mr-2 text-orange-500" />
            Etsy Stores {(isDemoMode || connectionError) && '(Demo Mode)'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect and manage your Etsy stores ({stores.length} stores)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={handleAddStore}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            disabled={authLoading}
          >
            <Plus className="h-4 w-4" />
            <span>Connect Etsy Store</span>
          </Button>
        </div>
      </div>

      {/* OAuth Integration Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              🔐 Secure Etsy Integration
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              <strong>OAuth Ready:</strong> Click "Connect Etsy Store" to authorize through Etsy's secure OAuth system. 
              You'll be redirected to Etsy, grant permissions, and automatically return here with your store connected.
              <br />
              <strong>Development Mode:</strong> Currently using mock tokens. Real API integration will be activated when Etsy API keys are configured.
              {(isDemoMode || connectionError) && (
                <>
                  <br />
                  <strong>Demo Mode:</strong> Database connection unavailable. All operations are simulated with demo data.
                </>
              )}
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
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">E</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No stores found' : 'No Etsy stores connected yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Connect your first Etsy store through secure OAuth to start managing your products'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={handleAddStore}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              disabled={authLoading}
            >
              <Plus className="h-4 w-4" />
              <span>Connect First Store</span>
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
                        <span className="text-white text-sm font-bold">E</span>
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
                        title={store.is_active ? 'Active - Click to disable' : 'Inactive - Click to enable'}
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
                          onClick={() => syncStoreData(store.id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                          title="Sync store data"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Sync</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => connectExistingStore(store.id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center space-x-1"
                          title="Connect to Etsy via OAuth"
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span>Connect</span>
                        </button>
                      )}
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
    </div>
  );
};

export default StoresPage;