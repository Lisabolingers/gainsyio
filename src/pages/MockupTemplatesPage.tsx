import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Upload, Move, Eye, EyeOff, X, Layers, MousePointer, RotateCw, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Stage, Layer, Rect, Circle, Group, Transformer, Text as KonvaText } from 'react-konva';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: any[];
  text_areas: any[];
  logo_area?: any;
  design_type: 'standard' | 'black' | 'white';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface DesignArea {
  id: string;
  type: 'design' | 'text' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  name: string;
  // Text area specific properties
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  placeholder?: string;
  maxCharacters?: number;
  alignment?: 'left' | 'center' | 'right';
}

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // CRITICAL: Enhanced canvas ve template oluşturma state'leri
  const [templateName, setTemplateName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [designType, setDesignType] = useState<'black' | 'white'>('black');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [designAreas, setDesignAreas] = useState<DesignArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAreaVisibility, setShowAreaVisibility] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
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

  // CRITICAL: Enhanced background image upload with auto-sizing
  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin!');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu çok büyük! Maksimum 10MB olmalı.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBackgroundImage(result);
      
      // Auto-detect canvas size from image with reasonable limits
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 900;
        let { width, height } = img;
        
        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        
        setCanvasSize({ width, height });
        console.log(`📐 Canvas boyutu ayarlandı: ${width}x${height}`);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // CRITICAL: Enhanced add design area with smart positioning
  const addDesignArea = (type: 'design' | 'text' | 'logo') => {
    // Limit logo areas to 1
    if (type === 'logo' && designAreas.some(area => area.type === 'logo')) {
      alert('Sadece bir logo alanı ekleyebilirsiniz!');
      return;
    }

    // Limit design areas to 1
    if (type === 'design' && designAreas.some(area => area.type === 'design')) {
      alert('Sadece bir tasarım alanı ekleyebilirsiniz!');
      return;
    }

    // Smart positioning - avoid overlaps
    const existingAreas = designAreas.filter(a => a.type === type);
    const offset = existingAreas.length * 20;
    
    const newArea: DesignArea = {
      id: `${type}-${Date.now()}`,
      type,
      x: Math.min(canvasSize.width / 2 - 75 + offset, canvasSize.width - 150),
      y: Math.min(canvasSize.height / 2 - 75 + offset, canvasSize.height - 150),
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 60 : 150,
      rotation: 0,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Area ${existingAreas.length + 1}`,
      // Text area defaults
      ...(type === 'text' && {
        fontFamily: 'Arial',
        fontSize: 24,
        textColor: designType === 'black' ? '#000000' : '#FFFFFF',
        placeholder: 'Örnek metin...',
        maxCharacters: 100,
        alignment: 'center' as const
      })
    };
    
    setDesignAreas(prev => [...prev, newArea]);
    setSelectedAreaId(newArea.id);
    console.log(`✅ ${type} alanı eklendi:`, newArea);
  };

  // CRITICAL: Enhanced delete design area
  const deleteDesignArea = (areaId: string) => {
    const area = designAreas.find(a => a.id === areaId);
    if (!area) return;

    if (window.confirm(`"${area.name}" alanını silmek istediğinizden emin misiniz?`)) {
      setDesignAreas(prev => prev.filter(area => area.id !== areaId));
      if (selectedAreaId === areaId) {
        setSelectedAreaId(null);
      }
      console.log(`🗑️ Alan silindi: ${area.name}`);
    }
  };

  // CRITICAL: Enhanced update area properties with validation
  const updateAreaProperty = (areaId: string, property: string, value: any) => {
    setDesignAreas(prev => 
      prev.map(area => {
        if (area.id !== areaId) return area;
        
        // Validate numeric values
        if (['x', 'y', 'width', 'height', 'fontSize', 'maxCharacters'].includes(property)) {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(numValue) || numValue < 0) return area;
          
          // Apply constraints
          if (property === 'width' || property === 'height') {
            value = Math.max(30, Math.min(canvasSize[property === 'width' ? 'width' : 'height'], numValue));
          }
          if (property === 'x') {
            value = Math.max(0, Math.min(canvasSize.width - area.width, numValue));
          }
          if (property === 'y') {
            value = Math.max(0, Math.min(canvasSize.height - area.height, numValue));
          }
          if (property === 'fontSize') {
            value = Math.max(8, Math.min(72, numValue));
          }
          if (property === 'maxCharacters') {
            value = Math.max(1, Math.min(500, numValue));
          }
        }
        
        return { ...area, [property]: value };
      })
    );
  };

  // CRITICAL: Enhanced area selection on canvas
  const handleAreaClick = (areaId: string) => {
    setSelectedAreaId(areaId);
    console.log(`🎯 Alan seçildi: ${areaId}`);
  };

  // CRITICAL: Enhanced area drag with constraints
  const handleAreaDragEnd = (areaId: string, e: any) => {
    const newX = Math.max(0, Math.min(canvasSize.width - 150, e.target.x()));
    const newY = Math.max(0, Math.min(canvasSize.height - 150, e.target.y()));
    updateAreaProperty(areaId, 'x', newX);
    updateAreaProperty(areaId, 'y', newY);
  };

  // CRITICAL: Enhanced area transform with constraints
  const handleAreaTransformEnd = (areaId: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale
    node.scaleX(1);
    node.scaleY(1);
    
    const newWidth = Math.max(30, Math.min(canvasSize.width, node.width() * scaleX));
    const newHeight = Math.max(30, Math.min(canvasSize.height, node.height() * scaleY));
    const newX = Math.max(0, Math.min(canvasSize.width - newWidth, node.x()));
    const newY = Math.max(0, Math.min(canvasSize.height - newHeight, node.y()));
    
    updateAreaProperty(areaId, 'width', newWidth);
    updateAreaProperty(areaId, 'height', newHeight);
    updateAreaProperty(areaId, 'x', newX);
    updateAreaProperty(areaId, 'y', newY);
    updateAreaProperty(areaId, 'rotation', node.rotation());
  };

  // CRITICAL: Enhanced save template with validation
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Lütfen template adı girin!');
      return;
    }

    if (!backgroundImage) {
      alert('Lütfen background görsel yükleyin!');
      return;
    }

    if (designAreas.length === 0) {
      alert('En az bir alan eklemelisiniz!');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Mockup template kaydediliyor...');

      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: backgroundImage,
        design_areas: designAreas.filter(area => area.type === 'design'),
        text_areas: designAreas.filter(area => area.type === 'text'),
        logo_area: designAreas.find(area => area.type === 'logo') || null,
        design_type: designType,
        is_default: false
      };

      const { data, error } = await supabase
        .from('mockup_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('❌ Template kaydetme hatası:', error);
        throw error;
      }

      console.log('✅ Template başarıyla kaydedildi:', data);
      await loadTemplates();
      
      // Reset form
      setTemplateName('');
      setBackgroundImage('');
      setDesignAreas([]);
      setSelectedAreaId(null);
      setShowCreateModal(false);
      
      alert('Template başarıyla kaydedildi! 🎉');
    } catch (error) {
      console.error('❌ Template kaydetme genel hatası:', error);
      alert('Template kaydedilemedi.');
    } finally {
      setSaving(false);
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
          logo_area: template.logo_area,
          design_type: template.design_type,
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

    if (!window.confirm(`${selectedTemplates.length} template\'i silmek istediğinizden emin misiniz?`)) return;

    try {
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => !selectedTemplates.includes(t.id)));
      setSelectedTemplates([]);
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('Template\'ler silinirken hata oluştu');
    }
  };

  // CRITICAL: Enhanced canvas scale calculation
  const maxCanvasWidth = 700;
  const maxCanvasHeight = 500;
  const scale = Math.min(
    maxCanvasWidth / canvasSize.width,
    maxCanvasHeight / canvasSize.height,
    1
  );

  // CRITICAL: Get area color based on type
  const getAreaColor = (type: string, isSelected: boolean = false) => {
    const colors = {
      design: isSelected ? '#3b82f6' : '#60a5fa',
      text: isSelected ? '#22c55e' : '#4ade80',
      logo: isSelected ? '#a855f7' : '#c084fc'
    };
    return colors[type as keyof typeof colors] || colors.design;
  };

  // CRITICAL: Get area icon
  const getAreaIcon = (type: string) => {
    switch (type) {
      case 'design': return '🎨';
      case 'text': return '📝';
      case 'logo': return '🏷️';
      default: return '📦';
    }
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
            Ürün mockup template'lerinizi oluşturun ve yönetin ({templates.length} template)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Template Oluştur</span>
          </Button>
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

      {/* Bulk Actions */}
      {selectedTemplates.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedTemplates.length} template seçildi
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Seçilenleri Sil
              </Button>
              <Button onClick={() => setSelectedTemplates([])} variant="secondary" size="sm">
                Seçimi Temizle
              </Button>
            </div>
          </div>
        </div>
      )}

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

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        {template.image_url ? (
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Image className="h-8 w-8" />
                          </div>
                        )}
                        
                        {/* Design Type Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.design_type === 'black' 
                              ? 'bg-gray-800 text-white' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'
                          }`}>
                            {template.design_type === 'black' ? '⚫ Black' : '⚪ White'}
                          </span>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Tasarım Alanları:</span>
                          <span className="font-medium">{template.design_areas?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Yazı Alanları:</span>
                          <span className="font-medium">{template.text_areas?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Logo Alanı:</span>
                          <span className="font-medium">{template.logo_area ? 'Var' : 'Yok'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Oluşturulma:</span>
                          <span>{formatDate(template.created_at)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button variant="secondary" size="sm" className="flex-1">
                          Kullan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                      İsim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tasarım Tipi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Alanlar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Oluşturulma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {template.image_url ? (
                              <img
                                className="h-10 w-10 rounded object-cover"
                                src={template.image_url}
                                alt={template.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Image className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          template.design_type === 'black' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'
                        }`}>
                          {template.design_type === 'black' ? '⚫ Black Design' : '⚪ White Design'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          <div>Tasarım: {template.design_areas?.length || 0}</div>
                          <div>Yazı: {template.text_areas?.length || 0}</div>
                          <div>Logo: {template.logo_area ? '1' : '0'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(template.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundUpload}
        className="hidden"
      />

      {/* CRITICAL: Enhanced Create Template Modal - POPUP ÜST BOŞLUK DÜZELTİLDİ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full h-[95vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🎨 Yeni Mockup Template Oluştur
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setTemplateName('');
                    setBackgroundImage('');
                    setDesignAreas([]);
                    setSelectedAreaId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* CRITICAL: ENHANCED LAYOUT - SOL TARAF MENÜLER, SAĞ TARAF CANVAS */}
            <div className="flex h-[calc(95vh-120px)]">
              {/* CRITICAL: SOL TARAF - ENHANCED MENÜLER */}
              <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
                <div className="space-y-6">
                  {/* Template Adı */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📝 Template Adı:
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Örn: T-shirt Mockup, Poster Template..."
                      className="w-full"
                    />
                  </div>

                  {/* Background Görsel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🖼️ Background Görsel:
                    </label>
                    <div className="space-y-3">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        className="w-full flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Görsel Yüklemek İçin Tıklayın</span>
                      </Button>
                      {backgroundImage && (
                        <div className="relative">
                          <img
                            src={backgroundImage}
                            alt="Background preview"
                            className="w-full h-32 object-cover rounded border"
                          />
                          <button
                            onClick={() => setBackgroundImage('')}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CRITICAL: Enhanced Tasarım Tipi Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      🎨 Tasarım Tipi Seçin:
                    </label>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setDesignType('black')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                          designType === 'black' 
                            ? 'border-gray-800 bg-gray-800 text-white' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">⚫</div>
                          <div className="font-medium">Black Design</div>
                          <div className="text-xs opacity-75">Siyah tasarım için</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setDesignType('white')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                          designType === 'white' 
                            ? 'border-gray-300 bg-gray-100 text-gray-800' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">⚪</div>
                          <div className="font-medium">White Design</div>
                          <div className="text-xs opacity-75">Beyaz tasarım için</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* CRITICAL: Enhanced Alan Ekleme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      ➕ Alan Ekle:
                    </label>
                    <div className="space-y-2">
                      <Button
                        onClick={() => addDesignArea('design')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
                        disabled={!backgroundImage || designAreas.some(a => a.type === 'design')}
                      >
                        <span>🎨</span>
                        <span>Tasarım Alanı {designAreas.some(a => a.type === 'design') ? '(Mevcut)' : 'Ekle'}</span>
                      </Button>
                      <Button
                        onClick={() => addDesignArea('text')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2"
                        disabled={!backgroundImage}
                      >
                        <span>📝</span>
                        <span>Yazı Alanı Ekle</span>
                      </Button>
                      <Button
                        onClick={() => addDesignArea('logo')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center space-x-2"
                        disabled={!backgroundImage || designAreas.some(a => a.type === 'logo')}
                      >
                        <span>🏷️</span>
                        <span>Logo Alanı {designAreas.some(a => a.type === 'logo') ? '(Mevcut)' : 'Ekle'}</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Tasarım ve Logo alanı sadece 1 tane eklenebilir
                    </p>
                  </div>

                  {/* Canvas Boyutu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📐 Canvas Boyutu:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Genişlik"
                        value={canvasSize.width}
                        onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                        min="100"
                        max="2000"
                      />
                      <Input
                        type="number"
                        placeholder="Yükseklik"
                        value={canvasSize.height}
                        onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                        min="100"
                        max="2000"
                      />
                    </div>
                  </div>

                  {/* CRITICAL: Enhanced Eklenen Alanlar Listesi */}
                  {designAreas.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          📋 Eklenen Alanlar ({designAreas.length}):
                        </label>
                        <button
                          onClick={() => setShowAreaVisibility(!showAreaVisibility)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showAreaVisibility ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {designAreas.map((area) => (
                          <div
                            key={area.id}
                            className={`p-3 rounded border cursor-pointer transition-all duration-200 ${
                              selectedAreaId === area.id
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:shadow-sm'
                            }`}
                            onClick={() => setSelectedAreaId(area.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getAreaIcon(area.type)}</span>
                                  <div className="font-medium text-sm">{area.name}</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  📍 {Math.round(area.x)}, {Math.round(area.y)} • 
                                  📏 {Math.round(area.width)}×{Math.round(area.height)}
                                  {area.rotation !== 0 && ` • 🔄 ${Math.round(area.rotation)}°`}
                                </div>
                                {area.type === 'text' && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    🔤 {area.fontFamily} • {area.fontSize}px • {area.textColor}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDesignArea(area.id);
                                }}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CRITICAL: Enhanced Selected Area Properties */}
                  {selectedAreaId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <MousePointer className="h-4 w-4 mr-2" />
                        Seçili Alan Özellikleri
                      </h4>
                      {(() => {
                        const selectedArea = designAreas.find(a => a.id === selectedAreaId);
                        if (!selectedArea) return null;
                        
                        return (
                          <div className="space-y-3">
                            {/* Name */}
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400">Alan Adı:</label>
                              <Input
                                value={selectedArea.name}
                                onChange={(e) => updateAreaProperty(selectedAreaId, 'name', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            
                            {/* Position and Size */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">X:</label>
                                <Input
                                  type="number"
                                  value={selectedArea.x}
                                  onChange={(e) => updateAreaProperty(selectedAreaId, 'x', e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Y:</label>
                                <Input
                                  type="number"
                                  value={selectedArea.y}
                                  onChange={(e) => updateAreaProperty(selectedAreaId, 'y', e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Genişlik:</label>
                                <Input
                                  type="number"
                                  value={selectedArea.width}
                                  onChange={(e) => updateAreaProperty(selectedAreaId, 'width', e.target.value)}
                                  className="text-sm"
                                  min="30"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">Yükseklik:</label>
                                <Input
                                  type="number"
                                  value={selectedArea.height}
                                  onChange={(e) => updateAreaProperty(selectedAreaId, 'height', e.target.value)}
                                  className="text-sm"
                                  min="30"
                                />
                              </div>
                            </div>

                            {/* Text Area Specific Properties */}
                            {selectedArea.type === 'text' && (
                              <div className="space-y-2 border-t pt-3">
                                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">📝 Yazı Özellikleri:</h5>
                                
                                <div>
                                  <label className="text-xs text-gray-600 dark:text-gray-400">Font:</label>
                                  <select
                                    value={selectedArea.fontFamily}
                                    onChange={(e) => updateAreaProperty(selectedAreaId, 'fontFamily', e.target.value)}
                                    className="w-full text-sm p-1 border rounded"
                                  >
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Georgia">Georgia</option>
                                  </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Font Boyutu:</label>
                                    <Input
                                      type="number"
                                      value={selectedArea.fontSize}
                                      onChange={(e) => updateAreaProperty(selectedAreaId, 'fontSize', e.target.value)}
                                      className="text-sm"
                                      min="8"
                                      max="72"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400">Renk:</label>
                                    <input
                                      type="color"
                                      value={selectedArea.textColor}
                                      onChange={(e) => updateAreaProperty(selectedAreaId, 'textColor', e.target.value)}
                                      className="w-full h-8 rounded border"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-600 dark:text-gray-400">Placeholder:</label>
                                  <Input
                                    value={selectedArea.placeholder}
                                    onChange={(e) => updateAreaProperty(selectedAreaId, 'placeholder', e.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-600 dark:text-gray-400">Max Karakter:</label>
                                  <Input
                                    type="number"
                                    value={selectedArea.maxCharacters}
                                    onChange={(e) => updateAreaProperty(selectedAreaId, 'maxCharacters', e.target.value)}
                                    className="text-sm"
                                    min="1"
                                    max="500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-600 dark:text-gray-400">Hizalama:</label>
                                  <select
                                    value={selectedArea.alignment}
                                    onChange={(e) => updateAreaProperty(selectedAreaId, 'alignment', e.target.value)}
                                    className="w-full text-sm p-1 border rounded"
                                  >
                                    <option value="left">Sol</option>
                                    <option value="center">Orta</option>
                                    <option value="right">Sağ</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* CRITICAL: SAĞ TARAF - ENHANCED CANVAS ALANI */}
              <div className="flex-1 p-6 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  {backgroundImage ? (
                    <div 
                      className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg bg-white"
                      style={{
                        width: `${Math.min(canvasSize.width * scale, maxCanvasWidth)}px`,
                        height: `${Math.min(canvasSize.height * scale, maxCanvasHeight)}px`
                      }}
                    >
                      {/* Background Image */}
                      <img
                        src={backgroundImage}
                        alt="Background"
                        className="w-full h-full object-cover"
                      />

                      {/* CRITICAL: Enhanced Konva Stage for Design Areas */}
                      <div className="absolute inset-0">
                        <Stage
                          width={Math.min(canvasSize.width * scale, maxCanvasWidth)}
                          height={Math.min(canvasSize.height * scale, maxCanvasHeight)}
                          ref={stageRef}
                          scaleX={scale}
                          scaleY={scale}
                          onMouseDown={(e) => {
                            // Deselect when clicking on empty space
                            if (e.target === e.target.getStage()) {
                              setSelectedAreaId(null);
                            }
                          }}
                        >
                          <Layer>
                            {showAreaVisibility && designAreas.map((area) => (
                              <Group key={area.id}>
                                {/* Area Rectangle */}
                                <Rect
                                  x={area.x}
                                  y={area.y}
                                  width={area.width}
                                  height={area.height}
                                  fill={`${getAreaColor(area.type, selectedAreaId === area.id)}33`}
                                  stroke={getAreaColor(area.type, selectedAreaId === area.id)}
                                  strokeWidth={selectedAreaId === area.id ? 3 : 2}
                                  dash={area.type === 'text' ? [5, 5] : []}
                                  draggable
                                  onClick={() => handleAreaClick(area.id)}
                                  onDragEnd={(e) => handleAreaDragEnd(area.id, e)}
                                  onTransformEnd={(e) => handleAreaTransformEnd(area.id, e)}
                                />
                                
                                {/* Area Label */}
                                <KonvaText
                                  x={area.x + 5}
                                  y={area.y + 5}
                                  text={`${getAreaIcon(area.type)} ${area.name}`}
                                  fontSize={12}
                                  fill={getAreaColor(area.type, selectedAreaId === area.id)}
                                  fontStyle="bold"
                                />
                                
                                {/* Text Area Preview */}
                                {area.type === 'text' && (
                                  <KonvaText
                                    x={area.x}
                                    y={area.y + area.height / 2 - (area.fontSize || 24) / 2}
                                    width={area.width}
                                    height={area.height}
                                    text={area.placeholder || 'Örnek metin...'}
                                    fontSize={(area.fontSize || 24) * 0.8}
                                    fontFamily={area.fontFamily || 'Arial'}
                                    fill={area.textColor || '#000000'}
                                    align={area.alignment || 'center'}
                                    verticalAlign="middle"
                                  />
                                )}
                              </Group>
                            ))}
                            
                            {/* CRITICAL: Enhanced Transformer */}
                            {selectedAreaId && (
                              <Transformer
                                ref={transformerRef}
                                boundBoxFunc={(oldBox, newBox) => {
                                  // Enhanced constraints
                                  if (newBox.width < 30 || newBox.height < 30) {
                                    return oldBox;
                                  }
                                  if (newBox.x < 0 || newBox.y < 0) {
                                    return oldBox;
                                  }
                                  if (newBox.x + newBox.width > canvasSize.width || newBox.y + newBox.height > canvasSize.height) {
                                    return oldBox;
                                  }
                                  return newBox;
                                }}
                                anchorStroke="#0066ff"
                                anchorFill="#ffffff"
                                anchorSize={8}
                                borderStroke="#0066ff"
                                borderStrokeWidth={2}
                              />
                            )}
                          </Layer>
                        </Stage>
                      </div>

                      {/* Canvas Info Overlay */}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        📐 {canvasSize.width} × {canvasSize.height} | 🔍 {Math.round(scale * 100)}%
                      </div>
                      
                      {/* Area Count Overlay */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        📋 {designAreas.length} alan
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Background Görsel Yükleyin
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Mockup template oluşturmak için önce bir background görsel yükleyin
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Görsel Seç
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CRITICAL: Enhanced Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {backgroundImage && (
                    <div className="flex items-center space-x-4">
                      <span>📐 Canvas: {canvasSize.width} × {canvasSize.height}</span>
                      <span>📋 Alanlar: {designAreas.length}</span>
                      <span>🎨 Tip: {designType === 'black' ? '⚫ Black Design' : '⚪ White Design'}</span>
                      {selectedAreaId && (
                        <span className="text-orange-600 dark:text-orange-400">
                          🎯 Seçili: {designAreas.find(a => a.id === selectedAreaId)?.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowCreateModal(false);
                      setTemplateName('');
                      setBackgroundImage('');
                      setDesignAreas([]);
                      setSelectedAreaId(null);
                    }}
                    variant="secondary"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={saveTemplate}
                    disabled={!templateName.trim() || !backgroundImage || designAreas.length === 0 || saving}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {saving ? 'Kaydediliyor...' : '💾 Template\'i Kaydet'}
                  </Button>
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