import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, Upload, Move, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, Pencil, Layers, Check, X, RefreshCw } from 'lucide-react';
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
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface TextArea {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  font_size: number;
  font_family: string;
}

interface LogoArea {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPath, setNewFolderPath] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [productCategory, setProductCategory] = useState('t-shirt');
  const [uploading, setUploading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [logoArea, setLogoArea] = useState<LogoArea | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      
      // If no folders exist, create a default one
      if (data?.length === 0) {
        await createDefaultFolder();
      }
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
      // Create mock folders for demo
      const mockFolders: TemplateFolder[] = [
        {
          id: '1',
          name: 'T-Shirts',
          path: 't-shirts',
          template_count: 5,
          black_designs: 3,
          white_designs: 2,
          color_designs: 0,
          first_created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Mugs',
          path: 'mugs',
          template_count: 3,
          black_designs: 1,
          white_designs: 1,
          color_designs: 1,
          first_created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Posters',
          path: 'posters',
          template_count: 2,
          black_designs: 1,
          white_designs: 1,
          color_designs: 0,
          first_created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          last_updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setFolders(mockFolders);
    }
  };

  const createDefaultFolder = async () => {
    try {
      console.log('🔄 Creating default folder...');
      
      // Create a default folder
      const defaultFolder = {
        user_id: user?.id,
        name: 'Default Templates',
        image_url: '',
        design_areas: [],
        text_areas: [],
        is_default: false,
        design_type: 'black' as const,
        product_category: 't-shirt',
        folder_path: 'default',
        folder_name: 'Default Templates'
      };
      
      // Insert a dummy template to create the folder
      const { error } = await supabase
        .from('mockup_templates')
        .insert(defaultFolder);
        
      if (error && error.code !== '23505') { // Ignore unique constraint violations
        console.error('❌ Default folder creation error:', error);
        throw error;
      }
      
      console.log('✅ Default folder created');
      
      // Reload folders
      await loadFolders();
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
      
      // Parse JSON fields
      const parsedTemplates = data?.map(template => ({
        ...template,
        design_areas: parseJsonField(template.design_areas, []),
        text_areas: parseJsonField(template.text_areas, []),
        logo_area: parseJsonField(template.logo_area, null)
      })) || [];
      
      setTemplates(parsedTemplates);
    } catch (error) {
      console.error('❌ Template loading general error:', error);
      // Create mock templates for demo
      createMockTemplates();
    } finally {
      setLoading(false);
    }
  };

  const parseJsonField = (field: any, defaultValue: any) => {
    if (!field) return defaultValue;
    
    try {
      if (typeof field === 'string') {
        return JSON.parse(field);
      }
      return field;
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      return defaultValue;
    }
  };

  const createMockTemplates = () => {
    const mockTemplates: MockupTemplate[] = [
      {
        id: '1',
        user_id: user?.id || '',
        name: 'T-Shirt Mockup 1',
        image_url: 'https://images.pexels.com/photos/1484516/pexels-photo-1484516.jpeg?auto=compress&cs=tinysrgb&w=600',
        design_areas: [
          {
            id: 1,
            x: 250,
            y: 200,
            width: 200,
            height: 200,
            rotation: 0
          }
        ],
        text_areas: [
          {
            id: 1,
            x: 250,
            y: 400,
            width: 200,
            height: 50,
            rotation: 0,
            font_size: 20,
            font_family: 'Arial'
          }
        ],
        logo_area: {
          x: 250,
          y: 100,
          width: 100,
          height: 50,
          rotation: 0,
          opacity: 0.8
        },
        is_default: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        design_type: 'black',
        product_category: 't-shirt',
        folder_path: 't-shirts',
        folder_name: 'T-Shirts'
      },
      {
        id: '2',
        user_id: user?.id || '',
        name: 'T-Shirt Mockup 2',
        image_url: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=600',
        design_areas: [
          {
            id: 1,
            x: 250,
            y: 200,
            width: 200,
            height: 200,
            rotation: 0
          }
        ],
        text_areas: [],
        is_default: false,
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        design_type: 'white',
        product_category: 't-shirt',
        folder_path: 't-shirts',
        folder_name: 'T-Shirts'
      },
      {
        id: '3',
        user_id: user?.id || '',
        name: 'Mug Mockup',
        image_url: 'https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=600',
        design_areas: [
          {
            id: 1,
            x: 200,
            y: 150,
            width: 150,
            height: 150,
            rotation: 0
          }
        ],
        text_areas: [
          {
            id: 1,
            x: 200,
            y: 300,
            width: 150,
            height: 30,
            rotation: 0,
            font_size: 16,
            font_family: 'Arial'
          }
        ],
        is_default: false,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        design_type: 'black',
        product_category: 'mug',
        folder_path: 'mugs',
        folder_name: 'Mugs'
      }
    ];
    
    setTemplates(mockTemplates);
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
      // Create mock stores for demo
      const mockStores: EtsyStore[] = [
        {
          id: 'store1',
          store_name: 'My Etsy Store',
          is_active: true
        },
        {
          id: 'store2',
          store_name: 'My Craft Shop',
          is_active: true
        }
      ];
      setStores(mockStores);
      setSelectedStore('store1');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setTemplateName(file.name.split('.')[0]);
    setShowUploadModal(true);
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      console.log('🔄 Creating new folder...');
      
      // Generate folder path from name
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      const existingFolder = folders.find(f => f.path === folderPath);
      if (existingFolder) {
        setError('A folder with this name already exists');
        return;
      }
      
      // Create a dummy template to create the folder
      const dummyTemplate = {
        user_id: user?.id,
        name: `${newFolderName} Folder`,
        image_url: '',
        design_areas: [],
        text_areas: [],
        is_default: false,
        design_type: designType,
        product_category: productCategory,
        folder_path: folderPath,
        folder_name: newFolderName,
        store_id: selectedStore || null
      };
      
      const { error } = await supabase
        .from('mockup_templates')
        .insert(dummyTemplate);
        
      if (error) {
        console.error('❌ Folder creation error:', error);
        throw error;
      }
      
      console.log('✅ Folder created successfully');
      
      // Reset form
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      // Reload folders
      await loadFolders();
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
      
    } catch (error: any) {
      console.error('❌ Folder creation error:', error);
      setError(`Failed to create folder: ${error.message}`);
    }
  };

  const uploadTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    
    if (!uploadFile || !uploadPreview) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      console.log('🔄 Uploading template...');
      
      // In a real implementation, we would upload the file to Supabase Storage
      // For now, we'll use the data URL as the image URL
      
      // Create template object
      const newTemplate = {
        user_id: user?.id,
        name: templateName,
        image_url: uploadPreview, // In real implementation, this would be a Supabase Storage URL
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        is_default: false,
        design_type: designType,
        product_category: productCategory,
        folder_path: currentFolder || 'default',
        folder_name: folders.find(f => f.path === currentFolder)?.name || 'Default Templates',
        store_id: selectedStore || null
      };
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .insert(newTemplate)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Template upload error:', error);
        throw error;
      }
      
      console.log('✅ Template uploaded successfully:', data);
      
      // Reset form
      setUploadFile(null);
      setUploadPreview('');
      setTemplateName('');
      setDesignAreas([]);
      setTextAreas([]);
      setLogoArea(null);
      setShowUploadModal(false);
      
      // Reload templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template upload error:', error);
      setError(`Failed to upload template: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      console.log('🔄 Updating template...');
      
      // Update template object
      const updatedTemplate = {
        name: templateName,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        product_category: productCategory,
        store_id: selectedStore || null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('mockup_templates')
        .update(updatedTemplate)
        .eq('id', editingTemplate.id)
        .eq('user_id', user?.id);
        
      if (error) {
        console.error('❌ Template update error:', error);
        throw error;
      }
      
      console.log('✅ Template updated successfully');
      
      // Reset form
      setEditingTemplate(null);
      setTemplateName('');
      setDesignAreas([]);
      setTextAreas([]);
      setLogoArea(null);
      setShowEditModal(false);
      
      // Reload templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template update error:', error);
      setError(`Failed to update template: ${error.message}`);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

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
      
      // Update local state
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
    } catch (error: any) {
      console.error('❌ Template deletion error:', error);
      setError(`Failed to delete template: ${error.message}`);
    }
  };

  const deleteFolder = async (folderPath: string) => {
    if (!window.confirm('Are you sure you want to delete this folder and all templates inside it?')) return;

    try {
      console.log(`🔄 Deleting folder: ${folderPath}`);
      
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
      setFolders(prev => prev.filter(f => f.path !== folderPath));
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folderPath) {
        setCurrentFolder('');
      }
      
      // Reload templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Folder deletion error:', error);
      setError(`Failed to delete folder: ${error.message}`);
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log(`🔄 Duplicating template: ${template.id}`);
      
      // Create a copy of the template
      const newTemplate = {
        user_id: user?.id,
        name: `${template.name} (Copy)`,
        image_url: template.image_url,
        design_areas: template.design_areas,
        text_areas: template.text_areas,
        logo_area: template.logo_area,
        is_default: false,
        design_type: template.design_type,
        product_category: template.product_category,
        folder_path: template.folder_path,
        folder_name: template.folder_name,
        store_id: template.store_id
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
      
    } catch (error: any) {
      console.error('❌ Template duplication error:', error);
      setError(`Failed to duplicate template: ${error.message}`);
    }
  };

  const editTemplate = (template: MockupTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setDesignType(template.design_type);
    setProductCategory(template.product_category);
    setDesignAreas(template.design_areas || []);
    setTextAreas(template.text_areas || []);
    setLogoArea(template.logo_area || null);
    setShowEditModal(true);
  };

  const addDesignArea = () => {
    const newArea: DesignArea = {
      id: Date.now(),
      x: 250,
      y: 250,
      width: 200,
      height: 200,
      rotation: 0
    };
    
    setDesignAreas([...designAreas, newArea]);
  };

  const addTextArea = () => {
    const newArea: TextArea = {
      id: Date.now(),
      x: 250,
      y: 350,
      width: 200,
      height: 50,
      rotation: 0,
      font_size: 20,
      font_family: 'Arial'
    };
    
    setTextAreas([...textAreas, newArea]);
  };

  const addLogoArea = () => {
    const newArea: LogoArea = {
      x: 250,
      y: 150,
      width: 100,
      height: 50,
      rotation: 0,
      opacity: 0.8
    };
    
    setLogoArea(newArea);
  };

  const removeDesignArea = (id: number) => {
    setDesignAreas(designAreas.filter(area => area.id !== id));
  };

  const removeTextArea = (id: number) => {
    setTextAreas(textAreas.filter(area => area.id !== id));
  };

  const removeLogoArea = () => {
    setLogoArea(null);
  };

  const updateDesignArea = (id: number, updates: Partial<DesignArea>) => {
    setDesignAreas(designAreas.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ));
  };

  const updateTextArea = (id: number, updates: Partial<TextArea>) => {
    setTextAreas(textAreas.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ));
  };

  const updateLogoArea = (updates: Partial<LogoArea>) => {
    if (logoArea) {
      setLogoArea({ ...logoArea, ...updates });
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
      console.log(`🔄 Deleting ${selectedTemplates.length} templates...`);
      
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
      
      // Reload templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Bulk deletion error:', error);
      setError(`Failed to delete templates: ${error.message}`);
    }
  };

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

  const getDesignTypeIcon = (type: string) => {
    switch (type) {
      case 'black': return '⚫';
      case 'white': return '⚪';
      case 'color': return '🎨';
      default: return '⚫';
    }
  };

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.product_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current folder name
  const getCurrentFolderName = () => {
    if (!currentFolder) return 'All Templates';
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
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage mockup templates with design areas ({templates.length} templates)
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
            onClick={() => fileInputRef.current?.click()}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Template</span>
          </Button>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Etsy Store:
            </label>
            {stores.length > 0 ? (
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All stores</option>
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-red-500">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
            >
              <X className="h-5 w-5" />
            </button>
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
                    key={folder.path}
                    className="group relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setCurrentFolder(folder.path)}
                  >
                    <div className="text-center">
                      <FolderOpen className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {folder.name}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-gray-900 rounded-full mr-1"></span>
                            {folder.black_designs}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-gray-100 border border-gray-300 rounded-full mr-1"></span>
                            {folder.white_designs}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-1"></span>
                            {folder.color_designs}
                          </span>
                        </div>
                        <div className="mt-1">
                          {folder.template_count} templates
                        </div>
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
            <span>Back to All Templates</span>
          </Button>
        )}

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
                  : 'Start by uploading your first template'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload First Template</span>
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
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Template Preview */}
                          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={template.image_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Design Type Badge */}
                            <div className="absolute top-2 left-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                                {getDesignTypeIcon(template.design_type)} {template.design_type}
                              </span>
                            </div>
                            
                            {/* Design Areas Indicator */}
                            {template.design_areas.length > 0 && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                                  {template.design_areas.length} design {template.design_areas.length === 1 ? 'area' : 'areas'}
                                </span>
                              </div>
                            )}
                            
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => editTemplate(template)}
                                  className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                                  title="Edit template"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => duplicateTemplate(template)}
                                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                  title="Duplicate template"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteTemplate(template.id)}
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                  title="Delete template"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Template Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedTemplates.includes(template.id)}
                                  onChange={() => toggleTemplateSelection(template.id)}
                                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {template.name}
                                </h3>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.product_category} • {formatDate(template.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Template Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                              <span className="flex items-center">
                                <Layers className="h-3 w-3 mr-1" />
                                {template.design_areas.length} design
                              </span>
                              <span className="flex items-center">
                                <Type className="h-3 w-3 mr-1" />
                                {template.text_areas.length} text
                              </span>
                            </div>
                            {template.logo_area && (
                              <span className="flex items-center">
                                <Image className="h-3 w-3 mr-1" />
                                Logo area
                              </span>
                            )}
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
                                  {template.folder_name || 'Default Templates'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                              {getDesignTypeIcon(template.design_type)} {template.design_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {template.product_category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <Layers className="h-3 w-3 mr-1" />
                                {template.design_areas.length}
                              </span>
                              <span className="flex items-center">
                                <Type className="h-3 w-3 mr-1" />
                                {template.text_areas.length}
                              </span>
                              {template.logo_area && (
                                <span className="flex items-center">
                                  <Image className="h-3 w-3 mr-1" />
                                  1
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(template.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => editTemplate(template)}
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
                    setError(null);
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

      {/* Upload Template Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload Mockup Template
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Image Preview */}
                <div className="space-y-4">
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {uploadPreview && (
                      <img
                        src={uploadPreview}
                        alt="Template Preview"
                        className="w-full h-full object-contain"
                        ref={imageRef}
                      />
                    )}
                    
                    {/* Design Areas Overlay */}
                    {uploadPreview && designAreas.map((area) => (
                      <div
                        key={area.id}
                        className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                        style={{
                          left: `${area.x - area.width/2}px`,
                          top: `${area.y - area.height/2}px`,
                          width: `${area.width}px`,
                          height: `${area.height}px`,
                          transform: `rotate(${area.rotation}deg)`
                        }}
                      >
                        <div className="absolute top-0 right-0 bg-blue-500 text-white p-1 text-xs">
                          Design {area.id}
                        </div>
                      </div>
                    ))}
                    
                    {/* Text Areas Overlay */}
                    {uploadPreview && textAreas.map((area) => (
                      <div
                        key={area.id}
                        className="absolute border-2 border-green-500 bg-green-500/20 cursor-move"
                        style={{
                          left: `${area.x - area.width/2}px`,
                          top: `${area.y - area.height/2}px`,
                          width: `${area.width}px`,
                          height: `${area.height}px`,
                          transform: `rotate(${area.rotation}deg)`
                        }}
                      >
                        <div className="absolute top-0 right-0 bg-green-500 text-white p-1 text-xs">
                          Text {area.id}
                        </div>
                      </div>
                    ))}
                    
                    {/* Logo Area Overlay */}
                    {uploadPreview && logoArea && (
                      <div
                        className="absolute border-2 border-purple-500 bg-purple-500/20 cursor-move"
                        style={{
                          left: `${logoArea.x - logoArea.width/2}px`,
                          top: `${logoArea.y - logoArea.height/2}px`,
                          width: `${logoArea.width}px`,
                          height: `${logoArea.height}px`,
                          transform: `rotate(${logoArea.rotation}deg)`,
                          opacity: logoArea.opacity
                        }}
                      >
                        <div className="absolute top-0 right-0 bg-purple-500 text-white p-1 text-xs">
                          Logo
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={addDesignArea}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={!uploadPreview}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Design Area
                    </Button>
                    <Button
                      onClick={addTextArea}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={!uploadPreview}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Text Area
                    </Button>
                    <Button
                      onClick={addLogoArea}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={!uploadPreview || logoArea !== null}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Logo Area
                    </Button>
                  </div>
                </div>
                
                {/* Right Column - Template Settings */}
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
                      Design Type:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={designType === 'black'}
                          onChange={() => setDesignType('black')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Black Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={designType === 'white'}
                          onChange={() => setDesignType('white')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">White Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
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
                      Folder:
                    </label>
                    <select
                      value={currentFolder}
                      onChange={(e) => setCurrentFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Root Directory</option>
                      {folders.map((folder) => (
                        <option key={folder.path} value={folder.path}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Design Areas List */}
                  {designAreas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Design Areas:
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {designAreas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Design Area {area.id}
                            </span>
                            <button
                              onClick={() => removeDesignArea(area.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Text Areas List */}
                  {textAreas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Text Areas:
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {textAreas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Text Area {area.id}
                            </span>
                            <button
                              onClick={() => removeTextArea(area.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Logo Area */}
                  {logoArea && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Logo Area:
                        </h3>
                        <button
                          onClick={removeLogoArea}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Opacity:
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={logoArea.opacity}
                            onChange={(e) => updateLogoArea({ opacity: parseFloat(e.target.value) })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {Math.round(logoArea.opacity * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={uploadTemplate}
                  className="flex-1"
                  disabled={uploading || !templateName.trim() || !uploadPreview}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span>Save Template</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadPreview('');
                    setTemplateName('');
                    setDesignAreas([]);
                    setTextAreas([]);
                    setLogoArea(null);
                    setError(null);
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

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Template: {editingTemplate.name}
              </h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Image Preview */}
                <div className="space-y-4">
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={editingTemplate.image_url}
                      alt={editingTemplate.name}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Design Areas Overlay */}
                    {designAreas.map((area) => (
                      <div
                        key={area.id}
                        className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                        style={{
                          left: `${area.x - area.width/2}px`,
                          top: `${area.y - area.height/2}px`,
                          width: `${area.width}px`,
                          height: `${area.height}px`,
                          transform: `rotate(${area.rotation}deg)`
                        }}
                      >
                        <div className="absolute top-0 right-0 bg-blue-500 text-white p-1 text-xs">
                          Design {area.id}
                        </div>
                      </div>
                    ))}
                    
                    {/* Text Areas Overlay */}
                    {textAreas.map((area) => (
                      <div
                        key={area.id}
                        className="absolute border-2 border-green-500 bg-green-500/20 cursor-move"
                        style={{
                          left: `${area.x - area.width/2}px`,
                          top: `${area.y - area.height/2}px`,
                          width: `${area.width}px`,
                          height: `${area.height}px`,
                          transform: `rotate(${area.rotation}deg)`
                        }}
                      >
                        <div className="absolute top-0 right-0 bg-green-500 text-white p-1 text-xs">
                          Text {area.id}
                        </div>
                      </div>
                    ))}
                    
                    {/* Logo Area Overlay */}
                    {logoArea && (
                      <div
                        className="absolute border-2 border-purple-500 bg-purple-500/20 cursor-move"
                        style={{
                          left: `${logoArea.x - logoArea.width/2}px`,
                          top: `${logoArea.y - logoArea.height/2}px`,
                          width: `${logoArea.width}px`,
                          height: `${logoArea.height}px`,
                          transform: `rotate(${logoArea.rotation}deg)`,
                          opacity: logoArea.opacity
                        }}
                      >
                        <div className="absolute top-0 right-0 bg-purple-500 text-white p-1 text-xs">
                          Logo
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={addDesignArea}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Design Area
                    </Button>
                    <Button
                      onClick={addTextArea}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Text Area
                    </Button>
                    <Button
                      onClick={addLogoArea}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      disabled={logoArea !== null}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Logo Area
                    </Button>
                  </div>
                </div>
                
                {/* Right Column - Template Settings */}
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
                      Design Type:
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={designType === 'black'}
                          onChange={() => setDesignType('black')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">Black Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={designType === 'white'}
                          onChange={() => setDesignType('white')}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">White Design</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
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
                  
                  {/* Design Areas List */}
                  {designAreas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Design Areas:
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {designAreas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Design Area {area.id}
                            </span>
                            <button
                              onClick={() => removeDesignArea(area.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Text Areas List */}
                  {textAreas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Text Areas:
                      </h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {textAreas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Text Area {area.id}
                            </span>
                            <button
                              onClick={() => removeTextArea(area.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Logo Area */}
                  {logoArea && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Logo Area:
                        </h3>
                        <button
                          onClick={removeLogoArea}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Opacity:
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={logoArea.opacity}
                            onChange={(e) => updateLogoArea({ opacity: parseFloat(e.target.value) })}
                            className="w-32"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {Math.round(logoArea.opacity * 100)}%
                          </span>
                        </div>
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
                  disabled={!templateName.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span>Update Template</span>
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTemplate(null);
                    setTemplateName('');
                    setDesignAreas([]);
                    setTextAreas([]);
                    setLogoArea(null);
                    setError(null);
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