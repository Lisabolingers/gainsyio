import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, FolderPlus, Folder, FolderOpen, ArrowLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: any[];
  text_areas: any[];
  logo_area?: any;
  design_type: 'black' | 'white' | 'color';
  store_id?: string;
  product_category: string;
  folder_path?: string;
  folder_name?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateFolder {
  folder_path: string;
  folder_name: string;
  template_count: number;
  black_designs: number;
  white_designs: number;
  color_designs: number;
  first_created: string;
  last_updated: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesignType, setNewTemplateDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [newTemplateProductCategory, setNewTemplateProductCategory] = useState('t-shirt');
  const [newTemplateFolder, setNewTemplateFolder] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
      loadStores();
    }
  }, [user, currentFolder]);

  const loadFolders = async () => {
    try {
      console.log('🔄 Loading mockup template folders...');
      
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('folder_name', { ascending: true });

      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup template folders loaded`);
      setFolders(data || []);
      
      // If no folders exist, create a default folder
      if (data && data.length === 0) {
        createDefaultFolder();
      }
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
      // Create mock folders for demo
      const mockFolders: TemplateFolder[] = [
        {
          folder_path: 'default',
          folder_name: 'Default Templates',
          template_count: 1,
          black_designs: 1,
          white_designs: 0,
          color_designs: 0,
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }
      ];
      setFolders(mockFolders);
    }
  };

  const createDefaultFolder = async () => {
    try {
      console.log('🔄 Creating default folder...');
      
      // First template will be created in the default folder
      const defaultTemplate: Partial<MockupTemplate> = {
        user_id: user?.id,
        name: 'Default T-Shirt Template',
        image_url: 'https://images.pexels.com/photos/1484807/pexels-photo-1484807.jpeg?auto=compress&cs=tinysrgb&w=600',
        design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
        text_areas: [],
        design_type: 'black',
        product_category: 't-shirt',
        folder_path: 'default',
        folder_name: 'Default Templates',
        is_default: true
      };
      
      const { error } = await supabase
        .from('mockup_templates')
        .insert(defaultTemplate);
      
      if (error) {
        console.error('❌ Default template creation error:', error);
        throw error;
      }
      
      console.log('✅ Default folder and template created');
      
      // Reload folders and templates
      await loadFolders();
      await loadTemplates();
    } catch (error) {
      console.error('❌ Default folder creation error:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading mockup templates...');
      
      let query = supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id);
      
      // If folder is selected, filter by folder
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
      }
      
      // If store is selected, filter by store
      if (selectedStore) {
        query = query.eq('store_id', selectedStore);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup templates loaded`);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template loading general error:', error);
      // Create mock template for demo
      if (templates.length === 0) {
        const mockTemplate: MockupTemplate = {
          id: '1',
          user_id: user?.id || '',
          name: 'Sample T-Shirt Template',
          image_url: 'https://images.pexels.com/photos/1484807/pexels-photo-1484807.jpeg?auto=compress&cs=tinysrgb&w=600',
          design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
          text_areas: [],
          design_type: 'black',
          product_category: 't-shirt',
          folder_path: 'default',
          folder_name: 'Default Templates',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTemplates([mockTemplate]);
      }
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
    } catch (error) {
      console.error('❌ Store loading general error:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Folder name is required!');
      return;
    }

    try {
      console.log('🔄 Creating new folder...');
      
      // Generate a folder path from the name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const existingFolder = folders.find(f => f.folder_path === folderPath);
      if (existingFolder) {
        alert('A folder with this name already exists!');
        return;
      }
      
      // Create a template in the new folder to initialize it
      const newTemplate: Partial<MockupTemplate> = {
        user_id: user?.id,
        name: `${newFolderName} Template`,
        image_url: 'https://images.pexels.com/photos/1484807/pexels-photo-1484807.jpeg?auto=compress&cs=tinysrgb&w=600',
        design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
        text_areas: [],
        design_type: 'black',
        product_category: 't-shirt',
        folder_path: folderPath,
        folder_name: newFolderName,
        is_default: false
      };
      
      const { error } = await supabase
        .from('mockup_templates')
        .insert(newTemplate);
      
      if (error) {
        console.error('❌ Folder creation error:', error);
        throw error;
      }
      
      console.log('✅ New folder created successfully');
      
      // Reset form and close modal
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      // Reload folders and templates
      await loadFolders();
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
    } catch (error) {
      console.error('❌ Folder creation general error:', error);
      alert('Failed to create folder. Please try again.');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB');
      return;
    }
    
    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Template name is required!');
      return;
    }
    
    if (!uploadedImage && !uploadPreview) {
      alert('Please upload an image for the template!');
      return;
    }
    
    try {
      setUploading(true);
      console.log('🔄 Creating new template...');
      
      // In a real implementation, this would upload the image to Supabase Storage
      // For now, we'll use the preview URL or a placeholder
      const imageUrl = uploadPreview || 'https://images.pexels.com/photos/1484807/pexels-photo-1484807.jpeg?auto=compress&cs=tinysrgb&w=600';
      
      // Use selected folder or current folder
      const folderPath = newTemplateFolder || currentFolder || 'default';
      
      // Find folder name from path
      const folder = folders.find(f => f.folder_path === folderPath);
      const folderName = folder?.folder_name || 'Default Templates';
      
      const newTemplate: Partial<MockupTemplate> = {
        user_id: user?.id,
        name: newTemplateName,
        image_url: imageUrl,
        design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
        text_areas: [],
        design_type: newTemplateDesignType,
        product_category: newTemplateProductCategory,
        store_id: selectedStore || undefined,
        folder_path: folderPath,
        folder_name: folderName,
        is_default: false
      };
      
      const { error } = await supabase
        .from('mockup_templates')
        .insert(newTemplate);
      
      if (error) {
        console.error('❌ Template creation error:', error);
        throw error;
      }
      
      console.log('✅ New template created successfully');
      
      // Reset form and close modal
      setNewTemplateName('');
      setNewTemplateDesignType('black');
      setNewTemplateProductCategory('t-shirt');
      setNewTemplateFolder('');
      setUploadedImage(null);
      setUploadPreview(null);
      setShowCreateTemplateModal(false);
      
      // Reload templates
      await loadTemplates();
    } catch (error) {
      console.error('❌ Template creation general error:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      console.log(`🗑️ Deleting template: ${templateId}`);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('❌ Template deletion error:', error);
        throw error;
      }

      console.log('✅ Template deleted successfully');
      
      // Update local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      // Reload folders to update counts
      await loadFolders();
    } catch (error) {
      console.error('❌ Template deletion general error:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const deleteFolder = async (folderPath: string) => {
    // Find folder to get template count
    const folder = folders.find(f => f.folder_path === folderPath);
    if (!folder) return;
    
    // Confirm deletion with warning about templates
    if (!window.confirm(`Are you sure you want to delete this folder and all ${folder.template_count} templates inside it?`)) return;

    try {
      console.log(`🗑️ Deleting folder: ${folderPath}`);
      
      // Delete all templates in the folder
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('folder_path', folderPath)
        .eq('user_id', user?.id);

      if (error) {
        console.error('❌ Folder deletion error:', error);
        throw error;
      }

      console.log('✅ Folder deleted successfully');
      
      // Update local state
      setFolders(prev => prev.filter(f => f.folder_path !== folderPath));
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folderPath) {
        setCurrentFolder('');
      }
      
      // Reload templates
      await loadTemplates();
    } catch (error) {
      console.error('❌ Folder deletion general error:', error);
      alert('Failed to delete folder. Please try again.');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log(`🔄 Duplicating template: ${template.id}`);
      
      const newTemplate: Partial<MockupTemplate> = {
        user_id: user?.id,
        name: `${template.name} (Copy)`,
        image_url: template.image_url,
        design_areas: template.design_areas,
        text_areas: template.text_areas,
        logo_area: template.logo_area,
        design_type: template.design_type,
        product_category: template.product_category,
        store_id: template.store_id,
        folder_path: template.folder_path,
        folder_name: template.folder_name,
        is_default: false
      };
      
      const { error } = await supabase
        .from('mockup_templates')
        .insert(newTemplate);
      
      if (error) {
        console.error('❌ Template duplication error:', error);
        throw error;
      }
      
      console.log('✅ Template duplicated successfully');
      
      // Reload templates
      await loadTemplates();
      
      // Reload folders to update counts
      await loadFolders();
    } catch (error) {
      console.error('❌ Template duplication general error:', error);
      alert('Failed to duplicate template. Please try again.');
    }
  };

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const selectAllTemplates = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTemplates.length} selected template(s)?`)) return;
    
    try {
      console.log(`🗑️ Deleting ${selectedTemplates.length} templates...`);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Bulk deletion error:', error);
        throw error;
      }
      
      console.log('✅ Templates deleted successfully');
      
      // Update local state
      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
      
      // Reload folders to update counts
      await loadFolders();
    } catch (error) {
      console.error('❌ Bulk deletion general error:', error);
      alert('Failed to delete templates. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDesignTypeColor = (type: string) => {
    const colors = {
      'black': 'bg-gray-900 text-white',
      'white': 'bg-gray-100 text-gray-900 border border-gray-300',
      'color': 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
    };
    return colors[type as keyof typeof colors] || colors.black;
  };

  const getCurrentFolderName = () => {
    if (!currentFolder) return 'All Folders';
    const folder = folders.find(f => f.folder_path === currentFolder);
    return folder ? folder.folder_name : currentFolder;
  };

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.product_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get product categories for dropdown
  const productCategories = [
    { value: 't-shirt', label: 'T-Shirt' },
    { value: 'sweatshirt', label: 'Sweatshirt' },
    { value: 'hoodie', label: 'Hoodie' },
    { value: 'mug', label: 'Mug' },
    { value: 'poster', label: 'Poster' },
    { value: 'canvas', label: 'Canvas' },
    { value: 'pillow', label: 'Pillow' },
    { value: 'phone-case', label: 'Phone Case' },
    { value: 'tote-bag', label: 'Tote Bag' },
    { value: 'sticker', label: 'Sticker' },
    { value: 'other', label: 'Other' }
  ];

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
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your mockup templates ({templates.length} templates)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateFolderModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </Button>
          <Button
            onClick={() => setShowCreateTemplateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => setCurrentFolder('')}
          className={`hover:text-orange-500 flex items-center space-x-1 ${!currentFolder ? 'font-medium text-orange-500' : ''}`}
        >
          <Folder className="h-4 w-4" />
          <span>All Folders</span>
        </button>
        {currentFolder && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 dark:text-white font-medium">{getCurrentFolderName()}</span>
          </>
        )}
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Store:
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name}
                </option>
              ))}
            </select>
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

      {/* Bulk Actions */}
      {selectedTemplates.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedTemplates.length} template(s) selected
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
              <Button onClick={() => setSelectedTemplates([])} variant="secondary" size="sm">
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Folders Display - Show when not in a specific folder */}
      {!currentFolder && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-orange-500" />
            Folders ({folders.length})
          </h2>
          
          {folders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No folders created yet
              </p>
              <Button
                onClick={() => setShowCreateFolderModal(true)}
                variant="secondary"
                className="flex items-center space-x-2 mx-auto"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Create First Folder</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.folder_path}
                  className="group relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setCurrentFolder(folder.folder_path)}
                >
                  <div className="text-center">
                    <FolderOpen className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {folder.folder_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {folder.template_count} templates
                    </p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <span className="px-2 py-1 bg-gray-900 text-white text-xs rounded-full">
                        {folder.black_designs} Black
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-900 border border-gray-300 text-xs rounded-full">
                        {folder.white_designs} White
                      </span>
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full">
                        {folder.color_designs} Color
                      </span>
                    </div>
                  </div>
                  
                  {/* Folder Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.folder_path);
                        }}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back Button - Show when in folder */}
      {currentFolder && (
        <Button
          onClick={() => setCurrentFolder('')}
          variant="secondary"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Folders</span>
        </Button>
      )}

      {/* Templates Display */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Image className="h-5 w-5 mr-2 text-orange-500" />
          {getCurrentFolderName()} - Templates ({filteredTemplates.length})
        </h2>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No templates found' : 'No templates in this folder'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Start by creating your first template'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowCreateTemplateModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Template</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={selectedTemplates.length === filteredTemplates.length}
                onChange={selectAllTemplates}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Select all ({filteredTemplates.length} templates)
              </label>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTemplates.includes(template.id)}
                            onChange={() => toggleTemplateSelection(template.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => duplicateTemplate(template)}
                            className="text-blue-500 hover:text-blue-700 p-1"
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
                      {/* Template Preview */}
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Design Type Badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                            {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                          </span>
                        </div>
                        
                        {/* Product Category Badge */}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
                            {template.product_category.charAt(0).toUpperCase() + template.product_category.slice(1).replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Design Areas:</span>
                          <span className="font-medium">{template.design_areas?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Text Areas:</span>
                          <span className="font-medium">{template.text_areas?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{formatDate(template.created_at)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-4">
                        <Button
                          onClick={() => {
                            // TODO: Implement edit functionality
                            console.log('Edit template:', template);
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            // TODO: Use template functionality
                            console.log('Use template:', template);
                          }}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.length === filteredTemplates.length}
                          onChange={selectAllTemplates}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Areas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTemplates.includes(template.id)}
                            onChange={() => toggleTemplateSelection(template.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden">
                              <img
                                src={template.image_url}
                                alt={template.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {template.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                            {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                          {template.product_category.replace('-', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className="text-gray-600 dark:text-gray-400">D:</span> {template.design_areas?.length || 0} 
                          <span className="mx-1">|</span>
                          <span className="text-gray-600 dark:text-gray-400">T:</span> {template.text_areas?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(template.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                // TODO: Implement edit functionality
                                console.log('Edit template:', template);
                              }}
                              className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Edit template"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicateTemplate(template)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Duplicate template"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              title="More actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Folder
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folder Name:
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. T-Shirts, Mugs, Posters..."
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={createFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
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

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Template
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name:
                    </label>
                    <Input
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g. White T-Shirt Front"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Design Type:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={newTemplateDesignType === 'black'}
                          onChange={() => setNewTemplateDesignType('black')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Black</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={newTemplateDesignType === 'white'}
                          onChange={() => setNewTemplateDesignType('white')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">White</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={newTemplateDesignType === 'color'}
                          onChange={() => setNewTemplateDesignType('color')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Color</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Category:
                    </label>
                    <select
                      value={newTemplateProductCategory}
                      onChange={(e) => setNewTemplateProductCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      {productCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Folder:
                    </label>
                    <select
                      value={newTemplateFolder || currentFolder}
                      onChange={(e) => setNewTemplateFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      {folders.map((folder) => (
                        <option key={folder.folder_path} value={folder.folder_path}>
                          {folder.folder_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Store (Optional):
                    </label>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">No Store</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.store_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Image:
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 h-64 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadPreview ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={uploadPreview} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                            setUploadPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-2">
                          Click to upload template image
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                          PNG, JPG or JPEG (max. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={createTemplate}
                  className="flex-1"
                  disabled={uploading || !newTemplateName.trim() || (!uploadedImage && !uploadPreview)}
                >
                  {uploading ? 'Creating...' : 'Create Template'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateTemplateModal(false);
                    setNewTemplateName('');
                    setNewTemplateDesignType('black');
                    setNewTemplateProductCategory('t-shirt');
                    setNewTemplateFolder('');
                    setUploadedImage(null);
                    setUploadPreview(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={uploading}
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

export default MockupTemplatesPage;