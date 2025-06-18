import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Group } from 'react-konva';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Image, Plus, Trash2, Save, Download, Eye, EyeOff, Square, Type, Circle, FolderPlus, Folder } from 'lucide-react';
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

interface Folder {
  id: string;
  name: string;
  path: string;
  template_count: number;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
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
  const [newFolderName, setNewFolderName] = useState('');
  
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const transformerRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
    }
  }, [user]);
  
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
        const defaultFolders: Folder[] = [
          { id: 'default', name: 'Default Templates', path: 'default', template_count: 0 },
          { id: 'tshirts', name: 'T-Shirts', path: 'tshirts', template_count: 0 },
          { id: 'mugs', name: 'Mugs', path: 'mugs', template_count: 0 }
        ];
        setFolders(defaultFolders);
        setSelectedFolder('default');
      } else {
        console.log(`✅ ${data.length} mockup template folders loaded`);
        
        const mappedFolders: Folder[] = data.map(folder => ({
          id: folder.folder_path,
          name: folder.folder_name,
          path: folder.folder_path,
          template_count: folder.template_count
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
      if (parsedTemplates.length > 0) {
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
      const newFolder: Folder = {
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Image className="h-6 w-6 mr-2 text-orange-500" />
              Mockup Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage mockup templates for your products
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={createNewTemplate}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </Button>
            <Button
              onClick={saveTemplate}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Template'}</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Main Content */}
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
          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template
            </label>
            <select
              value={currentTemplate?.id || ''}
              onChange={(e) => {
                const selected = templates.find(t => t.id === e.target.value);
                if (selected) {
                  selectTemplate(selected);
                } else {
                  createNewTemplate();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- New Template --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          
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
          
          {/* Template List */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Your Templates
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                      currentTemplate?.id === template.id
                        ? 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mr-2">
                        {template.image_url && (
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {template.design_type || 'black'} • {template.folder_name || 'Default'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(template.id);
                      }}
                      variant="danger"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
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
    </div>
  );
};

export default MockupTemplatesPage;