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
      
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use mock data
      const mockApiKeys: ApiKey[] = [
        {
          id: '1',
          provider: 'openai',
          key: 'sk-••••••••••••••••••••••••••••••••••••••••••••••',
          name: 'OpenAI GPT-4',
          isActive: true
        },
        {
          id: '2',
          provider: 'anthropic',
          key: 'sk-ant-••••••••••••••••••••••••••••••••••••••••••',
          name: 'Anthropic Claude',
          isActive: false
        }
      ];
      
      setApiKeys(mockApiKeys);
      console.log(`✅ ${mockApiKeys.length} API keys loaded`);
    } catch (error: any) {
      console.error('❌ Error loading API keys:', error);
      setError('Failed to load API keys: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading AI rules...');
      
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use mock data
      const mockRules: AIRule[] = [
        {
          id: '1',
          type: 'title',
          name: 'SEO Optimized Title',
          prompt: 'Create an SEO optimized title for an Etsy product. The title should be catchy, include relevant keywords, and be optimized for search. The product is: {{product}}',
          maxLength: 140,
          minLength: 20,
          apiProvider: '1', // OpenAI
          isDefault: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'tags',
          name: 'Etsy Tags Generator',
          prompt: 'Generate 13 SEO optimized tags for an Etsy product. Each tag should be less than 20 characters and relevant to the product. The product is: {{product}}',
          maxLength: 20,
          minLength: 3,
          apiProvider: '1', // OpenAI
          isDefault: false,
          createdAt: new Date().toISOString()
        }
      ];
      
      setRules(mockRules);
      console.log(`✅ ${mockRules.length} AI rules loaded`);
    } catch (error: any) {
      console.error('❌ Error loading AI rules:', error);
      setError('Failed to load AI rules: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setError('API key name and value are required.');
      return;
    }
    
    try {
      setSavingKey(true);
      setError(null);
      console.log('💾 Saving API key...');
      
      // In a real implementation, this would save to Supabase
      // For now, we'll just update the state
      
      const newKey: ApiKey = {
        id: Date.now().toString(),
        provider: newKeyProvider,
        key: newKeyValue,
        name: newKeyName,
        isActive: true
      };
      
      setApiKeys(prev => [...prev, newKey]);
      
      // Reset form
      setNewKeyProvider('openai');
      setNewKeyName('');
      setNewKeyValue('');
      setShowAddKey(false);
      
      setSuccess('API key saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error saving API key:', error);
      setError('Failed to save API key: ' + error.message);
    } finally {
      setSavingKey(false);
    }
  };

  const saveRule = async () => {
    if (!ruleName.trim() || !rulePrompt.trim() || !ruleApiProvider) {
      setError('Rule name, prompt, and API provider are required.');
      return;
    }
    
    try {
      setSavingRule(true);
      setError(null);
      console.log('💾 Saving AI rule...');
      
      // In a real implementation, this would save to Supabase
      // For now, we'll just update the state
      
      if (editingRuleId) {
        // Update existing rule
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
        const newRule: AIRule = {
          id: Date.now().toString(),
          type: ruleType,
          name: ruleName,
          prompt: rulePrompt,
          maxLength: ruleMaxLength,
          minLength: ruleMinLength,
          apiProvider: ruleApiProvider,
          isDefault: false,
          createdAt: new Date().toISOString()
        };
        
        setRules(prev => [...prev, newRule]);
      }
      
      // Reset form
      resetRuleForm();
      
      setSuccess(`AI rule ${editingRuleId ? 'updated' : 'saved'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error saving AI rule:', error);
      setError('Failed to save AI rule: ' + error.message);
    } finally {
      setSavingRule(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) return;
    
    try {
      console.log(`🗑️ Deleting API key: ${keyId}`);
      
      // In a real implementation, this would delete from Supabase
      // For now, we'll just update the state
      
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      setSuccess('API key deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error deleting API key:', error);
      setError('Failed to delete API key: ' + error.message);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this AI rule?')) return;
    
    try {
      console.log(`🗑️ Deleting AI rule: ${ruleId}`);
      
      // In a real implementation, this would delete from Supabase
      // For now, we'll just update the state
      
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      setSuccess('AI rule deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error deleting AI rule:', error);
      setError('Failed to delete AI rule: ' + error.message);
    }
  };

  const toggleApiKeyStatus = async (keyId: string) => {
    try {
      console.log(`🔄 Toggling API key status: ${keyId}`);
      
      // In a real implementation, this would update Supabase
      // For now, we'll just update the state
      
      setApiKeys(prev => prev.map(key => {
        if (key.id === keyId) {
          return { ...key, isActive: !key.isActive };
        }
        return key;
      }));
      
    } catch (error: any) {
      console.error('❌ Error toggling API key status:', error);
      setError('Failed to update API key status: ' + error.message);
    }
  };

  const setRuleAsDefault = async (ruleId: string, ruleType: 'title' | 'tags') => {
    try {
      console.log(`🔄 Setting rule as default: ${ruleId}`);
      
      // In a real implementation, this would update Supabase
      // For now, we'll just update the state
      
      setRules(prev => prev.map(rule => {
        if (rule.type === ruleType) {
          return { ...rule, isDefault: rule.id === ruleId };
        }
        return rule;
      }));
      
      setSuccess('Default rule updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error setting default rule:', error);
      setError('Failed to update default rule: ' + error.message);
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
    return new Date(dateString).toLocaleDateString('en-US', {
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
          Configure AI settings for title and tag generation
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
            API Keys
          </h2>
          <Button
            onClick={() => setShowAddKey(!showAddKey)}
            className="flex items-center space-x-2"
          >
            {showAddKey ? (
              <>
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add API Key</span>
              </>
            )}
          </Button>
        </div>

        {/* Add API Key Form */}
        {showAddKey && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Add New API Key
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Provider
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
                      Name
                    </label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., OpenAI GPT-4"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your API key is securely stored and never shared with third parties.
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
                    Cancel
                  </Button>
                  <Button
                    onClick={saveApiKey}
                    disabled={savingKey || !newKeyName.trim() || !newKeyValue.trim()}
                  >
                    {savingKey ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span>Save API Key</span>
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
              No API Keys Added
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add your first API key to start using AI features
            </p>
            <Button
              onClick={() => setShowAddKey(true)}
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add API Key</span>
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
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
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete API key"
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
            AI Rules
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
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Rule</span>
              </>
            )}
          </Button>
        </div>

        {/* Add/Edit Rule Form */}
        {showAddRule && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingRuleId ? 'Edit Rule' : 'Add New Rule'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rule Type
                    </label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as 'title' | 'tags')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="title">Title Generation</option>
                      <option value="tags">Tags Generation</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rule Name
                    </label>
                    <Input
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="e.g., SEO Optimized Title"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prompt Template
                  </label>
                  <textarea
                    value={rulePrompt}
                    onChange={(e) => setRulePrompt(e.target.value)}
                    placeholder="Enter your prompt template. Use {{product}} as a placeholder for the product information."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use <code>{{product}}</code> as a placeholder for the product information.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Length
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
                      Max Length
                    </label>
                    <Input
                      type="number"
                      value={ruleMaxLength}
                      onChange={(e) => setRuleMaxLength(parseInt(e.target.value))}
                      min={1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {ruleType === 'title' ? 'Etsy title limit: 140 characters' : 'Etsy tag limit: 20 characters'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Provider
                    </label>
                    <select
                      value={ruleApiProvider}
                      onChange={(e) => setRuleApiProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select API provider...</option>
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
                    Cancel
                  </Button>
                  <Button
                    onClick={saveRule}
                    disabled={savingRule || !ruleName.trim() || !rulePrompt.trim() || !ruleApiProvider}
                  >
                    {savingRule ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span>{editingRuleId ? 'Update Rule' : 'Save Rule'}</span>
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
                  About AI Rules
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Rules define how AI generates titles and tags for your products. Set a rule as default to automatically use it when generating content. You can create multiple rules for different types of products.
                </p>
              </div>
            </div>
          </div>
          
          {/* Title Rules */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              Title Generation Rules
            </h3>
            
            {rules.filter(rule => rule.type === 'title').length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No title generation rules defined
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
                  <span>Add Title Rule</span>
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
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {rule.prompt.length > 100 ? rule.prompt.substring(0, 100) + '...' : rule.prompt}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Length: {rule.minLength}-{rule.maxLength}</span>
                            <span>Created: {formatDate(rule.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editRule(rule)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit rule"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          {!rule.isDefault && (
                            <button
                              onClick={() => setRuleAsDefault(rule.id, rule.type)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Set as default"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm">
                          <span className="text-lg mr-2">{getProviderIcon(apiKeys.find(k => k.id === rule.apiProvider)?.provider || 'custom')}</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {apiKeys.find(k => k.id === rule.apiProvider)?.name || 'Unknown Provider'}
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
              Tags Generation Rules
            </h3>
            
            {rules.filter(rule => rule.type === 'tags').length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Tag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No tags generation rules defined
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
                  <span>Add Tags Rule</span>
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
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {rule.prompt.length > 100 ? rule.prompt.substring(0, 100) + '...' : rule.prompt}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Max Length: {rule.maxLength}</span>
                            <span>Created: {formatDate(rule.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editRule(rule)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit rule"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          {!rule.isDefault && (
                            <button
                              onClick={() => setRuleAsDefault(rule.id, rule.type)}
                              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Set as default"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm">
                          <span className="text-lg mr-2">{getProviderIcon(apiKeys.find(k => k.id === rule.apiProvider)?.provider || 'custom')}</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {apiKeys.find(k => k.id === rule.apiProvider)?.name || 'Unknown Provider'}
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
            Test AI Generation
          </h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Description
                </label>
                <textarea
                  placeholder="Enter a product description to test AI generation..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title Rule
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select title rule...</option>
                    {rules.filter(rule => rule.type === 'title').map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags Rule
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select tags rule...</option>
                    {rules.filter(rule => rule.type === 'tags').map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Generate Test Content</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-orange-500" />
                    Generated Title
                  </h4>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-h-[100px]">
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                      Generated title will appear here...
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-orange-500" />
                    Generated Tags
                  </h4>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-h-[100px]">
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                      Generated tags will appear here...
                    </p>
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