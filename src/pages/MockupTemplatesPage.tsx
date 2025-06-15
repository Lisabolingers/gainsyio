import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text as KonvaText, Transformer, Group, Image as KonvaImage } from 'react-konva';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Upload, Eye, EyeOff, Move, RotateCw, Palette, Type, Square, Circle, Store, Folder, FolderOpen, ArrowLeft, FolderPlus, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
  design_type: 'black' | 'white' | 'color';
  product_category: string;
  folder_path: string;
  folder_name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
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

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

interface TemplateFolder {
  folder_path: string;
  folder_name: string;
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
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'folders' | 'templates'>('folders');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Editor States
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [productCategory, setProductCategory] = useState('');
  const [templateFolder, setTemplateFolder] = useState('default');
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [logoArea, setLogoArea] = useState<LogoArea | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAreaVisibility, setShowAreaVisibility] = useState(true);

  // Transformer visibility control state
  const [showTransformer, setShowTransformer] = useState(false);

  // Logo Selector States
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  const stageRef = useRef<any>();
  const transformerRef = useRef<any>();
  const groupRefs = useRef<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas scaling
  const maxContainerSize = 600;
  const scale = Math.min(maxContainerSize / canvasSize.width, maxContainerSize / canvasSize.height, 1);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadStores();
      if (currentFolder) {
        loadTemplates();
      }
    }
  }, [user, currentFolder]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading mockup template folders...');
      
      const { data, error } = await supabase
        .from('mockup_template_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('folder_name');

      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} folders loaded`);
      setFolders(data || []);
    } catch (error) {
      console.error('❌ Folder loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    if (!currentFolder) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading templates for folder:', currentFolder);
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id)
        .eq('folder_path', currentFolder)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} templates loaded for folder`);
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
      alert('Klasör adı gerekli!');
      return;
    }

    try {
      console.log('📁 Creating new folder:', newFolderName);
      
      // Create a sample template in the new folder to initialize it
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const sampleTemplate = {
        user_id: user?.id,
        name: `${newFolderName} - Sample Template`,
        image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NzM4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1vY2t1cCBUZW1wbGF0ZTwvdGV4dD48L3N2Zz4=',
        design_areas: [],
        text_areas: [],
        logo_area: null,
        design_type: 'black',
        product_category: 'General',
        folder_path: folderPath,
        folder_name: newFolderName,
        store_id: selectedStore || null,
        is_default: false
      };

      const { error } = await supabase
        .from('mockup_templates')
        .insert(sampleTemplate);

      if (error) {
        console.error('❌ Folder creation error:', error);
        throw error;
      }

      console.log('✅ Folder created successfully');
      await loadFolders();
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      alert('Klasör başarıyla oluşturuldu! 🎉');
    } catch (error) {
      console.error('❌ Folder creation general error:', error);
      alert('Klasör oluşturulurken hata oluştu.');
    }
  };

  const deleteFolder = async (folderPath: string) => {
    const folder = folders.find(f => f.folder_path === folderPath);
    if (!folder) return;

    if (!window.confirm(`"${folder.folder_name}" klasörünü ve içindeki ${folder.template_count} template'i silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting folder:', folderPath);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('user_id', user?.id)
        .eq('folder_path', folderPath);

      if (error) throw error;

      console.log('✅ Folder deleted successfully');
      await loadFolders();
      
      // If we're currently viewing the deleted folder, go back to folders view
      if (currentFolder === folderPath) {
        setCurrentFolder('');
        setViewMode('folders');
      }
      
      alert('Klasör başarıyla silindi!');
    } catch (error) {
      console.error('❌ Folder deletion error:', error);
      alert('Klasör silinirken hata oluştu');
    }
  };

  const moveTemplatesToFolder = async (targetFolderPath: string) => {
    if (selectedTemplates.length === 0) {
      alert('Taşınacak template seçin!');
      return;
    }

    const targetFolder = folders.find(f => f.folder_path === targetFolderPath);
    if (!targetFolder) {
      alert('Hedef klasör bulunamadı!');
      return;
    }

    try {
      console.log('📦 Moving templates to folder:', targetFolderPath);
      
      const { error } = await supabase
        .from('mockup_templates')
        .update({
          folder_path: targetFolderPath,
          folder_name: targetFolder.folder_name,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      console.log('✅ Templates moved successfully');
      await loadTemplates();
      await loadFolders();
      setSelectedTemplates([]);
      setShowMoveModal(false);
      
      alert(`${selectedTemplates.length} template "${targetFolder.folder_name}" klasörüne taşındı! 🎉`);
    } catch (error) {
      console.error('❌ Template move error:', error);
      alert('Template'ler taşınırken hata oluştu');
    }
  };

  const createNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setBackgroundImage('');
    setSelectedStore(stores.length > 0 ? stores[0].id : '');
    setDesignType('black');
    setProductCategory('');
    setTemplateFolder(currentFolder || 'default');
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
    setDesignType(template.design_type);
    setProductCategory(template.product_category);
    setTemplateFolder(template.folder_path);
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
      alert('Template adı gerekli!');
      return;
    }

    if (!backgroundImage) {
      alert('Arka plan resmi gerekli!');
      return;
    }

    if (!selectedStore) {
      alert('Mağaza seçimi gerekli!');
      return;
    }

    if (!productCategory.trim()) {
      alert('Ürün kategorisi gerekli!');
      return;
    }

    try {
      console.log('💾 Saving template...');

      const folderInfo = folders.find(f => f.folder_path === templateFolder);
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: backgroundImage,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        product_category: productCategory,
        folder_path: templateFolder,
        folder_name: folderInfo?.folder_name || 'Default Templates',
        store_id: selectedStore,
        is_default: false
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
        alert('Template kaydedilemedi: ' + result.error.message);
        return;
      }

      console.log('✅ Template saved successfully:', result.data);
      await loadTemplates();
      await loadFolders();
      setShowEditor(false);
      alert('Template başarıyla kaydedildi! 🎉');

    } catch (error) {
      console.error('❌ Template save general error:', error);
      alert('Template kaydedilemedi: ' + (error as Error).message);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Bu template\'i silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      await loadFolders();
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Template silinirken hata oluştu');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
      const { error } = await supabase
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
          store_id: template.store_id,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('Template duplication error:', error);
      alert('Template kopyalanırken hata oluştu');
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir!');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Dosya boyutu 20MB\'dan küçük olmalı!');
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
      alert('Arka plan yüklenirken hata oluştu');
    }
  };

  const addDesignArea = () => {
    if (designAreas.length >= 1) {
      alert('Sadece 1 tasarım alanı ekleyebilirsiniz!');
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
      text: 'Örnek Metin',
      fontSize: 72,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      placeholder: 'Metninizi girin...',
      maxChars: 100,
      visible: true
    };

    setTextAreas(prev => [...prev, newArea]);
    setSelectedId(newArea.id);
    setShowTransformer(true);
  };

  const addLogoArea = () => {
    if (logoArea) {
      alert('Sadece 1 logo alanı ekleyebilirsiniz!');
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
      alert('Logo yüklenirken hata oluştu');
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

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.folder_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDesignTypeColor = (type: string) => {
    const colors = {
      'black': 'bg-gray-900 text-white',
      'white': 'bg-gray-100 text-gray-900 border border-gray-300',
      'color': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    };
    return colors[type as keyof typeof colors] || colors.black;
  };

  const getDesignTypeIcon = (type: string) => {
    switch (type) {
      case 'black': return '⚫';
      case 'white': return '⚪';
      case 'color': return '🌈';
      default: return '⚫';
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

  const getCurrentFolderName = () => {
    const folder = folders.find(f => f.folder_path === currentFolder);
    return folder ? folder.folder_name : 'Bilinmeyen Klasör';
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
                ← Geri
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTemplate ? 'Template Düzenle' : 'Yeni Template Oluştur'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={saveTemplate} disabled={!templateName || !backgroundImage || !selectedStore || !productCategory}>
                💾 Kaydet
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
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                <Input
                  placeholder="Template adı"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <Input
                  placeholder="Ürün kategorisi (örn: T-Shirt)"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                />
                <select
                  value={designType}
                  onChange={(e) => setDesignType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="black">⚫ Siyah Tasarım</option>
                  <option value="white">⚪ Beyaz Tasarım</option>
                  <option value="color">🌈 Renkli Tasarım</option>
                </select>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                >
                  📁 Mockup Yükle
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
                            text="TASARIM"
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
                                text="LOGO\n(Tıkla)"
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
                <p>💡 <strong>İpucu:</strong> Template kaydetmek için ad, kategori ve tasarım alanı ekleyin.</p>
                <p>Canvas boyutu: {canvasSize.width} × {canvasSize.height} px</p>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Add Areas */}
              <Card>
                <CardHeader>
                  <CardTitle>Alan Ekle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={addDesignArea}
                    className="w-full"
                    disabled={designAreas.length >= 1}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Tasarım Alanı {designAreas.length >= 1 && '(Maks 1)'}
                  </Button>
                  <Button
                    onClick={addTextArea}
                    variant="secondary"
                    className="w-full"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Metin Alanı
                  </Button>
                  <Button
                    onClick={addLogoArea}
                    variant="secondary"
                    className="w-full"
                    disabled={!!logoArea}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Logo Alanı {logoArea && '(Maks 1)'}
                  </Button>
                </CardContent>
              </Card>

              {/* Store and Folder Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Ayarlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Mağaza:
                    </label>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Mağaza seçin...</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.store_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Klasör:
                    </label>
                    <select
                      value={templateFolder}
                      onChange={(e) => setTemplateFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    >
                      {folders.map((folder) => (
                        <option key={folder.folder_path} value={folder.folder_path}>
                          {folder.folder_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Area Properties */}
              {selectedId && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {selectedId.startsWith('design-') && '🔷 Tasarım Alanı'}
                        {selectedId.startsWith('text-') && '📝 Metin Alanı'}
                        {selectedId.startsWith('logo-') && '🖼️ Logo Alanı'}
                      </CardTitle>
                      <Button
                        onClick={() => deleteArea(selectedId)}
                        variant="danger"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Seçili alanı düzenlemek için transformer kullanın.
                    </p>
                  </CardContent>
                </Card>
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

  // Main Templates View
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Mockup Templates
            {currentFolder && (
              <>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-orange-500">{getCurrentFolderName()}</span>
              </>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {viewMode === 'folders' 
              ? `Mockup template klasörlerinizi yönetin (${folders.length} klasör)`
              : `${getCurrentFolderName()} klasöründeki template'ler (${templates.length} template)`
            }
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {currentFolder && (
            <Button
              onClick={() => {
                setCurrentFolder('');
                setViewMode('folders');
              }}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Klasörlere Dön</span>
            </Button>
          )}
          {viewMode === 'folders' && (
            <Button
              onClick={() => setShowCreateFolderModal(true)}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Yeni Klasör</span>
            </Button>
          )}
          <Button
            onClick={createNewTemplate}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Template</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder={viewMode === 'folders' ? "Klasör ara..." : "Template ara..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Bulk Actions for Templates */}
      {viewMode === 'templates' && selectedTemplates.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedTemplates.length} template seçildi
            </span>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowMoveModal(true)} 
                variant="secondary" 
                size="sm"
              >
                <Move className="h-4 w-4 mr-1" />
                Klasöre Taşı
              </Button>
              <Button onClick={() => setSelectedTemplates([])} variant="secondary" size="sm">
                Seçimi Temizle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Folders View */}
      {viewMode === 'folders' && (
        <>
          {filteredFolders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Klasör bulunamadı' : 'Henüz klasör yok'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? 'Arama terimlerinizi ayarlayın'
                  : 'İlk klasörünüzü oluşturun'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>İlk Klasörü Oluştur</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFolders.map((folder) => (
                <Card 
                  key={folder.folder_path} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => {
                    setCurrentFolder(folder.folder_path);
                    setViewMode('templates');
                  }}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Folder Icon and Actions */}
                      <div className="flex items-center justify-between">
                        <FolderOpen className="h-12 w-12 text-orange-500" />
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFolder(folder.folder_path);
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title="Klasörü sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Folder Info */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                          {folder.folder_name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {folder.template_count} template
                        </p>
                      </div>

                      {/* Design Type Stats */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{folder.black_designs}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{folder.white_designs}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{folder.color_designs}</span>
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Son güncelleme: {formatDate(folder.last_updated)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Templates View */}
      {viewMode === 'templates' && (
        <>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Template bulunamadı' : 'Bu klasörde template yok'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? 'Arama terimlerinizi ayarlayın'
                  : 'İlk template\'inizi oluşturun'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={createNewTemplate}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>İlk Template\'i Oluştur</span>
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
                  Tümünü seç ({filteredTemplates.length} template)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Selection Checkbox */}
                        <div className="flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={selectedTemplates.includes(template.id)}
                            onChange={() => toggleTemplateSelection(template.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => editTemplate(template)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicateTemplate(template)}
                              className="text-green-500 hover:text-green-700 p-1"
                              title="Kopyala"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

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

                          {/* Area Count */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                            {(template.design_areas?.length || 0) + (template.text_areas?.length || 0) + (template.logo_area ? 1 : 0)} alan
                          </div>
                        </div>

                        {/* Template Info */}
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {template.name}
                          </h3>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Kategori: {template.product_category}</div>
                            <div>Oluşturulma: {formatDate(template.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

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
                  placeholder="örn: T-Shirt Tasarımları"
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && createFolder()}
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
                Template'leri Taşı
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedTemplates.length} template seçildi
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hedef Klasör:
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {folders.filter(f => f.folder_path !== currentFolder).map((folder) => (
                    <button
                      key={folder.folder_path}
                      onClick={() => moveTemplatesToFolder(folder.folder_path)}
                      className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Folder className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {folder.folder_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {folder.template_count} template
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowMoveModal(false)}
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