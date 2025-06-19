import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSupabase } from '../context/SupabaseContext';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Copy,
  Settings,
  Folder,
  Grid,
  List
} from 'lucide-react';

export default function MockupTemplatesPage() {
  const { user } = useAuth();
  const { supabase, isConfigValid } = useSupabase();
  const [templates, setTemplates] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignType, setSelectedDesignType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [designType, setDesignType] = useState('black');
  const [productCategory, setProductCategory] = useState('t-shirt');
  const [selectedStore, setSelectedStore] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDemoMode] = useState(!user);

  // 📦 1. Ekstra useState tanımlamaları
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');

  // 📡 2. Supabase'ten klasörleri yükleme ve klasör oluşturma fonksiyonları
  const loadFolders = useCallback(async () => {
    try {
      if (!user?.id || isDemoMode || !isConfigValid) return;

      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('first_created', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('❌ Folder loading error:', error);
    }
  }, [user, isDemoMode, isConfigValid, supabase]);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('mockup_templates')
        .insert({ 
          name: `${newFolderName} Template`,
          folder_name: newFolderName,
          folder_path: newFolderName.toLowerCase().replace(/\s+/g, '-'),
          user_id: user?.id,
          image_url: 'https://via.placeholder.com/300x400',
          design_type: 'black',
          product_category: 't-shirt'
        })
        .select();

      if (error) throw error;

      setNewFolderName('');
      loadTemplates();
      loadFolders();
    } catch (error) {
      console.error('❌ Folder creation error:', error);
      alert('Folder could not be created.');
    }
  };

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        // Demo data
        const demoTemplates = [
          {
            id: '1',
            name: 'Classic T-Shirt Black',
            image_url: 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg',
            design_type: 'black',
            product_category: 't-shirt',
            folder_name: 'Default Templates',
            folder_path: 'default'
          },
          {
            id: '2',
            name: 'Modern Hoodie White',
            image_url: 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg',
            design_type: 'white',
            product_category: 'hoodie',
            folder_name: 'Default Templates',
            folder_path: 'default'
          }
        ];
        setTemplates(demoTemplates);
        return;
      }

      if (!user?.id || !isConfigValid) return;

      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template loading error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, isConfigValid, supabase]);

  const loadStores = useCallback(async () => {
    try {
      if (isDemoMode) {
        setStores([{ id: 'demo', store_name: 'Demo Store', platform: 'etsy' }]);
        return;
      }

      if (!user?.id || !isConfigValid) return;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('❌ Store loading error:', error);
    }
  }, [user, isDemoMode, isConfigValid, supabase]);

  // 🔁 3. useEffect içinde folder'ları da yükle
  useEffect(() => {
    if (user || isDemoMode) {
      loadTemplates();
      loadStores();
      loadFolders();
    }
  }, [user, isDemoMode, loadTemplates, loadStores, loadFolders]);

  const saveTemplate = async () => {
    if (!templateName.trim() || !imageUrl.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const templateData = {
        name: templateName,
        image_url: imageUrl,
        design_type: designType,
        product_category: productCategory,
        store_id: selectedStore || null,
        user_id: user?.id,
        folder_path: selectedFolder || 'default',
        folder_name: folders.find(f => f.folder_path === selectedFolder)?.folder_name || 'Default Templates'
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('mockup_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mockup_templates')
          .insert(templateData);

        if (error) throw error;
      }

      resetForm();
      loadTemplates();
      loadFolders();
    } catch (error) {
      console.error('❌ Template save error:', error);
      alert('Template could not be saved.');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      loadTemplates();
      loadFolders();
    } catch (error) {
      console.error('❌ Template delete error:', error);
      alert('Template could not be deleted.');
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setTemplateName('');
    setImageUrl('');
    setDesignType('black');
    setProductCategory('t-shirt');
    setSelectedStore('');
    setSelectedFolder('');
  };

  const startEdit = (template: any) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setImageUrl(template.image_url);
    setDesignType(template.design_type);
    setProductCategory(template.product_category);
    setSelectedStore(template.store_id || '');
    setSelectedFolder(template.folder_path || '');
    setIsCreating(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesignType = !selectedDesignType || template.design_type === selectedDesignType;
    const matchesCategory = !selectedCategory || template.product_category === selectedCategory;
    return matchesSearch && matchesDesignType && matchesCategory;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const folderName = template.folder_name || 'Other Templates';
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your product mockup templates
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <select
                value={selectedDesignType}
                onChange={(e) => setSelectedDesignType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Design Types</option>
                <option value="black">Black Design</option>
                <option value="white">White Design</option>
                <option value="color">Color Design</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="t-shirt">T-Shirt</option>
                <option value="hoodie">Hoodie</option>
                <option value="sweatshirt">Sweatshirt</option>
                <option value="mug">Mug</option>
                <option value="poster">Poster</option>
                <option value="canvas">Canvas</option>
                <option value="pillow">Pillow</option>
                <option value="phone-case">Phone Case</option>
                <option value="tote-bag">Tote Bag</option>
                <option value="sticker">Sticker</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-8 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL *
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Design Type
                </label>
                <select
                  value={designType}
                  onChange={(e) => setDesignType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="black">Black Design</option>
                  <option value="white">White Design</option>
                  <option value="color">Color Design</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Category
                </label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="t-shirt">T-Shirt</option>
                  <option value="hoodie">Hoodie</option>
                  <option value="sweatshirt">Sweatshirt</option>
                  <option value="mug">Mug</option>
                  <option value="poster">Poster</option>
                  <option value="canvas">Canvas</option>
                  <option value="pillow">Pillow</option>
                  <option value="phone-case">Phone Case</option>
                  <option value="tote-bag">Tote Bag</option>
                  <option value="sticker">Sticker</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store (Optional)
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No specific store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.store_name} ({store.platform})
                    </option>
                  ))}
                </select>
              </div>

              {/* 🧩 5. Template oluşturma / düzenleme arayüzüne klasör seçme alanı ekle */}
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Folder:</label>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">No Folder</option>
                    {folders.map(folder => (
                      <option key={folder.folder_path} value={folder.folder_path}>
                        📁 {folder.folder_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2 mt-2">
                  <Input
                    placeholder="New folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={createFolder}>➕ Create Folder</Button>
                </div>
              </>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={saveTemplate} disabled={isDemoMode}>
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>

            {isDemoMode && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                Demo mode: Template creation is disabled. Please log in to create templates.
              </p>
            )}
          </Card>
        )}

        {/* Templates Grid/List */}
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([folderName, folderTemplates]) => (
            <div key={folderName}>
              <div className="flex items-center gap-2 mb-4">
                <Folder className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {folderName}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({folderTemplates.length} templates)
                </span>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {folderTemplates.map(template => (
                    <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
                          }}
                        />
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                          {template.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.design_type === 'black' 
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              : template.design_type === 'white'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {template.design_type}
                          </span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs font-medium">
                            {template.product_category}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(template)}
                            disabled={isDemoMode}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTemplate(template.id)}
                            disabled={isDemoMode}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {folderTemplates.map(template => (
                      <div key={template.id} className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=No+Image';
                            }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.design_type === 'black' 
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                : template.design_type === 'white'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            }`}>
                              {template.design_type}
                            </span>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-xs font-medium">
                              {template.product_category}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(template)}
                            disabled={isDemoMode}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTemplate(template.id)}
                            disabled={isDemoMode}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || selectedDesignType || selectedCategory
                  ? 'Try adjusting your search filters'
                  : 'Get started by creating your first mockup template'
                }
              </p>
              {!searchTerm && !selectedDesignType && !selectedCategory && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              )}
            </div>
          )}
        </div>

        {isDemoMode && (
          <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                You're viewing in demo mode. <a href="/login" className="underline font-medium">Log in</a> to create and manage your own mockup templates.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}