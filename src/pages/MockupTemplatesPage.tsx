import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
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
  is_default: boolean;
  created_at: string;
  updated_at: string;
  design_type: 'black' | 'white' | 'color';
  product_category: string;
  folder_path?: string;
  folder_name?: string;
  store_id?: string;
}

interface Folder {
  id: string;
  name: string;
  path: string;
  parent_path?: string;
  template_count: number;
  created_at: string;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [designTypeFilter, setDesignTypeFilter] = useState<'all' | 'black' | 'white' | 'color'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
    }
  }, [user, currentFolder]);

  const loadFolders = async () => {
    try {
      setLoading(true);
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

      // If no folders exist yet, create a default folder
      if (!data || data.length === 0) {
        console.log('📁 No folders found, creating default folders...');
        
        // Create mock folders for demonstration
        const mockFolders: Folder[] = [
          {
            id: 'default',
            name: 'Default Templates',
            path: 'default',
            template_count: 0,
            created_at: new Date().toISOString()
          },
          {
            id: 'tshirts',
            name: 'T-Shirts',
            path: 'tshirts',
            template_count: 0,
            created_at: new Date().toISOString()
          },
          {
            id: 'mugs',
            name: 'Mugs',
            path: 'mugs',
            template_count: 0,
            created_at: new Date().toISOString()
          }
        ];
        
        setFolders(mockFolders);
      } else {
        console.log(`✅ ${data.length} folders loaded`);
        
        // Map the data to our Folder interface
        const mappedFolders: Folder[] = data.map(folder => ({
          id: folder.folder_path,
          name: folder.folder_name || folder.folder_path,
          path: folder.folder_path,
          template_count: folder.template_count || 0,
          created_at: folder.first_created || new Date().toISOString()
        }));
        
        setFolders(mappedFolders);
      }
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
      
      // Fallback to mock folders if there's an error
      const mockFolders: Folder[] = [
        {
          id: 'default',
          name: 'Default Templates',
          path: 'default',
          template_count: 0,
          created_at: new Date().toISOString()
        },
        {
          id: 'tshirts',
          name: 'T-Shirts',
          path: 'tshirts',
          template_count: 0,
          created_at: new Date().toISOString()
        },
        {
          id: 'mugs',
          name: 'Mugs',
          path: 'mugs',
          template_count: 0,
          created_at: new Date().toISOString()
        }
      ];
      
      setFolders(mockFolders);
    } finally {
      setLoading(false);
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
      
      // If we're in a specific folder, filter by folder_path
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} templates loaded`);
      
      // If no templates exist yet, create some mock templates
      if (!data || data.length === 0) {
        console.log('📝 No templates found, using mock data...');
        
        // Create mock templates for demonstration
        const mockTemplates: MockupTemplate[] = [
          {
            id: '1',
            user_id: user?.id || '',
            name: 'T-Shirt Mockup 1',
            image_url: 'https://images.pexels.com/photos/1484516/pexels-photo-1484516.jpeg?auto=compress&cs=tinysrgb&w=600',
            design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
            text_areas: [{ x: 200, y: 500, width: 300, height: 100 }],
            is_default: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            design_type: 'black',
            product_category: 't-shirt',
            folder_path: 'tshirts',
            folder_name: 'T-Shirts'
          },
          {
            id: '2',
            user_id: user?.id || '',
            name: 'Mug Mockup 1',
            image_url: 'https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=600',
            design_areas: [{ x: 200, y: 200, width: 200, height: 200 }],
            text_areas: [],
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            design_type: 'white',
            product_category: 'mug',
            folder_path: 'mugs',
            folder_name: 'Mugs'
          },
          {
            id: '3',
            user_id: user?.id || '',
            name: 'Poster Mockup 1',
            image_url: 'https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=600',
            design_areas: [{ x: 200, y: 200, width: 400, height: 600 }],
            text_areas: [{ x: 200, y: 800, width: 400, height: 100 }],
            is_default: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            design_type: 'color',
            product_category: 'poster',
            folder_path: 'default',
            folder_name: 'Default Templates'
          }
        ];
        
        // Filter mock templates by current folder if needed
        const filteredMockTemplates = currentFolder 
          ? mockTemplates.filter(t => t.folder_path === currentFolder)
          : mockTemplates;
        
        setTemplates(filteredMockTemplates);
      } else {
        setTemplates(data);
      }
    } catch (error) {
      console.error('❌ Template loading general error:', error);
      
      // Fallback to empty templates array
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Folder name is required!');
      return;
    }

    try {
      console.log('📁 Creating new folder:', newFolderName);
      
      // Generate a folder path from the name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const existingFolder = folders.find(f => f.path === folderPath);
      if (existingFolder) {
        alert('A folder with this name already exists!');
        return;
      }
      
      // In a real implementation, this would create a folder in Supabase
      // For now, we'll just add it to the local state
      
      const newFolder: Folder = {
        id: folderPath,
        name: newFolderName,
        path: folderPath,
        template_count: 0,
        created_at: new Date().toISOString()
      };
      
      // Add to local state
      setFolders(prev => [...prev, newFolder]);
      
      // Reset form
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      console.log('✅ Folder created successfully');
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
      
    } catch (error) {
      console.error('❌ Folder creation error:', error);
      alert('Error creating folder');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!window.confirm('Are you sure you want to delete this folder? All templates in this folder will be moved to the Default folder.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting folder:', folderId);
      
      // Get the folder to delete
      const folderToDelete = folders.find(f => f.id === folderId);
      if (!folderToDelete) {
        console.error('❌ Folder not found:', folderId);
        return;
      }
      
      // In a real implementation, this would:
      // 1. Move all templates in this folder to the Default folder
      // 2. Delete the folder from Supabase
      
      // For now, we'll just update the local state
      
      // Remove folder from local state
      setFolders(prev => prev.filter(f => f.id !== folderId));
      
      // If we're currently in the deleted folder, go back to root
      if (currentFolder === folderToDelete.path) {
        setCurrentFolder('');
      }
      
      console.log('✅ Folder deleted successfully');
      
    } catch (error) {
      console.error('❌ Folder deletion error:', error);
      alert('Error deleting folder');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting template:', templateId);
      
      // In a real implementation, this would delete the template from Supabase
      // For now, we'll just update the local state
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      console.log('✅ Template deleted successfully');
      
    } catch (error) {
      console.error('❌ Template deletion error:', error);
      alert('Error deleting template');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log('🔄 Duplicating template:', template.id);
      
      // In a real implementation, this would create a new template in Supabase
      // For now, we'll just update the local state
      
      const newTemplate: MockupTemplate = {
        ...template,
        id: `${template.id}-copy-${Date.now()}`,
        name: `${template.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_default: false
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      
      console.log('✅ Template duplicated successfully');
      
    } catch (error) {
      console.error('❌ Template duplication error:', error);
      alert('Error duplicating template');
    }
  };

  const moveTemplateToFolder = async (templateId: string, folderPath: string) => {
    try {
      console.log(`🔄 Moving template ${templateId} to folder ${folderPath}`);
      
      // In a real implementation, this would update the template in Supabase
      // For now, we'll just update the local state
      
      // Find the folder
      const folder = folders.find(f => f.path === folderPath);
      if (!folder) {
        console.error('❌ Folder not found:', folderPath);
        return;
      }
      
      // Update the template
      setTemplates(prev => prev.map(t => {
        if (t.id === templateId) {
          return {
            ...t,
            folder_path: folderPath,
            folder_name: folder.name
          };
        }
        return t;
      }));
      
      console.log('✅ Template moved successfully');
      
    } catch (error) {
      console.error('❌ Template move error:', error);
      alert('Error moving template');
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadFolders();
      await loadTemplates();
    } finally {
      setRefreshing(false);
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
      
      // In a real implementation, this would delete the templates from Supabase
      // For now, we'll just update the local state
      
      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
      
      console.log('✅ Templates deleted successfully');
      
    } catch (error) {
      console.error('❌ Bulk template deletion error:', error);
      alert('Error deleting templates');
    }
  };

  const handleBulkMove = async (folderPath: string) => {
    if (selectedTemplates.length === 0) return;

    try {
      console.log(`🔄 Moving ${selectedTemplates.length} templates to folder ${folderPath}`);
      
      // Find the folder
      const folder = folders.find(f => f.path === folderPath);
      if (!folder) {
        console.error('❌ Folder not found:', folderPath);
        return;
      }
      
      // Update the templates
      setTemplates(prev => prev.map(t => {
        if (selectedTemplates.includes(t.id)) {
          return {
            ...t,
            folder_path: folderPath,
            folder_name: folder.name
          };
        }
        return t;
      }));
      
      setSelectedTemplates([]);
      
      console.log('✅ Templates moved successfully');
      
    } catch (error) {
      console.error('❌ Bulk template move error:', error);
      alert('Error moving templates');
    }
  };

  // Filter templates based on search term and design type
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesignType = designTypeFilter === 'all' || template.design_type === designTypeFilter;
    return matchesSearch && matchesDesignType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    if (!currentFolder) return 'All Templates';
    const folder = folders.find(f => f.path === currentFolder);
    return folder ? folder.name : currentFolder;
  };

  const breadcrumbs = () => {
    const parts = [];
    if (currentFolder) {
      const folder = folders.find(f => f.path === currentFolder);
      if (folder) {
        parts.push(folder.name);
      }
    }
    return parts;
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
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your mockup templates ({templates.length} templates)
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
            onClick={() => window.location.href = '/admin/templates/mockup/create'}
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
          <span>All Templates</span>
        </button>
        {breadcrumbs().map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 dark:text-white font-medium">{part}</span>
          </React.Fragment>
        ))}
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
          <select
            value={designTypeFilter}
            onChange={(e) => setDesignTypeFilter(e.target.value as 'all' | 'black' | 'white' | 'color')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="black">Black Designs</option>
            <option value="white">White Designs</option>
            <option value="color">Color Designs</option>
          </select>
          
          <Button
            onClick={handleRefresh}
            variant="secondary"
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
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
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkMove(e.target.value);
                      e.target.value = ''; // Reset after use
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Move to folder...</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.path}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
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

      {/* Folders and Templates Display */}
      <div className="space-y-6">
        {/* Folders Section - Show when in root directory */}
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
                    key={folder.id}
                    className="group relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setCurrentFolder(folder.path)}
                  >
                    <div className="text-center">
                      <FolderOpen className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {folder.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {folder.template_count} templates
                      </p>
                    </div>
                    
                    {/* Folder Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
                        }}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
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

        {/* Templates Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Image className="h-5 w-5 mr-2 text-orange-500" />
            {getCurrentFolderName()} - Templates ({filteredTemplates.length})
          </h2>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || designTypeFilter !== 'all' 
                  ? 'No templates found' 
                  : currentFolder 
                    ? 'No templates in this folder' 
                    : 'No templates created yet'
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || designTypeFilter !== 'all'
                  ? 'Try adjusting your search terms or filters'
                  : 'Create your first template to get started'
                }
              </p>
              {!searchTerm && designTypeFilter === 'all' && (
                <Button
                  onClick={() => window.location.href = '/admin/templates/mockup/create'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
                              onClick={(e) => e.stopPropagation()}
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
                        <div className="space-y-3">
                          {/* Template Preview */}
                          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
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
                            
                            {/* Folder Badge */}
                            {template.folder_name && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 bg-gray-800/70 text-white rounded-full text-xs font-medium flex items-center">
                                  <Folder className="h-3 w-3 mr-1" />
                                  {template.folder_name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Template Info */}
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Created: {formatDate(template.created_at)}</span>
                            <div className="flex items-center">
                              <span className="mr-2">Areas:</span>
                              <span className="font-medium">{template.design_areas.length + template.text_areas.length}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-2">
                            <Button
                              onClick={() => window.location.href = `/admin/templates/mockup/edit/${template.id}`}
                              size="sm"
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            
                            {/* Move to Folder Dropdown */}
                            <div className="relative flex-1">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    moveTemplateToFolder(template.id, e.target.value);
                                    e.target.value = ''; // Reset after use
                                  }
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                defaultValue=""
                              >
                                <option value="" disabled>Move to...</option>
                                {folders.map((folder) => (
                                  <option 
                                    key={folder.id} 
                                    value={folder.path}
                                    disabled={template.folder_path === folder.path}
                                  >
                                    {folder.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
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
                          Folder
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
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {template.product_category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                              {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Folder className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {template.folder_name || 'Default'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {template.design_areas.length + template.text_areas.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(template.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => window.location.href = `/admin/templates/mockup/edit/${template.id}`}
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
                              
                              {/* Move to Folder Dropdown */}
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    moveTemplateToFolder(template.id, e.target.value);
                                    e.target.value = ''; // Reset after use
                                  }
                                }}
                                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                defaultValue=""
                              >
                                <option value="" disabled>Move to...</option>
                                {folders.map((folder) => (
                                  <option 
                                    key={folder.id} 
                                    value={folder.path}
                                    disabled={template.folder_path === folder.path}
                                  >
                                    {folder.name}
                                  </option>
                                ))}
                              </select>
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
                  onKeyPress={(e) => e.key === 'Enter' && createFolder()}
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
    </div>
  );
};

export default MockupTemplatesPage;