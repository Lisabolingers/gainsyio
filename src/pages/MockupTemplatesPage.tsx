import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, Upload, Move, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Stage, Layer, Rect, Text, Group, Transformer } from 'react-konva';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: DesignArea[];
  text_areas: TextArea[];
  logo_area?: LogoArea;
  design_type: 'black' | 'white' | 'color';
  product_category: string;
  store_id?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  folder_path?: string;
  folder_name?: string;
}

interface DesignArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface TextArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize?: number;
  fontFamily?: string;
}

interface LogoArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface MockupFolder {
  id: string;
  name: string;
  path: string;
  parent_path?: string;
  template_count: number;
  created_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<MockupFolder[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateImage, setTemplateImage] = useState<File | null>(null);
  const [templateImageUrl, setTemplateImageUrl] = useState<string>('');
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [logoArea, setLogoArea] = useState<LogoArea | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [productCategory, setProductCategory] = useState<string>('t-shirt');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadFolders();
      loadStores();
    }
  }, [user, currentFolder]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading mockup templates...');
      
      let query = supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id);

      // If folder is selected, get templates from that folder
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
      }

      // If store is selected, get templates from that store
      if (selectedStore) {
        query = query.eq('store_id', selectedStore);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup templates loaded`);
      
      // Parse JSON fields
      const parsedTemplates = data?.map(template => ({
        ...template,
        design_areas: Array.isArray(template.design_areas) ? template.design_areas : [],
        text_areas: Array.isArray(template.text_areas) ? template.text_areas : [],
        logo_area: template.logo_area || null,
        design_type: template.design_type || 'black',
        product_category: template.product_category || 't-shirt',
        folder_path: template.folder_path || '',
        folder_name: template.folder_name || 'Default'
      })) || [];
      
      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('❌ Template loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      console.log('🔄 Loading mockup folders...');
      
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('folder_name', { ascending: true });

      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup folders loaded`);
      
      // Convert to MockupFolder format
      const parsedFolders: MockupFolder[] = data?.map(folder => ({
        id: folder.folder_path, // Use path as ID
        name: folder.folder_name,
        path: folder.folder_path,
        template_count: folder.template_count,
        created_at: folder.first_created
      })) || [];
      
      setFolders(parsedFolders);
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setTemplateImage(file);
    setTemplateImageUrl(URL.createObjectURL(file));
  };

  const createFolder = async (folderName: string) => {
    if (!folderName.trim()) {
      alert('Folder name is required!');
      return;
    }

    try {
      // Generate folder path from name (slugify)
      const folderPath = folderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const existingFolder = folders.find(f => f.path === folderPath);
      if (existingFolder) {
        alert('A folder with this name already exists!');
        return;
      }
      
      // In a real implementation, we would create a folder in the database
      // For now, we'll just add it to the state
      const newFolder: MockupFolder = {
        id: folderPath,
        name: folderName,
        path: folderPath,
        template_count: 0,
        created_at: new Date().toISOString()
      };
      
      setFolders([...folders, newFolder]);
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
      
      alert('Folder created successfully!');
    } catch (error) {
      console.error('❌ Folder creation error:', error);
      alert('Error creating folder');
    }
  };

  const createTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required!');
      return;
    }

    if (!templateImageUrl) {
      alert('Please upload a template image!');
      return;
    }

    try {
      console.log('💾 Creating mockup template...');
      
      // In a real implementation, we would upload the image to Supabase Storage
      // For now, we'll just use the object URL
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: templateImageUrl,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        product_category: productCategory,
        store_id: selectedStore || null,
        is_default: false,
        folder_path: currentFolder || 'default',
        folder_name: currentFolder ? folders.find(f => f.path === currentFolder)?.name : 'Default'
      };

      const { data, error } = await supabase
        .from('mockup_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Template creation error:', error);
        throw error;
      }

      console.log('✅ Template created successfully:', data);
      
      // Reload templates
      await loadTemplates();
      
      // Reset form
      resetForm();
      
      // Close modal
      setShowCreateModal(false);
      
      alert('Template created successfully!');
    } catch (error) {
      console.error('❌ Template creation general error:', error);
      alert('Error creating template');
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;
    
    if (!templateName.trim()) {
      alert('Template name is required!');
      return;
    }

    try {
      console.log('🔄 Updating mockup template...');
      
      const templateData = {
        name: templateName,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        product_category: productCategory,
        store_id: selectedStore || null,
        updated_at: new Date().toISOString()
      };

      // If a new image was uploaded, update the image_url
      if (templateImage) {
        // In a real implementation, we would upload the new image to Supabase Storage
        // For now, we'll just use the object URL
        templateData.image_url = templateImageUrl;
      }

      const { data, error } = await supabase
        .from('mockup_templates')
        .update(templateData)
        .eq('id', editingTemplate.id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Template update error:', error);
        throw error;
      }

      console.log('✅ Template updated successfully:', data);
      
      // Reload templates
      await loadTemplates();
      
      // Reset form
      resetForm();
      
      // Close modal
      setShowEditModal(false);
      
      alert('Template updated successfully!');
    } catch (error) {
      console.error('❌ Template update general error:', error);
      alert('Error updating template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Error occurred while deleting template');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          image_url: template.image_url,
          design_areas: template.design_areas,
          text_areas: template.text_areas,
          logo_area: template.logo_area,
          design_type: template.design_type,
          product_category: template.product_category,
          store_id: template.store_id,
          is_default: false,
          folder_path: template.folder_path,
          folder_name: template.folder_name
        });

      if (error) throw error;

      await loadTemplates();
      
      alert('Template duplicated successfully!');
    } catch (error) {
      console.error('Template duplication error:', error);
      alert('Error occurred while duplicating template');
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateImage(null);
    setTemplateImageUrl('');
    setDesignAreas([]);
    setTextAreas([]);
    setLogoArea(null);
    setDesignType('black');
    setProductCategory('t-shirt');
    setSelectedId(null);
    setEditingTemplate(null);
  };

  const openEditModal = (template: MockupTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateImageUrl(template.image_url);
    setDesignAreas(template.design_areas || []);
    setTextAreas(template.text_areas || []);
    setLogoArea(template.logo_area || null);
    setDesignType(template.design_type || 'black');
    setProductCategory(template.product_category || 't-shirt');
    setSelectedStore(template.store_id || '');
    setShowEditModal(true);
  };

  const addDesignArea = () => {
    const newArea: DesignArea = {
      id: `design-${Date.now()}`,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0
    };
    setDesignAreas([...designAreas, newArea]);
    setSelectedId(newArea.id);
  };

  const addTextArea = () => {
    const newArea: TextArea = {
      id: `text-${Date.now()}`,
      x: 100,
      y: 300,
      width: 200,
      height: 50,
      rotation: 0,
      fontSize: 20,
      fontFamily: 'Arial'
    };
    setTextAreas([...textAreas, newArea]);
    setSelectedId(newArea.id);
  };

  const addLogoArea = () => {
    const newArea: LogoArea = {
      id: `logo-${Date.now()}`,
      x: 300,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0
    };
    setLogoArea(newArea);
    setSelectedId(newArea.id);
  };

  const handleAreaDragEnd = (e: any, areaId: string) => {
    const { x, y } = e.target.position();
    
    if (typeof areaId !== 'string') return;
    
    if (areaId.startsWith('design-')) {
      setDesignAreas(
        designAreas.map(area => 
          area.id === areaId ? { ...area, x, y } : area
        )
      );
    } else if (areaId.startsWith('text-')) {
      setTextAreas(
        textAreas.map(area => 
          area.id === areaId ? { ...area, x, y } : area
        )
      );
    } else if (areaId.startsWith('logo-') && logoArea) {
      setLogoArea({ ...logoArea, x, y });
    }
  };

  const handleAreaTransformEnd = (e: any, areaId: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    
    // Reset scale to avoid accumulation
    node.scaleX(1);
    node.scaleY(1);
    
    const width = Math.abs(node.width() * scaleX);
    const height = Math.abs(node.height() * scaleY);
    
    if (typeof areaId !== 'string') return;
    
    if (areaId.startsWith('design-')) {
      setDesignAreas(
        designAreas.map(area => 
          area.id === areaId 
            ? { ...area, width, height, rotation } 
            : area
        )
      );
    } else if (areaId.startsWith('text-')) {
      setTextAreas(
        textAreas.map(area => 
          area.id === areaId 
            ? { ...area, width, height, rotation } 
            : area
        )
      );
    } else if (areaId.startsWith('logo-') && logoArea) {
      setLogoArea({ ...logoArea, width, height, rotation });
    }
  };

  const deleteArea = (areaId: string) => {
    if (typeof areaId !== 'string') return;
    
    if (areaId.startsWith('design-')) {
      setDesignAreas(designAreas.filter(area => area.id !== areaId));
    } else if (areaId.startsWith('text-')) {
      setTextAreas(textAreas.filter(area => area.id !== areaId));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(null);
    }
    
    setSelectedId(null);
  };

  const getSelectedArea = () => {
    if (!selectedId || typeof selectedId !== 'string') return null;
    
    if (selectedId.startsWith('design-')) {
      return designAreas.find(area => area.id === selectedId);
    } else if (selectedId.startsWith('text-')) {
      return textAreas.find(area => area.id === selectedId);
    } else if (selectedId.startsWith('logo-')) {
      return logoArea;
    }
    
    return null;
  };

  const updateSelectedArea = (property: string, value: any) => {
    if (!selectedId || typeof selectedId !== 'string') return;
    
    if (selectedId.startsWith('design-')) {
      setDesignAreas(
        designAreas.map(area => 
          area.id === selectedId ? { ...area, [property]: value } : area
        )
      );
    } else if (selectedId.startsWith('text-')) {
      setTextAreas(
        textAreas.map(area => 
          area.id === selectedId ? { ...area, [property]: value } : area
        )
      );
    } else if (selectedId.startsWith('logo-') && logoArea) {
      setLogoArea({ ...logoArea, [property]: value });
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.product_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

    if (!window.confirm(`Are you sure you want to delete ${selectedTemplates.length} template(s)?`)) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
      
      alert('Templates deleted successfully!');
    } catch (error) {
      console.error('Bulk deletion error:', error);
      alert('Error occurred while deleting templates');
    }
  };

  const getCurrentFolderName = () => {
    if (!currentFolder) return 'All Templates';
    const folder = folders.find(f => f.path === currentFolder);
    return folder ? folder.name : currentFolder;
  };

  const getDesignTypeColor = (type: string) => {
    switch (type) {
      case 'black': return 'bg-black text-white';
      case 'white': return 'bg-white text-black border border-gray-300';
      case 'color': return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
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
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage mockup templates for your products ({templates.length} templates)
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

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Etsy Store:
            </label>
            {stores.length > 0 ? (
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
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                No Etsy stores added yet. 
                <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                  Add a store
                </a>
              </div>
            )}
          </div>
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
        {currentFolder && (
          <>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{getCurrentFolderName()}</span>
          </>
        )}
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
          <Button
            onClick={() => createFolder(prompt('Enter folder name:') || '')}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
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
        {!currentFolder && folders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Folder className="h-5 w-5 mr-2 text-orange-500" />
              Folders ({folders.length})
            </h2>
            
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
                </div>
              ))}
            </div>
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
            <span>Back to All Templates</span>
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
                  onClick={() => setShowCreateModal(true)}
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
                              onClick={() => openEditModal(template)}
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
                          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={template.image_url}
                              alt={template.name}
                              className="w-full h-full object-contain"
                            />
                            
                            {/* Design Type Badge */}
                            <div className="absolute top-2 left-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                                {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                              </span>
                            </div>
                            
                            {/* Areas Count */}
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                              {template.design_areas.length} design areas • {template.text_areas.length} text areas
                              {template.logo_area ? ' • 1 logo area' : ''}
                            </div>
                          </div>

                          {/* Template Info */}
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Category: {template.product_category}</span>
                            <span>Created: {formatDate(template.created_at)}</span>
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={() => openEditModal(template)}
                            className="w-full"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Template
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
                          Design Type
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
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {template.folder_name || 'Default'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                              {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {template.product_category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {template.design_areas.length} design • {template.text_areas.length} text
                            {template.logo_area ? ' • 1 logo' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(template.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditModal(template)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit template"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => duplicateTemplate(template)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Mockup Template
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Template Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name:
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. T-Shirt Front Mockup"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Image:
                    </label>
                    {templateImageUrl ? (
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                        <img
                          src={templateImageUrl}
                          alt="Template Preview"
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={() => {
                            setTemplateImage(null);
                            setTemplateImageUrl('');
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload template image
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          PNG, JPG or JPEG (max. 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Store:
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Category:
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="t-shirt">T-Shirt</option>
                      <option value="sweatshirt">Sweatshirt</option>
                      <option value="hoodie">Hoodie</option>
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
                      Design Type:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="designType"
                          value="black"
                          checked={designType === 'black'}
                          onChange={() => setDesignType('black')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Black Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="designType"
                          value="white"
                          checked={designType === 'white'}
                          onChange={() => setDesignType('white')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">White Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="designType"
                          value="color"
                          checked={designType === 'color'}
                          onChange={() => setDesignType('color')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Color Design</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Folder:
                    </label>
                    <select
                      value={currentFolder}
                      onChange={(e) => setCurrentFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Root Directory</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.path}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Right Column - Canvas Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Design Area Editor
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addDesignArea}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Design</span>
                      </Button>
                      <Button
                        onClick={addTextArea}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Text</span>
                      </Button>
                      <Button
                        onClick={addLogoArea}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                        disabled={logoArea !== null}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Logo</span>
                      </Button>
                    </div>
                  </div>
                  
                  {templateImageUrl ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                        <Stage
                          width={400}
                          height={400}
                          ref={stageRef}
                          onClick={(e) => {
                            // Deselect when clicking on empty area
                            if (e.target === e.target.getStage()) {
                              setSelectedId(null);
                            }
                          }}
                          style={{ 
                            backgroundImage: `url(${templateImageUrl})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <Layer>
                            {/* Design Areas */}
                            {designAreas.map((area) => (
                              <Group
                                key={area.id}
                                id={area.id}
                                x={area.x}
                                y={area.y}
                                width={area.width}
                                height={area.height}
                                rotation={area.rotation}
                                draggable
                                onClick={() => setSelectedId(area.id)}
                                onTap={() => setSelectedId(area.id)}
                                onDragEnd={(e) => handleAreaDragEnd(e, area.id)}
                                onTransformEnd={(e) => handleAreaTransformEnd(e, area.id)}
                              >
                                <Rect
                                  width={area.width}
                                  height={area.height}
                                  fill="rgba(0, 0, 255, 0.2)"
                                  stroke={selectedId === area.id ? "blue" : "rgba(0, 0, 255, 0.5)"}
                                  strokeWidth={2}
                                />
                                <Text
                                  text="Design Area"
                                  fontSize={14}
                                  fill="blue"
                                  width={area.width}
                                  align="center"
                                  y={area.height / 2 - 7}
                                />
                              </Group>
                            ))}
                            
                            {/* Text Areas */}
                            {textAreas.map((area) => (
                              <Group
                                key={area.id}
                                id={area.id}
                                x={area.x}
                                y={area.y}
                                width={area.width}
                                height={area.height}
                                rotation={area.rotation}
                                draggable
                                onClick={() => setSelectedId(area.id)}
                                onTap={() => setSelectedId(area.id)}
                                onDragEnd={(e) => handleAreaDragEnd(e, area.id)}
                                onTransformEnd={(e) => handleAreaTransformEnd(e, area.id)}
                              >
                                <Rect
                                  width={area.width}
                                  height={area.height}
                                  fill="rgba(0, 128, 0, 0.2)"
                                  stroke={selectedId === area.id ? "green" : "rgba(0, 128, 0, 0.5)"}
                                  strokeWidth={2}
                                />
                                <Text
                                  text="Text Area"
                                  fontSize={14}
                                  fill="green"
                                  width={area.width}
                                  align="center"
                                  y={area.height / 2 - 7}
                                />
                              </Group>
                            ))}
                            
                            {/* Logo Area */}
                            {logoArea && (
                              <Group
                                key={logoArea.id}
                                id={logoArea.id}
                                x={logoArea.x}
                                y={logoArea.y}
                                width={logoArea.width}
                                height={logoArea.height}
                                rotation={logoArea.rotation}
                                draggable
                                onClick={() => setSelectedId(logoArea.id)}
                                onTap={() => setSelectedId(logoArea.id)}
                                onDragEnd={(e) => handleAreaDragEnd(e, logoArea.id)}
                                onTransformEnd={(e) => handleAreaTransformEnd(e, logoArea.id)}
                              >
                                <Rect
                                  width={logoArea.width}
                                  height={logoArea.height}
                                  fill="rgba(255, 0, 0, 0.2)"
                                  stroke={selectedId === logoArea.id ? "red" : "rgba(255, 0, 0, 0.5)"}
                                  strokeWidth={2}
                                />
                                <Text
                                  text="Logo Area"
                                  fontSize={14}
                                  fill="red"
                                  width={logoArea.width}
                                  align="center"
                                  y={logoArea.height / 2 - 7}
                                />
                              </Group>
                            )}
                            
                            {/* Transformer - for resizing and rotating */}
                            {selectedId && (
                              <Transformer
                                ref={transformerRef}
                                boundBoxFunc={(oldBox, newBox) => {
                                  // Limit size
                                  if (newBox.width < 10 || newBox.height < 10) {
                                    return oldBox;
                                  }
                                  return newBox;
                                }}
                              />
                            )}
                          </Layer>
                        </Stage>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Upload a template image to start editing
                      </p>
                    </div>
                  )}
                  
                  {/* Selected Area Properties */}
                  {selectedId && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {selectedId.startsWith('design-') ? 'Design Area Properties' : 
                           selectedId.startsWith('text-') ? 'Text Area Properties' : 
                           'Logo Area Properties'}
                        </h4>
                        <Button
                          onClick={() => deleteArea(selectedId)}
                          variant="danger"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Width:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.width || 0}
                            onChange={(e) => updateSelectedArea('width', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Height:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.height || 0}
                            onChange={(e) => updateSelectedArea('height', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            X Position:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.x || 0}
                            onChange={(e) => updateSelectedArea('x', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Y Position:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.y || 0}
                            onChange={(e) => updateSelectedArea('y', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rotation:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.rotation || 0}
                            onChange={(e) => updateSelectedArea('rotation', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        {/* Text Area specific properties */}
                        {selectedId.startsWith('text-') && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Font Size:
                              </label>
                              <Input
                                type="number"
                                value={(getSelectedArea() as TextArea)?.fontSize || 20}
                                onChange={(e) => updateSelectedArea('fontSize', Number(e.target.value))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Font Family:
                              </label>
                              <Input
                                type="text"
                                value={(getSelectedArea() as TextArea)?.fontFamily || 'Arial'}
                                onChange={(e) => updateSelectedArea('fontFamily', e.target.value)}
                                className="w-full"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={createTemplate}
                  className="flex-1"
                  disabled={!templateName.trim() || !templateImageUrl}
                >
                  Create Template
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
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

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Mockup Template
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Template Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Name:
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. T-Shirt Front Mockup"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Image:
                    </label>
                    {templateImageUrl ? (
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-2">
                        <img
                          src={templateImageUrl}
                          alt="Template Preview"
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-full"
                          title="Change image"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload template image
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          PNG, JPG or JPEG (max. 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Store:
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Category:
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="t-shirt">T-Shirt</option>
                      <option value="sweatshirt">Sweatshirt</option>
                      <option value="hoodie">Hoodie</option>
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
                      Design Type:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="designType"
                          value="black"
                          checked={designType === 'black'}
                          onChange={() => setDesignType('black')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Black Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="designType"
                          value="white"
                          checked={designType === 'white'}
                          onChange={() => setDesignType('white')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">White Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="designType"
                          value="color"
                          checked={designType === 'color'}
                          onChange={() => setDesignType('color')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Color Design</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Canvas Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Design Area Editor
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addDesignArea}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Design</span>
                      </Button>
                      <Button
                        onClick={addTextArea}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Text</span>
                      </Button>
                      <Button
                        onClick={addLogoArea}
                        variant="secondary"
                        size="sm"
                        className="flex items-center space-x-1"
                        disabled={logoArea !== null}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Logo</span>
                      </Button>
                    </div>
                  </div>
                  
                  {templateImageUrl ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                        <Stage
                          width={400}
                          height={400}
                          ref={stageRef}
                          onClick={(e) => {
                            // Deselect when clicking on empty area
                            if (e.target === e.target.getStage()) {
                              setSelectedId(null);
                            }
                          }}
                          style={{ 
                            backgroundImage: `url(${templateImageUrl})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <Layer>
                            {/* Design Areas */}
                            {designAreas.map((area) => (
                              <Group
                                key={area.id}
                                id={area.id}
                                x={area.x}
                                y={area.y}
                                width={area.width}
                                height={area.height}
                                rotation={area.rotation}
                                draggable
                                onClick={() => setSelectedId(area.id)}
                                onTap={() => setSelectedId(area.id)}
                                onDragEnd={(e) => handleAreaDragEnd(e, area.id)}
                                onTransformEnd={(e) => handleAreaTransformEnd(e, area.id)}
                              >
                                <Rect
                                  width={area.width}
                                  height={area.height}
                                  fill="rgba(0, 0, 255, 0.2)"
                                  stroke={selectedId === area.id ? "blue" : "rgba(0, 0, 255, 0.5)"}
                                  strokeWidth={2}
                                />
                                <Text
                                  text="Design Area"
                                  fontSize={14}
                                  fill="blue"
                                  width={area.width}
                                  align="center"
                                  y={area.height / 2 - 7}
                                />
                              </Group>
                            ))}
                            
                            {/* Text Areas */}
                            {textAreas.map((area) => (
                              <Group
                                key={area.id}
                                id={area.id}
                                x={area.x}
                                y={area.y}
                                width={area.width}
                                height={area.height}
                                rotation={area.rotation}
                                draggable
                                onClick={() => setSelectedId(area.id)}
                                onTap={() => setSelectedId(area.id)}
                                onDragEnd={(e) => handleAreaDragEnd(e, area.id)}
                                onTransformEnd={(e) => handleAreaTransformEnd(e, area.id)}
                              >
                                <Rect
                                  width={area.width}
                                  height={area.height}
                                  fill="rgba(0, 128, 0, 0.2)"
                                  stroke={selectedId === area.id ? "green" : "rgba(0, 128, 0, 0.5)"}
                                  strokeWidth={2}
                                />
                                <Text
                                  text="Text Area"
                                  fontSize={14}
                                  fill="green"
                                  width={area.width}
                                  align="center"
                                  y={area.height / 2 - 7}
                                />
                              </Group>
                            ))}
                            
                            {/* Logo Area */}
                            {logoArea && (
                              <Group
                                key={logoArea.id}
                                id={logoArea.id}
                                x={logoArea.x}
                                y={logoArea.y}
                                width={logoArea.width}
                                height={logoArea.height}
                                rotation={logoArea.rotation}
                                draggable
                                onClick={() => setSelectedId(logoArea.id)}
                                onTap={() => setSelectedId(logoArea.id)}
                                onDragEnd={(e) => handleAreaDragEnd(e, logoArea.id)}
                                onTransformEnd={(e) => handleAreaTransformEnd(e, logoArea.id)}
                              >
                                <Rect
                                  width={logoArea.width}
                                  height={logoArea.height}
                                  fill="rgba(255, 0, 0, 0.2)"
                                  stroke={selectedId === logoArea.id ? "red" : "rgba(255, 0, 0, 0.5)"}
                                  strokeWidth={2}
                                />
                                <Text
                                  text="Logo Area"
                                  fontSize={14}
                                  fill="red"
                                  width={logoArea.width}
                                  align="center"
                                  y={logoArea.height / 2 - 7}
                                />
                              </Group>
                            )}
                            
                            {/* Transformer - for resizing and rotating */}
                            {selectedId && (
                              <Transformer
                                ref={transformerRef}
                                boundBoxFunc={(oldBox, newBox) => {
                                  // Limit size
                                  if (newBox.width < 10 || newBox.height < 10) {
                                    return oldBox;
                                  }
                                  return newBox;
                                }}
                              />
                            )}
                          </Layer>
                        </Stage>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Upload a template image to start editing
                      </p>
                    </div>
                  )}
                  
                  {/* Selected Area Properties */}
                  {selectedId && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {selectedId.startsWith('design-') ? 'Design Area Properties' : 
                           selectedId.startsWith('text-') ? 'Text Area Properties' : 
                           'Logo Area Properties'}
                        </h4>
                        <Button
                          onClick={() => deleteArea(selectedId)}
                          variant="danger"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Width:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.width || 0}
                            onChange={(e) => updateSelectedArea('width', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Height:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.height || 0}
                            onChange={(e) => updateSelectedArea('height', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            X Position:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.x || 0}
                            onChange={(e) => updateSelectedArea('x', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Y Position:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.y || 0}
                            onChange={(e) => updateSelectedArea('y', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rotation:
                          </label>
                          <Input
                            type="number"
                            value={getSelectedArea()?.rotation || 0}
                            onChange={(e) => updateSelectedArea('rotation', Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        {/* Text Area specific properties */}
                        {selectedId.startsWith('text-') && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Font Size:
                              </label>
                              <Input
                                type="number"
                                value={(getSelectedArea() as TextArea)?.fontSize || 20}
                                onChange={(e) => updateSelectedArea('fontSize', Number(e.target.value))}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Font Family:
                              </label>
                              <Input
                                type="text"
                                value={(getSelectedArea() as TextArea)?.fontFamily || 'Arial'}
                                onChange={(e) => updateSelectedArea('fontFamily', e.target.value)}
                                className="w-full"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={updateTemplate}
                  className="flex-1"
                  disabled={!templateName.trim() || !templateImageUrl}
                >
                  Update Template
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowEditModal(false);
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