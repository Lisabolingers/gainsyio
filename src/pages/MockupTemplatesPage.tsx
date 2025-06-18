import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Group } from 'react-konva';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Image, Plus, Trash2, Save, Download, Eye, EyeOff, Square, Type, Circle, FolderPlus, Folder, FolderOpen, ArrowLeft, Search, Filter } from 'lucide-react';
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
  templateCount: number;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTemplate, setCurrentTemplate] = useState<MockupTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [productCategory, setProductCategory] = useState('t-shirt');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAreas, setShowAreas] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
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
  }, [user, currentFolder]);
  
  const loadFolders = async () => {
    try {
      console.log('🔄 Loading template folders...');
      
      // In a real implementation, this would fetch from the database
      // For now, we'll query the mockup_templates table and group by folder_path
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }
      
      // If no folders exist yet, create a default one
      if (!data || data.length === 0) {
        // Create default folders
        const defaultFolders: Folder[] = [
          { id: '1', name: 'T-Shirts', path: 't-shirts', templateCount: 0 },
          { id: '2', name: 'Mugs', path: 'mugs', templateCount: 0 },
          { id: '3', name: 'Posters', path: 'posters', templateCount: 0 }
        ];
        
        setFolders(defaultFolders);
      } else {
        // Map the data to our Folder interface
        const mappedFolders: Folder[] = data.map(folder => ({
          id: folder.folder_path,
          name: folder.folder_name || folder.folder_path,
          path: folder.folder_path,
          templateCount: folder.template_count || 0
        }));
        
        setFolders(mappedFolders);
      }
      
      console.log('✅ Folders loaded successfully');
    } catch (error) {
      console.error('❌ Folder loading error:', error);
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
      
      // If a folder is selected, filter by folder
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
      }
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
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
      
      // If there are templates and we're not in template editor mode, select the first one
      if (parsedTemplates.length > 0 && !showTemplateEditor) {
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
    setProductCategory(template.product_category || 't-shirt');
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
    
    // Show template editor
    setShowTemplateEditor(true);
  };
  
  const createNewTemplate = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setImageUrl('');
    setDesignType('black');
    setProductCategory('t-shirt');
    setSelectedId(null);
    setImage(null);
    
    // Show template editor
    setShowTemplateEditor(true);
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
    if (!image) {
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
    } else {
      // Create a new template with this design area
      setCurrentTemplate({
        id: '',
        user_id: user?.id || '',
        name: templateName,
        image_url: imageUrl,
        design_areas: [newArea],
        text_areas: [],
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        design_type: designType,
        product_category: productCategory,
        folder_path: currentFolder || 'default',
        folder_name: folders.find(f => f.path === currentFolder)?.name || 'Default Templates'
      });
    }
    
    setSelectedId(newArea.id);
  };
  
  const addTextArea = () => {
    if (!image) {
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
    } else {
      // Create a new template with this text area
      setCurrentTemplate({
        id: '',
        user_id: user?.id || '',
        name: templateName,
        image_url: imageUrl,
        design_areas: [],
        text_areas: [newArea],
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        design_type: designType,
        product_category: productCategory,
        folder_path: currentFolder || 'default',
        folder_name: folders.find(f => f.path === currentFolder)?.name || 'Default Templates'
      });
    }
    
    setSelectedId(newArea.id);
  };
  
  const addLogoArea = () => {
    if (!image) {
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
    } else {
      // Create a new template with this logo area
      setCurrentTemplate({
        id: '',
        user_id: user?.id || '',
        name: templateName,
        image_url: imageUrl,
        design_areas: [],
        text_areas: [],
        logo_area: newArea,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        design_type: designType,
        product_category: productCategory,
        folder_path: currentFolder || 'default',
        folder_name: folders.find(f => f.path === currentFolder)?.name || 'Default Templates'
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
  
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Please enter a folder name.');
      return;
    }
    
    try {
      // Generate a folder path from the name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      if (folders.some(f => f.path === folderPath)) {
        setError('A folder with this name already exists.');
        return;
      }
      
      // In a real implementation, we would create the folder in the database
      // For now, we'll just add it to the local state
      const newFolder: Folder = {
        id: Date.now().toString(),
        name: newFolderName,
        path: folderPath,
        templateCount: 0
      };
      
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setShowFolderModal(false);
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
      
      console.log('✅ Folder created successfully');
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
    
    try {
      setSaving(true);
      setError(null);
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: imageUrl,
        design_areas: currentTemplate?.design_areas || [],
        text_areas: currentTemplate?.text_areas || [],
        logo_area: currentTemplate?.logo_area || null,
        is_default: false,
        design_type: designType,
        product_category: productCategory,
        folder_path: currentFolder || 'default',
        folder_name: folders.find(f => f.path === currentFolder)?.name || 'Default Templates'
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
            product_category: productCategory,
            folder_path: currentFolder || currentTemplate.folder_path || 'default',
            folder_name: folders.find(f => f.path === currentFolder)?.name || currentTemplate.folder_name || 'Default Templates',
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
      await loadTemplates();
      await loadFolders();
      
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
      await loadTemplates();
      await loadFolders();
      
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
  
  // Filter templates based on search term
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.product_category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }
  
  // Render folder view if not in template editor mode
  if (!showTemplateEditor) {
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
              Create and manage mockup templates for your products
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
              onClick={createNewTemplate}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Template</span>
            </Button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`hover:text-orange-500 flex items-center space-x-1 ${!currentFolder ? 'font-medium text-orange-500' : ''}`}
          >
            <Folder className="h-4 w-4" />
            <span>All Folders</span>
          </button>
          {currentFolder && (
            <>
              <span>/</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {folders.find(f => f.path === currentFolder)?.name || currentFolder}
              </span>
            </>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        
        {/* Folder View */}
        {!currentFolder && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map((folder) => (
              <Card 
                key={folder.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentFolder(folder.path)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <FolderOpen className="h-16 w-16 text-orange-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {folder.templateCount} templates
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Template Grid */}
        {(currentFolder || searchTerm) && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {searchTerm 
                ? `Search Results: "${searchTerm}"`
                : `Templates in ${folders.find(f => f.path === currentFolder)?.name || currentFolder}`}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({filteredTemplates.length} templates)
              </span>
            </h2>
            
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No templates found' : 'No templates in this folder'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first template in this folder'
                  }
                </p>
                <Button
                  onClick={createNewTemplate}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          size="sm"
                        >
                          Edit Template
                        </Button>
                      </div>
                      
                      {/* Design Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          template.design_type === 'black' ? 'bg-gray-900 text-white' :
                          template.design_type === 'white' ? 'bg-gray-100 text-gray-900 border border-gray-300' :
                          'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        }`}>
                          {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                        </span>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {template.product_category}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* New Folder Modal */}
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
                    Folder Name
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
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={!newFolderName.trim()}
                  >
                    Create Folder
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
  }
  
  // Template Editor View
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Button
              onClick={() => {
                setShowTemplateEditor(false);
                setCurrentTemplate(null);
              }}
              variant="secondary"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Templates
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                {currentTemplate?.id ? 'Edit Template' : 'Create New Template'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentFolder 
                  ? `Folder: ${folders.find(f => f.path === currentFolder)?.name || currentFolder}`
                  : 'No folder selected'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
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
          
          {/* Folder Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder
            </label>
            <select
              value={currentFolder || (currentTemplate?.folder_path || 'default')}
              onChange={(e) => setCurrentFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="default">Default Templates</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.path}>
                  {folder.name}
                </option>
              ))}
            </select>
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
          
          {/* Product Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Category
            </label>
            <select
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
    </div>
  );
};

export default MockupTemplatesPage;