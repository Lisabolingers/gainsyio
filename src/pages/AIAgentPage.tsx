import React, { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Edit, Save, X, Check, AlertTriangle, Zap, Server, Key, BookOpen, Sparkles, RefreshCw, Database, Lock, Settings, Code, FileText, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { AIService, AIProvider, AIRule } from '../lib/aiService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const AIAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [titleRules, setTitleRules] = useState<AIRule[]>([]);
  const [tagRules, setTagRules] = useState<AIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showTitleRuleForm, setShowTitleRuleForm] = useState(false);
  const [showTagRuleForm, setShowTagRuleForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [editingTitleRule, setEditingTitleRule] = useState<AIRule | null>(null);
  const [editingTagRule, setEditingTagRule] = useState<AIRule | null>(null);
  
  // Provider form
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState<'openai' | 'anthropic' | 'google' | 'custom'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Title rule form
  const [titleRuleName, setTitleRuleName] = useState('');
  const [titlePrompt, setTitlePrompt] = useState('');
  const [titleMaxLength, setTitleMaxLength] = useState(140);
  const [titleMinLength, setTitleMinLength] = useState(20);
  const [titleProviderId, setTitleProviderId] = useState('');
  const [titleIsDefault, setTitleIsDefault] = useState(false);
  
  // Tag rule form
  const [tagRuleName, setTagRuleName] = useState('');
  const [tagPrompt, setTagPrompt] = useState('');
  const [tagMaxLength, setTagMaxLength] = useState(20);
  const [tagMinLength, setTagMinLength] = useState(3);
  const [tagProviderId, setTagProviderId] = useState('');
  const [tagIsDefault, setTagIsDefault] = useState(false);
  
  // Test states
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | string[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testType, setTestType] = useState<'title' | 'tags'>('title');
  const [testRuleId, setTestRuleId] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load providers
      const providersData = await AIService.getProviders(user?.id || '');
      setProviders(providersData);
      
      // Load rules
      const rulesData = await AIService.getRules(user?.id || '');
      setTitleRules(rulesData.filter(rule => rule.type === 'title'));
      setTagRules(rulesData.filter(rule => rule.type === 'tags'));
      
      console.log('✅ Loaded AI data:', {
        providers: providersData.length,
        titleRules: rulesData.filter(rule => rule.type === 'title').length,
        tagRules: rulesData.filter(rule => rule.type === 'tags').length
      });
      
    } catch (error: any) {
      console.error('❌ Error loading AI data:', error);
      setError(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Provider form handlers
  const resetProviderForm = () => {
    setProviderName('');
    setProviderType('openai');
    setApiKey('');
    setIsActive(true);
    setEditingProvider(null);
    setShowProviderForm(false);
  };

  const handleProviderSubmit = async () => {
    if (!providerName.trim()) {
      setError('Sağlayıcı adı gereklidir.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const providerData = {
        name: providerName,
        provider: providerType,
        apiKey,
        isActive
      };
      
      if (editingProvider) {
        // Update existing provider
        await AIService.updateProvider(user?.id || '', editingProvider.id, providerData);
        setSuccess('API sağlayıcı başarıyla güncellendi!');
      } else {
        // Create new provider
        await AIService.saveProvider(user?.id || '', providerData);
        setSuccess('API sağlayıcı başarıyla eklendi!');
      }
      
      // Reload data
      await loadData();
      resetProviderForm();
      
    } catch (error: any) {
      console.error('❌ Error saving provider:', error);
      setError(`API sağlayıcı kaydedilirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    setProviderName(provider.name);
    setProviderType(provider.provider);
    setApiKey(provider.apiKey);
    setIsActive(provider.isActive);
    setShowProviderForm(true);
  };

  const deleteProvider = async (providerId: string) => {
    if (!window.confirm('Bu API sağlayıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await AIService.deleteProvider(user?.id || '', providerId);
      setSuccess('API sağlayıcı başarıyla silindi!');
      
      // Reload data
      await loadData();
      
    } catch (error: any) {
      console.error('❌ Error deleting provider:', error);
      setError(`API sağlayıcı silinirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle provider active status
  const toggleProviderStatus = async (providerId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      await AIService.updateProvider(user?.id || '', providerId, {
        isActive: !currentStatus
      });
      
      setSuccess(`API sağlayıcı ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi!`);
      
      // Reload data
      await loadData();
      
    } catch (error: any) {
      console.error('❌ Error toggling provider status:', error);
      setError(`API sağlayıcı durumu değiştirilirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Title rule form handlers
  const resetTitleRuleForm = () => {
    setTitleRuleName('');
    setTitlePrompt('');
    setTitleMaxLength(140);
    setTitleMinLength(20);
    setTitleProviderId('');
    setTitleIsDefault(false);
    setEditingTitleRule(null);
    setShowTitleRuleForm(false);
  };

  const handleTitleRuleSubmit = async () => {
    if (!titleRuleName.trim() || !titlePrompt.trim() || !titleProviderId) {
      setError('Tüm alanları doldurun.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const ruleData = {
        type: 'title' as const,
        name: titleRuleName,
        prompt: titlePrompt,
        maxLength: titleMaxLength,
        minLength: titleMinLength,
        apiProviderId: titleProviderId,
        isDefault: titleIsDefault
      };
      
      if (editingTitleRule) {
        // Update existing rule
        await AIService.updateRule(user?.id || '', editingTitleRule.id, ruleData);
        setSuccess('Başlık kuralı başarıyla güncellendi!');
      } else {
        // Create new rule
        await AIService.saveRule(user?.id || '', ruleData);
        setSuccess('Başlık kuralı başarıyla eklendi!');
      }
      
      // Reload data
      await loadData();
      resetTitleRuleForm();
      
    } catch (error: any) {
      console.error('❌ Error saving title rule:', error);
      setError(`Başlık kuralı kaydedilirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editTitleRule = (rule: AIRule) => {
    setEditingTitleRule(rule);
    setTitleRuleName(rule.name);
    setTitlePrompt(rule.prompt);
    setTitleMaxLength(rule.maxLength);
    setTitleMinLength(rule.minLength);
    setTitleProviderId(rule.apiProviderId);
    setTitleIsDefault(rule.isDefault);
    setShowTitleRuleForm(true);
  };

  const deleteTitleRule = async (ruleId: string) => {
    if (!window.confirm('Bu başlık kuralını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await AIService.deleteRule(user?.id || '', ruleId);
      setSuccess('Başlık kuralı başarıyla silindi!');
      
      // Reload data
      await loadData();
      
    } catch (error: any) {
      console.error('❌ Error deleting title rule:', error);
      setError(`Başlık kuralı silinirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Tag rule form handlers
  const resetTagRuleForm = () => {
    setTagRuleName('');
    setTagPrompt('');
    setTagMaxLength(20);
    setTagMinLength(3);
    setTagProviderId('');
    setTagIsDefault(false);
    setEditingTagRule(null);
    setShowTagRuleForm(false);
  };

  const handleTagRuleSubmit = async () => {
    if (!tagRuleName.trim() || !tagPrompt.trim() || !tagProviderId) {
      setError('Tüm alanları doldurun.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const ruleData = {
        type: 'tags' as const,
        name: tagRuleName,
        prompt: tagPrompt,
        maxLength: tagMaxLength,
        minLength: tagMinLength,
        apiProviderId: tagProviderId,
        isDefault: tagIsDefault
      };
      
      if (editingTagRule) {
        // Update existing rule
        await AIService.updateRule(user?.id || '', editingTagRule.id, ruleData);
        setSuccess('Etiket kuralı başarıyla güncellendi!');
      } else {
        // Create new rule
        await AIService.saveRule(user?.id || '', ruleData);
        setSuccess('Etiket kuralı başarıyla eklendi!');
      }
      
      // Reload data
      await loadData();
      resetTagRuleForm();
      
    } catch (error: any) {
      console.error('❌ Error saving tag rule:', error);
      setError(`Etiket kuralı kaydedilirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const editTagRule = (rule: AIRule) => {
    setEditingTagRule(rule);
    setTagRuleName(rule.name);
    setTagPrompt(rule.prompt);
    setTagMaxLength(rule.maxLength);
    setTagMinLength(rule.minLength);
    setTagProviderId(rule.apiProviderId);
    setTagIsDefault(rule.isDefault);
    setShowTagRuleForm(true);
  };

  const deleteTagRule = async (ruleId: string) => {
    if (!window.confirm('Bu etiket kuralını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await AIService.deleteRule(user?.id || '', ruleId);
      setSuccess('Etiket kuralı başarıyla silindi!');
      
      // Reload data
      await loadData();
      
    } catch (error: any) {
      console.error('❌ Error deleting tag rule:', error);
      setError(`Etiket kuralı silinirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Set a rule as default
  const setRuleAsDefault = async (ruleId: string, type: 'title' | 'tags') => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the rule
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      
      // Update the rule
      await AIService.updateRule(user?.id || '', ruleId, {
        ...data,
        isDefault: true
      });
      
      setSuccess(`${type === 'title' ? 'Başlık' : 'Etiket'} kuralı varsayılan olarak ayarlandı!`);
      
      // Reload data
      await loadData();
      
    } catch (error: any) {
      console.error('❌ Error setting rule as default:', error);
      setError(`Kural varsayılan olarak ayarlanırken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test AI generation
  const testAIGeneration = async () => {
    if (!testInput.trim() || !testRuleId) {
      setError('Lütfen test için bir metin ve kural seçin.');
      return;
    }
    
    try {
      setTestLoading(true);
      setError(null);
      setTestResult(null);
      
      const response = await AIService.generateContent(user?.id || '', {
        productInfo: testInput,
        ruleId: testRuleId,
        type: testType
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      if (testType === 'title') {
        setTestResult(response.data?.title || 'Sonuç bulunamadı');
      } else {
        setTestResult(response.data?.tags || []);
      }
      
    } catch (error: any) {
      console.error('❌ Error testing AI generation:', error);
      setError(`AI testi sırasında hata oluştu: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  // Get provider name by ID
  const getProviderName = (providerId: string): string => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Bilinmeyen Sağlayıcı';
  };

  if (loading && providers.length === 0) {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Brain className="h-6 w-6 mr-2 text-orange-500" />
          AI Agent
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Başlık ve etiket oluşturma için AI kurallarını yönetin
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500" />
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* API Providers Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Server className="h-5 w-5 mr-2 text-orange-500" />
            API Sağlayıcıları
          </h2>
          <Button
            onClick={() => {
              resetProviderForm();
              setShowProviderForm(true);
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Sağlayıcı Ekle</span>
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz API sağlayıcı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI özelliklerini kullanmak için bir API sağlayıcı ekleyin
            </p>
            <Button
              onClick={() => {
                resetProviderForm();
                setShowProviderForm(true);
              }}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Sağlayıcıyı Ekle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        {provider.name}
                        {provider.isActive ? (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs rounded-full">
                            Pasif
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {provider.provider === 'openai' ? 'OpenAI' : 
                         provider.provider === 'anthropic' ? 'Anthropic' : 
                         provider.provider === 'google' ? 'Google AI' : 'Özel API'}
                      </p>
                      <div className="mt-2 flex items-center">
                        <Key className="h-3 w-3 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {provider.apiKey && provider.apiKey.length > 0 
                            ? `${provider.apiKey.substring(0, 4)}•••••••••••••••`
                            : 'API anahtarı yok'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleProviderStatus(provider.id, provider.isActive)}
                        className={`p-1 ${provider.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
                        title={provider.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      >
                        {provider.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => editProvider(provider)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProvider(provider.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Provider Form */}
        {showProviderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingProvider ? 'API Sağlayıcı Düzenle' : 'Yeni API Sağlayıcı'}
                  </h2>
                  <button
                    onClick={resetProviderForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sağlayıcı Adı:
                  </label>
                  <Input
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Örn: OpenAI GPT-4"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sağlayıcı Türü:
                  </label>
                  <select
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google AI</option>
                    <option value="custom">Özel API</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Anahtarı:
                  </label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Aktif
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleProviderSubmit}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : (editingProvider ? 'Güncelle' : 'Kaydet')}
                  </Button>
                  <Button
                    onClick={resetProviderForm}
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

      {/* Title Rules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-500" />
            Başlık Kuralları
          </h2>
          <Button
            onClick={() => {
              if (providers.length === 0) {
                setError('Önce bir API sağlayıcı eklemelisiniz.');
                return;
              }
              resetTitleRuleForm();
              setShowTitleRuleForm(true);
            }}
            className="flex items-center space-x-2"
            disabled={providers.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Kural Ekle</span>
          </Button>
        </div>

        {titleRules.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz başlık kuralı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI ile otomatik başlık oluşturmak için bir kural ekleyin
            </p>
            {providers.length > 0 ? (
              <Button
                onClick={() => {
                  resetTitleRuleForm();
                  setShowTitleRuleForm(true);
                }}
                className="mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Kuralı Ekle
              </Button>
            ) : (
              <p className="text-orange-500 dark:text-orange-400">
                Önce bir API sağlayıcı eklemelisiniz.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {titleRules.map((rule) => (
              <Card key={rule.id} className={`hover:shadow-lg transition-shadow ${rule.isDefault ? 'border-2 border-orange-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        {rule.name}
                        {rule.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs rounded-full">
                            Varsayılan
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sağlayıcı: {getProviderName(rule.apiProviderId)}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <p>Uzunluk: {rule.minLength}-{rule.maxLength} karakter</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {!rule.isDefault && (
                        <button
                          onClick={() => setRuleAsDefault(rule.id, 'title')}
                          className="p-1 text-orange-500 hover:text-orange-700"
                          title="Varsayılan Yap"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => editTitleRule(rule)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTitleRule(rule.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center mb-1">
                      <Code className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-medium">Prompt:</span>
                    </div>
                    <p className="text-xs line-clamp-2">{rule.prompt}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Title Rule Form */}
        {showTitleRuleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTitleRule ? 'Başlık Kuralı Düzenle' : 'Yeni Başlık Kuralı'}
                  </h2>
                  <button
                    onClick={resetTitleRuleForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kural Adı:
                  </label>
                  <Input
                    value={titleRuleName}
                    onChange={(e) => setTitleRuleName(e.target.value)}
                    placeholder="Örn: Etsy Başlık Kuralı"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Sağlayıcı:
                  </label>
                  <select
                    value={titleProviderId}
                    onChange={(e) => setTitleProviderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sağlayıcı seçin...</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id} disabled={!provider.isActive}>
                        {provider.name} {!provider.isActive && '(Pasif)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prompt:
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Ürün bilgisi için <code>{'{{product}}'}</code> yer tutucusunu kullanın.
                    </span>
                  </div>
                  <textarea
                    value={titlePrompt}
                    onChange={(e) => setTitlePrompt(e.target.value)}
                    placeholder="Örn: Aşağıdaki ürün için SEO dostu bir Etsy başlığı oluştur: {{product}}"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={5}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Uzunluk:
                    </label>
                    <Input
                      type="number"
                      value={titleMinLength}
                      onChange={(e) => setTitleMinLength(parseInt(e.target.value))}
                      min={1}
                      max={100}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maksimum Uzunluk:
                    </label>
                    <Input
                      type="number"
                      value={titleMaxLength}
                      onChange={(e) => setTitleMaxLength(parseInt(e.target.value))}
                      min={10}
                      max={200}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="titleIsDefault"
                    checked={titleIsDefault}
                    onChange={(e) => setTitleIsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="titleIsDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Varsayılan kural olarak ayarla
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleTitleRuleSubmit}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : (editingTitleRule ? 'Güncelle' : 'Kaydet')}
                  </Button>
                  <Button
                    onClick={resetTitleRuleForm}
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

      {/* Tag Rules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Tag className="h-5 w-5 mr-2 text-orange-500" />
            Etiket Kuralları
          </h2>
          <Button
            onClick={() => {
              if (providers.length === 0) {
                setError('Önce bir API sağlayıcı eklemelisiniz.');
                return;
              }
              resetTagRuleForm();
              setShowTagRuleForm(true);
            }}
            className="flex items-center space-x-2"
            disabled={providers.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Kural Ekle</span>
          </Button>
        </div>

        {tagRules.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz etiket kuralı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI ile otomatik etiket oluşturmak için bir kural ekleyin
            </p>
            {providers.length > 0 ? (
              <Button
                onClick={() => {
                  resetTagRuleForm();
                  setShowTagRuleForm(true);
                }}
                className="mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Kuralı Ekle
              </Button>
            ) : (
              <p className="text-orange-500 dark:text-orange-400">
                Önce bir API sağlayıcı eklemelisiniz.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tagRules.map((rule) => (
              <Card key={rule.id} className={`hover:shadow-lg transition-shadow ${rule.isDefault ? 'border-2 border-orange-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        {rule.name}
                        {rule.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs rounded-full">
                            Varsayılan
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sağlayıcı: {getProviderName(rule.apiProviderId)}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <p>Uzunluk: {rule.minLength}-{rule.maxLength} karakter</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {!rule.isDefault && (
                        <button
                          onClick={() => setRuleAsDefault(rule.id, 'tags')}
                          className="p-1 text-orange-500 hover:text-orange-700"
                          title="Varsayılan Yap"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => editTagRule(rule)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTagRule(rule.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center mb-1">
                      <Code className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-medium">Prompt:</span>
                    </div>
                    <p className="text-xs line-clamp-2">{rule.prompt}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tag Rule Form */}
        {showTagRuleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingTagRule ? 'Etiket Kuralı Düzenle' : 'Yeni Etiket Kuralı'}
                  </h2>
                  <button
                    onClick={resetTagRuleForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kural Adı:
                  </label>
                  <Input
                    value={tagRuleName}
                    onChange={(e) => setTagRuleName(e.target.value)}
                    placeholder="Örn: Etsy Etiket Kuralı"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Sağlayıcı:
                  </label>
                  <select
                    value={tagProviderId}
                    onChange={(e) => setTagProviderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sağlayıcı seçin...</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id} disabled={!provider.isActive}>
                        {provider.name} {!provider.isActive && '(Pasif)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prompt:
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Ürün bilgisi için <code>{'{{product}}'}</code> yer tutucusunu kullanın.
                    </span>
                  </div>
                  <textarea
                    value={tagPrompt}
                    onChange={(e) => setTagPrompt(e.target.value)}
                    placeholder="Örn: Aşağıdaki ürün için 13 adet SEO dostu Etsy etiketi oluştur: {{product}}"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={5}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Uzunluk:
                    </label>
                    <Input
                      type="number"
                      value={tagMinLength}
                      onChange={(e) => setTagMinLength(parseInt(e.target.value))}
                      min={1}
                      max={20}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maksimum Uzunluk:
                    </label>
                    <Input
                      type="number"
                      value={tagMaxLength}
                      onChange={(e) => setTagMaxLength(parseInt(e.target.value))}
                      min={3}
                      max={50}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tagIsDefault"
                    checked={tagIsDefault}
                    onChange={(e) => setTagIsDefault(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="tagIsDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Varsayılan kural olarak ayarla
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleTagRuleSubmit}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Kaydediliyor...' : (editingTagRule ? 'Güncelle' : 'Kaydet')}
                  </Button>
                  <Button
                    onClick={resetTagRuleForm}
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

      {/* Test Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <Zap className="h-5 w-5 mr-2 text-orange-500" />
          AI Testi
        </h2>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Türü:
                </label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="testTypeTitle"
                      name="testType"
                      value="title"
                      checked={testType === 'title'}
                      onChange={() => setTestType('title')}
                      className="rounded-full border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="testTypeTitle" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Başlık
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="testTypeTags"
                      name="testType"
                      value="tags"
                      checked={testType === 'tags'}
                      onChange={() => setTestType('tags')}
                      className="rounded-full border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="testTypeTags" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Etiketler
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kural:
                </label>
                <select
                  value={testRuleId}
                  onChange={(e) => setTestRuleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Kural seçin...</option>
                  {testType === 'title' ? (
                    titleRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Varsayılan)' : ''}
                      </option>
                    ))
                  ) : (
                    tagRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Varsayılan)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Metni:
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Ürün bilgilerini buraya girin..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={4}
                />
              </div>
              
              <Button
                onClick={testAIGeneration}
                className="flex items-center space-x-2"
                disabled={testLoading || !testInput.trim() || !testRuleId}
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Test Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Test Et</span>
                  </>
                )}
              </Button>
              
              {/* Test Results */}
              {testResult && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-orange-500" />
                    Test Sonucu:
                  </h3>
                  
                  {testType === 'title' ? (
                    <p className="text-gray-700 dark:text-gray-300">{testResult as string}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(testResult) ? (
                        testResult.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 rounded-full text-sm">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Etiket bulunamadı</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAgentPage;