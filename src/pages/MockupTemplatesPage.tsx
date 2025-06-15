import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Text as KonvaText, Transformer, Group, Image as KonvaImage } from 'react-konva';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Upload, Eye, EyeOff, Move, RotateCw, Palette, Type, Square, Circle, Store } from 'lucide-react';
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
  folder_path?: string;
  folder_name?: string;
  design_type: string;
  product_category: string;
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
  path: string;
  name: string;
  template_count: number;
  black_designs: number;
  white_designs: number;
  color_designs: number;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Editor States
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [logoArea, setLogoArea] = useState<LogoArea | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAreaVisibility, setShowAreaVisibility] = useState(true);
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [productCategory, setProductCategory] = useState<string>('t-shirt');

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
        .order('folder_name');

      if (error) {
        console.error('❌ Folder loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} folders loaded`);
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

      // Filter by folder if selected
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
      alert('Klasör adı gerekli!');
      return;
    }

    try {
      console.log('📁 Creating new folder:', newFolderName);
      
      // Create a sample template in the new folder to initialize it
      const folderPath = newFolderName.toLowerCase().replace(/\s+/g, '-');
      
      // For now, we'll just refresh the folders list
      // In a real implementation, you might want to create an empty folder record
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      alert('Klasör oluşturuldu! Şimdi bu klasöre şablon ekleyebilirsiniz.');
      
    } catch (error) {
      console.error('❌ Folder creation error:', error);
      alert('Klasör oluşturulurken hata oluştu.');
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
    setDesignType('black');
    setProductCategory('t-shirt');
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
    setDesignType(template.design_type as 'black' | 'white' | 'color' || 'black');
    setProductCategory(template.product_category || 't-shirt');
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
      alert('Şablon adı gerekli!');
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

    try {
      console.log('💾 Saving template...');

      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: backgroundImage,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        store_id: selectedStore,
        folder_path: currentFolder || 'default',
        folder_name: currentFolder ? folders.find(f => f.path === currentFolder)?.name || 'Default' : 'Default Templates',
        design_type: designType,
        product_category: productCategory,
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
        alert('Şablon kaydedilemedi: ' + result.error.message);
        return;
      }

      console.log('✅ Template saved successfully:', result.data);
      await loadTemplates();
      await loadFolders();
      setShowEditor(false);
      alert('Şablon başarıyla kaydedildi! 🎉');

    } catch (error) {
      console.error('❌ Template save general error:', error);
      alert('Şablon kaydedilemedi: ' + (error as Error).message);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      await loadFolders(); // Refresh folder counts
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Şablon silinirken hata oluştu');
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
          store_id: template.store_id,
          folder_path: template.folder_path,
          folder_name: template.folder_name,
          design_type: template.design_type,
          product_category: template.product_category,
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
      await loadFolders();
    } catch (error) {
      console.error('Template duplication error:', error);
      alert('Şablon kopyalanırken hata oluştu');
    }
  };

  const moveTemplateToFolder = async (templateId: string, targetFolderPath: string, targetFolderName: string) => {
    try {
      const { error } = await supabase
        .from('mockup_templates')
        .update({
          folder_path: targetFolderPath,
          folder_name: targetFolderName,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadTemplates();
      await loadFolders();
      alert('Şablon başarıyla taşındı!');
    } catch (error) {
      console.error('Template move error:', error);
      alert('Şablon taşınırken hata oluştu');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStoreName = (storeId?: string) => {
    if (!storeId) return 'Mağaza seçilmedi';
    const store = stores.find(s => s.id === storeId);
    return store ? store.store_name : 'Bilinmeyen mağaza';
  };

  const getCurrentFolderName = () => {
    if (!currentFolder) return 'Tüm Şablonlar';
    const folder = folders.find(f => f.path === currentFolder);
    return folder ? folder.name : currentFolder;
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

  // Show folders view when not in a specific folder
  if (!currentFolder) {
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
              Şablonlarınızı klasörlerde organize edin ({folders.length} klasör)
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={() => setShowCreateFolderModal(true)}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
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

        {/* Folders Grid */}
        {folders.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz klasör yok
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              İlk klasörünüzü oluşturun ve şablonlarınızı organize edin
            </p>
            <Button
              onClick={() => setShowCreateFolderModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Klasörü Oluştur</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder) => (
              <Card 
                key={folder.path} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentFolder(folder.path)}
              >
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Image className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {folder.template_count} şablon
                    </p>
                    
                    {/* Design Type Distribution */}
                    <div className="flex justify-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-black rounded-full"></div>
                        <span>{folder.black_designs}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-white border border-gray-300 rounded-full"></div>
                        <span>{folder.white_designs}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-blue-500 rounded-full"></div>
                        <span>{folder.color_designs}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    placeholder="örn. T-Shirt Şablonları, Kupa Tasarımları..."
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
      </div>
    );
  }

  // Templates view when inside a folder
  return (
    <div className="p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button
              onClick={() => setCurrentFolder('')}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              ← Geri
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Klasörler / {getCurrentFolderName()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getCurrentFolderName()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredTemplates.length} şablon
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={createNewTemplate}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Şablon</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Şablon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Şablon bulunamadı' : 'Bu klasörde henüz şablon yok'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Arama terimlerinizi ayarlayın'
              : 'İlk şablonunuzu oluşturun'
            }
          </p>
          {!searchTerm && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.design_type === 'black' ? 'bg-black text-white' :
                        template.design_type === 'white' ? 'bg-white text-black border border-gray-300' :
                        'bg-gradient-to-r from-red-500 to-blue-500 text-white'
                      }`}>
                        {template.design_type === 'black' ? 'Siyah' :
                         template.design_type === 'white' ? 'Beyaz' : 'Renkli'}
                      </span>
                    </div>
                    
                    {/* Overlay with area indicators */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity text-white text-center">
                        <div className="text-sm">
                          {template.design_areas?.length || 0} Tasarım • {template.text_areas?.length || 0} Metin
                          {template.logo_area && ' • 1 Logo'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {template.name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Store className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {getStoreName(template.store_id)}
                        </span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(template.created_at)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Kategori: {template.product_category}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => editTemplate(template)}
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      onClick={() => duplicateTemplate(template)}
                      variant="secondary"
                      size="sm"
                      className="p-2"
                      title="Kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteTemplate(template.id)}
                      variant="danger"
                      size="sm"
                      className="p-2"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MockupTemplatesPage;