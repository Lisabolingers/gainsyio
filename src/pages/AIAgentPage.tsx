import React, { useState, useEffect } from 'react';
import { Brain, Key, Settings, Save, Plus, Trash2, RefreshCw, FileText, Tag, Zap, AlertCircle, Check, Info, Lock, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface ApiKey {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  key: string;
  name: string;
  isActive: boolean;
}

interface AIRule {
  id: string;
  type: 'title' | 'tags';
  name: string;
  prompt: string;
  maxLength: number;
  minLength: number;
  apiProvider: string;
  isDefault: boolean;
  createdAt: string;
}

const AIAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [rules, setRules] = useState<AIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [savingRule, setSavingRule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // API Key form state
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<'openai' | 'anthropic' | 'google' | 'custom'>('openai');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  
  // Rule form state
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleType, setRuleType] = useState<'title' | 'tags'>('title');
  const [ruleName, setRuleName] = useState('');
  const [rulePrompt, setRulePrompt] = useState('');
  const [ruleMaxLength, setRuleMaxLength] = useState<number>(140);
  const [ruleMinLength, setRuleMinLength] = useState<number>(20);
  const [ruleApiProvider, setRuleApiProvider] = useState('');

  // Test AI Generation state
  const [testProductDescription, setTestProductDescription] = useState('');
  const [testGeneratedTitle, setTestGeneratedTitle] = useState('');
  const [testGeneratedTags, setTestGeneratedTags] = useState('');
  const [selectedTestTitleRule, setSelectedTestTitleRule] = useState('');
  const [selectedTestTagsRule, setSelectedTestTagsRule] = useState('');
  const [testAiLoading, setTestAiLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadApiKeys();
      loadRules();
    }
  }, [user]);

  // Set default max length based on rule type
  useEffect(() => {
    if (ruleType === 'title') {
      setRuleMaxLength(140);
      setRuleMinLength(20);
    } else {
      setRuleMaxLength(20);
      setRuleMinLength(3);
    }
  }, [ruleType]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading API keys...');
      
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ API key loading error:', error);
        throw error;
      }
      
      // Transform data to match our interface
      const transformedData: ApiKey[] = data?.map(item => ({
        id: item.id,
        provider: item.provider as 'openai' | 'anthropic' | 'google' | 'custom',
        key: item.api_key.substring(0, 6) + '••••••••••••••••••••••••••••••••••••••••••',
        name: item.name,
        isActive: item.is_active
      })) || [];
      
      setApiKeys(transformedData);
      console.log(`✅ ${transformedData.length} API keys loaded`);
    } catch (error: any) {
      console.error('❌ Error loading API keys:', error);
      setError('API anahtarları yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading AI rules...');
      
      const { data, error } = await supabase
        .from('ai_rules')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ AI rules loading error:', error);
        throw error;
      }
      
      // Transform data to match our interface
      const transformedData: AIRule[] = data?.map(item => ({
        id: item.id,
        type: item.type as 'title' | 'tags',
        name: item.name,
        prompt: item.prompt,
        maxLength: item.max_length,
        minLength: item.min_length,
        apiProvider: item.api_provider_id,
        isDefault: item.is_default,
        createdAt: item.created_at
      })) || [];
      
      setRules(transformedData);
      console.log(`✅ ${transformedData.length} AI rules loaded`);
    } catch (error: any) {
      console.error('❌ Error loading AI rules:', error);
      setError('AI kuralları yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setError('API anahtar adı ve değeri gereklidir.');
      return;
    }
    
    try {
      setSavingKey(true);
      setError(null);
      console.log('💾 Saving API key...');
      
      const { data, error } = await supabase
        .from('ai_providers')
        .insert({
          user_id: user?.id,
          provider: newKeyProvider,
          api_key: newKeyValue,
          name: newKeyName,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ API key save error:', error);
        throw error;
      }
      
      console.log('✅ API key saved successfully:', data);
      
      // Add to state with masked key
      const newKey: ApiKey = {
        id: data.id,
        provider: data.provider,
        key: newKeyValue.substring(0, 6) + '••••••••••••••••••••••••••••••••••••••••••',
        name: data.name,
        isActive: data.is_active
      };
      
      setApiKeys(prev => [...prev, newKey]);
      
      // Reset form
      setNewKeyProvider('openai');
      setNewKeyName('');
      setNewKeyValue('');
      setShowAddKey(false);
      
      setSuccess('API anahtarı başarıyla kaydedildi!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error saving API key:', error);
      setError('API anahtarı kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSavingKey(false);
    }
  };

  const saveRule = async () => {
    if (!ruleName.trim() || !rulePrompt.trim() || !ruleApiProvider) {
      setError('Kural adı, istem metni ve API sağlayıcı gereklidir.');
      return;
    }
    
    try {
      setSavingRule(true);
      setError(null);
      console.log('💾 Saving AI rule...');
      
      if (editingRuleId) {
        // Update existing rule
        const { data, error } = await supabase
          .from('ai_rules')
          .update({
            type: ruleType,
            name: ruleName,
            prompt: rulePrompt,
            max_length: ruleMaxLength,
            min_length: ruleMinLength,
            api_provider_id: ruleApiProvider,
            is_default: false // Default status is handled separately
          })
          .eq('id', editingRuleId)
          .eq('user_id', user?.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ AI rule update error:', error);
          throw error;
        }
        
        console.log('✅ AI rule updated successfully:', data);
        
        // Update in state
        setRules(prev => prev.map(rule => {
          if (rule.id === editingRuleId) {
            return {
              ...rule,
              type: ruleType,
              name: ruleName,
              prompt: rulePrompt,
              maxLength: ruleMaxLength,
              minLength: ruleMinLength,
              apiProvider: ruleApiProvider
            };
          }
          return rule;
        }));
      } else {
        // Create new rule
        const { data, error } = await supabase
          .from('ai_rules')
          .insert({
            user_id: user?.id,
            type: ruleType,
            name: ruleName,
            prompt: rulePrompt,
            max_length: ruleMaxLength,
            min_length: ruleMinLength,
            api_provider_id: ruleApiProvider,
            is_default: false // Default status is handled separately
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ AI rule save error:', error);
          throw error;
        }
        
        console.log('✅ AI rule saved successfully:', data);
        
        // Add to state
        const newRule: AIRule = {
          id: data.id,
          type: data.type,
          name: data.name,
          prompt: data.prompt,
          maxLength: data.max_length,
          minLength: data.min_length,
          apiProvider: data.api_provider_id,
          isDefault: data.is_default,
          createdAt: data.created_at
        };
        
        setRules(prev => [...prev, newRule]);
      }
      
      // Reset form
      resetRuleForm();
      
      setSuccess(`AI kuralı ${editingRuleId ? 'güncellendi' : 'kaydedildi'}!`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error saving AI rule:', error);
      setError('AI kuralı kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSavingRule(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!window.confirm('Bu API anahtarını silmek istediğinizden emin misiniz?')) return;
    
    try {
      console.log(`🗑️ Deleting API key: ${keyId}`);
      
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ API key delete error:', error);
        throw error;
      }
      
      console.log('✅ API key deleted successfully');
      
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      setSuccess('API anahtarı başarıyla silindi!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error deleting API key:', error);
      setError('API anahtarı silinirken hata oluştu: ' + error.message);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Bu AI kuralını silmek istediğinizden emin misiniz?')) return;
    
    try {
      console.log(`🗑️ Deleting AI rule: ${ruleId}`);
      
      const { error } = await supabase
        .from('ai_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ AI rule delete error:', error);
        throw error;
      }
      
      console.log('✅ AI rule deleted successfully');
      
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      setSuccess('AI kuralı başarıyla silindi!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error deleting AI rule:', error);
      setError('AI kuralı silinirken hata oluştu: ' + error.message);
    }
  };

  const toggleApiKeyStatus = async (keyId: string) => {
    try {
      console.log(`🔄 Toggling API key status: ${keyId}`);
      
      // Find current status
      const currentKey = apiKeys.find(key => key.id === keyId);
      if (!currentKey) return;
      
      const newStatus = !currentKey.isActive;
      
      const { error } = await supabase
        .from('ai_providers')
        .update({ is_active: newStatus })
        .eq('id', keyId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ API key status update error:', error);
        throw error;
      }
      
      console.log(`✅ API key status updated to: ${newStatus}`);
      
      setApiKeys(prev => prev.map(key => {
        if (key.id === keyId) {
          return { ...key, isActive: newStatus };
        }
        return key;
      }));
      
    } catch (error: any) {
      console.error('❌ Error updating API key status:', error);
      setError('API anahtarı durumu güncellenirken hata oluştu: ' + error.message);
    }
  };

  const setRuleAsDefault = async (ruleId: string, ruleType: 'title' | 'tags') => {
    try {
      console.log(`🔄 Setting rule as default: ${ruleId}`);
      
      const { error } = await supabase
        .from('ai_rules')
        .update({ is_default: true })
        .eq('id', ruleId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Set default rule error:', error);
        throw error;
      }
      
      console.log('✅ Rule set as default successfully');
      
      // Update state - our trigger function will handle unsetting other defaults
      setRules(prev => prev.map(rule => {
        if (rule.type === ruleType) {
          return { ...rule, isDefault: rule.id === ruleId };
        }
        return rule;
      }));
      
      setSuccess('Varsayılan kural başarıyla güncellendi!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload rules to ensure consistency
      loadRules();
      
    } catch (error: any) {
      console.error('❌ Error setting default rule:', error);
      setError('Varsayılan kural ayarlanırken hata oluştu: ' + error.message);
    }
  };

  const editRule = (rule: AIRule) => {
    setEditingRuleId(rule.id);
    setRuleType(rule.type);
    setRuleName(rule.name);
    setRulePrompt(rule.prompt);
    setRuleMaxLength(rule.maxLength);
    setRuleMinLength(rule.minLength);
    setRuleApiProvider(rule.apiProvider);
    setShowAddRule(true);
  };

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setRuleType('title');
    setRuleName('');
    setRulePrompt('');
    setRuleMaxLength(140);
    setRuleMinLength(20);
    setRuleApiProvider('');
    setShowAddRule(false);
  };

  const handleGenerateTestContent = async () => {
    if (!testProductDescription.trim()) {
      setError('Test için bir ürün açıklaması girin.');
      return;
    }

    try {
      setTestAiLoading(true);
      setError(null);
      console.log('🤖 Generating test content...');

      // Mock AI generation for demonstration
      // In a real implementation, this would call the Supabase Edge Function
      
      let generatedTitle = '';
      let generatedTags = '';

      if (selectedTestTitleRule) {
        const titleRule = rules.find(rule => rule.id === selectedTestTitleRule);
        if (titleRule) {
          // Mock title generation based on the product description
          generatedTitle = `Premium ${testProductDescription} - Handcrafted Quality Design - Perfect Gift Idea - Instant Download`;
          if (generatedTitle.length > titleRule.maxLength) {
            generatedTitle = generatedTitle.substring(0, titleRule.maxLength - 3) + '...';
          }
        }
      }

      if (selectedTestTagsRule) {
        const tagsRule = rules.find(rule => rule.id === selectedTestTagsRule);
        if (tagsRule) {
          // Mock tags generation based on the product description
          const mockTags = [
            'handmade', 'custom design', 'gift idea', 'digital download', 
            'printable art', 'home decor', 'wall art', 'instant download',
            'personalized', 'unique gift', 'creative', 'modern design', 'trendy'
          ];
          generatedTags = mockTags.slice(0, 13).join(', ');
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTestGeneratedTitle(generatedTitle);
      setTestGeneratedTags(generatedTags);

      setSuccess('Test içeriği başarıyla oluşturuldu!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      console.error('❌ Error generating test content:', error);
      setError('Test içeriği oluşturulurken hata oluştu: ' + error.message);
    } finally {
      setTestAiLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      case 'google':
        return '🔍';
      case 'custom':
        return '⚙️';
      default:
        return '🔑';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'google':
        return 'Google AI';
      case 'custom':
        return 'Custom API';
      default:
        return provider;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Brain className="h-6 w-6 mr-2 text-orange-500" />
          AI Agent
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Başlık ve etiket oluşturma için AI ayarlarını yapılandırın
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
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

      {/* API Keys Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Key className="h-5 w-5 mr-2 text-orange-500" />
            API Anahtarları
          </h2>
          <Button
            onClick={() => setShowAddKey(!showAddKey)}
            className="flex items-center space-x-2"
          >
            {showAddKey ? (
              <>
                <X className="h-4 w-4" />
                <span>İptal</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>API Anahtarı Ekle</span>
              </>
            )}
          </Button>
        </div>

        {/* Add API Key Form */}
        {showAddKey && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Yeni API Anahtarı Ekle
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sağlayıcı
                    </label>
                    <select
                      value={newKeyProvider}
                      onChange={(e) => setNewKeyProvider(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google AI</option>
                      <option value="custom">Custom API</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      İsim
                    </label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="örn. OpenAI GPT-4"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Anahtarı
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="API anahtarınızı girin"
                      className="w-full pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    API anahtarınız güvenli bir şekilde saklanır ve asla üçüncü taraflarla paylaşılmaz.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => {
                      setShowAddKey(false);
                      setNewKeyProvider('openai');
                      setNewKeyName('');
                      setNewKeyValue('');
                    }}
                    variant="secondary"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={saveApiKey}
                    disabled={savingKey || !newKeyName.trim() || !newKeyValue.trim()}
                  >
                    {savingKey ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span>API Anahtarını Kaydet</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              API Anahtarı Eklenmemiş
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI özelliklerini kullanmak için ilk API anahtarınızı ekleyin
            </p>
            <Button
              onClick={() => setShowAddKey(true)}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>API Anahtarı Ekle</span>
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sağlayıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İsim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API Anahtarı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getProviderIcon(key.provider)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getProviderName(key.provider)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {key.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {key.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleApiKeyStatus(key.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            key.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              key.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`ml-2 text-sm ${
                          key.isActive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {key.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="API anahtarını sil"
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
      </div>

      {/* AI Rules Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-orange-500" />
            AI Kuralları
          </h2>
          <Button
            onClick={() => {
              resetRuleForm();
              setShowAddRule(!showAddRule);
            }}
            className="flex items-center space-x-2"
          >
            {showAddRule ? (
              <>
                <X className="h-4 w-4" />
                <span>İptal</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Kural Ekle</span>
              </>
            )}
          </Button>
        </div>

        {/* Add/Edit Rule Form */}
        {showAddRule && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingRuleId ? 'Kuralı Düzenle' : 'Yeni Kural Ekle'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kural Tipi
                    </label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as 'title' | 'tags')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="title">Başlık Oluşturma</option>
                      <option value="tags">Etiket Oluşturma</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kural Adı
                    </label>
                    <Input
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="örn. SEO Optimizasyonlu Başlık"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    İstem Şablonu
                  </label>
                  <textarea
                    value={rulePrompt}
                    onChange={(e) => setRulePrompt(e.target.value)}
                    placeholder="İstem şablonunuzu girin. Ürün bilgisi için {{product}} yer tutucusunu kullanın."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ürün bilgisi için <code>{'{{product}}'}</code> yer tutucusunu kullanın.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Uzunluk
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Uzunluk
                    </label>
                    <Input
                      type="number"
                      value={ruleMaxLength}
                      onChange={(e) => setRuleMaxLength(parseInt(e.target.value))}
                      min={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {ruleType === 'title' ? 'Etsy başlık limiti: 140 karakter' : 'Etsy etiket limiti: 20 karakter'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Sağlayıcı
                    </label>
                    <select
                      value={ruleApiProvider}
                      onChange={(e) => setRuleApiProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">API sağlayıcı seçin...</option>
                      {apiKeys.filter(key => key.isActive).map(key => (
                        <option key={key.id} value={key.id}>
                          {key.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={resetRuleForm}
                    variant="secondary"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={saveRule}
                    disabled={savingRule || !ruleName.trim() || !rulePrompt.trim() || !ruleApiProvider}
                  >
                    {savingRule ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span>{editingRuleId ? 'Kuralı Güncelle' : 'Kuralı Kaydet'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rules List */}
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                  AI Kuralları Hakkında
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Kurallar, AI'nin ürünleriniz için başlık ve etiketleri nasıl oluşturacağını tanımlar. Bir kuralı varsayılan olarak ayarlayarak, içerik oluştururken otomatik olarak kullanılmasını sağlayabilirsiniz. Farklı ürün türleri için birden fazla kural oluşturabilirsiniz.
                </p>
              </div>
            </div>
          </div>
          
          {/* Title Rules */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              Başlık Oluşturma Kuralları
            </h3>
            
            {rules.filter(rule => rule.type === 'title').length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Henüz başlık oluşturma kuralı tanımlanmamış
                </p>
                <Button
                  onClick={() => {
                    setRuleType('title');
                    setShowAddRule(true);
                  }}
                  variant="secondary"
                  className="mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Başlık Kuralı Ekle</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.filter(rule => rule.type === 'title').map(rule => (
                  <Card key={rule.id} className={`hover:shadow-md transition-shadow ${rule.isDefault ? 'border-green-300 dark:border-green-700' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-base font-medium text-gray-900 dark:text-white">
                              {rule.name}
                            </h4>
                            {rule.isDefault && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {rule.prompt.length > 100 ? rule.prompt.substring(0, 100) + '...' : rule.prompt}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Uzunluk: {rule.minLength}-{rule.maxLength}</span>
                            <span>Oluşturulma: {formatDate(rule.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editRule(rule)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Kuralı düzenle"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          {!rule.isDefault && (
                            <button
                              onClick={() => setRuleAsDefault(rule.id, rule.type)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Varsayılan yap"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Kuralı sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm">
                          <span className="text-lg mr-2">{getProviderIcon(apiKeys.find(k => k.id === rule.apiProvider)?.provider || 'custom')}</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {apiKeys.find(k => k.id === rule.apiProvider)?.name || 'Bilinmeyen Sağlayıcı'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Tags Rules */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-orange-500" />
              Etiket Oluşturma Kuralları
            </h3>
            
            {rules.filter(rule => rule.type === 'tags').length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Tag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Henüz etiket oluşturma kuralı tanımlanmamış
                </p>
                <Button
                  onClick={() => {
                    setRuleType('tags');
                    setShowAddRule(true);
                  }}
                  variant="secondary"
                  className="mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Etiket Kuralı Ekle</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.filter(rule => rule.type === 'tags').map(rule => (
                  <Card key={rule.id} className={`hover:shadow-md transition-shadow ${rule.isDefault ? 'border-green-300 dark:border-green-700' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-base font-medium text-gray-900 dark:text-white">
                              {rule.name}
                            </h4>
                            {rule.isDefault && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {rule.prompt.length > 100 ? rule.prompt.substring(0, 100) + '...' : rule.prompt}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Max Uzunluk: {rule.maxLength}</span>
                            <span>Oluşturulma: {formatDate(rule.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editRule(rule)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Kuralı düzenle"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          {!rule.isDefault && (
                            <button
                              onClick={() => setRuleAsDefault(rule.id, rule.type)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Varsayılan yap"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Kuralı sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm">
                          <span className="text-lg mr-2">{getProviderIcon(apiKeys.find(k => k.id === rule.apiProvider)?.provider || 'custom')}</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {apiKeys.find(k => k.id === rule.apiProvider)?.name || 'Bilinmeyen Sağlayıcı'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test AI Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-orange-500" />
            AI Oluşturma Testi
          </h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ürün Açıklaması
                </label>
                <textarea
                  value={testProductDescription}
                  onChange={(e) => setTestProductDescription(e.target.value)}
                  placeholder="AI oluşturmayı test etmek için bir ürün açıklaması girin..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Başlık Kuralı
                  </label>
                  <select
                    value={selectedTestTitleRule}
                    onChange={(e) => setSelectedTestTitleRule(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Başlık kuralı seçin...</option>
                    {rules.filter(rule => rule.type === 'title').map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Varsayılan)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Etiket Kuralı
                  </label>
                  <select
                    value={selectedTestTagsRule}
                    onChange={(e) => setSelectedTestTagsRule(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Etiket kuralı seçin...</option>
                    {rules.filter(rule => rule.type === 'tags').map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Varsayılan)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerateTestContent}
                  disabled={testAiLoading || !testProductDescription.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {testAiLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span>Test İçeriği Oluştur</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-orange-500" />
                    Oluşturulan Başlık
                  </h4>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-h-[100px]">
                    {testGeneratedTitle ? (
                      <p className="text-gray-900 dark:text-white text-sm">
                        {testGeneratedTitle}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                        Oluşturulan başlık burada görünecek...
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-orange-500" />
                    Oluşturulan Etiketler
                  </h4>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-h-[100px]">
                    {testGeneratedTags ? (
                      <p className="text-gray-900 dark:text-white text-sm">
                        {testGeneratedTags}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                        Oluşturulan etiketler burada görünecek...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAgentPage;