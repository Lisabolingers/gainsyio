import React, { useState, useEffect } from 'react';
import { Brain, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, Package, Tag, DollarSign, FileText, Layers, Target, RefreshCw, ArrowRight, CheckCircle, AlertCircle, Sparkles, Zap, Key, Server, Lock, Shield, Settings, Check, X } from 'lucide-react';
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
  const [isActive, setIsActive] = useState(true);
  
  // Rule form state
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AIRule | null>(null);
  const [ruleType, setRuleType] = useState<'title' | 'tags'>('title');
  const [ruleName, setRuleName] = useState('');
  const [rulePrompt, setRulePrompt] = useState('');
  const [maxLength, setMaxLength] = useState(140);
  const [minLength, setMinLength] = useState(10);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Test state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testType, setTestType] = useState<'title' | 'tags'>('title');
  const [testRuleId, setTestRuleId] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | string[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProviders();
      loadRules();
    }
  }, [user]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading AI providers...');
      
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ AI providers loading error:', error);
        throw error;
      }
      
      // Map database fields to camelCase for frontend
      const mappedProviders = (data || []).map(provider => ({
        id: provider.id,
        name: provider.name,
        provider: provider.provider,
        apiKey: provider.api_key,
        isActive: provider.is_active
      }));
      
      setProviders(mappedProviders);
      console.log(`✅ ${mappedProviders.length} AI providers loaded`);
    } catch (error: any) {
      console.error('❌ Error loading AI providers:', error);
      setError(`AI sağlayıcıları yüklenirken hata: ${error.message}`);
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
      
      // Map database fields to camelCase for frontend
      const mappedRules = (data || []).map(rule => ({
        id: rule.id,
        type: rule.type,
        name: rule.name,
        prompt: rule.prompt,
        maxLength: rule.max_length,
        minLength: rule.min_length,
        apiProviderId: rule.api_provider_id,
        isDefault: rule.is_default
      }));
      
      // Split rules by type
      const titleRules = mappedRules.filter(rule => rule.type === 'title');
      const tagRules = mappedRules.filter(rule => rule.type === 'tags');
      
      setTitleRules(titleRules);
      setTagRules(tagRules);
      
      console.log(`✅ ${titleRules.length} title rules and ${tagRules.length} tag rules loaded`);
    } catch (error: any) {
      console.error('❌ Error loading AI rules:', error);
      setError(`AI kuralları yüklenirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveProvider = async () => {
    if (!providerName.trim() || !apiKey.trim()) {
      setError('Sağlayıcı adı ve API anahtarı gereklidir.');
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
      
      let result;
      
      if (editingProvider) {
        // Update existing provider
        result = await supabase
          .from('ai_providers')
          .update({
            name: providerName,
            provider: providerType,
            api_key: apiKey,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProvider.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        // Create new provider
        result = await supabase
          .from('ai_providers')
          .insert({
            user_id: user?.id,
            name: providerName,
            provider: providerType,
            api_key: apiKey,
            is_active: isActive
          })
          .select()
          .single();
      }
      
      if (result.error) {
        console.error('❌ Provider save error:', result.error);
        throw result.error;
      }
      
      // Map database fields to camelCase for frontend
      const savedProvider = {
        id: result.data.id,
        name: result.data.name,
        provider: result.data.provider,
        apiKey: result.data.api_key,
        isActive: result.data.is_active
      };
      
      // Update providers list
      if (editingProvider) {
        setProviders(prev => prev.map(p => p.id === savedProvider.id ? savedProvider : p));
      } else {
        setProviders(prev => [...prev, savedProvider]);
      }
      
      // Reset form
      resetProviderForm();
      
      setShowProviderForm(false);
      setSuccess(`API sağlayıcı ${editingProvider ? 'güncellendi' : 'eklendi'}!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error saving provider:', error);
      setError(`API sağlayıcı kaydedilirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async () => {
    if (!ruleName.trim() || !rulePrompt.trim() || !selectedProviderId) {
      setError('Kural adı, prompt ve API sağlayıcı gereklidir.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // If this is a default rule, unset any existing default for this type
      if (isDefault) {
        await supabase
          .from('ai_rules')
          .update({ is_default: false })
          .eq('user_id', user?.id)
          .eq('type', ruleType)
          .eq('is_default', true);
      }
      
      let result;
      
      if (editingRule) {
        // Update existing rule
        result = await supabase
          .from('ai_rules')
          .update({
            type: ruleType,
            name: ruleName,
            prompt: rulePrompt,
            max_length: maxLength,
            min_length: minLength,
            api_provider_id: selectedProviderId,
            is_default: isDefault,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRule.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        // Create new rule
        result = await supabase
          .from('ai_rules')
          .insert({
            user_id: user?.id,
            type: ruleType,
            name: ruleName,
            prompt: rulePrompt,
            max_length: maxLength,
            min_length: minLength,
            api_provider_id: selectedProviderId,
            is_default: isDefault
          })
          .select()
          .single();
      }
      
      if (result.error) {
        console.error('❌ Rule save error:', result.error);
        throw result.error;
      }
      
      // Map database fields to camelCase for frontend
      const savedRule = {
        id: result.data.id,
        type: result.data.type,
        name: result.data.name,
        prompt: result.data.prompt,
        maxLength: result.data.max_length,
        minLength: result.data.min_length,
        apiProviderId: result.data.api_provider_id,
        isDefault: result.data.is_default
      };
      
      // Update rules list
      if (editingRule) {
        if (savedRule.type === 'title') {
          setTitleRules(prev => prev.map(r => r.id === savedRule.id ? savedRule : r));
        } else {
          setTagRules(prev => prev.map(r => r.id === savedRule.id ? savedRule : r));
        }
      } else {
        if (savedRule.type === 'title') {
          setTitleRules(prev => [...prev, savedRule]);
        } else {
          setTagRules(prev => [...prev, savedRule]);
        }
      }
      
      // Reset form
      resetRuleForm();
      
      setShowRuleForm(false);
      setSuccess(`AI kuralı ${editingRule ? 'güncellendi' : 'eklendi'}!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error saving rule:', error);
      setError(`AI kuralı kaydedilirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!window.confirm('Bu API sağlayıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this provider is used by any rules
      const { data: rulesUsingProvider, error: rulesError } = await supabase
        .from('ai_rules')
        .select('id')
        .eq('api_provider_id', providerId);
      
      if (rulesError) throw rulesError;
      
      if (rulesUsingProvider && rulesUsingProvider.length > 0) {
        throw new Error(`Bu sağlayıcı ${rulesUsingProvider.length} kural tarafından kullanılıyor. Önce bu kuralları silmelisiniz.`);
      }
      
      // Delete the provider
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', providerId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Update providers list
      setProviders(prev => prev.filter(p => p.id !== providerId));
      
      setSuccess('API sağlayıcı başarıyla silindi!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error deleting provider:', error);
      setError(`API sağlayıcı silinirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string, ruleType: 'title' | 'tags') => {
    if (!window.confirm('Bu AI kuralını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('ai_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Update rules list
      if (ruleType === 'title') {
        setTitleRules(prev => prev.filter(r => r.id !== ruleId));
      } else {
        setTagRules(prev => prev.filter(r => r.id !== ruleId));
      }
      
      setSuccess('AI kuralı başarıyla silindi!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error deleting rule:', error);
      setError(`AI kuralı silinirken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setRuleAsDefault = async (ruleId: string, ruleType: 'title' | 'tags') => {
    try {
      setLoading(true);
      
      // Update the rule
      const { error } = await supabase
        .from('ai_rules')
        .update({ is_default: true })
        .eq('id', ruleId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Reload rules to get updated default status
      await loadRules();
      
      setSuccess('Varsayılan kural güncellendi!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error setting default rule:', error);
      setError(`Varsayılan kural ayarlanırken hata: ${error.message}`);
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

  const editRule = (rule: AIRule) => {
    setEditingRule(rule);
    setRuleType(rule.type);
    setRuleName(rule.name);
    setRulePrompt(rule.prompt);
    setMaxLength(rule.maxLength);
    setMinLength(rule.minLength);
    setSelectedProviderId(rule.apiProviderId);
    setIsDefault(rule.isDefault);
    setShowRuleForm(true);
  };

  const resetProviderForm = () => {
    setEditingProvider(null);
    setProviderName('');
    setProviderType('openai');
    setApiKey('');
    setIsActive(true);
  };

  const resetRuleForm = () => {
    setEditingRule(null);
    setRuleType('title');
    setRuleName('');
    setRulePrompt('');
    setMaxLength(140);
    setMinLength(10);
    setSelectedProviderId('');
    setIsDefault(false);
  };

  const testRule = async () => {
    if (!testInput.trim() || !testRuleId) {
      setTestError('Test için bir girdi ve kural seçmelisiniz.');
      return;
    }
    
    try {
      setTestLoading(true);
      setTestError(null);
      setTestResult(null);
      
      console.log(`🧪 Testing ${testType} rule: ${testRuleId}`);
      
      // In a real implementation, this would call the AI service
      // For now, we'll simulate the response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (testType === 'title') {
        // Generate a title
        const title = simulateTitleGeneration(testInput);
        setTestResult(title);
      } else {
        // Generate tags
        const tags = simulateTagsGeneration(testInput);
        setTestResult(tags);
      }
      
    } catch (error: any) {
      console.error('❌ Error testing rule:', error);
      setTestError(`Test sırasında hata: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  // Simulate title generation (for demo purposes)
  const simulateTitleGeneration = (productInfo: string): string => {
    const keywords = productInfo.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    const adjectives = [
      'Handmade', 'Custom', 'Personalized', 'Unique', 'Vintage', 'Modern', 
      'Rustic', 'Minimalist', 'Elegant', 'Premium', 'Exclusive', 'Trendy'
    ];
    
    const nouns = [
      'Gift', 'Design', 'Artwork', 'Creation', 'Piece', 'Item', 
      'Product', 'Present', 'Decor', 'Accessory', 'Collection'
    ];
    
    const occasions = [
      'Birthday', 'Anniversary', 'Wedding', 'Graduation', 'Housewarming',
      'Christmas', 'Holiday', 'Special Occasion', 'Celebration'
    ];
    
    // Pick random elements
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const occasion = occasions[Math.floor(Math.random() * occasions.length)];
    
    // Use keywords from product info if available
    let keyword = 'Item';
    if (keywords.length > 0) {
      keyword = keywords[Math.floor(Math.random() * keywords.length)];
      // Capitalize first letter
      keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
    
    // Generate title
    return `${adjective} ${keyword} ${noun} - Perfect ${occasion} Gift`;
  };
  
  // Simulate tags generation (for demo purposes)
  const simulateTagsGeneration = (productInfo: string): string[] => {
    const keywords = productInfo.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    const baseTags = [
      'handmade', 'custom', 'personalized', 'unique', 'gift idea',
      'birthday gift', 'special occasion', 'home decor', 'wall art',
      'trending', 'best seller', 'popular item', 'fast shipping'
    ];
    
    // Generate tags based on keywords
    const keywordTags = keywords.map(word => {
      return [word, `${word} gift`, `${word} design`, `custom ${word}`];
    }).flat();
    
    // Combine and deduplicate
    const allTags = [...new Set([...baseTags, ...keywordTags])];
    
    // Return random selection of tags
    return allTags
      .sort(() => 0.5 - Math.random())
      .slice(0, 13); // Etsy allows max 13 tags
  };

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      case 'google':
        return '🔍';
      case 'custom':
        return '⚙️';
      default:
        return '🔌';
    }
  };

  const getProviderTypeColor = (type: string) => {
    const colors = {
      'openai': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'anthropic': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'google': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[type as keyof typeof colors] || colors.custom;
  };

  const getRuleTypeColor = (type: string) => {
    const colors = {
      'title': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'tags': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[type as keyof typeof colors] || colors.title;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && providers.length === 0 && titleRules.length === 0 && tagRules.length === 0) {
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

      {/* Status Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
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
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Sağlayıcı Ekle</span>
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Sağlayıcıyı Ekle</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span className={`p-1 rounded-lg ${getProviderTypeColor(provider.provider)}`}>
                        {getProviderTypeIcon(provider.provider)}
                      </span>
                      <span>{provider.name}</span>
                    </CardTitle>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => editProvider(provider)}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderTypeColor(provider.provider)}`}>
                        {provider.provider.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        provider.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {provider.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-1">
                        <code className="text-xs text-gray-800 dark:text-gray-300">
                          {provider.apiKey.substring(0, 4)}...{provider.apiKey.substring(provider.apiKey.length - 4)}
                        </code>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                      <span>Kullanılan Kurallar: {
                        titleRules.filter(r => r.apiProviderId === provider.id).length +
                        tagRules.filter(r => r.apiProviderId === provider.id).length
                      }</span>
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
            onClick={() => {
              resetRuleForm();
              setRuleType('title');
              setShowRuleForm(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            disabled={providers.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Kural Ekle</span>
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="text-yellow-700 dark:text-yellow-400">
                Kural eklemek için önce bir API sağlayıcı eklemelisiniz.
              </p>
            </div>
          </div>
        ) : titleRules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz başlık kuralı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI başlık oluşturma için bir kural ekleyin
            </p>
            <Button
              onClick={() => {
                resetRuleForm();
                setRuleType('title');
                setShowRuleForm(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Başlık Kuralını Ekle</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {titleRules.map((rule) => (
              <Card key={rule.id} className={`hover:shadow-lg transition-shadow ${
                rule.isDefault ? 'border-2 border-orange-500 dark:border-orange-400' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRuleTypeColor(rule.type)}`}>
                        Başlık
                      </span>
                      <span>{rule.name}</span>
                      {rule.isDefault && (
                        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs px-2 py-1 rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => editRule(rule)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id, rule.type)}
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
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {rule.prompt}
                      </p>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Uzunluk: {rule.minLength}-{rule.maxLength}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Sağlayıcı: {providers.find(p => p.id === rule.apiProviderId)?.name || 'Bilinmeyen'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!rule.isDefault && (
                        <Button
                          onClick={() => setRuleAsDefault(rule.id, rule.type)}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          Varsayılan Yap
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setTestType('title');
                          setTestRuleId(rule.id);
                          setTestInput('');
                          setTestResult(null);
                          setTestError(null);
                          setShowTestPanel(true);
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        Test Et
                      </Button>
                    </div>
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
              resetRuleForm();
              setRuleType('tags');
              setShowRuleForm(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            disabled={providers.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Kural Ekle</span>
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="text-yellow-700 dark:text-yellow-400">
                Kural eklemek için önce bir API sağlayıcı eklemelisiniz.
              </p>
            </div>
          </div>
        ) : tagRules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz etiket kuralı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              AI etiket oluşturma için bir kural ekleyin
            </p>
            <Button
              onClick={() => {
                resetRuleForm();
                setRuleType('tags');
                setShowRuleForm(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Etiket Kuralını Ekle</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tagRules.map((rule) => (
              <Card key={rule.id} className={`hover:shadow-lg transition-shadow ${
                rule.isDefault ? 'border-2 border-orange-500 dark:border-orange-400' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRuleTypeColor(rule.type)}`}>
                        Etiket
                      </span>
                      <span>{rule.name}</span>
                      {rule.isDefault && (
                        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs px-2 py-1 rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => editRule(rule)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id, rule.type)}
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
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {rule.prompt}
                      </p>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Uzunluk: {rule.minLength}-{rule.maxLength}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Sağlayıcı: {providers.find(p => p.id === rule.apiProviderId)?.name || 'Bilinmeyen'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!rule.isDefault && (
                        <Button
                          onClick={() => setRuleAsDefault(rule.id, rule.type)}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          Varsayılan Yap
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setTestType('tags');
                          setTestRuleId(rule.id);
                          setTestInput('');
                          setTestResult(null);
                          setTestError(null);
                          setShowTestPanel(true);
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        Test Et
                      </Button>
                    </div>
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
                {editingProvider ? 'API Sağlayıcı Düzenle' : 'Yeni API Sağlayıcı Ekle'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Provider Name */}
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
              
              {/* Provider Type */}
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
              
              {/* API Key */}
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
              
              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Aktif
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={saveProvider}
                  className="flex-1"
                  disabled={!providerName.trim() || !apiKey.trim()}
                >
                  {editingProvider ? 'Güncelle' : 'Ekle'}
                </Button>
                <Button
                  onClick={() => setShowProviderForm(false)}
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

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRule ? 'AI Kuralı Düzenle' : 'Yeni AI Kuralı Ekle'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Rule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kural Türü:
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
              
              {/* Rule Name */}
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
              
              {/* API Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Sağlayıcı:
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Sağlayıcı seçin...</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id} disabled={!provider.isActive}>
                      {provider.name} {!provider.isActive && '(Pasif)'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt:
                </label>
                <textarea
                  value={rulePrompt}
                  onChange={(e) => setRulePrompt(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder={ruleType === 'title' 
                    ? 'Ürün için SEO dostu bir başlık oluştur. Ürün: {{product}}'
                    : 'Ürün için 13 adet Etsy etiketi oluştur. Ürün: {{product}}'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ürün bilgisi için <code>{'{{product}}'}</code> yer tutucusunu kullanın.
                </p>
              </div>
              
              {/* Length Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Uzunluk:
                  </label>
                  <Input
                    type="number"
                    value={minLength}
                    onChange={(e) => setMinLength(parseInt(e.target.value))}
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
                    value={maxLength}
                    onChange={(e) => setMaxLength(parseInt(e.target.value))}
                    min={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Default Setting */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
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
                  disabled={!ruleName.trim() || !rulePrompt.trim() || !selectedProviderId}
                >
                  {editingRule ? 'Güncelle' : 'Ekle'}
                </Button>
                <Button
                  onClick={() => setShowRuleForm(false)}
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

      {/* Test Panel */}
      {showTestPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-500" />
                  AI Kuralı Test Et
                </h2>
                <button
                  onClick={() => setShowTestPanel(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Test Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Girdisi (Ürün Bilgisi):
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Örn: Vintage tarzı el yapımı deri cüzdan, kahverengi, erkekler için"
                />
              </div>
              
              {/* Test Button */}
              <Button
                onClick={testRule}
                className="w-full"
                disabled={testLoading || !testInput.trim()}
              >
                {testLoading ? (
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
              
              {/* Test Error */}
              {testError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-400">{testError}</p>
                  </div>
                </div>
              )}
              
              {/* Test Result */}
              {testResult && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1" />
                    {testType === 'title' ? 'Oluşturulan Başlık:' : 'Oluşturulan Etiketler:'}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentPage;