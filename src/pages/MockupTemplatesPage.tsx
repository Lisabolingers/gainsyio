import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, FolderPlus, Folder, FolderOpen, ArrowLeft, AlertCircle, RefreshCw, CheckCircle, X } from 'lucide-react';
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
}

const MockupTemplatesPage: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesignType, setUploadDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [uploadProductCategory, setUploadProductCategory] = useState('t-shirt');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
      
      // Check if we're in demo mode
      if (isDemoMode) {
        setDemoMode(true);
      }
    }
  }, [user, currentFolder, isDemoMode]);

  const loadFolders = async () => {
    try {
      console.log('🔄 Loading template folders...');
      
      // If in demo mode, use mock data
      if (isDemoMode) {
        console.log('📋 Demo mode: Using mock folder data');
        const mockFolders: TemplateFolder[] = [
          { id: '1', name: 'T-Shirts', path: 't-shirts', template_count: 5 },
          { id: '2', name: 'Mugs', path: 'mugs', template_count: 3 },
          { id: '3', name: 'Posters', path: 'posters', template_count: 4 },
          { id: '4', name: 'Hoodies', path: 'hoodies', template_count: 2 },
          { id: '5', name: 'Default Templates', path: 'default', template_count: 6 }
        ];
        setFolders(mockFolders);
        return;
      }
      
      // Try to get real data from Supabase
      try {
        const { data, error } = await supabase
          .from('mockup_template_folders')
          .select('*')
          .eq('user_id', user?.id)
          .order('folder_name', { ascending: true });

        if (error) {
          console.error('❌ Folder loading error:', error);
          throw error;
        }

        // Transform the data to match our interface
        const transformedFolders: TemplateFolder[] = data.map(folder => ({
          id: folder.folder_path, // Use folder_path as ID
          name: folder.folder_name,
          path: folder.folder_path,
          template_count: folder.template_count
        }));

        console.log(`✅ ${transformedFolders.length} template folders loaded`);
        setFolders(transformedFolders);
      } catch (error) {
        console.warn('⚠️ Error loading folders from Supabase, falling back to mock data:', error);
        // Fall back to mock data
        const mockFolders: TemplateFolder[] = [
          { id: '1', name: 'T-Shirts', path: 't-shirts', template_count: 5 },
          { id: '2', name: 'Mugs', path: 'mugs', template_count: 3 },
          { id: '3', name: 'Posters', path: 'posters', template_count: 4 },
          { id: '4', name: 'Hoodies', path: 'hoodies', template_count: 2 },
          { id: '5', name: 'Default Templates', path: 'default', template_count: 6 }
        ];
        setFolders(mockFolders);
        setDemoMode(true);
      }
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
      setError('Failed to load folders. Please try again later.');
      
      // Fall back to mock data
      const mockFolders: TemplateFolder[] = [
        { id: '1', name: 'T-Shirts', path: 't-shirts', template_count: 5 },
        { id: '2', name: 'Mugs', path: 'mugs', template_count: 3 },
        { id: '3', name: 'Posters', path: 'posters', template_count: 4 },
        { id: '4', name: 'Hoodies', path: 'hoodies', template_count: 2 },
        { id: '5', name: 'Default Templates', path: 'default', template_count: 6 }
      ];
      setFolders(mockFolders);
      setDemoMode(true);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading mockup templates...');
      
      // If in demo mode, use mock data
      if (isDemoMode) {
        console.log('📋 Demo mode: Using mock template data');
        loadMockTemplates();
        return;
      }
      
      // Try to get real data from Supabase
      try {
        let query = supabase
          .from('mockup_templates')
          .select('*')
          .eq('user_id', user?.id);

        // If folder is selected, filter by folder
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
        console.warn('⚠️ Error loading templates from Supabase, falling back to mock data:', error);
        // Fall back to mock data
        loadMockTemplates();
      }
    } catch (error) {
      console.error('❌ Template loading general error:', error);
      setError('Failed to load templates. Please try again later.');
      
      // Fall back to mock data
      loadMockTemplates();
    } finally {
      setLoading(false);
    }
  };

  const loadMockTemplates = () => {
    // Generate mock templates based on current folder
    const folderName = currentFolder ? 
      folders.find(f => f.path === currentFolder)?.name || 'Unknown Folder' : 
      'All Templates';
    
    const mockTemplates: MockupTemplate[] = [];
    
    // Number of templates to generate
    const templateCount = currentFolder ? 
      folders.find(f => f.path === currentFolder)?.template_count || 5 : 
      12;
    
    // Generate mock templates
    for (let i = 1; i <= templateCount; i++) {
      // Determine design type (distribute evenly)
      const designTypes: Array<'black' | 'white' | 'color'> = ['black', 'white', 'color'];
      const designType = designTypes[i % 3];
      
      // Generate random image URL from Pexels
      const imageId = 1000000 + Math.floor(Math.random() * 1000000);
      const imageUrl = `https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=400`;
      
      // Create mock template
      mockTemplates.push({
        id: `mock-${currentFolder || 'all'}-${i}`,
        user_id: user?.id || 'mock-user',
        name: `${folderName} Template ${i}`,
        image_url: imageUrl,
        design_areas: [{ x: 100, y: 100, width: 200, height: 200 }],
        text_areas: [{ x: 100, y: 300, width: 200, height: 50 }],
        logo_area: { x: 50, y: 50, width: 100, height: 100 },
        design_type: designType,
        product_category: currentFolder === 't-shirts' ? 't-shirt' : 
                          currentFolder === 'mugs' ? 'mug' : 
                          currentFolder === 'posters' ? 'poster' : 
                          currentFolder === 'hoodies' ? 'hoodie' : 
                          'other',
        folder_path: currentFolder || 'default',
        folder_name: folderName,
        is_default: i === 1, // First template is default
        created_at: new Date(Date.now() - i * 86400000).toISOString(), // i days ago
        updated_at: new Date(Date.now() - i * 43200000).toISOString() // i/2 days ago
      });
    }
    
    setTemplates(mockTemplates);
    setDemoMode(true);
    console.log(`✅ ${mockTemplates.length} mock templates loaded`);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required!');
      return;
    }

    try {
      console.log('🔄 Creating new folder:', newFolderName);
      
      // Generate folder path from name (lowercase, replace spaces with hyphens)
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if folder already exists
      if (folders.some(f => f.path === folderPath)) {
        setError('A folder with this name already exists!');
        return;
      }
      
      // If in demo mode, just update state
      if (demoMode) {
        console.log('📋 Demo mode: Creating folder in state only');
        const newFolder: TemplateFolder = {
          id: `folder-${Date.now()}`,
          name: newFolderName,
          path: folderPath,
          template_count: 0
        };
        
        setFolders(prev => [...prev, newFolder]);
        setNewFolderName('');
        setShowCreateFolderModal(false);
        return;
      }
      
      // In real mode, create folder in Supabase
      // This is a bit tricky since we're using a view for folders
      // We'll create a dummy template in the new folder to make it appear
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${newFolderName} Template`,
          image_url: 'https://via.placeholder.com/400x400?text=New+Template',
          design_areas: [],
          text_areas: [],
          design_type: 'black',
          product_category: 'other',
          folder_path: folderPath,
          folder_name: newFolderName,
          is_default: false
        });

      if (error) {
        console.error('❌ Folder creation error:', error);
        throw error;
      }

      console.log('✅ Folder created successfully');
      
      // Reload folders
      await loadFolders();
      
      // Reset form
      setNewFolderName('');
      setShowCreateFolderModal(false);
    } catch (error) {
      console.error('❌ Folder creation general error:', error);
      setError('Failed to create folder. Please try again later.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed!');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB!');
      return;
    }
    
    setUploadFile(file);
    setUploadName(file.name.split('.')[0]); // Set default name from filename
    setShowUploadModal(true);
  };

  const uploadTemplate = async () => {
    if (!uploadFile || !uploadName.trim()) {
      setError('File and template name are required!');
      return;
    }

    try {
      setUploading(true);
      console.log('🔄 Uploading template:', uploadName);
      
      // If in demo mode, just update state
      if (demoMode) {
        console.log('📋 Demo mode: Creating template in state only');
        
        // Create a URL for the file
        const imageUrl = URL.createObjectURL(uploadFile);
        
        // Create mock template
        const newTemplate: MockupTemplate = {
          id: `template-${Date.now()}`,
          user_id: user?.id || 'mock-user',
          name: uploadName,
          image_url: imageUrl,
          design_areas: [{ x: 100, y: 100, width: 200, height: 200 }],
          text_areas: [{ x: 100, y: 300, width: 200, height: 50 }],
          design_type: uploadDesignType,
          product_category: uploadProductCategory,
          folder_path: currentFolder || 'default',
          folder_name: currentFolder ? 
            folders.find(f => f.path === currentFolder)?.name || 'Unknown Folder' : 
            'Default Templates',
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setTemplates(prev => [newTemplate, ...prev]);
        
        // Update folder template count
        setFolders(prev => prev.map(folder => 
          folder.path === (currentFolder || 'default') 
            ? { ...folder, template_count: folder.template_count + 1 } 
            : folder
        ));
        
        // Reset form
        setUploadFile(null);
        setUploadName('');
        setShowUploadModal(false);
        
        console.log('✅ Template created successfully (demo mode)');
        return;
      }
      
      // In real mode, upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('mockup-templates')
        .upload(filePath, uploadFile);
      
      if (fileError) {
        console.error('❌ File upload error:', fileError);
        throw fileError;
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('mockup-templates')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Create template in database
      const { error: templateError } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: uploadName,
          image_url: publicUrl,
          design_areas: [],
          text_areas: [],
          design_type: uploadDesignType,
          product_category: uploadProductCategory,
          folder_path: currentFolder || 'default',
          folder_name: currentFolder ? 
            folders.find(f => f.path === currentFolder)?.name || 'Unknown Folder' : 
            'Default Templates',
          is_default: false
        });
      
      if (templateError) {
        console.error('❌ Template creation error:', templateError);
        throw templateError;
      }
      
      console.log('✅ Template created successfully');
      
      // Reload templates
      await loadTemplates();
      
      // Reset form
      setUploadFile(null);
      setUploadName('');
      setShowUploadModal(false);
    } catch (error) {
      console.error('❌ Template upload general error:', error);
      setError('Failed to upload template. Please try again later.');
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      console.log('🔄 Deleting template:', templateId);
      
      // If in demo mode, just update state
      if (demoMode) {
        console.log('📋 Demo mode: Deleting template from state only');
        
        // Get template to delete
        const templateToDelete = templates.find(t => t.id === templateId);
        
        // Remove from state
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        
        // Update folder template count
        if (templateToDelete) {
          setFolders(prev => prev.map(folder => 
            folder.path === templateToDelete.folder_path 
              ? { ...folder, template_count: Math.max(0, folder.template_count - 1) } 
              : folder
          ));
        }
        
        console.log('✅ Template deleted successfully (demo mode)');
        return;
      }
      
      // In real mode, delete from Supabase
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
      
      // Reload templates and folders
      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('❌ Template deletion general error:', error);
      setError('Failed to delete template. Please try again later.');
    }
  };

  const deleteFolder = async (folderPath: string) => {
    // Check if folder has templates
    const folderTemplates = templates.filter(t => t.folder_path === folderPath);
    
    if (folderTemplates.length > 0) {
      if (!window.confirm(`This folder contains ${folderTemplates.length} templates. Are you sure you want to delete it? All templates in this folder will be moved to the Default folder.`)) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this empty folder?')) {
        return;
      }
    }

    try {
      console.log('🔄 Deleting folder:', folderPath);
      
      // If in demo mode, just update state
      if (demoMode) {
        console.log('📋 Demo mode: Deleting folder from state only');
        
        // If folder has templates, move them to Default folder
        if (folderTemplates.length > 0) {
          setTemplates(prev => prev.map(template => 
            template.folder_path === folderPath 
              ? { 
                  ...template, 
                  folder_path: 'default', 
                  folder_name: 'Default Templates' 
                } 
              : template
          ));
          
          // Update folder template counts
          setFolders(prev => prev.map(folder => 
            folder.path === 'default' 
              ? { ...folder, template_count: folder.template_count + folderTemplates.length } 
              : folder
          ));
        }
        
        // Remove folder from state
        setFolders(prev => prev.filter(f => f.path !== folderPath));
        
        // If we're in the deleted folder, go back to root
        if (currentFolder === folderPath) {
          setCurrentFolder('');
        }
        
        console.log('✅ Folder deleted successfully (demo mode)');
        return;
      }
      
      // In real mode, update templates to move them to Default folder
      if (folderTemplates.length > 0) {
        const { error } = await supabase
          .from('mockup_templates')
          .update({ 
            folder_path: 'default', 
            folder_name: 'Default Templates' 
          })
          .eq('folder_path', folderPath)
          .eq('user_id', user?.id);

        if (error) {
          console.error('❌ Template update error:', error);
          throw error;
        }
      }
      
      // Delete the folder's dummy template if it exists
      // This is a bit of a hack since we're using a view for folders
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
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folderPath) {
        setCurrentFolder('');
      }
      
      // Reload templates and folders
      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('❌ Folder deletion general error:', error);
      setError('Failed to delete folder. Please try again later.');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      console.log('🔄 Duplicating template:', template.name);
      
      // If in demo mode, just update state
      if (demoMode) {
        console.log('📋 Demo mode: Duplicating template in state only');
        
        // Create duplicate template
        const duplicateTemplate: MockupTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          name: `${template.name} (Copy)`,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Add to state
        setTemplates(prev => [duplicateTemplate, ...prev]);
        
        // Update folder template count
        setFolders(prev => prev.map(folder => 
          folder.path === template.folder_path 
            ? { ...folder, template_count: folder.template_count + 1 } 
            : folder
        ));
        
        console.log('✅ Template duplicated successfully (demo mode)');
        return;
      }
      
      // In real mode, duplicate in Supabase
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
          folder_path: template.folder_path,
          folder_name: template.folder_name,
          is_default: false
        });

      if (error) {
        console.error('❌ Template duplication error:', error);
        throw error;
      }

      console.log('✅ Template duplicated successfully');
      
      // Reload templates and folders
      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('❌ Template duplication general error:', error);
      setError('Failed to duplicate template. Please try again later.');
    }
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

  const getDesignTypeColor = (type: string) => {
    const colors = {
      'black': 'bg-gray-900 text-white',
      'white': 'bg-gray-100 text-gray-900 border border-gray-300',
      'color': 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
    };
    return colors[type as keyof typeof colors] || colors.black;
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
      
      // If in demo mode, just update state
      if (demoMode) {
        console.log('📋 Demo mode: Deleting templates from state only');
        
        // Get templates to delete
        const templatesToDelete = templates.filter(t => selectedTemplates.includes(t.id));
        
        // Remove from state
        setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
        
        // Update folder template counts
        const folderCounts: Record<string, number> = {};
        templatesToDelete.forEach(template => {
          const folderPath = template.folder_path || 'default';
          folderCounts[folderPath] = (folderCounts[folderPath] || 0) + 1;
        });
        
        setFolders(prev => prev.map(folder => 
          folderCounts[folder.path] 
            ? { ...folder, template_count: Math.max(0, folder.template_count - folderCounts[folder.path]) } 
            : folder
        ));
        
        // Clear selection
        setSelectedTemplates([]);
        
        console.log('✅ Templates deleted successfully (demo mode)');
        return;
      }
      
      // In real mode, delete from Supabase
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) {
        console.error('❌ Bulk template deletion error:', error);
        throw error;
      }

      console.log('✅ Templates deleted successfully');
      
      // Clear selection
      setSelectedTemplates([]);
      
      // Reload templates and folders
      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('❌ Bulk template deletion general error:', error);
      setError('Failed to delete templates. Please try again later.');
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

  return (
    <div className="p-6 space-y-6">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Demo Mode Active
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                You're viewing sample mockup templates. Changes won't be saved to the database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize your mockup templates in folders ({templates.length} templates)
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
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
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Template Info */}
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Design Type:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getDesignTypeColor(template.design_type)}`}>
                              {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{formatDate(template.created_at)}</span>
                          </div>
                          {template.is_default && (
                            <div className="flex justify-center">
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs">
                                Default Template
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          <Button
                            onClick={() => {
                              // TODO: Implement edit functionality
                              alert('Edit functionality will be implemented soon!');
                            }}
                            size="sm"
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => {
                              // TODO: Implement use functionality
                              alert('Use template functionality will be implemented soon!');
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
                          Design Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
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
                            <span className={`px-2 py-1 rounded-full text-xs ${getDesignTypeColor(template.design_type)}`}>
                              {template.design_type.charAt(0).toUpperCase() + template.design_type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(template.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {template.is_default ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs">
                                Default
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  alert('Edit functionality will be implemented soon!');
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload Template
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Template Preview */}
              {uploadFile && (
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Template Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name:
                </label>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. T-Shirt Mockup Front View"
                  className="w-full"
                />
              </div>
              
              {/* Design Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Design Type:
                </label>
                <select
                  value={uploadDesignType}
                  onChange={(e) => setUploadDesignType(e.target.value as 'black' | 'white' | 'color')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="black">Black Design</option>
                  <option value="white">White Design</option>
                  <option value="color">Color Design</option>
                </select>
              </div>
              
              {/* Folder Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folder:
                </label>
                <select
                  value={currentFolder || 'default'}
                  disabled={!!currentFolder} // Disable if already in a folder
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="default">Default Templates</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.path}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                {currentFolder && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Template will be added to the current folder: {getCurrentFolderName()}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={uploadTemplate}
                  className="flex-1"
                  disabled={uploading || !uploadFile || !uploadName.trim()}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>Upload</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadName('');
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={uploading}
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