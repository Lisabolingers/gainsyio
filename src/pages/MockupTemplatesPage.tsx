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

const MockupTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);

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
      loadTemplates();
      loadStores();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading mockup templates...');
      
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

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

      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: backgroundImage,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
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
        alert('Template could not be saved: ' + result.error.message);
        return;
      }

      console.log('✅ Template saved successfully:', result.data);
      await loadTemplates();
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
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    } catch (error) {
      console.error('Template deletion error:', error);
      alert('Error occurred while deleting template');
    }
  };

  const duplicateTemplate = async (template: MockupTemplate) => {
    try {
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
          is_default: false
        });

      if (error) throw error;

      await loadTemplates();
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

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            Mockup Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your mockup templates ({templates.length} templates)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={createNewTemplate}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
      </div>

      {/* Search */}
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

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No templates found' : 'No mockup templates yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first mockup template to get started'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={createNewTemplate}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Template</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    
                    {/* Overlay with area indicators */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <div className="opacity-0 hover:opacity-100 transition-opacity text-white text-center">
                        <div className="text-sm">
                          {template.design_areas?.length || 0} Design • {template.text_areas?.length || 0} Text
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
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => editTemplate(template)}
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => duplicateTemplate(template)}
                      variant="secondary"
                      size="sm"
                      className="p-2"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteTemplate(template.id)}
                      variant="danger"
                      size="sm"
                      className="p-2"
                      title="Delete"
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