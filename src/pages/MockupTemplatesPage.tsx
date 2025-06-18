import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Group } from 'react-konva';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Image, Plus, Trash2, Save, Download, Eye, EyeOff, Square, Type, Circle, FolderPlus, Folder, Edit, ArrowLeft, ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: DesignArea[];
  text_areas: TextArea[];
  logo_area?: LogoArea;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  design_type: 'black' | 'white' | 'color';
  product_category: string;
  store_id?: string;
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
  font_size?: number;
  font_family?: string;
}

interface LogoArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface FolderType {
  id: string;
  name: string;
  path: string;
  template_count: number;
  black_designs?: number;
  white_designs?: number;
  color_designs?: number;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState<MockupTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAreas, setShowAreas] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'templates' | 'editor'>('folders');
  
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedFolder) {
      loadTemplates();
    }
  }, [selectedFolder]);
  
  const loadFolders = async () => {
    try {
      console.log('🔄 Loading mockup template folders...');
      
      // In a real implementation, this would fetch from the database
      // For now, we'll use a view or query to get folder information
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('folder_name', { ascending: true });
      
      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }
      
      // If no folders exist, create a default folder
      if (!data || data.length === 0) {
        const defaultFolders: FolderType[] = [
          { id: 'default', name: 'Default Templates', path: 'default', template_count: 0 },
          { id: 'tshirts', name: 'T-Shirts', path: 'tshirts', template_count: 0 },
          { id: 'mugs', name: 'Mugs', path: 'mugs', template_count: 0 }
        ];
        setFolders(defaultFolders);
        setSelectedFolder('default');
      } else {
        console.log(`✅ ${data.length} mockup template folders loaded`);
        
        const mappedFolders: FolderType[] = data.map(folder => ({
          id: folder.folder_path,
          name: folder.folder_name,
          path: folder.folder_path,
          template_count: folder.template_count,
          black_designs: folder.black_designs,
          white_designs: folder.white_designs,
          color_designs: folder.color_designs
        }));
        
        setFolders(mappedFolders);
        
        // Select the first folder if none is selected
        if (!selectedFolder && mappedFolders.length > 0) {
          setSelectedFolder(mappedFolders[0].path);
        }
      }
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
      
      // Filter by folder if one is selected
      if (selectedFolder) {
        query = query.eq('folder_path', selectedFolder);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} mockup templates loaded`);
      
      // Parse the stored JSON data
      const parsedTemplates = data?.map(template => {
        return {
          ...template,
          design_areas: template.design_areas || [],
          text_areas: template.text_areas || [],
          logo_area: template.logo_area || null,
          design_type: template.design_type || 'black',
          product_category: template.product_category || 't-shirt',
          folder_path: template.folder_path || 'default',
          folder_name: template.folder_name || 'Default Templates'
        };
      }) || [];
      
      setTemplates(parsedTemplates);
      
      // If there are templates, select the first one
      if (parsedTemplates.length > 0 && viewMode === 'editor') {
        selectTemplate(parsedTemplates[0]);
      }
    } catch (error) {
      console.error('❌ Template loading general error:', error);
      setError('Failed to load templates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const selectTemplate = (template: MockupTemplate) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setImageUrl(template.image_url);
    setDesignType(template.design_type || 'black');
    setSelectedFolder(template.folder_path || 'default');
    setSelectedId(null);
    setViewMode('editor');
    
    // Load the image
    const img = new window.Image();
    img.src = template.image_url;
    img.onload = () => {
      setImage(img);
      
      // Set stage size based on image dimensions
      const maxWidth = 800;
      const maxHeight = 600;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = height * ratio;
        width = width * ratio;
      }
      
      setStageSize({ width, height });
    };
  };
  
  const createNewTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setImageUrl('');
    setDesignType('black');
    setSelectedId(null);
    setImage(null);
    setViewMode('editor');
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    
    // Create object URL for the image
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    // Load the image
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage(img);
      
      // Set stage size based on image dimensions
      const maxWidth = 800;
      const maxHeight = 600;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = height * ratio;
        width = width * ratio;
      }
      
      setStageSize({ width, height });
    };
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const addDesignArea = () => {
    if (!currentTemplate && !image) {
      setError('Please upload an image first.');
      return;
    }
    
    const newArea: DesignArea = {
      id: `design-${Date.now()}`,
      x: stageSize.width / 2 - 50,
      y: stageSize.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0
    };
    
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        design_areas: [...currentTemplate.design_areas, newArea]
      });
    }
    
    setSelectedId(newArea.id);
  };
  
  const addTextArea = () => {
    if (!currentTemplate && !image) {
      setError('Please upload an image first.');
      return;
    }
    
    const newArea: TextArea = {
      id: `text-${Date.now()}`,
      x: stageSize.width / 2 - 75,
      y: stageSize.height / 2 - 25,
      width: 150,
      height: 50,
      rotation: 0,
      font_size: 16,
      font_family: 'Arial'
    };
    
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        text_areas: [...currentTemplate.text_areas, newArea]
      });
    }
    
    setSelectedId(newArea.id);
  };
  
  const addLogoArea = () => {
    if (!currentTemplate && !image) {
      setError('Please upload an image first.');
      return;
    }
    
    // Check if logo area already exists
    if (currentTemplate?.logo_area) {
      setError('A logo area already exists. You can only have one logo area per template.');
      return;
    }
    
    const newArea: LogoArea = {
      id: `logo-${Date.now()}`,
      x: stageSize.width / 2 - 40,
      y: stageSize.height / 2 - 40,
      width: 80,
      height: 80,
      rotation: 0
    };
    
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        logo_area: newArea
      });
    }
    
    setSelectedId(newArea.id);
  };
  
  const handleStageClick = (e: any) => {
    // Clicked on stage but not on any shape
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }
  };
  
  const handleAreaClick = (id: string) => {
    setSelectedId(id);
  };
  
  const handleDragEnd = (e: any, id: string) => {
    if (!currentTemplate) return;
    
    const { x, y } = e.target.position();
    
    // Update the appropriate area based on the id
    if (id.startsWith('design-')) {
      const updatedAreas = currentTemplate.design_areas.map(area => 
        area.id === id ? { ...area, x, y } : area
      );
      setCurrentTemplate({ ...currentTemplate, design_areas: updatedAreas });
    } else if (id.startsWith('text-')) {
      const updatedAreas = currentTemplate.text_areas.map(area => 
        area.id === id ? { ...area, x, y } : area
      );
      setCurrentTemplate({ ...currentTemplate, text_areas: updatedAreas });
    } else if (id.startsWith('logo-') && currentTemplate.logo_area) {
      setCurrentTemplate({ 
        ...currentTemplate, 
        logo_area: { ...currentTemplate.logo_area, x, y } 
      });
    }
  };
  
  const handleTransformEnd = (e: any, id: string) => {
    if (!currentTemplate) return;
    
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    
    // Reset scale to avoid accumulation
    node.scaleX(1);
    node.scaleY(1);
    
    const { x, y } = node.position();
    const width = Math.max(5, node.width() * scaleX);
    const height = Math.max(5, node.height() * scaleY);
    
    // Update the appropriate area based on the id
    if (typeof id !== 'string') return;
    
    if (id.startsWith('design-')) {
      const updatedAreas = currentTemplate.design_areas.map(area => 
        area.id === id ? { ...area, x, y, width, height, rotation } : area
      );
      setCurrentTemplate({ ...currentTemplate, design_areas: updatedAreas });
    } else if (id.startsWith('text-')) {
      const updatedAreas = currentTemplate.text_areas.map(area => 
        area.id === id ? { ...area, x, y, width, height, rotation } : area
      );
      setCurrentTemplate({ ...currentTemplate, text_areas: updatedAreas });
    } else if (id.startsWith('logo-') && currentTemplate.logo_area) {
      setCurrentTemplate({ 
        ...currentTemplate, 
        logo_area: { ...currentTemplate.logo_area, x, y, width, height, rotation } 
      });
    }
  };
  
  const deleteSelectedArea = () => {
    if (!currentTemplate || !selectedId) return;
    
    if (typeof selectedId !== 'string') return;
    
    if (selectedId.startsWith('design-')) {
      const updatedAreas = currentTemplate.design_areas.filter(area => area.id !== selectedId);
      setCurrentTemplate({ ...currentTemplate, design_areas: updatedAreas });
    } else if (selectedId.startsWith('text-')) {
      const updatedAreas = currentTemplate.text_areas.filter(area => area.id !== selectedId);
      setCurrentTemplate({ ...currentTemplate, text_areas: updatedAreas });
    } else if (selectedId.startsWith('logo-')) {
      setCurrentTemplate({ ...currentTemplate, logo_area: undefined });
    }
    
    setSelectedId(null);
  };
  
  const getSelectedArea = () => {
    if (!currentTemplate || !selectedId) return null;
    
    if (typeof selectedId !== 'string') return null;
    
    if (selectedId.startsWith('design-')) {
      return currentTemplate.design_areas.find(area => area.id === selectedId);
    } else if (selectedId.startsWith('text-')) {
      return currentTemplate.text_areas.find(area => area.id === selectedId);
    } else if (selectedId.startsWith('logo-')) {
      return currentTemplate.logo_area;
    }
    
    return null;
  };
  
  const updateSelectedArea = (updates: Partial<DesignArea | TextArea | LogoArea>) => {
    if (!currentTemplate || !selectedId) return;
    
    if (typeof selectedId !== 'string') return;
    
    if (selectedId.startsWith('design-')) {
      const updatedAreas = currentTemplate.design_areas.map(area => 
        area.id === selectedId ? { ...area, ...updates } : area
      );
      setCurrentTemplate({ ...currentTemplate, design_areas: updatedAreas });
    } else if (selectedId.startsWith('text-')) {
      const updatedAreas = currentTemplate.text_areas.map(area => 
        area.id === selectedId ? { ...area, ...updates } : area
      );
      setCurrentTemplate({ ...currentTemplate, text_areas: updatedAreas });
    } else if (selectedId.startsWith('logo-') && currentTemplate.logo_area) {
      setCurrentTemplate({ 
        ...currentTemplate, 
        logo_area: { ...currentTemplate.logo_area, ...updates } 
      });
    }
  };
  
  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Please enter a folder name.');
      return;
    }
    
    try {
      // Generate a path from the name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const existingFolder = folders.find(f => f.path === folderPath);
      if (existingFolder) {
        setError('A folder with this name already exists.');
        return;
      }
      
      // In a real implementation, you would create the folder in the database
      // For now, we'll just add it to the state
      const newFolder: FolderType = {
        id: folderPath,
        name: newFolderName,
        path: folderPath,
        template_count: 0
      };
      
      setFolders([...folders, newFolder]);
      setSelectedFolder(folderPath);
      setNewFolderName('');
      setShowNewFolderModal(false);
      
      // In a real implementation, you would reload the folders from the database
      // For now, we'll just update the state
    } catch (error: any) {
      console.error('❌ Folder creation error:', error);
      setError(`Failed to create folder: ${error.message}`);
    }
  };
  
  const editFolder = (folder: FolderType) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setShowEditFolderModal(true);
  };
  
  const updateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) {
      setError('Please enter a folder name.');
      return;
    }
    
    try {
      // In a real implementation, you would update the folder in the database
      // For now, we'll just update the state
      const updatedFolders = folders.map(f => 
        f.id === editingFolder.id ? { ...f, name: newFolderName } : f
      );
      
      setFolders(updatedFolders);
      setNewFolderName('');
      setEditingFolder(null);
      setShowEditFolderModal(false);
      
      // Update templates in this folder
      if (templates.length > 0) {
        const updatedTemplates = templates.map(t => 
          t.folder_path === editingFolder.path ? { ...t, folder_name: newFolderName } : t
        );
        setTemplates(updatedTemplates);
      }
      
      // In a real implementation, you would reload the folders from the database
      // For now, we'll just update the state
    } catch (error: any) {
      console.error('❌ Folder update error:', error);
      setError(`Failed to update folder: ${error.message}`);
    }
  };
  
  const deleteFolder = async (folder: FolderType) => {
    if (!window.confirm(`Are you sure you want to delete the folder "${folder.name}"? All templates in this folder will be moved to the Default folder.`)) {
      return;
    }
    
    try {
      // In a real implementation, you would delete the folder in the database
      // and move templates to the default folder
      // For now, we'll just update the state
      
      // Remove folder from state
      const updatedFolders = folders.filter(f => f.id !== folder.id);
      setFolders(updatedFolders);
      
      // If the deleted folder was the selected one, select the default folder
      if (selectedFolder === folder.path) {
        const defaultFolder = updatedFolders.find(f => f.path === 'default');
        if (defaultFolder) {
          setSelectedFolder(defaultFolder.path);
        } else if (updatedFolders.length > 0) {
          setSelectedFolder(updatedFolders[0].path);
        } else {
          setSelectedFolder('');
        }
      }
      
      // In a real implementation, you would reload the folders from the database
      // For now, we'll just update the state
    } catch (error: any) {
      console.error('❌ Folder delete error:', error);
      setError(`Failed to delete folder: ${error.message}`);
    }
  };
  
  const saveTemplate = async () => {
    if (!templateName) {
      setError('Please enter a template name.');
      return;
    }
    
    if (!imageUrl) {
      setError('Please upload an image.');
      return;
    }
    
    if (!selectedFolder) {
      setError('Please select a folder.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Find the folder name from the selected folder path
      const folder = folders.find(f => f.path === selectedFolder);
      const folderName = folder ? folder.name : 'Default Templates';
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: imageUrl,
        design_areas: currentTemplate?.design_areas || [],
        text_areas: currentTemplate?.text_areas || [],
        logo_area: currentTemplate?.logo_area || null,
        is_default: false,
        design_type: designType,
        product_category: 't-shirt', // Default value, not used with folder system
        folder_path: selectedFolder,
        folder_name: folderName
      };
      
      let result;
      
      if (currentTemplate?.id) {
        // Update existing template
        result = await supabase
          .from('mockup_templates')
          .update({
            name: templateName,
            image_url: imageUrl,
            design_areas: currentTemplate.design_areas,
            text_areas: currentTemplate.text_areas,
            logo_area: currentTemplate.logo_area,
            design_type: designType,
            folder_path: selectedFolder,
            folder_name: folderName,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTemplate.id)
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
      
      // Reload templates and folders
      await loadFolders();
      await loadTemplates();
      
      // Select the newly created/updated template
      if (result.data) {
        selectTemplate(result.data);
      }
      
      alert('Template saved successfully!');
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
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Template delete error:', error);
        throw error;
      }
      
      console.log('✅ Template deleted successfully');
      
      // Reload templates and folders
      await loadFolders();
      await loadTemplates();
      
      // If the deleted template was the current one, reset the form
      if (currentTemplate?.id === templateId) {
        createNewTemplate();
      }
    } catch (error: any) {
      console.error('❌ Template delete error:', error);
      setError(`Failed to delete template: ${error.message}`);
    }
  };
  
  const selectedArea = getSelectedArea();
  
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            {viewMode !== 'folders' && (
              <Button
                onClick={() => setViewMode('folders')}
                variant="secondary"
                className="mr-3"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Folders
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Image className="h-6 w-6 mr-2 text-orange-500" />
                {viewMode === 'folders' ? 'Mockup Template Folders' : 
                 viewMode === 'templates' ? `Templates in ${folders.find(f => f.path === selectedFolder)?.name || 'Folder'}` :
                 currentTemplate ? `Editing: ${currentTemplate.name}` : 'New Template'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {viewMode === 'folders' ? 'Manage your mockup template folders' : 
                 viewMode === 'templates' ? `${templates.length} templates in this folder` :
                 'Create and edit mockup templates'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {viewMode === 'folders' && (
              <Button
                onClick={() => setShowNewFolderModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              >
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </Button>
            )}
            {viewMode === 'templates' && (
              <Button
                onClick={createNewTemplate}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Template</span>
              </Button>
            )}
            {viewMode === 'editor' && (
              <Button
                onClick={saveTemplate}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Template'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Folders View */}
      {viewMode === 'folders' && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <Card 
              key={folder.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedFolder(folder.path);
                setViewMode('templates');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Folder className="h-10 w-10 text-orange-500 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {folder.name}
                    </h3>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editFolder(folder);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {folder.path !== 'default' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder);
                        }}
                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Templates:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{folder.template_count}</span>
                  </div>
                  
                  {folder.black_designs !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Black designs:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{folder.black_designs}</span>
                    </div>
                  )}
                  
                  {folder.white_designs !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">White designs:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{folder.white_designs}</span>
                    </div>
                  )}
                  
                  {folder.color_designs !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Color designs:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{folder.color_designs}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="flex items-center text-orange-500 hover:text-orange-600 text-sm font-medium">
                    <span>View Templates</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add New Folder Card */}
          <Card 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer bg-transparent"
            onClick={() => setShowNewFolderModal(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <FolderPlus className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create New Folder
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Organize your templates into custom folders
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Templates View */}
      {viewMode === 'templates' && (
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Folder className="h-5 w-5 mr-2 text-orange-500" />
              {folders.find(f => f.path === selectedFolder)?.name || 'Templates'}
            </h2>
            <Button
              onClick={createNewTemplate}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </Button>
          </div>
          
          {templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates in this folder
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create your first template to get started
              </p>
              <Button
                onClick={createNewTemplate}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => selectTemplate(template)}
                >
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.design_type === 'black' ? 'bg-gray-900 text-white' :
                        template.design_type === 'white' ? 'bg-gray-100 text-gray-900 border border-gray-300' :
                        'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      }`}>
                        {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectTemplate(template);
                          }}
                          className="bg-white text-gray-900 hover:bg-gray-100"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          variant="danger"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                      {template.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Square className="h-3 w-3 mr-1" />
                        <span>{template.design_areas.length} design areas</span>
                      </div>
                      <div className="flex items-center">
                        <Type className="h-3 w-3 mr-1" />
                        <span>{template.text_areas.length} text areas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Template Card */}
              <Card 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer bg-transparent"
                onClick={createNewTemplate}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full aspect-square">
                  <Plus className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Create New Template
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Add a new mockup template to this folder
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      
      {/* Editor View */}
      {viewMode === 'editor' && (
        <div className="flex-1 flex">
          {/* Canvas */}
          <div className="flex-1 p-6 flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-auto">
            {image ? (
              <Stage
                width={stageSize.width}
                height={stageSize.height}
                ref={stageRef}
                onClick={handleStageClick}
                className="bg-white shadow-lg"
              >
                <Layer>
                  <KonvaImage
                    ref={imageRef}
                    image={image}
                    width={stageSize.width}
                    height={stageSize.height}
                  />
                  
                  {/* Design Areas */}
                  {currentTemplate && showAreas && currentTemplate.design_areas.map((area) => (
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
                      onDragEnd={(e) => handleDragEnd(e, area.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, area.id)}
                    >
                      <Rect
                        width={area.width}
                        height={area.height}
                        fill="rgba(255, 100, 50, 0.2)"
                        stroke={selectedId === area.id ? "#FF6432" : "rgba(255, 100, 50, 0.8)"}
                        strokeWidth={2}
                        dash={[5, 5]}
                      />
                    </Group>
                  ))}
                  
                  {/* Text Areas */}
                  {currentTemplate && showAreas && currentTemplate.text_areas.map((area) => (
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
                      onDragEnd={(e) => handleDragEnd(e, area.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, area.id)}
                    >
                      <Rect
                        width={area.width}
                        height={area.height}
                        fill="rgba(50, 100, 255, 0.2)"
                        stroke={selectedId === area.id ? "#3264FF" : "rgba(50, 100, 255, 0.8)"}
                        strokeWidth={2}
                        dash={[5, 5]}
                      />
                    </Group>
                  ))}
                  
                  {/* Logo Area */}
                  {currentTemplate && showAreas && currentTemplate.logo_area && (
                    <Group
                      key={currentTemplate.logo_area.id}
                      id={currentTemplate.logo_area.id}
                      x={currentTemplate.logo_area.x}
                      y={currentTemplate.logo_area.y}
                      width={currentTemplate.logo_area.width}
                      height={currentTemplate.logo_area.height}
                      rotation={currentTemplate.logo_area.rotation}
                      draggable
                      onClick={() => handleAreaClick(currentTemplate.logo_area.id)}
                      onDragEnd={(e) => handleDragEnd(e, currentTemplate.logo_area.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, currentTemplate.logo_area.id)}
                    >
                      <Rect
                        width={currentTemplate.logo_area.width}
                        height={currentTemplate.logo_area.height}
                        fill="rgba(100, 255, 50, 0.2)"
                        stroke={selectedId === currentTemplate.logo_area.id ? "#64FF32" : "rgba(100, 255, 50, 0.8)"}
                        strokeWidth={2}
                        dash={[5, 5]}
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
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <Image className="h-16 w-16 text-gray-400 mx-auto" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No image uploaded. Please upload an image to create a template.
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            {/* Template Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="w-full"
              />
            </div>
            
            {/* Design Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Design Type
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setDesignType('black')}
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    designType === 'black' 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Black
                </button>
                <button
                  type="button"
                  onClick={() => setDesignType('white')}
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    designType === 'white' 
                      ? 'bg-gray-100 text-gray-900 border-gray-900' 
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => setDesignType('color')}
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    designType === 'color' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-500' 
                      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Color
                </button>
              </div>
            </div>
            
            {/* Folder Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Folder
                </label>
                <Button
                  onClick={() => setShowNewFolderModal(true)}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <FolderPlus className="h-3 w-3" />
                  <span>New</span>
                </Button>
              </div>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.path}>
                    {folder.name} ({folder.template_count})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Image
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="flex-1"
                >
                  {imageUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {imageUrl && (
                  <Button
                    onClick={() => {
                      setImageUrl('');
                      setImage(null);
                    }}
                    variant="danger"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imageUrl && (
                <div className="mt-2 relative">
                  <img
                    src={imageUrl}
                    alt="Template Preview"
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>
            
            {/* Add Elements */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Add Elements
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={addDesignArea}
                  variant="secondary"
                  className="w-full bg-orange-600 text-white hover:bg-orange-700"
                  disabled={!image}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Add Design Area
                </Button>
                <Button
                  onClick={addTextArea}
                  variant="secondary"
                  className="w-full"
                  disabled={!image}
                >
                  <Type className="h-4 w-4 mr-2" />
                  Add Text Area
                </Button>
                <Button
                  onClick={addLogoArea}
                  variant="secondary"
                  className="w-full"
                  disabled={!image || (currentTemplate?.logo_area !== undefined && currentTemplate?.logo_area !== null)}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Add Logo Area
                </Button>
              </div>
            </div>
            
            {/* Visibility */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Visibility
              </h3>
              <Button
                onClick={() => setShowAreas(!showAreas)}
                variant="secondary"
                className="w-full"
              >
                {showAreas ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Areas
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Areas
                  </>
                )}
              </Button>
            </div>
            
            {/* Selected Area Properties */}
            {selectedArea && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Selected Area Properties
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">X</label>
                        <Input
                          type="number"
                          value={Math.round(selectedArea.x)}
                          onChange={(e) => updateSelectedArea({ x: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Y</label>
                        <Input
                          type="number"
                          value={Math.round(selectedArea.y)}
                          onChange={(e) => updateSelectedArea({ y: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Width</label>
                        <Input
                          type="number"
                          value={Math.round(selectedArea.width)}
                          onChange={(e) => updateSelectedArea({ width: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Height</label>
                        <Input
                          type="number"
                          value={Math.round(selectedArea.height)}
                          onChange={(e) => updateSelectedArea({ height: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rotation
                    </label>
                    <Input
                      type="number"
                      value={Math.round(selectedArea.rotation)}
                      onChange={(e) => updateSelectedArea({ rotation: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Text area specific properties */}
                  {selectedId && typeof selectedId === 'string' && selectedId.startsWith('text-') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Font Size
                      </label>
                      <Input
                        type="number"
                        value={(selectedArea as TextArea).font_size || 16}
                        onChange={(e) => updateSelectedArea({ font_size: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <Button
                    onClick={deleteSelectedArea}
                    variant="danger"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Area
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* New Folder Modal */}
      {showNewFolderModal && (
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
                  Folder Name
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={createNewFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim()}
                >
                  Create Folder
                </Button>
                <Button
                  onClick={() => {
                    setShowNewFolderModal(false);
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
      
      {/* Edit Folder Modal */}
      {showEditFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Folder
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folder Name
                </label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={updateFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim()}
                >
                  Update Folder
                </Button>
                <Button
                  onClick={() => {
                    setShowEditFolderModal(false);
                    setNewFolderName('');
                    setEditingFolder(null);
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