import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, Square, Type, Image as ImageIcon, X, Check, RefreshCw, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
import Konva from 'konva';

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
  folder_path?: string;
  folder_name?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
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

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [designTypeFilter, setDesignTypeFilter] = useState<'all' | 'black' | 'white' | 'color'>('all');
  
  // Template editing states
  const [editMode, setEditMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [designAreas, setDesignAreas] = useState<any[]>([]);
  const [textAreas, setTextAreas] = useState<any[]>([]);
  const [logoArea, setLogoArea] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingMode, setAddingMode] = useState<'design' | 'text' | 'logo' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
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
      // Fallback to mock folders if needed
      const mockFolders: TemplateFolder[] = [
        {
          id: '1',
          name: 'T-Shirts',
          path: 't-shirts',
          template_count: 5,
          black_designs: 3,
          white_designs: 2,
          color_designs: 0,
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Mugs',
          path: 'mugs',
          template_count: 3,
          black_designs: 1,
          white_designs: 1,
          color_designs: 1,
          first_created: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }
      ];
      setFolders(mockFolders);
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
      } else {
        // If no folder is selected, show templates without a folder
        query = query.is('folder_path', null);
      }
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup templates loaded`);
      setTemplates(data || []);
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
      setError('Folder name is required');
      return;
    }

    try {
      setCreatingFolder(true);
      setError(null);
      console.log(`🔄 Creating new folder: ${newFolderName}`);
      
      // Generate a folder path from the name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const { data: existingFolders, error: checkError } = await supabase
        .from('mockup_templates')
        .select('id')
        .eq('user_id', user?.id)
        .eq('folder_path', folderPath)
        .limit(1);
        
      if (checkError) {
        console.error('❌ Error checking for existing folder:', checkError);
        throw checkError;
      }
      
      if (existingFolders && existingFolders.length > 0) {
        setError('A folder with this name already exists');
        return;
      }
      
      // Create a dummy template to establish the folder
      // This is a workaround since we don't have a separate folders table
      const { error: createError } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${newFolderName} Folder`,
          image_url: 'https://via.placeholder.com/400x400?text=Folder',
          design_areas: [],
          text_areas: [],
          design_type: 'black',
          product_category: 'other',
          folder_path: folderPath,
          folder_name: newFolderName,
          is_default: false
        });
        
      if (createError) {
        console.error('❌ Error creating folder:', createError);
        throw createError;
      }
      
      console.log('✅ Folder created successfully');
      
      // Refresh folders and templates
      await loadFolders();
      
      // If we're in a folder, stay there; otherwise, navigate to the new folder
      if (!currentFolder) {
        setCurrentFolder(folderPath);
      }
      
      // Close the modal and reset form
      setShowFolderModal(false);
      setNewFolderName('');
      
    } catch (error: any) {
      console.error('❌ Folder creation error:', error);
      setError(`Failed to create folder: ${error.message}`);
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteFolder = async (folderPath: string) => {
    if (!window.confirm(`Are you sure you want to delete this folder and all templates inside it?`)) {
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
        console.error('❌ Error deleting folder templates:', error);
        throw error;
      }
      
      console.log('✅ Folder deleted successfully');
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folderPath) {
        setCurrentFolder('');
      }
      
      // Refresh folders
      await loadFolders();
      
    } catch (error: any) {
      console.error('❌ Folder deletion error:', error);
      alert(`Failed to delete folder: ${error.message}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        setTemplateImage(img);
        setError(null);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTemplate = () => {
    setEditMode(true);
    setEditingTemplate(null);
    setTemplateName('');
    setDesignType('black');
    setTemplateImage(null);
    setDesignAreas([]);
    setTextAreas([]);
    setLogoArea(null);
    setSelectedId(null);
    setAddingMode(null);
    setShowCreateModal(false);
  };

  const handleEditTemplate = (template: MockupTemplate) => {
    setEditMode(true);
    setEditingTemplate(template);
    setTemplateName(template.name);
    setDesignType(template.design_type);
    
    // Load template image
    const img = new Image();
    img.src = template.image_url;
    img.onload = () => {
      setTemplateImage(img);
    };
    
    setDesignAreas(template.design_areas || []);
    setTextAreas(template.text_areas || []);
    setLogoArea(template.logo_area || null);
    setSelectedId(null);
    setAddingMode(null);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    if (!templateImage) {
      setError('Template image is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      console.log('🔄 Saving template...');
      
      // Convert stage to data URL for preview
      const dataUrl = templateImage.src;
      
      // Prepare template data
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: dataUrl,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        product_category: 'other', // Default value
        folder_path: currentFolder || null,
        folder_name: folders.find(f => f.path === currentFolder)?.name || null,
        is_default: false
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
      
      console.log('✅ Template saved successfully:', result.data);
      
      // Exit edit mode and refresh templates
      setEditMode(false);
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template save error:', error);
      setError(`Failed to save template: ${error.message}`);
    } finally {
      setSaving(false);
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
      
      // Refresh templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template deletion error:', error);
      alert(`Failed to delete template: ${error.message}`);
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log(`🔄 Duplicating template: ${template.id}`);
      
      // Create a copy of the template with a new name
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          ...template,
          id: undefined, // Let Supabase generate a new ID
          name: `${template.name} (Copy)`,
          created_at: undefined, // Let Supabase set the timestamp
          updated_at: undefined
        });
        
      if (error) {
        console.error('❌ Template duplication error:', error);
        throw error;
      }
      
      console.log('✅ Template duplicated successfully');
      
      // Refresh templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template duplication error:', error);
      alert(`Failed to duplicate template: ${error.message}`);
    }
  };

  const handleAddArea = (type: 'design' | 'text' | 'logo') => {
    setAddingMode(type);
    setSelectedId(null);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If we're not in adding mode, just handle selection
    if (!addingMode) {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
        return;
      }
      return;
    }
    
    // Get stage and mouse position
    const stage = e.target.getStage();
    if (!stage) return;
    
    const mousePos = stage.getPointerPosition();
    if (!mousePos) return;
    
    // Create a new area based on the adding mode
    if (addingMode === 'design') {
      const newArea = {
        id: `design-${Date.now()}`,
        x: mousePos.x - 50,
        y: mousePos.y - 50,
        width: 100,
        height: 100,
        rotation: 0
      };
      setDesignAreas([...designAreas, newArea]);
      setSelectedId(newArea.id);
    } else if (addingMode === 'text') {
      const newArea = {
        id: `text-${Date.now()}`,
        x: mousePos.x - 75,
        y: mousePos.y - 25,
        width: 150,
        height: 50,
        rotation: 0,
        fontSize: 16,
        fontFamily: 'Arial'
      };
      setTextAreas([...textAreas, newArea]);
      setSelectedId(newArea.id);
    } else if (addingMode === 'logo') {
      const newArea = {
        id: `logo-${Date.now()}`,
        x: mousePos.x - 25,
        y: mousePos.y - 25,
        width: 50,
        height: 50,
        rotation: 0
      };
      setLogoArea(newArea);
      setSelectedId(newArea.id);
    }
    
    // Exit adding mode
    setAddingMode(null);
  };

  const handleAreaClick = (id: string) => {
    setSelectedId(id);
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, id: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale and apply to width/height instead
    node.scaleX(1);
    node.scaleY(1);
    
    const updatedProps = {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation()
    };
    
    // Update the appropriate area
    if (id.startsWith('design-')) {
      setDesignAreas(
        designAreas.map(area => (area.id === id ? { ...area, ...updatedProps } : area))
      );
    } else if (id.startsWith('text-')) {
      setTextAreas(
        textAreas.map(area => (area.id === id ? { ...area, ...updatedProps } : area))
      );
    } else if (id.startsWith('logo-')) {
      setLogoArea({ ...logoArea, ...updatedProps });
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const updatedProps = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    // Update the appropriate area
    if (id.startsWith('design-')) {
      setDesignAreas(
        designAreas.map(area => (area.id === id ? { ...area, ...updatedProps } : area))
      );
    } else if (id.startsWith('text-')) {
      setTextAreas(
        textAreas.map(area => (area.id === id ? { ...area, ...updatedProps } : area))
      );
    } else if (id.startsWith('logo-')) {
      setLogoArea({ ...logoArea, ...updatedProps });
    }
  };

  const deleteArea = (id: string) => {
    if (id.startsWith('design-')) {
      setDesignAreas(designAreas.filter(area => area.id !== id));
    } else if (id.startsWith('text-')) {
      setTextAreas(textAreas.filter(area => area.id !== id));
    } else if (id.startsWith('logo-')) {
      setLogoArea(null);
    }
    setSelectedId(null);
  };

  const getSelectedArea = () => {
    if (!selectedId) return null;
    
    if (selectedId.startsWith('design-')) {
      return designAreas.find(area => area.id === selectedId);
    } else if (selectedId.startsWith('text-')) {
      return textAreas.find(area => area.id === selectedId);
    } else if (selectedId.startsWith('logo-')) {
      return logoArea;
    }
    
    return null;
  };

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

  const getBreadcrumbs = () => {
    if (!currentFolder) return [];
    
    const folder = folders.find(f => f.path === currentFolder);
    if (!folder) return [];
    
    return [folder];
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

  if (editMode) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Image className="h-6 w-6 mr-2 text-orange-500" />
              {editingTemplate ? 'Edit Mockup Template' : 'Create Mockup Template'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentFolder ? `Folder: ${folders.find(f => f.path === currentFolder)?.name || currentFolder}` : 'Root folder'}
            </p>
          </div>
          <Button
            onClick={() => setEditMode(false)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Templates</span>
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-red-500">⚠️</div>
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Template Settings */}
          <div className="space-y-6">
            {/* Template Info */}
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
                    placeholder="e.g. T-Shirt Mockup"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Design Type:
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setDesignType('black')}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        designType === 'black'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="bg-black h-8 w-full rounded"></div>
                      <p className="text-center mt-2 text-sm">Black</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignType('white')}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        designType === 'white'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="bg-white h-8 w-full rounded border border-gray-300"></div>
                      <p className="text-center mt-2 text-sm">White</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignType('color')}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        designType === 'color'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-8 w-full rounded"></div>
                      <p className="text-center mt-2 text-sm">Color</p>
                    </button>
                  </div>
                </div>
                
                {!templateImage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Image:
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 dark:hover:border-orange-400"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Click to upload mockup image
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        PNG, JPG or JPEG (max. 5MB)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Add Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleAddArea('design')}
                  variant={addingMode === 'design' ? 'primary' : 'secondary'}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Add Design Area</span>
                </Button>
                <Button
                  onClick={() => handleAddArea('text')}
                  variant={addingMode === 'text' ? 'primary' : 'secondary'}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Type className="h-4 w-4" />
                  <span>Add Text Area</span>
                </Button>
                <Button
                  onClick={() => handleAddArea('logo')}
                  variant={addingMode === 'logo' ? 'primary' : 'secondary'}
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={logoArea !== null}
                >
                  <ImageIcon className="h-4 w-4" />
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
                    onClick={() => deleteArea(selectedId)}
                    variant="danger"
                    size="sm"
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedId.startsWith('text-') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Font Size:
                      </label>
                      <Input
                        type="number"
                        value={getSelectedArea()?.fontSize || 16}
                        onChange={(e) => {
                          const fontSize = parseInt(e.target.value);
                          setTextAreas(
                            textAreas.map(area => 
                              area.id === selectedId 
                                ? { ...area, fontSize } 
                                : area
                            )
                          );
                        }}
                        min={8}
                        max={72}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Width:
                      </label>
                      <Input
                        type="number"
                        value={Math.round(getSelectedArea()?.width || 0)}
                        onChange={(e) => {
                          const width = parseInt(e.target.value);
                          if (selectedId.startsWith('design-')) {
                            setDesignAreas(
                              designAreas.map(area => 
                                area.id === selectedId 
                                  ? { ...area, width } 
                                  : area
                              )
                            );
                          } else if (selectedId.startsWith('text-')) {
                            setTextAreas(
                              textAreas.map(area => 
                                area.id === selectedId 
                                  ? { ...area, width } 
                                  : area
                              )
                            );
                          } else if (selectedId.startsWith('logo-')) {
                            setLogoArea({ ...logoArea, width });
                          }
                        }}
                        min={5}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Height:
                      </label>
                      <Input
                        type="number"
                        value={Math.round(getSelectedArea()?.height || 0)}
                        onChange={(e) => {
                          const height = parseInt(e.target.value);
                          if (selectedId.startsWith('design-')) {
                            setDesignAreas(
                              designAreas.map(area => 
                                area.id === selectedId 
                                  ? { ...area, height } 
                                  : area
                              )
                            );
                          } else if (selectedId.startsWith('text-')) {
                            setTextAreas(
                              textAreas.map(area => 
                                area.id === selectedId 
                                  ? { ...area, height } 
                                  : area
                              )
                            );
                          } else if (selectedId.startsWith('logo-')) {
                            setLogoArea({ ...logoArea, height });
                          }
                        }}
                        min={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rotation:
                    </label>
                    <Input
                      type="number"
                      value={Math.round(getSelectedArea()?.rotation || 0)}
                      onChange={(e) => {
                        const rotation = parseInt(e.target.value);
                        if (selectedId.startsWith('design-')) {
                          setDesignAreas(
                            designAreas.map(area => 
                              area.id === selectedId 
                                ? { ...area, rotation } 
                                : area
                            )
                          );
                        } else if (selectedId.startsWith('text-')) {
                          setTextAreas(
                            textAreas.map(area => 
                              area.id === selectedId 
                                ? { ...area, rotation } 
                                : area
                            )
                          );
                        } else if (selectedId.startsWith('logo-')) {
                          setLogoArea({ ...logoArea, rotation });
                        }
                      }}
                      min={-180}
                      max={180}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex space-x-3">
              <Button
                onClick={handleSaveTemplate}
                className="flex-1"
                disabled={!templateName || !templateImage || saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setEditMode(false)}
                variant="secondary"
                className="flex-1"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                <span>Cancel</span>
              </Button>
            </div>
          </div>

          {/* Right Column - Canvas */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-6">
                {templateImage ? (
                  <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="w-full" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <Stage
                        width={templateImage.width}
                        height={templateImage.height}
                        ref={stageRef}
                        onClick={handleStageClick}
                        onTap={handleStageClick}
                      >
                        <Layer>
                          {/* Background Image */}
                          <KonvaImage
                            image={templateImage}
                            width={templateImage.width}
                            height={templateImage.height}
                          />
                          
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
                              onClick={() => handleAreaClick(area.id)}
                              onTap={() => handleAreaClick(area.id)}
                              onDragEnd={(e) => handleDragEnd(e, area.id)}
                              onTransformEnd={(e) => handleTransformEnd(e, area.id)}
                            >
                              <Rect
                                width={area.width}
                                height={area.height}
                                fill="rgba(0, 0, 255, 0.2)"
                                stroke={selectedId === area.id ? "#FF6B00" : "blue"}
                                strokeWidth={2}
                                cornerRadius={4}
                              />
                              <Text
                                text="Design"
                                fontSize={14}
                                fill="white"
                                width={area.width}
                                height={area.height}
                                align="center"
                                verticalAlign="middle"
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
                              onClick={() => handleAreaClick(area.id)}
                              onTap={() => handleAreaClick(area.id)}
                              onDragEnd={(e) => handleDragEnd(e, area.id)}
                              onTransformEnd={(e) => handleTransformEnd(e, area.id)}
                            >
                              <Rect
                                width={area.width}
                                height={area.height}
                                fill="rgba(0, 255, 0, 0.2)"
                                stroke={selectedId === area.id ? "#FF6B00" : "green"}
                                strokeWidth={2}
                                cornerRadius={4}
                              />
                              <Text
                                text="Text"
                                fontSize={14}
                                fill="white"
                                width={area.width}
                                height={area.height}
                                align="center"
                                verticalAlign="middle"
                              />
                            </Group>
                          ))}
                          
                          {/* Logo Area */}
                          {logoArea && (
                            <Group
                              id={logoArea.id}
                              x={logoArea.x}
                              y={logoArea.y}
                              width={logoArea.width}
                              height={logoArea.height}
                              rotation={logoArea.rotation}
                              draggable
                              onClick={() => handleAreaClick(logoArea.id)}
                              onTap={() => handleAreaClick(logoArea.id)}
                              onDragEnd={(e) => handleDragEnd(e, logoArea.id)}
                              onTransformEnd={(e) => handleTransformEnd(e, logoArea.id)}
                            >
                              <Rect
                                width={logoArea.width}
                                height={logoArea.height}
                                fill="rgba(255, 0, 0, 0.2)"
                                stroke={selectedId === logoArea.id ? "#FF6B00" : "red"}
                                strokeWidth={2}
                                cornerRadius={4}
                              />
                              <Text
                                text="Logo"
                                fontSize={14}
                                fill="white"
                                width={logoArea.width}
                                height={logoArea.height}
                                align="center"
                                verticalAlign="middle"
                              />
                            </Group>
                          )}
                          
                          {/* Transformer */}
                          {selectedId && (
                            <Transformer
                              ref={transformerRef}
                              boundBoxFunc={(oldBox, newBox) => {
                                // Limit minimum size
                                if (newBox.width < 5 || newBox.height < 5) {
                                  return oldBox;
                                }
                                return newBox;
                              }}
                            />
                          )}
                        </Layer>
                      </Stage>
                    </div>
                    
                    {/* Instructions */}
                    {addingMode && (
                      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 text-center">
                        Click on the image to add a {addingMode} area
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Please upload a template image
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
            {currentFolder 
              ? `Folder: ${folders.find(f => f.path === currentFolder)?.name || currentFolder}` 
              : 'All templates'}
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
            onClick={handleCreateTemplate}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      {(currentFolder || getBreadcrumbs().length > 0) && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setCurrentFolder('')}
            className="hover:text-orange-500 flex items-center space-x-1"
          >
            <Folder className="h-4 w-4" />
            <span>Root</span>
          </button>
          
          {getBreadcrumbs().map((folder, index) => (
            <React.Fragment key={folder.path}>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 dark:text-white font-medium">{folder.name}</span>
            </React.Fragment>
          ))}
        </div>
      )}

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
            onChange={(e) => setDesignTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="color">Color</option>
          </select>
          
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

      {/* Folders Grid (only shown at root level) */}
      {!currentFolder && folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-orange-500" />
            Folders
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
                  <div className="flex justify-center space-x-2 mt-2">
                    <span className="px-2 py-1 bg-gray-900 text-white text-xs rounded-full">
                      {folder.black_designs}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-900 border border-gray-300 text-xs rounded-full">
                      {folder.white_designs}
                    </span>
                    <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full">
                      {folder.color_designs}
                    </span>
                  </div>
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
          Templates
        </h2>
        
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm 
                ? 'No templates found' 
                : currentFolder 
                  ? 'No templates in this folder' 
                  : 'No templates yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Start by creating your first template'}
            </p>
            {!searchTerm && (
              <Button
                onClick={handleCreateTemplate}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTemplate(template)}
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
                          template.design_type === 'black' 
                            ? 'bg-gray-900 text-white' 
                            : template.design_type === 'white'
                            ? 'bg-gray-100 text-gray-900 border border-gray-300'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        }`}>
                          {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                        </span>
                      </div>
                      <span>{formatDate(template.created_at)}</span>
                    </div>
                    
                    {/* Area Counts */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{template.design_areas?.length || 0} design areas</span>
                      <span>{template.text_areas?.length || 0} text areas</span>
                      <span>{template.logo_area ? '1' : '0'} logo area</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folder Name:
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. T-Shirts, Mugs, Posters"
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={createFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim() || creatingFolder}
                >
                  {creatingFolder ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      <span>Create Folder</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName('');
                    setError(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={creatingFolder}
                >
                  <X className="h-4 w-4 mr-2" />
                  <span>Cancel</span>
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