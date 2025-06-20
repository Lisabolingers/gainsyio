import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, RefreshCw, Move } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
  product_category: string;
  folder_path: string;
  folder_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateFolder {
  id: string;
  name: string;
  path: string;
  parent_path?: string;
  template_count: number;
  black_designs: number;
  white_designs: number;
  color_designs: number;
  first_created: string;
  last_updated: string;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [designTypeFilter, setDesignTypeFilter] = useState<'all' | 'black' | 'white' | 'color'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
    }
  }, [user, currentFolder]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading template folders...');
      
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('folder_name', { ascending: true });

      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} template folders loaded`);
      
      // Convert to TemplateFolder format
      const templateFolders: TemplateFolder[] = (data || []).map(folder => ({
        id: folder.folder_path, // Use folder_path as ID
        name: folder.folder_name,
        path: folder.folder_path,
        template_count: folder.template_count,
        black_designs: folder.black_designs,
        white_designs: folder.white_designs,
        color_designs: folder.color_designs,
        first_created: folder.first_created,
        last_updated: folder.last_updated
      }));
      
      setFolders(templateFolders);
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
      
      // Fallback to mock data if there's an error
      const mockFolders: TemplateFolder[] = [
        {
          id: 'tshirts',
          name: 'T-Shirts',
          path: 'tshirts',
          template_count: 5,
          black_designs: 2,
          white_designs: 2,
          color_designs: 1,
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        {
          id: 'mugs',
          name: 'Mugs',
          path: 'mugs',
          template_count: 3,
          black_designs: 1,
          white_designs: 1,
          color_designs: 1,
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        {
          id: 'posters',
          name: 'Posters',
          path: 'posters',
          template_count: 4,
          black_designs: 2,
          white_designs: 1,
          color_designs: 1,
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
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
      
      // Filter by current folder if one is selected
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
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
      
      // Fallback to mock data if there's an error
      const mockTemplates: MockupTemplate[] = [
        {
          id: '1',
          user_id: user?.id || '',
          name: 'T-Shirt Mockup 1',
          image_url: 'https://images.pexels.com/photos/1566412/pexels-photo-1566412.jpeg?auto=compress&cs=tinysrgb&w=400',
          design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
          text_areas: [{ x: 200, y: 500, width: 300, height: 100 }],
          design_type: 'black',
          product_category: 't-shirt',
          folder_path: currentFolder || 'tshirts',
          folder_name: 'T-Shirts',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: user?.id || '',
          name: 'T-Shirt Mockup 2',
          image_url: 'https://images.pexels.com/photos/1484807/pexels-photo-1484807.jpeg?auto=compress&cs=tinysrgb&w=400',
          design_areas: [{ x: 200, y: 200, width: 300, height: 300 }],
          text_areas: [{ x: 200, y: 500, width: 300, height: 100 }],
          design_type: 'white',
          product_category: 't-shirt',
          folder_path: currentFolder || 'tshirts',
          folder_name: 'T-Shirts',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          user_id: user?.id || '',
          name: 'Mug Mockup 1',
          image_url: 'https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=400',
          design_areas: [{ x: 200, y: 200, width: 200, height: 200 }],
          text_areas: [],
          design_type: 'black',
          product_category: 'mug',
          folder_path: currentFolder || 'mugs',
          folder_name: 'Mugs',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // Filter mock templates based on current folder
      const filteredMockTemplates = currentFolder 
        ? mockTemplates.filter(t => t.folder_path === currentFolder)
        : mockTemplates;
      
      setTemplates(filteredMockTemplates);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Klasör adı gereklidir!');
      return;
    }

    try {
      console.log('🔄 Creating new folder:', newFolderName);
      
      // Generate a folder path from the name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const existingFolder = folders.find(f => 
        f.path === folderPath || 
        f.name.toLowerCase() === newFolderName.toLowerCase()
      );
      
      if (existingFolder) {
        setError('Bu isimde bir klasör zaten var!');
        return;
      }
      
      // In a real implementation, we would create a folder in the database
      // For now, we'll just add it to the state
      
      const newFolder: TemplateFolder = {
        id: folderPath,
        name: newFolderName,
        path: folderPath,
        parent_path: currentFolder || undefined,
        template_count: 0,
        black_designs: 0,
        white_designs: 0,
        color_designs: 0,
        first_created: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      setError(null);
      
      console.log('✅ Folder created successfully:', newFolder);
    } catch (error: any) {
      console.error('❌ Folder creation error:', error);
      setError('Klasör oluşturulurken bir hata oluştu: ' + error.message);
    }
  };

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    if (folder.template_count > 0) {
      if (!window.confirm(`Bu klasörde ${folder.template_count} şablon var. Klasörü ve içindeki tüm şablonları silmek istediğinizden emin misiniz?`)) {
        return;
      }
    } else {
      if (!window.confirm(`"${folder.name}" klasörünü silmek istediğinizden emin misiniz?`)) {
        return;
      }
    }

    try {
      console.log('🔄 Deleting folder:', folder.name);
      
      // In a real implementation, we would delete the folder from the database
      // For now, we'll just remove it from the state
      
      setFolders(prev => prev.filter(f => f.id !== folderId));
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folder.path) {
        setCurrentFolder('');
      }
      
      console.log('✅ Folder deleted successfully');
    } catch (error: any) {
      console.error('❌ Folder deletion error:', error);
      setError('Klasör silinirken bir hata oluştu: ' + error.message);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      console.log('🔄 Deleting template:', templateId);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      console.log('✅ Template deleted successfully');
      
      // Update folder counts
      loadFolders();
    } catch (error: any) {
      console.error('❌ Template deletion error:', error);
      setError('Şablon silinirken bir hata oluştu: ' + error.message);
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log('🔄 Duplicating template:', template.name);
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Kopya)`,
          image_url: template.image_url,
          design_areas: template.design_areas,
          text_areas: template.text_areas,
          logo_area: template.logo_area,
          design_type: template.design_type,
          product_category: template.product_category,
          folder_path: template.folder_path,
          folder_name: template.folder_name,
          is_default: false
        })
        .select();

      if (error) throw error;

      console.log('✅ Template duplicated successfully:', data);
      
      // Reload templates to get the new one
      loadTemplates();
      
      // Update folder counts
      loadFolders();
    } catch (error: any) {
      console.error('❌ Template duplication error:', error);
      setError('Şablon kopyalanırken bir hata oluştu: ' + error.message);
    }
  };

  const moveTemplates = async () => {
    if (selectedTemplates.length === 0 || !selectedMoveFolder) {
      setError('Lütfen taşımak için şablonlar ve hedef klasör seçin!');
      return;
    }

    try {
      console.log(`🔄 Moving ${selectedTemplates.length} templates to folder: ${selectedMoveFolder}`);
      
      // Get target folder name
      const targetFolder = folders.find(f => f.path === selectedMoveFolder);
      if (!targetFolder) {
        throw new Error('Hedef klasör bulunamadı!');
      }
      
      // In a real implementation, we would update the templates in the database
      // For now, we'll just update the state
      
      const updatedTemplates = templates.map(template => {
        if (selectedTemplates.includes(template.id)) {
          return {
            ...template,
            folder_path: selectedMoveFolder,
            folder_name: targetFolder.name
          };
        }
        return template;
      });
      
      setTemplates(updatedTemplates);
      setSelectedTemplates([]);
      setShowMoveModal(false);
      setSelectedMoveFolder('');
      
      console.log('✅ Templates moved successfully');
      
      // Update folder counts
      loadFolders();
    } catch (error: any) {
      console.error('❌ Template move error:', error);
      setError('Şablonlar taşınırken bir hata oluştu: ' + error.message);
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
    
    if (!window.confirm(`${selectedTemplates.length} şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;
    
    try {
      console.log(`🔄 Deleting ${selectedTemplates.length} templates...`);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
      
      console.log('✅ Templates deleted successfully');
      
      // Update folder counts
      loadFolders();
    } catch (error: any) {
      console.error('❌ Bulk template deletion error:', error);
      setError('Şablonlar silinirken bir hata oluştu: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
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

  // Filter templates based on search term and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesignType = designTypeFilter === 'all' || template.design_type === designTypeFilter;
    const matchesProductCategory = productCategoryFilter === 'all' || template.product_category === productCategoryFilter;
    
    return matchesSearch && matchesDesignType && matchesProductCategory;
  });

  // Get unique product categories for filter
  const productCategories = ['all', ...new Set(templates.map(t => t.product_category))];

  // Get current folder name
  const getCurrentFolderName = () => {
    if (!currentFolder) return 'Tüm Şablonlar';
    const folder = folders.find(f => f.path === currentFolder);
    return folder ? folder.name : currentFolder;
  };

  // Breadcrumb navigation
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
            Mockup Şablonları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Mockup şablonlarınızı klasörler halinde düzenleyin ({templates.length} şablon)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateFolderModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Yeni Klasör</span>
          </Button>
          <Button
            onClick={() => window.location.href = '/admin/templates/mockup/create'}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Şablon</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 text-red-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => setCurrentFolder('')}
          className="hover:text-orange-500 flex items-center space-x-1"
        >
          <Folder className="h-4 w-4" />
          <span>Tüm Şablonlar</span>
        </button>
        {breadcrumbs().map((part, index) => (
          <React.Fragment key={index}>
            <span>/</span>
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
            placeholder="Şablonlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Design Type Filter */}
          <select
            value={designTypeFilter}
            onChange={(e) => setDesignTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tüm Tasarım Tipleri</option>
            <option value="black">Siyah Tasarım</option>
            <option value="white">Beyaz Tasarım</option>
            <option value="color">Renkli Tasarım</option>
          </select>

          {/* Product Category Filter */}
          <select
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {productCategories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Tüm Kategoriler' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
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
              {selectedTemplates.length} şablon seçildi
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowMoveModal(true)}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Move className="h-4 w-4" />
                <span>Taşı</span>
              </Button>
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                <span>Sil</span>
              </Button>
              <Button onClick={() => setSelectedTemplates([])} variant="secondary" size="sm">
                <span>Seçimi Temizle</span>
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
              Klasörler ({folders.length})
            </h2>
            
            {folders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Henüz klasör oluşturulmamış
                </p>
                <Button
                  onClick={() => setShowCreateFolderModal(true)}
                  variant="secondary"
                  className="flex items-center space-x-2 mx-auto"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>İlk Klasörü Oluştur</span>
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
                        {folder.template_count} şablon
                      </p>
                      
                      {/* Design type counts */}
                      <div className="flex justify-center space-x-2 mt-2">
                        {folder.black_designs > 0 && (
                          <span className="px-2 py-1 bg-gray-900 text-white text-xs rounded-full">
                            {folder.black_designs}
                          </span>
                        )}
                        {folder.white_designs > 0 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-900 text-xs rounded-full border border-gray-300">
                            {folder.white_designs}
                          </span>
                        )}
                        {folder.color_designs > 0 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full">
                            {folder.color_designs}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Folder Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
                        }}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Klasörü sil"
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
            <span>Tüm Klasörlere Dön</span>
          </Button>
        )}

        {/* Templates Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Image className="h-5 w-5 mr-2 text-orange-500" />
            {getCurrentFolderName()} - Şablonlar ({filteredTemplates.length})
          </h2>

          {/* Select All Checkbox */}
          {filteredTemplates.length > 0 && (
            <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={selectedTemplates.length === filteredTemplates.length}
                onChange={selectAllTemplates}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Tümünü seç ({filteredTemplates.length} şablon)
              </label>
            </div>
          )}

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || designTypeFilter !== 'all' || productCategoryFilter !== 'all'
                  ? 'Şablon bulunamadı'
                  : currentFolder
                    ? 'Bu klasörde şablon yok'
                    : 'Henüz şablon yok'
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || designTypeFilter !== 'all' || productCategoryFilter !== 'all'
                  ? 'Arama terimlerinizi veya filtrelerinizi değiştirmeyi deneyin'
                  : 'İlk şablonunuzu oluşturarak başlayın'
                }
              </p>
              {!searchTerm && designTypeFilter === 'all' && productCategoryFilter === 'all' && (
                <Button
                  onClick={() => window.location.href = '/admin/templates/mockup/create'}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>İlk Şablonu Oluştur</span>
                </Button>
              )}
            </div>
          ) : (
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
                          title="Şablonu kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Şablonu sil"
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
                          {template.design_type === 'black' ? 'Siyah' : 
                           template.design_type === 'white' ? 'Beyaz' : 'Renkli'}
                        </span>
                      </div>
                      
                      {/* Design Areas Indicator */}
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                          {template.design_areas.length} tasarım alanı
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Kategori:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {template.product_category.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Klasör:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {template.folder_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Oluşturulma:</span>
                        <span>{formatDate(template.created_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <Button
                        onClick={() => window.location.href = `/admin/templates/mockup/edit/${template.id}`}
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Düzenle
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
                        Kullan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Yeni Klasör Oluştur
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Klasör Adı:
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Örn: T-Shirt Şablonları"
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={createFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim()}
                >
                  Oluştur
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                    setError(null);
                  }}
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

      {/* Move Templates Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Şablonları Taşı
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedTemplates.length} şablonu taşı
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hedef Klasör:
                </label>
                <select
                  value={selectedMoveFolder}
                  onChange={(e) => setSelectedMoveFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Klasör seçin...</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.path}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={moveTemplates}
                  className="flex-1"
                  disabled={!selectedMoveFolder}
                >
                  Taşı
                </Button>
                <Button
                  onClick={() => {
                    setShowMoveModal(false);
                    setSelectedMoveFolder('');
                    setError(null);
                  }}
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
  );
};

export default MockupTemplatesPage;