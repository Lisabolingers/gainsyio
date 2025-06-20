import React, { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text as KonvaText, Transformer, Group, Image as KonvaImage } from 'react-konva';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, Move, RotateCw, Palette, Type, Square, Circle, Store, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, executeWithTimeout, isConfigValid } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LogoSelector from '../components/AutoTextToImage/LogoSelector';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: DesignArea[];
  text_areas: TextArea[];
  logo_area?: LogoArea;
  store_id?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  design_type?: 'black' | 'white' | 'color';
  product_category?: string;
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
  opacity: number;
  visible: boolean;
}

interface TextArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  placeholder: string;
  maxChars: number;
  visible: boolean;
}

interface LogoArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  logoUrl?: string;
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
  const { user, isDemoMode } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>('');
  const [designTypeFilter, setDesignTypeFilter] = useState<'all' | 'black' | 'white' | 'color'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Editor States
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [logoArea, setLogoArea] = useState<LogoArea | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAreaVisibility, setShowAreaVisibility] = useState(true);
  const [showTransformer, setShowTransformer] = useState(false);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  const stageRef = useRef<any>();
  const transformerRef = useRef<any>();
  const groupRefs = useRef<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas scaling
  const maxContainerSize = 600;
  const scale = Math.min(maxContainerSize / canvasSize.width, maxContainerSize / canvasSize.height, 1);

  // Memoized load templates function to prevent unnecessary rerenders
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading mockup templates...');
      
      // Check if in demo mode
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Using demo data for mockup templates');
        loadDemoTemplates();
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('User is not authenticated');
      }

      console.log('📡 Making request to Supabase for user:', user.id);
      
      let query = supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user.id);
      
      // Filter by current folder if one is selected
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
      }
      
      // Use executeWithTimeout with increased timeout and retries
      const { data, error } = await executeWithTimeout(
        () => query.order('created_at', { ascending: false }),
        45000, // Increased timeout to 45 seconds
        3 // Increased retries to 3
      );

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} mockup templates loaded successfully`);
      setTemplates(data || []);
      setInitialLoadComplete(true);
    } catch (error: any) {
      console.error('❌ Template loading error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load templates';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.message?.includes('Database query failed')) {
        errorMessage = `Database error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Load demo data as fallback
      loadDemoTemplates();
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, currentFolder]);

  const loadDemoTemplates = () => {
    console.log('🎭 Loading demo mockup templates');
    
    // Create demo templates
    const demoTemplates: MockupTemplate[] = [
      {
        id: 'demo-1',
        user_id: user?.id || 'demo-user',
        name: 'T-Shirt Mockup Template',
        image_url: 'https://images.pexels.com/photos/1566412/pexels-photo-1566412.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        design_areas: [
          {
            id: 'design-1',
            x: 500,
            y: 400,
            width: 300,
            height: 300,
            rotation: 0,
            opacity: 0.8,
            visible: true
          }
        ],
        text_areas: [
          {
            id: 'text-1',
            x: 500,
            y: 700,
            width: 400,
            height: 100,
            rotation: 0,
            text: 'Sample Text',
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#000000',
            align: 'center',
            placeholder: 'Enter text...',
            maxChars: 50,
            visible: true
          }
        ],
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        design_type: 'black',
        product_category: 't-shirt',
        folder_path: currentFolder || 'default',
        folder_name: 'Default Templates'
      },
      {
        id: 'demo-2',
        user_id: user?.id || 'demo-user',
        name: 'Mug Mockup Template',
        image_url: 'https://images.pexels.com/photos/1566298/pexels-photo-1566298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
        design_areas: [
          {
            id: 'design-1',
            x: 400,
            y: 300,
            width: 200,
            height: 200,
            rotation: 0,
            opacity: 0.8,
            visible: true
          }
        ],
        text_areas: [],
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        design_type: 'white',
        product_category: 'mug',
        folder_path: currentFolder || 'default',
        folder_name: 'Default Templates'
      }
    ];
    
    // Filter demo templates based on current folder
    const filteredDemoTemplates = currentFolder 
      ? demoTemplates.filter(t => t.folder_path === currentFolder)
      : demoTemplates;
    
    setTemplates(filteredDemoTemplates);
    setError('Using demo data - Database connection not available');
    setInitialLoadComplete(true);
  };

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading template folders...');
      
      // Check if in demo mode
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Using demo data for folders');
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
        return;
      }

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
  }, [user, isDemoMode]);

  // Memoized load stores function to prevent unnecessary rerenders
  const loadStores = useCallback(async () => {
    try {
      console.log('🔄 Loading Etsy stores...');
      
      // Check if in demo mode
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Using demo data for stores');
        setStores([
          { id: 'demo-store-1', store_name: 'Demo Etsy Store', is_active: true },
          { id: 'demo-store-2', store_name: 'Demo Craft Shop', is_active: true }
        ]);
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('User is not authenticated');
      }

      console.log('📡 Making request to Supabase for stores for user:', user.id);
      
      // Use executeWithTimeout with increased timeout and retries
      const { data, error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'etsy')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        30000, // Increased timeout to 30 seconds
        3 // Increased retries to 3
      );

      if (error) {
        console.error('❌ Store loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy stores loaded`);
      setStores(data || []);
      
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error: any) {
      console.error('❌ Store loading error:', error);
      // Don't set error state for stores as it's not critical for the page to function
    }
  }, [user, isDemoMode]);

  // Load data on component mount
  useEffect(() => {
    if (user || isDemoMode) {
      loadTemplates();
      loadFolders();
      loadStores();
    }
  }, [user, isDemoMode, loadTemplates, loadFolders, loadStores, currentFolder]);

  // Memoized filtered templates to prevent unnecessary recalculations
  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDesignType = designTypeFilter === 'all' || template.design_type === designTypeFilter;
      const matchesProductCategory = productCategoryFilter === 'all' || template.product_category === productCategoryFilter;
      
      return matchesSearch && matchesDesignType && matchesProductCategory;
    });
  }, [templates, searchTerm, designTypeFilter, productCategoryFilter]);

  // Get unique product categories for filter
  const productCategories = React.useMemo(() => {
    return ['all', ...new Set(templates.map(t => t.product_category || 't-shirt'))];
  }, [templates]);

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

  const createNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setBackgroundImage('');
    setSelectedStore(stores.length > 0 ? stores[0].id : '');
    setDesignAreas([]);
    setTextAreas([]);
    setLogoArea(null);
    setLogoImage(null);
    setSelectedId(null);
    setShowTransformer(false);
    setCanvasSize({ width: 2000, height: 2000 });
    setShowEditor(true);
  };

  const editTemplate = (template: MockupTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setBackgroundImage(template.image_url);
    setSelectedStore(template.store_id || (stores.length > 0 ? stores[0].id : ''));
    setDesignAreas(template.design_areas || []);
    setTextAreas(template.text_areas || []);
    setLogoArea(template.logo_area || null);
    setSelectedId(null);
    setShowTransformer(false);
    
    // Load logo image
    if (template.logo_area?.logoUrl) {
      const img = new window.Image();
      img.onload = () => {
        setLogoImage(img);
      };
      img.src = template.logo_area.logoUrl;
    } else {
      setLogoImage(null);
    }
    
    if (template.image_url) {
      const img = new window.Image();
      img.onload = () => {
        setCanvasSize({ width: img.width, height: img.height });
      };
      img.src = template.image_url;
    }
    
    setShowEditor(true);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Template name is required!');
      return;
    }

    if (!backgroundImage) {
      alert('Background image is required!');
      return;
    }

    if (!selectedStore) {
      alert('Store selection is required!');
      return;
    }

    try {
      console.log('💾 Saving template...');

      // If in demo mode, just update the state
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Demo mode: Simulating template save');
        
        const templateData = {
          id: editingTemplate?.id || `demo-${Date.now()}`,
          user_id: user?.id || 'demo-user',
          name: templateName,
          image_url: backgroundImage,
          design_areas: designAreas,
          text_areas: textAreas,
          logo_area: logoArea,
          store_id: selectedStore,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          design_type: 'black' as const,
          product_category: 't-shirt',
          folder_path: currentFolder || 'default',
          folder_name: currentFolder ? folders.find(f => f.path === currentFolder)?.name || 'Default Templates' : 'Default Templates'
        };
        
        if (editingTemplate) {
          setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? templateData : t));
        } else {
          setTemplates(prev => [templateData, ...prev]);
        }
        
        setShowEditor(false);
        alert('Template saved successfully! 🎉');
        return;
      }

      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: backgroundImage,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        store_id: selectedStore,
        is_default: false,
        design_type: 'black' as const,
        product_category: 't-shirt',
        folder_path: currentFolder || 'default',
        folder_name: currentFolder ? folders.find(f => f.path === currentFolder)?.name || 'Default Templates' : 'Default Templates'
      };

      let result;

      if (editingTemplate) {
        result = await supabase
          .from('mockup_templates')
          .update({
            ...templateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id)
          .eq('user_id', user?.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('mockup_templates')
          .insert(templateData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Template save error:', result.error);
        alert('Template could not be saved: ' + result.error.message);
        return;
      }

      console.log('✅ Template saved successfully:', result.data);
      await loadTemplates();
      await loadFolders();
      setShowEditor(false);
      alert('Template saved successfully! 🎉');

    } catch (error) {
      console.error('❌ Template save general error:', error);
      alert('Template could not be saved: ' + (error as Error).message);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      // If in demo mode, just update the state
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Demo mode: Simulating template deletion');
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        setSelectedTemplates(prev => prev.filter(id => id !== templateId));
        return;
      }

      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      // Update folder counts
      loadFolders();
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Error occurred while deleting template');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      // If in demo mode, just update the state
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Demo mode: Simulating template duplication');
        
        const duplicatedTemplate = {
          ...template,
          id: `demo-${Date.now()}`,
          name: `${template.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setTemplates(prev => [duplicatedTemplate, ...prev]);
        return;
      }

      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          image_url: template.image_url,
          design_areas: template.design_areas,
          text_areas: template.text_areas,
          logo_area: template.logo_area,
          store_id: template.store_id,
          is_default: false,
          design_type: template.design_type || 'black',
          product_category: template.product_category || 't-shirt',
          folder_path: template.folder_path || 'default',
          folder_name: template.folder_name || 'Default Templates'
        });

      if (error) throw error;

      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('Template duplication error:', error);
      alert('Error occurred while duplicating template');
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only image files can be uploaded!');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be smaller than 20MB!');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setBackgroundImage(base64);
        
        const img = new window.Image();
        img.onload = () => {
          setCanvasSize({ width: img.width, height: img.height });
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Background upload error:', error);
      alert('Error occurred while uploading background');
    }
  };

  const addDesignArea = () => {
    if (designAreas.length >= 1) {
      alert('You can only add 1 design area!');
      return;
    }

    const newArea: DesignArea = {
      id: `design-${Date.now()}`,
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      width: 600,
      height: 600,
      rotation: 0,
      opacity: 0.7,
      visible: true
    };

    setDesignAreas([newArea]);
    setSelectedId(newArea.id);
    setShowTransformer(true);
  };

  const addTextArea = () => {
    const newArea: TextArea = {
      id: `text-${Date.now()}`,
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      width: 800,
      height: 150,
      rotation: 0,
      text: 'Sample Text',
      fontSize: 72,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      placeholder: 'Enter your text...',
      maxChars: 100,
      visible: true
    };

    setTextAreas(prev => [...prev, newArea]);
    setSelectedId(newArea.id);
    setShowTransformer(true);
  };

  const addLogoArea = () => {
    if (logoArea) {
      alert('You can only add 1 logo area!');
      return;
    }

    const newArea: LogoArea = {
      id: `logo-${Date.now()}`,
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      width: 450,
      height: 450,
      rotation: 0,
      opacity: 0.8,
      visible: true
    };

    setLogoArea(newArea);
    setSelectedId(newArea.id);
    setShowTransformer(true);
    
    // Open logo selector
    setShowLogoSelector(true);
  };

  const handleLogoSelect = (logoUrl: string) => {
    console.log('🖼️ Logo selected:', logoUrl);
    
    const img = new window.Image();
    img.onload = () => {
      setLogoImage(img);
      console.log('✅ Logo image loaded:', img.width, 'x', img.height);
    };
    img.onerror = () => {
      console.error('❌ Logo image could not be loaded:', logoUrl);
      alert('Error occurred while loading logo');
    };
    img.src = logoUrl;
    
    if (logoArea) {
      setLogoArea(prev => prev ? { ...prev, logoUrl } : null);
    }
    
    setShowLogoSelector(false);
  };

  const handleLogoAreaClick = () => {
    console.log('🖼️ Logo area clicked, opening logo selector...');
    setSelectedId(logoArea?.id || null);
    setShowTransformer(true);
    setShowLogoSelector(true);
  };

  const deleteArea = (areaId: string) => {
    if (areaId.startsWith('design-')) {
      setDesignAreas([]);
    } else if (areaId.startsWith('text-')) {
      setTextAreas(prev => prev.filter(area => area.id !== areaId));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(null);
      setLogoImage(null);
    }
    
    if (selectedId === areaId) {
      setSelectedId(null);
      setShowTransformer(false);
    }
  };

  // Canvas click handler - clear selection when clicking empty area
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      console.log('🖱️ Empty area clicked, clearing selection and hiding transformer');
      setSelectedId(null);
      setShowTransformer(false);
    }
  };

  // Area click handler - show transformer
  const handleAreaClick = (areaId: string) => {
    console.log('🎯 Area clicked, showing transformer:', areaId);
    setSelectedId(areaId);
    setShowTransformer(true);
  };

  const handleDragEnd = (areaId: string, e: any) => {
    const newX = e.target.x();
    const newY = e.target.y();

    if (areaId.startsWith('design-')) {
      setDesignAreas(prev => prev.map(area => 
        area.id === areaId ? { ...area, x: newX, y: newY } : area
      ));
    } else if (areaId.startsWith('text-')) {
      setTextAreas(prev => prev.map(area => 
        area.id === areaId ? { ...area, x: newX, y: newY } : area
      ));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(prev => prev ? { ...prev, x: newX, y: newY } : null);
    }
  };

  const handleTransformEnd = (areaId: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);

    if (areaId.startsWith('design-')) {
      setDesignAreas(prev => prev.map(area => 
        area.id === areaId ? {
          ...area,
          x: node.x(),
          y: node.y(),
          width: Math.max(100, area.width * scaleX),
          height: Math.max(100, area.height * scaleY),
        } : area
      ));
    } else if (areaId.startsWith('text-')) {
      setTextAreas(prev => prev.map(area => 
        area.id === areaId ? {
          ...area,
          x: node.x(),
          y: node.y(),
          width: Math.max(200, area.width * scaleX),
          height: Math.max(60, area.height * scaleY),
        } : area
      ));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(prev => prev ? {
        ...prev,
        x: node.x(),
        y: node.y(),
        width: Math.max(150, prev.width * scaleX),
        height: Math.max(150, prev.height * scaleY),
      } : null);
    }
  };

  // Show transformer only when showTransformer is true
  useEffect(() => {
    if (!showTransformer || !selectedId) {
      transformerRef.current?.nodes([]);
      return;
    }

    const node = groupRefs.current[selectedId];
    if (node && transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, showTransformer]);

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
      
      // If in demo mode, just update the state
      if (isDemoMode || !isConfigValid) {
        console.log('🎭 Demo mode: Simulating bulk template deletion');
        setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
        setSelectedTemplates([]);
        return;
      }

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

  const updateSelectedArea = (property: string, value: any) => {
    if (!selectedId) return;
    
    if (selectedId.startsWith('design-')) {
      setDesignAreas(prev => prev.map(area => 
        area.id === selectedId ? { ...area, [property]: value } : area
      ));
    } else if (selectedId.startsWith('text-')) {
      setTextAreas(prev => prev.map(area => 
        area.id === selectedId ? { ...area, [property]: value } : area
      ));
    } else if (selectedId.startsWith('logo-')) {
      setLogoArea(prev => prev ? { ...prev, [property]: value } : null);
    }
  };

  const getStoreName = (storeId?: string) => {
    if (!storeId) return 'No store selected';
    const store = stores.find(s => s.id === storeId);
    return store ? store.store_name : 'Unknown store';
  };

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

  const retryLoadTemplates = () => {
    setError(null);
    loadTemplates();
  };

  // Show loading state only on initial load
  if (loading && !initialLoadComplete) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  // Editor View
  if (showEditor) {
    return (
      <div className="h-screen flex flex-col">
        {/* Editor Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowEditor(false)}
                variant="secondary"
                size="sm"
              >
                ← Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={saveTemplate} disabled={!templateName || !backgroundImage || !selectedStore}>
                💾 Save
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
            <div className="flex flex-col items-center">
              {/* Canvas Controls */}
              <div className="mb-4 flex items-center space-x-4">
                <Input
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-64"
                />
                <div className="flex items-center space-x-2">
                  <Store className="h-5 w-5 text-orange-500" />
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select store...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                >
                  📁 Upload Mockup
                </Button>
              </div>

              {/* Canvas */}
              <div 
                className="bg-white border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg"
                style={{ 
                  width: `${maxContainerSize}px`, 
                  height: `${maxContainerSize}px` 
                }}
              >
                <div
                  style={{
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'relative'
                  }}
                >
                  <Stage
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={stageRef}
                    onClick={handleStageClick}
                  >
                    <Layer>
                      {/* Background Image */}
                      {backgroundImage && (
                        <KonvaImage
                          image={(() => {
                            const img = new window.Image();
                            img.src = backgroundImage;
                            return img;
                          })()}
                          width={canvasSize.width}
                          height={canvasSize.height}
                        />
                      )}

                      {/* Design Areas */}
                      {showAreaVisibility && designAreas.map((area) => (
                        <Group
                          key={area.id}
                          ref={(node) => (groupRefs.current[area.id] = node)}
                          x={area.x}
                          y={area.y}
                          draggable={showTransformer && selectedId === area.id}
                          onClick={() => handleAreaClick(area.id)}
                          onDragEnd={(e) => handleDragEnd(area.id, e)}
                          onTransformEnd={(e) => handleTransformEnd(area.id, e)}
                        >
                          <Rect
                            width={area.width}
                            height={area.height}
                            fill="rgba(59, 130, 246, 0.3)"
                            stroke="#3b82f6"
                            strokeWidth={4}
                            offsetX={area.width / 2}
                            offsetY={area.height / 2}
                            opacity={area.opacity}
                            rotation={area.rotation}
                          />
                          <KonvaText
                            text="DESIGN"
                            fontSize={48}
                            fontFamily="Arial"
                            fill="#3b82f6"
                            width={area.width}
                            height={area.height}
                            align="center"
                            verticalAlign="middle"
                            offsetX={area.width / 2}
                            offsetY={area.height / 2}
                          />
                        </Group>
                      ))}

                      {/* Text Areas */}
                      {showAreaVisibility && textAreas.map((area) => (
                        <Group
                          key={area.id}
                          ref={(node) => (groupRefs.current[area.id] = node)}
                          x={area.x}
                          y={area.y}
                          draggable={showTransformer && selectedId === area.id}
                          onClick={() => handleAreaClick(area.id)}
                          onDragEnd={(e) => handleDragEnd(area.id, e)}
                          onTransformEnd={(e) => handleTransformEnd(area.id, e)}
                        >
                          <Rect
                            width={area.width}
                            height={area.height}
                            fill="transparent"
                            stroke="transparent"
                            strokeWidth={0}
                            offsetX={area.width / 2}
                            offsetY={area.height / 2}
                            opacity={0}
                            rotation={area.rotation}
                          />
                          <KonvaText
                            text={area.text}
                            fontSize={area.fontSize}
                            fontFamily={area.fontFamily}
                            fill={area.color}
                            width={area.width}
                            height={area.height}
                            align={area.align}
                            verticalAlign="middle"
                            offsetX={area.width / 2}
                            offsetY={area.height / 2}
                          />
                        </Group>
                      ))}

                      {/* Logo Area */}
                      {showAreaVisibility && logoArea && (
                        <Group
                          key={logoArea.id}
                          ref={(node) => (groupRefs.current[logoArea.id] = node)}
                          x={logoArea.x}
                          y={logoArea.y}
                          draggable={showTransformer && selectedId === logoArea.id}
                          onClick={handleLogoAreaClick}
                          onDragEnd={(e) => handleDragEnd(logoArea.id, e)}
                          onTransformEnd={(e) => handleTransformEnd(logoArea.id, e)}
                        >
                          {logoImage ? (
                            <KonvaImage
                              image={logoImage}
                              width={logoArea.width}
                              height={logoArea.height}
                              offsetX={logoArea.width / 2}
                              offsetY={logoArea.height / 2}
                              opacity={logoArea.opacity}
                              rotation={logoArea.rotation}
                            />
                          ) : (
                            <>
                              <Rect
                                width={logoArea.width}
                                height={logoArea.height}
                                fill="rgba(168, 85, 247, 0.3)"
                                stroke="#a855f7"
                                strokeWidth={4}
                                offsetX={logoArea.width / 2}
                                offsetY={logoArea.height / 2}
                                opacity={logoArea.opacity}
                                rotation={logoArea.rotation}
                              />
                              <KonvaText
                                text="LOGO\n(Click)"
                                fontSize={36}
                                fontFamily="Arial"
                                fill="#a855f7"
                                width={logoArea.width}
                                height={logoArea.height}
                                align="center"
                                verticalAlign="middle"
                                offsetX={logoArea.width / 2}
                                offsetY={logoArea.height / 2}
                              />
                            </>
                          )}
                        </Group>
                      )}

                      {/* Show transformer only when showTransformer is true */}
                      {selectedId && showTransformer && showAreaVisibility && (
                        <Transformer
                          ref={transformerRef}
                          borderStroke="#0066ff"
                          borderStrokeWidth={Math.max(2, 4 / scale)}
                          anchorSize={Math.max(8, 16 / scale)}
                          anchorStroke="#0066ff"
                          anchorFill="#ffffff"
                        />
                      )}
                    </Layer>
                  </Stage>
                </div>
              </div>

              {/* Canvas Info */}
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>💡 <strong>Tip:</strong> To save the template, please add a template name and design area. Logo and text are optional.</p>
                <p>Canvas size: {canvasSize.width} × {canvasSize.height} px</p>
                <p className="mt-2 text-orange-600 dark:text-orange-400">
                  🖱️ <strong>Click empty area to clear selection and view areas only</strong>
                </p>
                {logoArea && !logoImage && (
                  <p className="text-orange-600 dark:text-orange-400 mt-2">
                    🖼️ <strong>Click logo area to select logo from Store Images</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Tools */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Add Elements */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Elements</h3>
                <div className="space-y-3">
                  <Button
                    onClick={addDesignArea}
                    className="w-full flex items-center space-x-2"
                    disabled={designAreas.length >= 1}
                  >
                    <Square className="h-4 w-4" />
                    <span>Add Design Area</span>
                  </Button>
                  <Button
                    onClick={addTextArea}
                    variant="secondary"
                    className="w-full flex items-center space-x-2"
                  >
                    <Type className="h-4 w-4" />
                    <span>Add Text Area</span>
                  </Button>
                  <Button
                    onClick={addLogoArea}
                    variant="secondary"
                    className="w-full flex items-center space-x-2"
                    disabled={!!logoArea}
                  >
                    <Circle className="h-4 w-4" />
                    <span>Add Logo Area</span>
                  </Button>
                </div>
              </div>

              {/* Area Visibility */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visibility</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAreaVisibility(!showAreaVisibility)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                  >
                    {showAreaVisibility ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span>{showAreaVisibility ? 'Hide Areas' : 'Show Areas'}</span>
                  </button>
                </div>
              </div>

              {/* Selected Area Properties */}
              {selectedId && getSelectedArea() && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
                  <div className="space-y-3">
                    {selectedId.startsWith('text-') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Text:
                          </label>
                          <Input
                            value={(getSelectedArea() as TextArea)?.text || ''}
                            onChange={(e) => updateSelectedArea('text', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Font Size:
                          </label>
                          <Input
                            type="number"
                            value={(getSelectedArea() as TextArea)?.fontSize || 72}
                            onChange={(e) => updateSelectedArea('fontSize', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Color:
                          </label>
                          <input
                            type="color"
                            value={(getSelectedArea() as TextArea)?.color || '#000000'}
                            onChange={(e) => updateSelectedArea('color', e.target.value)}
                            className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Opacity:
                      </label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={getSelectedArea()?.opacity || 1}
                        onChange={(e) => updateSelectedArea('opacity', parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <Button
                      onClick={() => deleteArea(selectedId)}
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

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          className="hidden"
        />

        {/* Logo Selector Modal */}
        {showLogoSelector && (
          <LogoSelector
            onSelect={handleLogoSelect}
            onClose={() => setShowLogoSelector(false)}
          />
        )}
      </div>
    );
  }

  // Templates List View
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
            onClick={createNewTemplate}
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
                  onClick={createNewTemplate}
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type || 'black')}`}>
                          {template.design_type === 'black' ? 'Siyah' : 
                           template.design_type === 'white' ? 'Beyaz' : 'Renkli'}
                        </span>
                      </div>
                      
                      {/* Design Areas Indicator */}
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                          {template.design_areas?.length || 0} tasarım alanı
                        </span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Kategori:</span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {(template.product_category || 't-shirt').replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Klasör:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {template.folder_name || 'Default Templates'}
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
                        onClick={() => editTemplate(template)}
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        className="hidden"
      />

      {/* Logo Selector Modal */}
      {showLogoSelector && (
        <LogoSelector
          onSelect={handleLogoSelect}
          onClose={() => setShowLogoSelector(false)}
        />
      )}
    </div>
  );
};

export default MockupTemplatesPage;