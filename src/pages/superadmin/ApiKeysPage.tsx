import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Terminal, RefreshCw, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created: string;
  expires: string | null;
  last_used: string | null;
  created_by: string;
}

const ApiKeysPage: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Available permissions
  const availablePermissions = [
    { value: 'read:users', label: 'Kullanıcıları Okuma' },
    { value: 'write:users', label: 'Kullanıcıları Yazma' },
    { value: 'read:stores', label: 'Mağazaları Okuma' },
    { value: 'write:stores', label: 'Mağazaları Yazma' },
    { value: 'read:products', label: 'Ürünleri Okuma' },
    { value: 'write:products', label: 'Ürünleri Yazma' },
    { value: 'read:analytics', label: 'Analitiği Okuma' },
    { value: 'admin:system', label: 'Sistem Yönetimi' }
  ];

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading API keys...');
      
      // In a real implementation, this would fetch actual data from Supabase
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock API keys data
      const mockApiKeys: ApiKey[] = [
        {
          id: '1',
          name: 'Etsy Integration',
          key: 'sk_live_etsy_integration_12345678901234567890',
          permissions: ['read:stores', 'read:products', 'write:products'],
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          expires: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(), // 335 days from now
          last_used: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          created_by: 'admin@example.com'
        },
        {
          id: '2',
          name: 'Analytics Dashboard',
          key: 'sk_live_analytics_dashboard_09876543210987654321',
          permissions: ['read:analytics', 'read:stores', 'read:products'],
          created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
          expires: null, // Never expires
          last_used: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
          created_by: 'admin@example.com'
        },
        {
          id: '3',
          name: 'Mobile App',
          key: 'sk_live_mobile_app_abcdefghijklmnopqrstuvwxyz',
          permissions: ['read:users', 'read:stores', 'read:products', 'write:products'],
          created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
          expires: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(), // 275 days from now
          last_used: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          created_by: 'admin@example.com'
        }
      ];
      
      setApiKeys(mockApiKeys);
      
      // Initialize showKeys state
      const initialShowKeys: Record<string, boolean> = {};
      mockApiKeys.forEach(key => {
        initialShowKeys[key.id] = false;
      });
      setShowKeys(initialShowKeys);
      
      console.log('✅ API keys loaded successfully');
    } catch (error) {
      console.error('❌ Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('API anahtarı için bir isim gereklidir.');
      return;
    }
    
    if (newKeyPermissions.length === 0) {
      alert('En az bir izin seçmelisiniz.');
      return;
    }
    
    try {
      console.log('🔄 Creating new API key...');
      
      // In a real implementation, this would create a new API key in Supabase
      // For now, we'll simulate it
      
      // Generate a random key
      const randomKey = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Calculate expiry date if not "never"
      let expiryDate = null;
      if (newKeyExpiry !== 'never') {
        const days = parseInt(newKeyExpiry);
        expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }
      
      // Create new API key
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: randomKey,
        permissions: newKeyPermissions,
        created: new Date().toISOString(),
        expires: expiryDate,
        last_used: null,
        created_by: user?.email || 'unknown'
      };
      
      // Update state
      setApiKeys(prev => [newKey, ...prev]);
      setShowKeys(prev => ({ ...prev, [newKey.id]: true }));
      
      // Reset form
      setNewKeyName('');
      setNewKeyPermissions([]);
      setNewKeyExpiry('never');
      setShowCreateModal(false);
      
      console.log('✅ API key created successfully');
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(randomKey).then(() => {
        setCopiedKey(newKey.id);
        setTimeout(() => setCopiedKey(null), 3000);
      });
      
      // Show success message
      alert('API anahtarı başarıyla oluşturuldu ve panoya kopyalandı. Bu anahtarı güvenli bir yerde saklayın, bir daha tam olarak görüntülenemeyecektir.');
      
    } catch (error) {
      console.error('❌ Error creating API key:', error);
      alert('API anahtarı oluşturulurken bir hata oluştu.');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!window.confirm('Bu API anahtarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve bu anahtarı kullanan tüm entegrasyonlar çalışmayı durduracaktır.')) {
      return;
    }
    
    try {
      console.log(`🔄 Deleting API key: ${keyId}`);
      
      // In a real implementation, this would delete the API key from Supabase
      // For now, we'll just update the state
      
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      console.log('✅ API key deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting API key:', error);
      alert('API anahtarı silinirken bir hata oluştu.');
    }
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 3000);
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hiç';
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return 'Süresiz';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Süresi Doldu';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return `${diffDays} gün`;
  };

  const handlePermissionChange = (permission: string) => {
    setNewKeyPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Terminal className="h-6 w-6 mr-2 text-orange-500" />
            API Anahtarları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            API anahtarlarını yönetin ve erişim izinlerini düzenleyin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadApiKeys}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Yenile</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni API Anahtarı</span>
          </button>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İsim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  API Anahtarı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İzinler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Süre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Son Kullanım
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    API anahtarı bulunamadı
                  </td>
                </tr>
              ) : (
                apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {apiKey.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {apiKey.created_by}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          {showKeys[apiKey.id] 
                            ? apiKey.key 
                            : apiKey.key.substring(0, 8) + '••••••••••••••••' + apiKey.key.substring(apiKey.key.length - 4)}
                        </code>
                        <button
                          onClick={() => toggleShowKey(apiKey.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title={showKeys[apiKey.id] ? 'Gizle' : 'Göster'}
                        >
                          {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="Kopyala"
                        >
                          {copiedKey === apiKey.id ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <span 
                            key={permission} 
                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(apiKey.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getTimeRemaining(apiKey.expires)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(apiKey.last_used)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Yeni API Anahtarı Oluştur
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anahtar İsmi:
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Örn: Etsy Entegrasyonu"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İzinler:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                  {availablePermissions.map((permission) => (
                    <div key={permission.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={permission.value}
                        checked={newKeyPermissions.includes(permission.value)}
                        onChange={() => handlePermissionChange(permission.value)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor={permission.value} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Geçerlilik Süresi:
                </label>
                <select
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="never">Süresiz</option>
                  <option value="30">30 gün</option>
                  <option value="90">90 gün</option>
                  <option value="180">180 gün</option>
                  <option value="365">365 gün</option>
                </select>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    API anahtarı oluşturulduktan sonra tam anahtarı yalnızca bir kez görebileceksiniz. Lütfen güvenli bir yerde saklayın.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={createApiKey}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  disabled={!newKeyName.trim() || newKeyPermissions.length === 0}
                >
                  Oluştur
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;