import React, { useState, useEffect } from 'react';
import { Brain, Plus, Edit, Trash2, Save, Check, X, RefreshCw, Sparkles, Zap, AlertTriangle, Info, Settings, Key, Lock, FileText, Tag, CheckCircle } from 'lucide-react';
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
  
  // Provider form state
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState<'openai' | 'anthropic' | 'google' | 'custom'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [savingProvider, setSavingProvider] = useState(false);
  
  // Rule form state
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AIRule | null>(null);
  const [ruleType, setRuleType] = useState<'title' | 'tags'>('title');
  const [ruleName, setRuleName] = useState('');
  const [rulePrompt, setRulePrompt] = useState('');
  const [ruleMaxLength, setRuleMaxLength] = useState(140);
  const [ruleMinLength, setRuleMinLength] = useState(10);
  const [ruleApiProviderId, setRuleApiProviderId] = useState('');
  const [ruleIsDefault, setRuleIsDefault] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  
  // Test state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testType, setTestType] = useState<'title' | 'tags'>('title');
  const [testInput, setTestInput] = useState('');
  const [testRuleId, setTestRuleId] = useState('');
  const [testResult, setTestResult] = useState<string | string[]>('');
  const [testing, setTesting] = useState(false);

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
      const providers = await AIService.getProviders(user?.id || '');
      setProviders(providers);
      
      // Load rules
      const rules = await AIService.getRules(user?.id || '');
      setTitleRules(rules.filter(rule => rule.type === 'title'));
      setTagRules(rules.filter(rule => rule.type === 'tags'));
      
    } catch (error: any) {
      console.error('Error loading AI data:', error);
      setError(`Veri yüklenirken hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Provider form handlers
  const openProviderForm = (provider?: AIProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderName(provider.name);
      setProviderType(provider.provider);
      setApiKey(provider.apiKey);
    } else {
      setEditingProvider(null);
      setProviderName('');
      setProviderType('openai');
      setApiKey('');
    }
    setShowProviderForm(true);
  };

  const closeProviderForm = () => {
    setShowProviderForm(false);
    setEditingProvider(null);
    setProviderName('');
    setProviderType('openai');
    setApiKey('');
  };

  const saveProvider = async () => {
    if (!providerName.trim()) {
      setError('Sağlayıcı adı gereklidir.');
      return;
    }
    
    if (!apiKey.trim()) {
      setError('API anahtarı gereklidir.');
      return;
    }
    
    try {
      setSavingProvider(true);
      setError(null);
      
      const providerData = {
        name: providerName,
        provider: providerType,
        apiKey: apiKey,
        isActive: true
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
      
      // Close form
      closeProviderForm();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      setError(`Sağlayıcı kaydedilirken hata oluştu: ${error.message}`);
    } finally {
      setSavingProvider(false);
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!window.confirm('Bu API sağlayıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setError(null);
      
      // Check if provider is used in any rules
      const usedInRules = [...titleRules, ...tagRules].some(rule => rule.apiProviderId === providerId);
      
      if (usedInRules) {
        setError('Bu sağlayıcı bir veya daha fazla kuralda kullanılıyor. Önce bu kuralları silmeniz gerekiyor.');
        return;
      }
      
      await AIService.deleteProvider(user?.id || '', providerId);
      setSuccess('API sağlayıcı başarıyla silindi!');
      
      // Reload data
      await loadData();
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      setError(`Sağlayıcı silinirken hata oluştu: ${error.message}`);
    }
  };

  // Rule form handlers
  const openRuleForm = (rule?: AIRule) => {
    if (providers.length === 0) {
      setError('Kural oluşturmadan önce bir API sağlayıcı eklemelisiniz.');
      return;
    }
    
    if (rule) {
      setEditingRule(rule);
      setRuleType(rule.type);
      setRuleName(rule.name);
      setRulePrompt(rule.prompt);
      setRuleMaxLength(rule.maxLength);
      setRuleMinLength(rule.minLength);
      setRuleApiProviderId(rule.apiProviderId);
      setRuleIsDefault(rule.isDefault);
    } else {
      setEditingRule(null);
      setRuleType('title');
      setRuleName('');
      setRulePrompt('');
      setRuleMaxLength(140);
      setRuleMinLength(10);
      setRuleApiProviderId(providers[0]?.id || '');
      setRuleIsDefault(false);
    }
    setShowRuleForm(true);
  };

  const closeRuleForm = () => {
    setShowRuleForm(false);
    setEditingRule(null);
    setRuleType('title');
    setRuleName('');
    setRulePrompt('');
    setRuleMaxLength(140);
    setRuleMinLength(10);
    setRuleApiProviderId('');
    setRuleIsDefault(false);
  };

  const saveRule = async () => {
    if (!ruleName.trim()) {
      setError('Kural adı gereklidir.');
      return;
    }
    
    if (!rulePrompt.trim()) {
      setError('Kural metni gereklidir.');
      return;
    }
    
    if (!ruleApiProviderId) {
      setError('API sağlayıcı seçmelisiniz.');
      return;
    }
    
    try {
      setSavingRule(true);
      setError(null);
      
      const ruleData = {
        type: ruleType,
        name: ruleName,
        prompt: rulePrompt,
        maxLength: ruleMaxLength,
        minLength: ruleMinLength,
        apiProviderId: ruleApiProviderId,
        isDefault: ruleIsDefault
      };
      
      if (editingRule) {
        // Update existing rule
        await AIService.updateRule(user?.id || '', editingRule.id, ruleData);
        setSuccess('AI kuralı başarıyla güncellendi!');
      } else {
        // Create new rule
        await AIService.saveRule(user?.id || '', ruleData);
        setSuccess('AI kuralı başarıyla eklendi!');
      }
      
      // Reload data
      await loadData();
      
      // Close form
      closeRuleForm();
    } catch (error: any) {
      console.error('Error saving rule:', error);
      setError(`Kural kaydedilirken hata oluştu: ${error.message}`);
    } finally {
      setSavingRule(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Bu AI kuralını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setError(null);
      
      await AIService.deleteRule(user?.id || '', ruleId);
      setSuccess('AI kuralı başarıyla silindi!');
      
      // Reload data
      await loadData();
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      setError(`Kural silinirken hata oluştu: ${error.message}`);
    }
  };

  const setRuleAsDefault = async (rule: AIRule) => {
    try {
      setError(null);
      
      await AIService.updateRule(user?.id || '', rule.id, { isDefault: true });
      setSuccess(`"${rule.name}" varsayılan ${rule.type === 'title' ? 'başlık' : 'etiket'} kuralı olarak ayarlandı!`);
      
      // Reload data
      await loadData();
    } catch (error: any) {
      console.error('Error setting rule as default:', error);
      setError(`Kural varsayılan olarak ayarlanırken hata oluştu: ${error.message}`);
    }
  };

  // Test panel handlers
  const openTestPanel = () => {
    const rules = [...titleRules, ...tagRules];
    if (rules.length === 0) {
      setError('Test yapmadan önce en az bir kural oluşturmalısınız.');
      return;
    }
    
    setShowTestPanel(true);
    setTestType('title');
    setTestInput('');
    setTestRuleId(titleRules.find(r => r.isDefault)?.id || titleRules[0]?.id || '');
    setTestResult('');
  };

  const closeTestPanel = () => {
    setShowTestPanel(false);
    setTestType('title');
    setTestInput('');
    setTestRuleId('');
    setTestResult('');
  };

  const runTest = async () => {
    if (!testInput.trim()) {
      setError('Test için bir ürün bilgisi girmelisiniz.');
      return;
    }
    
    if (!testRuleId) {
      setError('Test için bir kural seçmelisiniz.');
      return;
    }
    
    try {
      setTesting(true);
      setError(null);
      setTestResult('');
      
      const response = await AIService.generateContent(user?.id || '', {
        productInfo: testInput,
        ruleId: testRuleId,
        type: testType
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      if (testType === 'title') {
        setTestResult(response.data?.title || 'Başlık oluşturulamadı.');
      } else {
        setTestResult(response.data?.tags || []);
      }
    } catch (error: any) {
      console.error('Error running test:', error);
      setError(`Test çalıştırılırken hata oluştu: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Helper function to get provider name by ID
  const getProviderName = (providerId: string): string => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.name : 'Bilinmeyen Sağlayıcı';
  };

  // Helper function to get provider type display name
  const getProviderTypeName = (type: string): string => {
    const typeMap: {[key: string]: string} = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google AI',
      'custom': 'Özel API'
    };
    return typeMap[type] || type;
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
            <Brain className="h-6 w-6 mr-2 text-orange-500" />
            AI Agent
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Başlık ve etiket oluşturma için AI kurallarını yönetin
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={openTestPanel}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Test Et</span>
          </Button>
        </div>
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
            <Key className="h-5 w-5 mr-2 text-orange-500" />
            API Sağlayıcıları
          </h2>
          <Button
            onClick={() => openProviderForm()}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Sağlayıcı Ekle</span>
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz API sağlayıcı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI özelliklerini kullanmak için bir API sağlayıcı eklemelisiniz.
            </p>
            <Button
              onClick={() => openProviderForm()}
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Sağlayıcıyı Ekle</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openProviderForm(provider)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProvider(provider.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sağlayıcı:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getProviderTypeName(provider.provider)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">API Anahtarı:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ••••••••{provider.apiKey.substring(provider.apiKey.length - 4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Durum:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        provider.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {provider.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            onClick={() => openRuleForm()}
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
              AI başlık önerilerini kullanmak için bir kural eklemelisiniz.
            </p>
            {providers.length === 0 ? (
              <p className="text-orange-500 dark:text-orange-400">
                Kural eklemek için önce bir API sağlayıcı eklemelisiniz.
              </p>
            ) : (
              <Button
                onClick={() => {
                  setRuleType('title');
                  openRuleForm();
                }}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>İlk Başlık Kuralını Ekle</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {titleRules.map((rule) => (
              <Card key={rule.id} className={`hover:shadow-lg transition-shadow ${
                rule.isDefault ? 'border-2 border-orange-500 dark:border-orange-400' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      {rule.isDefault && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-medium">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openRuleForm(rule)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sağlayıcı:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getProviderName(rule.apiProviderId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Uzunluk:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {rule.minLength} - {rule.maxLength} karakter
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Prompt:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg line-clamp-3">
                        {rule.prompt}
                      </p>
                    </div>
                    
                    {!rule.isDefault && (
                      <Button
                        onClick={() => setRuleAsDefault(rule)}
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Varsayılan Yap
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
              setRuleType('tags');
              openRuleForm();
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
              AI etiket önerilerini kullanmak için bir kural eklemelisiniz.
            </p>
            {providers.length === 0 ? (
              <p className="text-orange-500 dark:text-orange-400">
                Kural eklemek için önce bir API sağlayıcı eklemelisiniz.
              </p>
            ) : (
              <Button
                onClick={() => {
                  setRuleType('tags');
                  openRuleForm();
                }}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>İlk Etiket Kuralını Ekle</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tagRules.map((rule) => (
              <Card key={rule.id} className={`hover:shadow-lg transition-shadow ${
                rule.isDefault ? 'border-2 border-orange-500 dark:border-orange-400' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      {rule.isDefault && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-medium">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openRuleForm(rule)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sağlayıcı:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getProviderName(rule.apiProviderId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Uzunluk:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {rule.minLength} - {rule.maxLength} karakter
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Prompt:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg line-clamp-3">
                        {rule.prompt}
                      </p>
                    </div>
                    
                    {!rule.isDefault && (
                      <Button
                        onClick={() => setRuleAsDefault(rule)}
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Varsayılan Yap
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Provider Form Modal */}
      {showProviderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProvider ? 'API Sağlayıcı Düzenle' : 'API Sağlayıcı Ekle'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sağlayıcı Adı:
                </label>
                <Input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Örn: OpenAI API"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sağlayıcı Tipi:
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
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={saveProvider}
                  className="flex-1"
                  disabled={savingProvider}
                >
                  {savingProvider ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Kaydet</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={closeProviderForm}
                  variant="secondary"
                  className="flex-1"
                  disabled={savingProvider}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>İptal</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRule ? 'AI Kuralı Düzenle' : 'AI Kuralı Ekle'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kural Tipi:
                </label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as 'title' | 'tags')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  disabled={!!editingRule} // Can't change type when editing
                >
                  <option value="title">Başlık Kuralı</option>
                  <option value="tags">Etiket Kuralı</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kural Adı:
                </label>
                <Input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Örn: Etsy Başlık Kuralı"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt:
                </label>
                <textarea
                  value={rulePrompt}
                  onChange={(e) => setRulePrompt(e.target.value)}
                  placeholder={ruleType === 'title' 
                    ? "Aşağıdaki ürün için bir Etsy başlığı oluştur:\n\n{{product}}\n\nBaşlığın SEO dostu olduğundan emin ol ve anahtar kelimeleri içersin."
                    : "Aşağıdaki ürün için Etsy etiketleri oluştur:\n\n{{product}}\n\nEtiketler virgülle ayrılmış olmalı ve her biri 20 karakterden kısa olmalı."
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Info className="h-3 w-3 inline mr-1" />
                  <code>&lbrace;&lbrace;product&rbrace;&rbrace;</code> yer tutucusu, ürün bilgisiyle değiştirilecektir.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Uzunluk:
                  </label>
                  <Input
                    type="number"
                    value={ruleMinLength}
                    onChange={(e) => setRuleMinLength(parseInt(e.target.value))}
                    min={1}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maksimum Uzunluk:
                  </label>
                  <Input
                    type="number"
                    value={ruleMaxLength}
                    onChange={(e) => setRuleMaxLength(parseInt(e.target.value))}
                    min={ruleMinLength}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Sağlayıcı:
                </label>
                <select
                  value={ruleApiProviderId}
                  onChange={(e) => setRuleApiProviderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sağlayıcı seçin...</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({getProviderTypeName(provider.provider)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={ruleIsDefault}
                  onChange={(e) => setRuleIsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                  Bu kuralı varsayılan olarak ayarla
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={saveRule}
                  className="flex-1"
                  disabled={savingRule}
                >
                  {savingRule ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Kaydet</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={closeRuleForm}
                  variant="secondary"
                  className="flex-1"
                  disabled={savingRule}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>İptal</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Panel Modal */}
      {showTestPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Kuralı Test Et
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Tipi:
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={testType === 'title'}
                      onChange={() => {
                        setTestType('title');
                        setTestRuleId(titleRules.find(r => r.isDefault)?.id || titleRules[0]?.id || '');
                        setTestResult('');
                      }}
                      className="rounded-full border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Başlık</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={testType === 'tags'}
                      onChange={() => {
                        setTestType('tags');
                        setTestRuleId(tagRules.find(r => r.isDefault)?.id || tagRules[0]?.id || '');
                        setTestResult('');
                      }}
                      className="rounded-full border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Etiketler</span>
                  </label>
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
                  {(testType === 'title' ? titleRules : tagRules).map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name} {rule.isDefault ? '(Varsayılan)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ürün Bilgisi:
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Ürününüzü tanımlayın..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={4}
                />
              </div>
              
              {/* Test Result */}
              {testResult && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                    Test Sonucu:
                  </h3>
                  {testType === 'title' ? (
                    <p className="text-green-700 dark:text-green-400">{testResult as string}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(testResult) ? (
                        testResult.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-sm"
                          >
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
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={runTest}
                  className="flex-1"
                  disabled={testing || !testInput.trim() || !testRuleId}
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Test Ediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      <span>Test Et</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={closeTestPanel}
                  variant="secondary"
                  className="flex-1"
                  disabled={testing}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Kapat</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentPage;