import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, Upload, Move, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, X, Square, Type, CheckSquare, Circle } from 'lucide-react';
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
  store_id?: string;
  folder_path?: string;
  folder_name?: string;
}

interface TemplateFolder {
  id: string;
  name: string;
  path: string;
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  
  // Template editor states
  const [templateName, setTemplateName] = useState('');
  const [templateImage, setTemplateImage] = useState<File | null>(null);
  const [templateImageUrl, setTemplateImageUrl] = useState('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [designAreas, setDesignAreas] = useState<any[]>([]);
  const [textAreas, setTextAreas] = useState<any[]>([]);
  const [logoArea, setLogoArea] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [areaType, setAreaType] = useState<'design' | 'text' | 'logo'>('design');
  
  const canvasRef = useRef<HTMLDivElement>(null);
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
      setFolders(data || []);
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
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
        
      // Filter by folder if a folder is selected
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
      const { data: existingFolder, error: checkError } = await supabase
        .from('mockup_templates')
        .select('id')
        .eq('user_id', user?.id)
        .eq('folder_path', folderPath)
        .limit(1);
        
      if (checkError) {
        console.error('❌ Folder check error:', checkError);
        throw checkError;
      }
      
      if (existingFolder && existingFolder.length > 0) {
        alert('A folder with this name already exists!');
        return;
      }
      
      // Create a sample template in the new folder to make it visible
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: 'Sample Template',
          image_url: 'https://images.pexels.com/photos/1566412/pexels-photo-1566412.jpeg?auto=compress&cs=tinysrgb&w=400',
          design_areas: [],
          text_areas: [],
          is_default: false,
          design_type: 'black',
          product_category: 't-shirt',
          folder_path: folderPath,
          folder_name: newFolderName
        });

      if (error) {
        console.error('❌ Folder creation error:', error);
        throw error;
      }

      console.log('✅ Folder created successfully');
      setNewFolderName('');
      setShowFolderModal(false);
      
      // Reload folders and templates
      await loadFolders();
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
      await loadTemplates();
      
    } catch (error) {
      console.error('❌ Folder creation general error:', error);
      alert('Error occurred while creating folder.');
    }
  };

  const deleteFolder = async (folderPath: string) => {
    if (!window.confirm('Are you sure you want to delete this folder and all templates inside it?')) {
      return;
    }

    try {
      console.log(`🔄 Deleting folder: ${folderPath}`);
      
      // Delete all templates in the folder
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('user_id', user?.id)
        .eq('folder_path', folderPath);

      if (error) {
        console.error('❌ Folder deletion error:', error);
        throw error;
      }

      console.log('✅ Folder deleted successfully');
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folderPath) {
        setCurrentFolder('');
      }
      
      // Reload folders and templates
      await loadFolders();
      await loadTemplates();
      
    } catch (error) {
      console.error('❌ Folder deletion general error:', error);
      alert('Error occurred while deleting folder.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    setTemplateImage(file);
    setTemplateImageUrl(URL.createObjectURL(file));
  };

  const resetEditor = () => {
    setTemplateName('');
    setTemplateImage(null);
    setTemplateImageUrl('');
    setDesignType('black');
    setDesignAreas([]);
    setTextAreas([]);
    setLogoArea(null);
    setSelectedId(null);
    setEditingTemplate(null);
  };

  const openEditor = (template?: MockupTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateImageUrl(template.image_url);
      setDesignType(template.design_type);
      setDesignAreas(template.design_areas || []);
      setTextAreas(template.text_areas || []);
      setLogoArea(template.logo_area || null);
    } else {
      resetEditor();
    }
    
    setShowEditor(true);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required!');
      return;
    }
    
    if (!templateImageUrl && !templateImage) {
      alert('Template image is required!');
      return;
    }
    
    try {
      console.log('🔄 Saving template...');
      
      let imageUrl = templateImageUrl;
      
      // If a new image was uploaded, save it to Supabase Storage
      if (templateImage) {
        // In a real implementation, this would upload to Supabase Storage
        // For now, we'll just use the object URL
        imageUrl = URL.createObjectURL(templateImage);
      }
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: imageUrl,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        is_default: false,
        design_type: designType,
        product_category: 't-shirt', // Default value
        store_id: selectedStore || null,
        folder_path: currentFolder || 'default',
        folder_name: currentFolder ? folders.find(f => f.path === currentFolder)?.name || 'Default' : 'Default'
      };
      
      let result;
      
      if (editingTemplate) {
        // Update existing template
        result = await supabase
          .from('mockup_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        // Create new template
        result = await supabase
          .from('mockup_templates')
          .insert(templateData)
          .select()
          .single();
      }
      
      if (result.error) {
        console.error('❌ Template save error:', result.error);
        throw result.error;
      }
      
      console.log('✅ Template saved successfully');
      
      // Reset editor and reload templates
      resetEditor();
      setShowEditor(false);
      await loadTemplates();
      
    } catch (error) {
      console.error('❌ Template save general error:', error);
      alert('Error occurred while saving template.');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      console.log(`🔄 Deleting template: ${templateId}`);
      
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
      
      // Remove from selected templates if it was selected
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      // Reload templates
      await loadTemplates();
      
    } catch (error) {
      console.error('❌ Template deletion general error:', error);
      alert('Error occurred while deleting template.');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log(`🔄 Duplicating template: ${template.id}`);
      
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          ...template,
          id: undefined, // Let Supabase generate a new ID
          name: `${template.name} (Copy)`,
          is_default: false,
          created_at: undefined, // Let Supabase set the timestamp
          updated_at: undefined
        });

      if (error) {
        console.error('❌ Template duplication error:', error);
        throw error;
      }

      console.log('✅ Template duplicated successfully');
      
      // Reload templates
      await loadTemplates();
      
    } catch (error) {
      console.error('❌ Template duplication general error:', error);
      alert('Error occurred while duplicating template.');
    }
  };

  const handleAddDesignArea = () => {
    setAreaType('design');
    setIsDrawing(false);
  };

  const handleAddTextArea = () => {
    setAreaType('text');
    setIsDrawing(false);
  };

  const handleAddLogoArea = () => {
    setAreaType('logo');
    setIsDrawing(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    // Get canvas bounds
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    // Get canvas bounds
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate width and height
    const width = x - startPoint.x;
    const height = y - startPoint.y;
    
    // Update the currently drawing area
    const newArea = {
      id: Date.now().toString(),
      x: startPoint.x,
      y: startPoint.y,
      width: Math.abs(width),
      height: Math.abs(height),
      // If width or height is negative, adjust the position
      ...(width < 0 && { x: x }),
      ...(height < 0 && { y: y })
    };
    
    // Update the appropriate area type
    if (areaType === 'design') {
      setDesignAreas([...designAreas.filter(a => a.id !== 'temp'), { ...newArea, id: 'temp' }]);
    } else if (areaType === 'text') {
      setTextAreas([...textAreas.filter(a => a.id !== 'temp'), { ...newArea, id: 'temp' }]);
    } else if (areaType === 'logo') {
      setLogoArea({ ...newArea, id: 'temp' });
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    
    // Finalize the area
    if (areaType === 'design') {
      const tempArea = designAreas.find(a => a.id === 'temp');
      if (tempArea) {
        const newArea = { ...tempArea, id: Date.now().toString() };
        setDesignAreas([...designAreas.filter(a => a.id !== 'temp'), newArea]);
        setSelectedId(newArea.id);
      }
    } else if (areaType === 'text') {
      const tempArea = textAreas.find(a => a.id === 'temp');
      if (tempArea) {
        const newArea = { ...tempArea, id: Date.now().toString() };
        setTextAreas([...textAreas.filter(a => a.id !== 'temp'), newArea]);
        setSelectedId(newArea.id);
      }
    } else if (areaType === 'logo') {
      if (logoArea && logoArea.id === 'temp') {
        const newArea = { ...logoArea, id: Date.now().toString() };
        setLogoArea(newArea);
        setSelectedId(newArea.id);
      }
    }
    
    setIsDrawing(false);
  };

  const handleAreaClick = (id: string, type: 'design' | 'text' | 'logo') => {
    setSelectedId(id);
    setAreaType(type);
  };

  const deleteArea = () => {
    if (!selectedId) return;
    
    if (selectedId === 'temp') {
      // Clear temp area
      if (areaType === 'design') {
        setDesignAreas(designAreas.filter(a => a.id !== 'temp'));
      } else if (areaType === 'text') {
        setTextAreas(textAreas.filter(a => a.id !== 'temp'));
      } else if (areaType === 'logo') {
        setLogoArea(null);
      }
    } else {
      // Delete selected area
      if (areaType === 'design') {
        setDesignAreas(designAreas.filter(a => a.id !== selectedId));
      } else if (areaType === 'text') {
        setTextAreas(textAreas.filter(a => a.id !== selectedId));
      } else if (areaType === 'logo') {
        setLogoArea(null);
      }
    }
    
    setSelectedId(null);
  };

  const getSelectedArea = () => {
    if (!selectedId) return null;
    
    if (areaType === 'design') {
      return designAreas.find(a => a.id === selectedId);
    } else if (areaType === 'text') {
      return textAreas.find(a => a.id === selectedId);
    } else if (areaType === 'logo') {
      return logoArea && logoArea.id === selectedId ? logoArea : null;
    }
    
    return null;
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Template Editor View
  if (showEditor) {
    return (
      <div className="p-6 space-y-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit? Any unsaved changes will be lost.')) {
                  setShowEditor(false);
                  resetEditor();
                }
              }}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={saveTemplate}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={!templateName || (!templateImageUrl && !templateImage)}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Template Settings */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name:
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. T-Shirt Mockup Front View"
                    className="w-full"
                  />
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
                    <option value="">No store (global template)</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name}
                      </option>
                    ))}
                  </select>
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
                    <option value="default">Default</option>
                    {folders.map((folder) => (
                      <option key={folder.path} value={folder.path}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Design Type:
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setDesignType('black')}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                        designType === 'black'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>Black</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignType('white')}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                        designType === 'white'
                          ? 'bg-gray-100 text-gray-900 border-2 border-gray-900'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>White</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignType('color')}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                        designType === 'color'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>Color</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Image:
                  </label>
                  {templateImageUrl ? (
                    <div className="relative">
                      <img
                        src={templateImageUrl}
                        alt="Template Preview"
                        className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        onClick={() => {
                          setTemplateImageUrl('');
                          setTemplateImage(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 dark:hover:border-orange-500"
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Add Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Add Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleAddDesignArea}
                  variant="secondary"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Add Design Area</span>
                </Button>
                <Button
                  onClick={handleAddTextArea}
                  variant="secondary"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Type className="h-4 w-4" />
                  <span>Add Text Area</span>
                </Button>
                <Button
                  onClick={handleAddLogoArea}
                  variant="secondary"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Circle className="h-4 w-4" />
                  <span>Add Logo Area</span>
                </Button>
              </CardContent>
            </Card>
            
            {/* Selected Area Properties */}
            {selectedId && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Area Properties</CardTitle>
                  <Button
                    onClick={deleteArea}
                    variant="danger"
                    size="sm"
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        X Position:
                      </label>
                      <Input
                        type="number"
                        value={getSelectedArea()?.x || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (areaType === 'design') {
                            setDesignAreas(designAreas.map(a => a.id === selectedId ? { ...a, x: value } : a));
                          } else if (areaType === 'text') {
                            setTextAreas(textAreas.map(a => a.id === selectedId ? { ...a, x: value } : a));
                          } else if (areaType === 'logo' && logoArea) {
                            setLogoArea({ ...logoArea, x: value });
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Y Position:
                      </label>
                      <Input
                        type="number"
                        value={getSelectedArea()?.y || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (areaType === 'design') {
                            setDesignAreas(designAreas.map(a => a.id === selectedId ? { ...a, y: value } : a));
                          } else if (areaType === 'text') {
                            setTextAreas(textAreas.map(a => a.id === selectedId ? { ...a, y: value } : a));
                          } else if (areaType === 'logo' && logoArea) {
                            setLogoArea({ ...logoArea, y: value });
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Width:
                      </label>
                      <Input
                        type="number"
                        value={getSelectedArea()?.width || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (areaType === 'design') {
                            setDesignAreas(designAreas.map(a => a.id === selectedId ? { ...a, width: value } : a));
                          } else if (areaType === 'text') {
                            setTextAreas(textAreas.map(a => a.id === selectedId ? { ...a, width: value } : a));
                          } else if (areaType === 'logo' && logoArea) {
                            setLogoArea({ ...logoArea, width: value });
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Height:
                      </label>
                      <Input
                        type="number"
                        value={getSelectedArea()?.height || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (areaType === 'design') {
                            setDesignAreas(designAreas.map(a => a.id === selectedId ? { ...a, height: value } : a));
                          } else if (areaType === 'text') {
                            setTextAreas(textAreas.map(a => a.id === selectedId ? { ...a, height: value } : a));
                          } else if (areaType === 'logo' && logoArea) {
                            setLogoArea({ ...logoArea, height: value });
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Area Type:
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                      {areaType === 'design' ? 'Design Area' : areaType === 'text' ? 'Text Area' : 'Logo Area'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Middle Column - Canvas */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Template Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                {templateImageUrl ? (
                  <div 
                    ref={canvasRef}
                    className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                    style={{ 
                      backgroundImage: `url(${templateImageUrl})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      height: '500px'
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  >
                    {/* Design Areas */}
                    {designAreas.map((area) => (
                      <div
                        key={area.id}
                        className={`absolute border-2 ${
                          selectedId === area.id
                            ? 'border-orange-500'
                            : 'border-blue-500'
                        } bg-blue-500 bg-opacity-20`}
                        style={{
                          left: `${area.x}px`,
                          top: `${area.y}px`,
                          width: `${area.width}px`,
                          height: `${area.height}px`,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAreaClick(area.id, 'design');
                        }}
                      >
                        {selectedId === area.id && (
                          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Design Area
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Text Areas */}
                    {textAreas.map((area) => (
                      <div
                        key={area.id}
                        className={`absolute border-2 ${
                          selectedId === area.id
                            ? 'border-orange-500'
                            : 'border-green-500'
                        } bg-green-500 bg-opacity-20`}
                        style={{
                          left: `${area.x}px`,
                          top: `${area.y}px`,
                          width: `${area.width}px`,
                          height: `${area.height}px`,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAreaClick(area.id, 'text');
                        }}
                      >
                        {selectedId === area.id && (
                          <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Text Area
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Logo Area */}
                    {logoArea && (
                      <div
                        className={`absolute border-2 ${
                          selectedId === logoArea.id
                            ? 'border-orange-500'
                            : 'border-purple-500'
                        } bg-purple-500 bg-opacity-20`}
                        style={{
                          left: `${logoArea.x}px`,
                          top: `${logoArea.y}px`,
                          width: `${logoArea.width}px`,
                          height: `${logoArea.height}px`,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAreaClick(logoArea.id, 'logo');
                        }}
                      >
                        {selectedId === logoArea.id && (
                          <div className="absolute -top-6 left-0 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                            Logo Area
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      Please upload a template image
                    </p>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <p>Click and drag on the image to create areas. Select an area to edit its properties.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main View (Folders and Templates)
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
            {currentFolder ? getCurrentFolderName() : 'All Templates'} ({templates.length} templates)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowFolderModal(true)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </Button>
          <Button
            onClick={() => openEditor()}
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

      {/* Folders Section - Show when in root directory */}
      {!currentFolder && folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-orange-500" />
            Folders ({folders.length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {folders.map((folder) => (
              <div
                key={folder.path}
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
                      deleteFolder(folder.path);
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
        </div>
      )}

      {/* Templates Display */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Image className="h-5 w-5 mr-2 text-orange-500" />
          {currentFolder ? getCurrentFolderName() : 'All Templates'} ({filteredTemplates.length} templates)
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
                onClick={() => openEditor()}
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
                          />
                          <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openEditor(template)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edit template"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
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
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        
                        {/* Template Info */}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.design_type === 'black' ? 'bg-gray-900 text-white' :
                              template.design_type === 'white' ? 'bg-gray-100 text-gray-900 border border-gray-300' :
                              'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            }`}>
                              {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                            </span>
                          </div>
                          <span>
                            {formatDate(template.created_at)}
                          </span>
                        </div>
                        
                        {/* Areas Count */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {template.design_areas?.length || 0} design areas
                          </span>
                          <span>
                            {template.text_areas?.length || 0} text areas
                          </span>
                          <span>
                            {template.logo_area ? '1 logo area' : 'No logo area'}
                          </span>
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
                        Design Type
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
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {template.folder_name || 'Default'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.design_type === 'black' ? 'bg-gray-900 text-white' :
                            template.design_type === 'white' ? 'bg-gray-100 text-gray-900 border border-gray-300' :
                            'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          }`}>
                            {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-xs">
                              {template.design_areas?.length || 0} design
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-xs">
                              {template.text_areas?.length || 0} text
                            </span>
                            {template.logo_area && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 rounded-full text-xs">
                                1 logo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(template.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditor(template)}
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

      {/* Create Folder Modal */}
      {showFolderModal && (
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
                    setShowFolderModal(false);
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