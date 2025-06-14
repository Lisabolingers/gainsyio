import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Grid, List, Save, Download, Store, Upload, Move, RotateCw, Type, Palette, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useFonts } from '../hooks/useFonts';

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
}

interface DesignArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

interface TextArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  font_family: string;
  font_size: number;
  color: string;
  placeholder_text: string;
}

interface LogoArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

interface EtsyStore {
  id: string;
  store_name: string;
  store_url?: string;
  is_active: boolean;
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const { allFonts } = useFonts();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  
  // Editor state
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [textAreas, setTextAreas] = useState<TextArea[]>([]);
  const [logoArea, setLogoArea] = useState<LogoArea | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAreas, setShowAreas] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadStores();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Mockup template\'ler yükleniyor...');
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup template yüklendi`);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Template yükleme genel hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      console.log('🔄 Etsy mağazaları yükleniyor...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'etsy')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Mağaza yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy mağazası yüklendi`);
      setStores(data || []);
      
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Mağaza yükleme genel hatası:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addDesignArea = () => {
    const newArea: DesignArea = {
      id: `design-${Date.now()}`,
      name: `Tasarım Alanı`,
      x: 200,
      y: 200,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 0.8
    };
    setDesignAreas([newArea]);
    setSelectedArea(newArea.id);
  };

  const addTextArea = () => {
    const newArea: TextArea = {
      id: `text-${Date.now()}`,
      name: `Yazı Alanı ${textAreas.length + 1}`,
      x: 150,
      y: 150,
      width: 300,
      height: 60,
      rotation: 0,
      font_family: 'Arial',
      font_size: 24,
      color: '#000000',
      placeholder_text: 'Örnek metin'
    };
    setTextAreas([...textAreas, newArea]);
    setSelectedArea(newArea.id);
  };

  const addLogoArea = () => {
    if (logoArea) return; // Sadece bir logo alanı
    
    const newArea: LogoArea = {
      id: `logo-${Date.now()}`,
      name: 'Logo Alanı',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 0.9
    };
    setLogoArea(newArea);
    setSelectedArea(newArea.id);
  };

  // CRITICAL: Canvas tıklama işleyicisi - SADECE background'a tıklandığında seçimi kaldır
  const handleCanvasClick = (e: React.MouseEvent) => {
    // CRITICAL: Sadece canvas'ın kendisine (background) tıklandığında seçimi kaldır
    if (e.target === canvasRef.current) {
      console.log('🖱️ Canvas background\'ına tıklandı, seçim kaldırılıyor');
      setSelectedArea(null);
    }
  };

  // CRITICAL: Area tıklama işleyicisi - seçimi ayarla ve event propagation'ı durdur
  const handleAreaClick = (e: React.MouseEvent, areaId: string) => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Event'in canvas'a ulaşmasını engelle
    console.log(`🖱️ Area tıklandı: ${areaId}`);
    setSelectedArea(areaId);
  };

  // CRITICAL: Geliştirilmiş mouse event handlers
  const handleMouseDown = (e: React.MouseEvent, areaId: string, action: 'move' | 'resize' = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`🖱️ Mouse down: ${areaId}, action: ${action}`);
    
    setSelectedArea(areaId);
    
    if (action === 'move') {
      setIsDragging(true);
      setIsResizing(false);
    } else {
      setIsResizing(true);
      setIsDragging(false);
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const area = [...designAreas, ...textAreas, ...(logoArea ? [logoArea] : [])].find(a => a.id === areaId);
      if (area) {
        setDragOffset({
          x: e.clientX - rect.left - area.x,
          y: e.clientY - rect.top - area.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedArea || (!isDragging && !isResizing)) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging) {
      const newX = Math.max(0, Math.min(600 - 50, mouseX - dragOffset.x));
      const newY = Math.max(0, Math.min(600 - 50, mouseY - dragOffset.y));
      
      console.log(`🔄 Dragging ${selectedArea} to: ${newX}, ${newY}`);
      updateAreaPosition(selectedArea, newX, newY);
    } else if (isResizing) {
      const area = [...designAreas, ...textAreas, ...(logoArea ? [logoArea] : [])].find(a => a.id === selectedArea);
      if (area) {
        const newWidth = Math.max(30, mouseX - area.x);
        const newHeight = Math.max(20, mouseY - area.y);
        
        console.log(`🔄 Resizing ${selectedArea} to: ${newWidth}x${newHeight}`);
        updateAreaSize(selectedArea, newWidth, newHeight);
      }
    }
  };

  const handleMouseUp = () => {
    console.log('🖱️ Mouse up - stopping drag/resize');
    setIsDragging(false);
    setIsResizing(false);
  };

  // CRITICAL: Global mouse events for better drag experience
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!selectedArea || (!isDragging && !isResizing)) return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      if (isDragging) {
        const newX = Math.max(0, Math.min(600 - 50, mouseX - dragOffset.x));
        const newY = Math.max(0, Math.min(600 - 50, mouseY - dragOffset.y));
        updateAreaPosition(selectedArea, newX, newY);
      } else if (isResizing) {
        const area = [...designAreas, ...textAreas, ...(logoArea ? [logoArea] : [])].find(a => a.id === selectedArea);
        if (area) {
          const newWidth = Math.max(30, mouseX - area.x);
          const newHeight = Math.max(20, mouseY - area.y);
          updateAreaSize(selectedArea, newWidth, newHeight);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, selectedArea, dragOffset]);

  const updateAreaPosition = (areaId: string, x: number, y: number) => {
    console.log(`📍 Updating position for ${areaId}: ${x}, ${y}`);
    
    if (areaId.startsWith('design-')) {
      setDesignAreas(prev => prev.map(area => 
        area.id === areaId ? { ...area, x, y } : area
      ));
    } else if (areaId.startsWith('text-')) {
      setTextAreas(prev => prev.map(area => 
        area.id === areaId ? { ...area, x, y } : area
      ));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const updateAreaSize = (areaId: string, width: number, height: number) => {
    console.log(`📏 Updating size for ${areaId}: ${width}x${height}`);
    
    if (areaId.startsWith('design-')) {
      setDesignAreas(prev => prev.map(area => 
        area.id === areaId ? { ...area, width, height } : area
      ));
    } else if (areaId.startsWith('text-')) {
      setTextAreas(prev => prev.map(area => 
        area.id === areaId ? { ...area, width, height } : area
      ));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(prev => prev ? { ...prev, width, height } : null);
    }
  };

  // CRITICAL: TAMAMEN YENİDEN YAZILMIŞ font boyutu güncelleme fonksiyonu
  const updateTextAreaProperty = (areaId: string, property: string, value: any) => {
    console.log(`🔄 Text area property güncelleniyor: ${areaId}, ${property} = ${value} (type: ${typeof value})`);
    
    setTextAreas(prev => {
      const updated = prev.map(area => {
        if (area.id === areaId) {
          let processedValue = value;
          
          // CRITICAL: Font boyutu için özel işlem
          if (property === 'font_size') {
            // String'den number'a çevir
            const numValue = typeof value === 'string' ? parseInt(value, 10) : Number(value);
            processedValue = isNaN(numValue) ? 24 : Math.max(8, Math.min(72, numValue));
            console.log(`📝 Font size işlendi: "${value}" -> ${processedValue} (number)`);
          }
          
          const updatedArea = { ...area, [property]: processedValue };
          console.log(`✅ Area güncellendi:`, updatedArea);
          return updatedArea;
        }
        return area;
      });
      
      console.log(`🔄 Tüm text areas:`, updated);
      return updated;
    });
  };

  const deleteArea = (areaId: string) => {
    if (areaId.startsWith('design-')) {
      setDesignAreas(prev => prev.filter(area => area.id !== areaId));
    } else if (areaId.startsWith('text-')) {
      setTextAreas(prev => prev.filter(area => area.id !== areaId));
    } else if (areaId.startsWith('logo-')) {
      setLogoArea(null);
    }
    setSelectedArea(null);
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !backgroundImage) {
      alert('Template adı ve background görsel gerekli!');
      return;
    }

    try {
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: backgroundImage,
        design_areas: designAreas,
        text_areas: textAreas,
        ...(logoArea && { logo_area: logoArea }),
        is_default: false
      };

      const { data, error } = await supabase
        .from('mockup_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Template başarıyla kaydedildi:', data);
      await loadTemplates();
      resetEditor();
      setShowCreateModal(false);
      
      alert('Template başarıyla kaydedildi! 🎉');
    } catch (error) {
      console.error('❌ Template kaydetme hatası:', error);
      alert('Template kaydedilirken hata oluştu.');
    }
  };

  const resetEditor = () => {
    setBackgroundImage('');
    setTemplateName('');
    setDesignAreas([]);
    setTextAreas([]);
    setLogoArea(null);
    setSelectedArea(null);
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
    } catch (error) {
      console.error('Template silme hatası:', error);
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
          ...(template.logo_area && { logo_area: template.logo_area }),
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Template kopyalama hatası:', error);
      alert('Template kopyalanırken hata oluştu');
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

  const getSelectedAreaDetails = () => {
    if (!selectedArea) return null;
    
    const area = [...designAreas, ...textAreas, ...(logoArea ? [logoArea] : [])].find(a => a.id === selectedArea);
    return area;
  };

  // CRITICAL: Resize handle component
  const ResizeHandle: React.FC<{ areaId: string; position: 'se' }> = ({ areaId, position }) => (
    <div
      className="absolute w-3 h-3 bg-orange-500 border border-white cursor-se-resize"
      style={{
        right: position === 'se' ? -6 : undefined,
        bottom: position === 'se' ? -6 : undefined,
      }}
      onMouseDown={(e) => handleMouseDown(e, areaId, 'resize')}
    />
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
            Ürün mockupları için template oluşturun ve yönetin ({templates.length} template)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Template</span>
          </Button>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etsy Mağazası Seçin:
            </label>
            {stores.length > 0 ? (
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Mağaza seçin...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.store_name} {store.store_url && `(${store.store_url})`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Henüz Etsy mağazası eklenmemiş. 
                <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                  Mağaza ekleyin
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Template ara..."
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

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Template bulunamadı' : 'Henüz mockup template yok'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Arama terimlerinizi değiştirmeyi deneyin'
              : 'İlk mockup template\'inizi oluşturmaya başlayın'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Template\'i Oluştur</span>
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
                      onClick={() => duplicateTemplate(template)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Template\'i kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Template\'i sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Template Preview */}
                  <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden h-40">
                    {template.image_url && (
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <div className="text-white text-xs text-center">
                        <div>Tasarım: {template.design_areas.length}</div>
                        <div>Yazı: {template.text_areas.length}</div>
                        <div>Logo: {template.logo_area ? 1 : 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Oluşturulma: {formatDate(template.created_at)}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    Kullan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Yeni Mockup Template Oluştur
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetEditor();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex h-[calc(95vh-120px)]">
              {/* Left Panel - Controls */}
              <div className="w-80 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="space-y-6">
                  {/* Template Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Template Adı:
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template adı girin..."
                      className="w-full"
                    />
                  </div>

                  {/* Background Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Background Görsel:
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500 transition-colors"
                    >
                      {backgroundImage ? (
                        <img src={backgroundImage} alt="Background" className="w-full h-32 object-cover rounded" />
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Görsel yüklemek için tıklayın
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Add Areas */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Alan Ekle:</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={addDesignArea}
                        variant="secondary"
                        className="w-full justify-start"
                        disabled={designAreas.length > 0}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Tasarım Alanı {designAreas.length > 0 && '(Eklendi)'}
                      </Button>
                      <Button
                        onClick={addTextArea}
                        variant="secondary"
                        className="w-full justify-start"
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Yazı Alanı Ekle
                      </Button>
                      <Button
                        onClick={addLogoArea}
                        variant="secondary"
                        className="w-full justify-start"
                        disabled={logoArea !== null}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Logo Alanı {logoArea && '(Eklendi)'}
                      </Button>
                    </div>
                  </div>

                  {/* Area Properties - Simplified */}
                  {selectedArea && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Seçili Alan Özellikleri
                      </h3>
                      {(() => {
                        const area = getSelectedAreaDetails();
                        if (!area) return null;

                        return (
                          <div className="space-y-3">
                            {/* Text Area Specific Properties - Simplified */}
                            {selectedArea.startsWith('text-') && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Yazı Metni:</label>
                                  <textarea
                                    value={(area as TextArea).placeholder_text}
                                    onChange={(e) => updateTextAreaProperty(area.id, 'placeholder_text', e.target.value)}
                                    className="w-full text-sm p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 resize-none"
                                    rows={2}
                                    placeholder="Örnek metin girin..."
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font:</label>
                                  <select
                                    value={(area as TextArea).font_family}
                                    onChange={(e) => updateTextAreaProperty(area.id, 'font_family', e.target.value)}
                                    className="w-full text-sm p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                                  >
                                    {allFonts.map((font) => (
                                      <option key={font.value} value={font.display} className="text-gray-900 dark:text-white bg-white dark:bg-gray-700">
                                        {font.display}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Font Boyutu: {(area as TextArea).font_size}px
                                  </label>
                                  <input
                                    type="number"
                                    value={(area as TextArea).font_size}
                                    onChange={(e) => {
                                      console.log(`🔄 Font size input değişti: "${e.target.value}" (${typeof e.target.value})`);
                                      updateTextAreaProperty(area.id, 'font_size', e.target.value);
                                    }}
                                    className="w-full text-sm p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                                    min="8"
                                    max="72"
                                    step="1"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Renk:</label>
                                  <input
                                    type="color"
                                    value={(area as TextArea).color}
                                    onChange={(e) => updateTextAreaProperty(area.id, 'color', e.target.value)}
                                    className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
                                  />
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={() => deleteArea(area.id)}
                              variant="danger"
                              size="sm"
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Alanı Sil
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Toggle Areas Visibility */}
                  <Button
                    onClick={() => setShowAreas(!showAreas)}
                    variant="secondary"
                    className="w-full"
                  >
                    {showAreas ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showAreas ? 'Alanları Gizle' : 'Alanları Göster'}
                  </Button>

                  {/* Save Button */}
                  <Button
                    onClick={saveTemplate}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={!templateName.trim() || !backgroundImage}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Template\'i Kaydet
                  </Button>
                </div>
              </div>

              {/* Right Panel - Canvas */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="flex items-center justify-center min-h-full">
                  <div
                    ref={canvasRef}
                    className="relative bg-white border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg select-none"
                    style={{ width: '600px', height: '600px' }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleCanvasClick}
                  >
                    {/* Background Image */}
                    {backgroundImage && (
                      <img
                        src={backgroundImage}
                        alt="Background"
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    )}

                    {/* Design Areas */}
                    {showAreas && designAreas.map((area) => (
                      <div
                        key={area.id}
                        className={`absolute border-2 cursor-move select-none ${
                          selectedArea === area.id 
                            ? 'border-orange-500 bg-orange-500 bg-opacity-20' 
                            : 'border-blue-500 bg-blue-500 bg-opacity-20'
                        }`}
                        style={{
                          left: area.x,
                          top: area.y,
                          width: area.width,
                          height: area.height,
                          transform: `rotate(${area.rotation}deg)`,
                          opacity: area.opacity
                        }}
                        onClick={(e) => handleAreaClick(e, area.id)}
                        onMouseDown={(e) => handleMouseDown(e, area.id, 'move')}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 pointer-events-none">
                          {area.name}
                        </div>
                        {selectedArea === area.id && (
                          <ResizeHandle areaId={area.id} position="se" />
                        )}
                      </div>
                    ))}

                    {/* Text Areas */}
                    {showAreas && textAreas.map((area) => (
                      <div
                        key={area.id}
                        className={`absolute border-2 cursor-move select-none ${
                          selectedArea === area.id 
                            ? 'border-orange-500 bg-orange-500 bg-opacity-20' 
                            : 'border-green-500 bg-green-500 bg-opacity-20'
                        }`}
                        style={{
                          left: area.x,
                          top: area.y,
                          width: area.width,
                          height: area.height,
                          transform: `rotate(${area.rotation}deg)`,
                          fontFamily: area.font_family,
                          fontSize: `${area.font_size}px`,
                          color: area.color
                        }}
                        onClick={(e) => handleAreaClick(e, area.id)}
                        onMouseDown={(e) => handleMouseDown(e, area.id, 'move')}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium p-1 overflow-hidden pointer-events-none">
                          {area.placeholder_text}
                        </div>
                        {selectedArea === area.id && (
                          <ResizeHandle areaId={area.id} position="se" />
                        )}
                      </div>
                    ))}

                    {/* Logo Area */}
                    {showAreas && logoArea && (
                      <div
                        className={`absolute border-2 cursor-move select-none ${
                          selectedArea === logoArea.id 
                            ? 'border-orange-500 bg-orange-500 bg-opacity-20' 
                            : 'border-purple-500 bg-purple-500 bg-opacity-20'
                        }`}
                        style={{
                          left: logoArea.x,
                          top: logoArea.y,
                          width: logoArea.width,
                          height: logoArea.height,
                          transform: `rotate(${logoArea.rotation}deg)`,
                          opacity: logoArea.opacity
                        }}
                        onClick={(e) => handleAreaClick(e, logoArea.id)}
                        onMouseDown={(e) => handleMouseDown(e, logoArea.id, 'move')}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 pointer-events-none">
                          {logoArea.name}
                        </div>
                        {selectedArea === logoArea.id && (
                          <ResizeHandle areaId={logoArea.id} position="se" />
                        )}
                      </div>
                    )}

                    {/* Empty State */}
                    {!backgroundImage && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                        <div className="text-center">
                          <Image className="h-16 w-16 mx-auto mb-4" />
                          <p>Background görsel yükleyin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockupTemplatesPage;