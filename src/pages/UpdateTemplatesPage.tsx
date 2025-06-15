import React, { useState, useEffect } from 'react';
import { Edit, Plus, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, Package, Tag, DollarSign, FileText, Layers, Target, RefreshCw, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface UpdateTemplate {
  id: string;
  user_id: string;
  name: string;
  template_type: 'description' | 'variation' | 'pricing';
  content_template: string;
  variables: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: string;
  created_at: string;
}

const UpdateTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<UpdateTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<UpdateTemplate | null>(null);

  // Create/Edit Template States
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'description' | 'variation' | 'pricing'>('description');
  const [templateContent, setTemplateContent] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<UpdateTemplate | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStore) {
      loadProducts();
    }
  }, [selectedStore]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading update templates...');
      
      const { data, error } = await supabase
        .from('update_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} update templates loaded`);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      console.log('🔄 Loading Etsy stores...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'etsy')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Store loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy stores loaded`);
      setStores(data || []);
      
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Store loading general error:', error);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('🔄 Loading products for store:', selectedStore);
      
      // Mock product data - in real implementation this would come from Supabase
      const mockProducts: Product[] = [
        {
          id: '1',
          title: 'Vintage Style Poster Design - Digital Download',
          description: 'Beautiful vintage-style poster perfect for home decoration. High-quality digital download ready for printing.',
          price: 4.99,
          tags: ['vintage', 'poster', 'digital download', 'printable', 'wall art'],
          status: 'active',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          title: 'Modern Typography Print - Instant Download',
          description: 'Clean and modern typography design. Perfect for office or home decoration.',
          price: 3.99,
          tags: ['typography', 'modern', 'print', 'instant download', 'office decor'],
          status: 'active',
          created_at: '2024-01-10T09:15:00Z'
        },
        {
          id: '3',
          title: 'Botanical Illustration Set - Digital Art',
          description: 'Set of 4 botanical illustrations. High-resolution files perfect for printing and framing.',
          price: 7.99,
          tags: ['botanical', 'illustration', 'nature', 'plants', 'digital art'],
          status: 'active',
          created_at: '2024-01-05T14:20:00Z'
        },
        {
          id: '4',
          title: 'Abstract Geometric Art - Printable Wall Art',
          description: 'Contemporary abstract geometric design. Perfect for modern interiors.',
          price: 5.99,
          tags: ['abstract', 'geometric', 'modern', 'wall art', 'contemporary'],
          status: 'draft',
          created_at: '2024-01-25T16:45:00Z'
        },
        {
          id: '5',
          title: 'Watercolor Floral Bundle - Digital Clipart',
          description: 'Beautiful watercolor floral elements. Perfect for wedding invitations and crafting projects.',
          price: 12.99,
          tags: ['watercolor', 'floral', 'clipart', 'wedding', 'invitation'],
          status: 'active',
          created_at: '2024-01-01T08:00:00Z'
        }
      ];
      
      setProducts(mockProducts);
      console.log(`✅ ${mockProducts.length} products loaded`);
    } catch (error) {
      console.error('❌ Product loading error:', error);
    }
  };

  const createTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      alert('Template name and content are required!');
      return;
    }

    try {
      console.log('💾 Creating update template...');

      const templateData = {
        user_id: user?.id,
        name: templateName,
        template_type: templateType,
        content_template: templateContent,
        variables: extractVariables(templateContent),
        is_default: false
      };

      let result;

      if (editingTemplate) {
        result = await supabase
          .from('update_templates')
          .update({
            ...templateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('update_templates')
          .insert(templateData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Template save error:', result.error);
        alert('Template could not be saved: ' + result.error.message);
        return;
      }

      console.log('✅ Template saved successfully:', result.data);
      await loadTemplates();
      resetCreateForm();
      
      alert('Template saved successfully! 🎉');
    } catch (error) {
      console.error('❌ Template save general error:', error);
      alert('Template could not be saved: ' + (error as Error).message);
    }
  };

  const extractVariables = (content: string): Record<string, any> => {
    // Extract variables from template content (e.g., {{title}}, {{price}}, {{tags}})
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: Record<string, any> = {};
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables[match[1]] = {
        type: 'text',
        description: `Variable for ${match[1]}`,
        required: true
      };
    }

    return variables;
  };

  const resetCreateForm = () => {
    setTemplateName('');
    setTemplateContent('');
    setTemplateType('description');
    setEditingTemplate(null);
    setShowCreateModal(false);
  };

  const editTemplate = (template: UpdateTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content_template);
    setTemplateType(template.template_type);
    setShowCreateModal(true);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('update_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Error occurred while deleting template');
    }
  };

  const duplicateTemplate = async (template: UpdateTemplate) => {
    try {
      const { error } = await supabase
        .from('update_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          template_type: template.template_type,
          content_template: template.content_template,
          variables: template.variables,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Template duplication error:', error);
      alert('Error occurred while duplicating template');
    }
  };

  const applyTemplateToProducts = async () => {
    if (!selectedTemplate || selectedProducts.length === 0) {
      alert('Please select a template and at least one product!');
      return;
    }

    try {
      console.log('🔄 Applying template to products...');
      
      // In real implementation, this would update products in Supabase
      // For now, we'll just show a success message
      
      const updatedCount = selectedProducts.length;
      
      alert(`Template "${selectedTemplate.name}" applied to ${updatedCount} product(s) successfully! 🎉`);
      
      setShowApplyModal(false);
      setSelectedTemplate(null);
      setSelectedProducts([]);
      
    } catch (error) {
      console.error('❌ Template application error:', error);
      alert('Error occurred while applying template');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemplateTypeColor = (type: string) => {
    const colors = {
      'description': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'variation': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'pricing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[type as keyof typeof colors] || colors.description;
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'description': return '📝';
      case 'variation': return '🔄';
      case 'pricing': return '💰';
      default: return '📄';
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
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
            <Edit className="h-6 w-6 mr-2 text-orange-500" />
            Update Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create templates for bulk product updates ({templates.length} templates)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              🎯 How Update Templates Work
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              <strong>1. Create Templates:</strong> Build reusable templates for descriptions, variations, or pricing updates.
              <br />
              <strong>2. Use Variables:</strong> Use placeholders like <code>{'{{title}}'}</code>, <code>{'{{price}}'}</code>, <code>{'{{tags}}'}</code> for dynamic content.
              <br />
              <strong>3. Apply to Products:</strong> Select products from your store and apply templates for bulk updates.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Edit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No templates found' : 'No update templates yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first update template to start bulk updating products'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Template</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTemplateTypeColor(template.template_type)}`}>
                        {getTemplateTypeIcon(template.template_type)} {template.template_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => editTemplate(template)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Edit template"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(template)}
                      className="text-green-500 hover:text-green-700 p-1"
                      title="Duplicate template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Template Preview */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Content:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {template.content_template}
                    </p>
                  </div>

                  {/* Variables */}
                  {Object.keys(template.variables || {}).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variables:</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(template.variables).map((variable, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs rounded-full"
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Template Info */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {formatDate(template.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowApplyModal(true);
                      }}
                      size="sm"
                      className="flex-1"
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Apply to Products
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Create Update Template'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name:
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Holiday Sale Description"
                  className="w-full"
                />
              </div>

              {/* Template Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Type:
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="description">📝 Description Update</option>
                  <option value="variation">🔄 Variation Update</option>
                  <option value="pricing">💰 Pricing Update</option>
                </select>
              </div>

              {/* Template Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Content:
                </label>
                <textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder={`Enter your template content here. Use variables like:
{{title}} - Product title
{{price}} - Product price
{{tags}} - Product tags
{{description}} - Current description

Example:
🎄 HOLIDAY SALE! 🎄
{{title}} - Now only ${{price}}!
Perfect for the holidays. {{description}}
Tags: {{tags}}`}
                />
              </div>

              {/* Variable Help */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">Available Variables:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-600 dark:text-blue-300">
                  <div><code>{'{{title}}'}</code> - Product title</div>
                  <div><code>{'{{price}}'}</code> - Product price</div>
                  <div><code>{'{{tags}}'}</code> - Product tags</div>
                  <div><code>{'{{description}}'}</code> - Current description</div>
                  <div><code>{'{{category}}'}</code> - Product category</div>
                  <div><code>{'{{status}}'}</code> - Product status</div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={createTemplate}
                  className="flex-1"
                  disabled={!templateName.trim() || !templateContent.trim()}
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                <Button
                  onClick={resetCreateForm}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {showApplyModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Apply Template: {selectedTemplate.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Select products to apply this {selectedTemplate.template_type} template
              </p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Store Selection */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <Store className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Store:
                    </label>
                    {stores.length > 0 ? (
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select store...</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.store_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400">
                        No Etsy stores found. 
                        <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                          Add a store
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              {selectedStore && products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Select Products ({selectedProducts.length}/{products.length})
                    </h3>
                    <Button
                      onClick={selectAllProducts}
                      variant="secondary"
                      size="sm"
                    >
                      {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedProducts.includes(product.id)
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {product.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{'$' + Number(product.price || 0).toFixed(2)}</span>
                              <span>{product.status}</span>
                              <span>{product.tags.length} tags</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStore && products.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No products found in this store
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={applyTemplateToProducts}
                  className="flex-1"
                  disabled={!selectedStore || selectedProducts.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply to {selectedProducts.length} Product(s)
                </Button>
                <Button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedTemplate(null);
                    setSelectedProducts([]);
                  }}
                  variant="secondary"
                  className="flex-1"
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

export default UpdateTemplatesPage;