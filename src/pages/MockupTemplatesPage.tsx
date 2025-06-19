import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';

interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: any[];
  text_areas: any[];
  logo_area?: any;
  design_type: 'black' | 'white' | 'color';
  store_id?: string;
  product_category?: string;
  folder_path?: string;
  folder_name?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateFolder {
  user_id: string;
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [templateImage, setTemplateImage] = useState<File | null>(null);
  const [templateImageUrl, setTemplateImageUrl] = useState<string>('');
  const [designAreas, setDesignAreas] = useState<any[]>([]);
  const [textAreas, setTextAreas] = useState<any[]>([]);
  const [logoArea, setLogoArea] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
  const [showAreas, setShowAreas] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadFolders();
      loadTemplates();
    }
  }, [user, currentFolder]);

  useEffect(() => {
    // Update transformer on selection change
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      
      if (selectedId) {
        // Find the selected node
        const selectedNode = stage.findOne(`#${selectedId}`);
        if (selectedNode) {
          // Attach transformer to the selected node
          transformer.nodes([selectedNode]);
          transformer.getLayer()?.batchDraw();
        }
      } else {
        // Clear selection
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  const loadFolders = async () => {
    try {
      setLoading(true);
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
    } catch (error: any) {
      console.error('❌ Folder loading general error:', error);
      setError(`Klasörler yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
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
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Template loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} mockup templates loaded`);
      setTemplates(data || []);
    } catch (error: any) {
      console.error('❌ Template loading general error:', error);
      setError(`Şablonlar yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Klasör adı boş olamaz!');
      return;
    }

    try {
      setIsCreatingFolder(true);
      console.log('🔄 Creating new folder:', newFolderName);
      
      // Generate a folder path from the name (slugify)
      const folderPath = newFolderName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Check if folder already exists
      const { data: existingFolder, error: checkError } = await supabase
        .from('mockup_templates')
        .select('id')
        .eq('user_id', user?.id)
        .eq('folder_path', folderPath)
        .limit(1);
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingFolder && existingFolder.length > 0) {
        setError('Bu klasör adı zaten kullanılıyor!');
        return;
      }
      
      // Create a dummy template to establish the folder
      // This is needed because we're using a view to show folders
      const { error } = await supabase
        .from('mockup_templates')
        .insert({
          user_id: user?.id,
          name: `${newFolderName} - Folder Marker`,
          image_url: 'https://via.placeholder.com/500x500?text=Folder',
          design_areas: [],
          text_areas: [],
          design_type: 'black',
          folder_path: folderPath,
          folder_name: newFolderName,
          is_default: false
        });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Folder created successfully');
      setSuccess(`"${newFolderName}" klasörü başarıyla oluşturuldu!`);
      
      // Reset form and refresh data
      setNewFolderName('');
      setShowCreateFolderModal(false);
      await loadFolders();
      
      // Navigate to the new folder
      setCurrentFolder(folderPath);
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Folder creation error:', error);
      setError(`Klasör oluşturulurken bir hata oluştu: ${error.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const deleteFolder = async (folderPath: string) => {
    // Find folder info
    const folder = folders.find(f => f.folder_path === folderPath);
    if (!folder) {
      setError('Klasör bulunamadı!');
      return;
    }
    
    // Confirm deletion
    const templateCount = folder.template_count;
    if (!window.confirm(`"${folder.folder_name}" klasörünü ve içindeki ${templateCount} şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      console.log('🔄 Deleting folder:', folderPath);
      
      // Delete all templates in the folder
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('user_id', user?.id)
        .eq('folder_path', folderPath);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Folder deleted successfully');
      setSuccess(`"${folder.folder_name}" klasörü ve içindeki şablonlar başarıyla silindi!`);
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folderPath) {
        setCurrentFolder('');
      }
      
      // Refresh data
      await loadFolders();
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Folder deletion error:', error);
      setError(`Klasör silinirken bir hata oluştu: ${error.message}`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir resim dosyası seçin (JPEG, PNG, GIF)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük! Maksimum 5MB olmalıdır.');
      return;
    }
    
    setTemplateImage(file);
    setTemplateImageUrl(URL.createObjectURL(file));
    
    // Reset stage size when new image is loaded
    const img = new Image();
    img.onload = () => {
      setStageSize({
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(file);
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setDesignType('black');
    setTemplateImage(null);
    setTemplateImageUrl('');
    setDesignAreas([]);
    setTextAreas([]);
    setLogoArea(null);
    setSelectedId(null);
    setShowTemplateEditor(false);
  };

  const openTemplateEditor = (template?: MockupTemplate) => {
    if (template) {
      // Edit existing template
      setEditingTemplate(template);
      setTemplateName(template.name);
      setDesignType(template.design_type);
      setTemplateImageUrl(template.image_url);
      setDesignAreas(template.design_areas || []);
      setTextAreas(template.text_areas || []);
      setLogoArea(template.logo_area || null);
      
      // Set stage size based on first design area or default
      if (template.design_areas && template.design_areas.length > 0) {
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          setStageSize({
            width: img.width,
            height: img.height
          });
        };
        img.src = template.image_url;
      }
    } else {
      // Create new template
      resetTemplateForm();
    }
    
    setShowTemplateEditor(true);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Şablon adı boş olamaz!');
      return;
    }
    
    if (!templateImageUrl && !editingTemplate) {
      setError('Lütfen bir şablon görseli seçin!');
      return;
    }
    
    try {
      setIsCreatingTemplate(true);
      console.log('🔄 Saving template:', templateName);
      
      let imageUrl = templateImageUrl;
      
      // If we have a new image file, upload it to Supabase Storage
      if (templateImage) {
        const fileName = `mockup_${Date.now()}_${templateImage.name.replace(/\s+/g, '_')}`;
        const filePath = `${user?.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('mockup-templates')
          .upload(filePath, templateImage);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('mockup-templates')
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
      }
      
      const templateData = {
        user_id: user?.id,
        name: templateName,
        image_url: imageUrl,
        design_areas: designAreas,
        text_areas: textAreas,
        logo_area: logoArea,
        design_type: designType,
        folder_path: currentFolder || 'default',
        folder_name: currentFolder ? folders.find(f => f.folder_path === currentFolder)?.folder_name || 'Default' : 'Default',
        is_default: false
      };
      
      let result;
      
      if (editingTemplate) {
        // Update existing template
        result = await supabase
          .from('mockup_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .eq('user_id', user?.id);
      } else {
        // Create new template
        result = await supabase
          .from('mockup_templates')
          .insert(templateData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      console.log('✅ Template saved successfully');
      setSuccess(`"${templateName}" şablonu başarıyla ${editingTemplate ? 'güncellendi' : 'oluşturuldu'}!`);
      
      // Reset form and refresh data
      resetTemplateForm();
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template save error:', error);
      setError(`Şablon ${editingTemplate ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu: ${error.message}`);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setError('Şablon bulunamadı!');
      return;
    }
    
    if (!window.confirm(`"${template.name}" şablonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      console.log('🔄 Deleting template:', templateId);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Template deleted successfully');
      setSuccess(`"${template.name}" şablonu başarıyla silindi!`);
      
      // Remove from selected templates if it was selected
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
      
      // Refresh templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template deletion error:', error);
      setError(`Şablon silinirken bir hata oluştu: ${error.message}`);
    }
  };

  const duplicateTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setError('Şablon bulunamadı!');
      return;
    }

    try {
      console.log('🔄 Duplicating template:', templateId);
      
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
          folder_path: template.folder_path || 'default',
          folder_name: template.folder_name || 'Default',
          is_default: false
        });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Template duplicated successfully');
      setSuccess(`"${template.name}" şablonu başarıyla kopyalandı!`);
      
      // Refresh templates
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Template duplication error:', error);
      setError(`Şablon kopyalanırken bir hata oluştu: ${error.message}`);
    }
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Clicked on stage background
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      
      // Start drawing if we're adding a new area
      if (isDrawing) {
        setStartPoint({
          x: e.evt.offsetX,
          y: e.evt.offsetY
        });
      }
      return;
    }
    
    // Clicked on a shape
    const clickedOnTransformer = e.target.getParent().className === 'Transformer';
    if (clickedOnTransformer) {
      return;
    }
    
    // Get id of the shape
    const id = e.target.id();
    if (id) {
      setSelectedId(id);
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // No drawing in progress
    if (!isDrawing || !startPoint) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    
    // Calculate new rectangle dimensions
    const x = Math.min(startPoint.x, pointerPosition.x);
    const y = Math.min(startPoint.y, pointerPosition.y);
    const width = Math.abs(pointerPosition.x - startPoint.x);
    const height = Math.abs(pointerPosition.y - startPoint.y);
    
    // Update the temporary shape
    if (selectedId === 'newArea') {
      // Find the temporary shape and update it
      const newArea = stageRef.current?.findOne('#newArea');
      if (newArea) {
        (newArea as Konva.Rect).setAttrs({
          x,
          y,
          width,
          height
        });
        newArea.getLayer()?.batchDraw();
      }
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // No drawing in progress
    if (!isDrawing || !startPoint) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    
    // Calculate final rectangle dimensions
    const x = Math.min(startPoint.x, pointerPosition.x);
    const y = Math.min(startPoint.y, pointerPosition.y);
    const width = Math.abs(pointerPosition.x - startPoint.x);
    const height = Math.abs(pointerPosition.y - startPoint.y);
    
    // Minimum size check
    if (width < 10 || height < 10) {
      console.log('Area too small, ignoring');
      setIsDrawing(false);
      setStartPoint(null);
      
      // Remove temporary shape
      const newArea = stageRef.current?.findOne('#newArea');
      if (newArea) {
        newArea.destroy();
        newArea.getLayer()?.batchDraw();
      }
      return;
    }
    
    // Create the new area
    const newId = `area-${Date.now()}`;
    
    if (selectedId === 'newDesignArea') {
      setDesignAreas([
        ...designAreas,
        {
          id: newId,
          x,
          y,
          width,
          height,
          rotation: 0
        }
      ]);
    } else if (selectedId === 'newTextArea') {
      setTextAreas([
        ...textAreas,
        {
          id: newId,
          x,
          y,
          width,
          height,
          rotation: 0,
          fontSize: 20,
          fontFamily: 'Arial'
        }
      ]);
    } else if (selectedId === 'newLogoArea') {
      setLogoArea({
        id: newId,
        x,
        y,
        width,
        height,
        rotation: 0
      });
    }
    
    // Remove temporary shape
    const newArea = stageRef.current?.findOne('#newArea');
    if (newArea) {
      newArea.destroy();
      newArea.getLayer()?.batchDraw();
    }
    
    // Reset drawing state
    setIsDrawing(false);
    setStartPoint(null);
    setSelectedId(newId);
  };

  const addDesignArea = () => {
    setIsDrawing(true);
    setSelectedId('newDesignArea');
    
    // Create a temporary shape for drawing
    const layer = stageRef.current?.findOne('Layer');
    if (layer) {
      const rect = new Konva.Rect({
        id: 'newArea',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: 'rgba(255, 100, 50, 0.3)',
        stroke: '#ff6432',
        strokeWidth: 2,
        dash: [5, 5]
      });
      layer.add(rect);
      layer.batchDraw();
    }
  };

  const addTextArea = () => {
    setIsDrawing(true);
    setSelectedId('newTextArea');
    
    // Create a temporary shape for drawing
    const layer = stageRef.current?.findOne('Layer');
    if (layer) {
      const rect = new Konva.Rect({
        id: 'newArea',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: 'rgba(50, 100, 255, 0.3)',
        stroke: '#3264ff',
        strokeWidth: 2,
        dash: [5, 5]
      });
      layer.add(rect);
      layer.batchDraw();
    }
  };

  const addLogoArea = () => {
    setIsDrawing(true);
    setSelectedId('newLogoArea');
    
    // Create a temporary shape for drawing
    const layer = stageRef.current?.findOne('Layer');
    if (layer) {
      const rect = new Konva.Rect({
        id: 'newArea',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: 'rgba(50, 200, 50, 0.3)',
        stroke: '#32c832',
        strokeWidth: 2,
        dash: [5, 5]
      });
      layer.add(rect);
      layer.batchDraw();
    }
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    // Get the transformed node
    const node = e.target;
    const id = node.id();
    
    // Get the new position and size
    const { x, y, width, height, rotation } = node.attrs;
    
    // Update the appropriate area
    if (id && id.startsWith('area-')) {
      // Check if it's a design area
      const designArea = designAreas.find(area => area.id === id);
      if (designArea) {
        setDesignAreas(
          designAreas.map(area => 
            area.id === id 
              ? { ...area, x, y, width, height, rotation: rotation || 0 } 
              : area
          )
        );
        return;
      }
      
      // Check if it's a text area
      const textArea = textAreas.find(area => area.id === id);
      if (textArea) {
        setTextAreas(
          textAreas.map(area => 
            area.id === id 
              ? { ...area, x, y, width, height, rotation: rotation || 0 } 
              : area
          )
        );
        return;
      }
      
      // Check if it's the logo area
      if (logoArea && logoArea.id === id) {
        setLogoArea({ ...logoArea, x, y, width, height, rotation: rotation || 0 });
      }
    }
  };

  const deleteArea = () => {
    if (!selectedId || !selectedId.startsWith('area-')) return;
    
    // Check if it's a design area
    const designArea = designAreas.find(area => area.id === selectedId);
    if (designArea) {
      setDesignAreas(designAreas.filter(area => area.id !== selectedId));
      setSelectedId(null);
      return;
    }
    
    // Check if it's a text area
    const textArea = textAreas.find(area => area.id === selectedId);
    if (textArea) {
      setTextAreas(textAreas.filter(area => area.id !== selectedId));
      setSelectedId(null);
      return;
    }
    
    // Check if it's the logo area
    if (logoArea && logoArea.id === selectedId) {
      setLogoArea(null);
      setSelectedId(null);
    }
  };

  const getSelectedArea = () => {
    if (!selectedId || typeof selectedId !== 'string' || !selectedId.startsWith('area-')) return null;
    
    // Check if it's a design area
    const designArea = designAreas.find(area => area.id === selectedId);
    if (designArea) {
      return { ...designArea, type: 'design' };
    }
    
    // Check if it's a text area
    const textArea = textAreas.find(area => area.id === selectedId);
    if (textArea) {
      return { ...textArea, type: 'text' };
    }
    
    // Check if it's the logo area
    if (logoArea && logoArea.id === selectedId) {
      return { ...logoArea, type: 'logo' };
    }
    
    return null;
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
    
    if (!window.confirm(`${selectedTemplates.length} şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      console.log('🔄 Deleting multiple templates:', selectedTemplates);
      
      const { error } = await supabase
        .from('mockup_templates')
        .delete()
        .in('id', selectedTemplates)
        .eq('user_id', user?.id);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Templates deleted successfully');
      setSuccess(`${selectedTemplates.length} şablon başarıyla silindi!`);
      
      // Reset selected templates and refresh
      setSelectedTemplates([]);
      await loadTemplates();
      
    } catch (error: any) {
      console.error('❌ Bulk template deletion error:', error);
      setError(`Şablonlar silinirken bir hata oluştu: ${error.message}`);
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

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current folder name
  const getCurrentFolderName = () => {
    if (!currentFolder) return 'Tüm Şablonlar';
    const folder = folders.find(f => f.folder_path === currentFolder);
    return folder ? folder.folder_name : currentFolder;
  };

  // Get breadcrumb path
  const getBreadcrumbs = () => {
    if (!currentFolder) return [];
    return [{ path: currentFolder, name: getCurrentFolderName() }];
  };

  if (loading && templates.length === 0 && folders.length === 0) {
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
            Mockup Şablonları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Mockup şablonlarını yönetin ve düzenleyin ({templates.length} şablon)
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
            onClick={() => openTemplateEditor()}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Şablon</span>
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700 dark:text-green-400">{success}</p>
            <button 
              onClick={() => setSuccess(null)} 
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => {
            setCurrentFolder('');
            loadTemplates();
          }}
          className={`hover:text-orange-500 flex items-center space-x-1 ${!currentFolder ? 'font-medium text-orange-500' : ''}`}
        >
          <Folder className="h-4 w-4" />
          <span>Tüm Şablonlar</span>
        </button>
        
        {getBreadcrumbs().map((crumb, index) => (
          <React.Fragment key={index}>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{crumb.name}</span>
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
              {selectedTemplates.length} şablon seçildi
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

      {/* Folders Section - Show when in root directory */}
      {!currentFolder && folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-orange-500" />
            Klasörler ({folders.length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {folders.map((folder) => (
              <div
                key={folder.folder_path}
                className="group relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setCurrentFolder(folder.folder_path);
                  loadTemplates();
                }}
              >
                <div className="text-center">
                  <FolderOpen className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {folder.folder_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {folder.template_count} şablon
                  </p>
                  
                  <div className="flex justify-center space-x-2 mt-2">
                    <span className="px-2 py-1 bg-gray-900 text-white text-xs rounded-full">
                      {folder.black_designs} Siyah
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-900 border border-gray-300 text-xs rounded-full">
                      {folder.white_designs} Beyaz
                    </span>
                    {folder.color_designs > 0 && (
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full">
                        {folder.color_designs} Renkli
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Folder Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder.folder_path);
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
        </div>
      )}

      {/* Back Button - Show when in folder */}
      {currentFolder && (
        <Button
          onClick={() => {
            setCurrentFolder('');
            loadTemplates();
          }}
          variant="secondary"
          className="flex items-center space-x-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tüm Klasörlere Dön</span>
        </Button>
      )}

      {/* Templates Display */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Image className="h-5 w-5 mr-2 text-orange-500" />
          {getCurrentFolderName()} - Şablonlar ({filteredTemplates.length})
        </h2>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Şablon bulunamadı' : 'Bu klasörde henüz şablon yok'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Arama terimlerinizi değiştirmeyi deneyin'
                : 'İlk şablonunuzu oluşturarak başlayın'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => openTemplateEditor()}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>İlk Şablonu Oluştur</span>
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
                Tümünü seç ({filteredTemplates.length} şablon)
              </label>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
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
                            onClick={() => openTemplateEditor(template)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Şablonu düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => duplicateTemplate(template.id)}
                            className="text-green-500 hover:text-green-700 p-1"
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
                      <div className="space-y-3">
                        {/* Template Preview */}
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={template.image_url}
                            alt={template.name}
                            className="w-full h-full object-contain"
                          />
                          
                          {/* Design Type Badge */}
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                              {template.design_type === 'black' ? 'Siyah' : 
                               template.design_type === 'white' ? 'Beyaz' : 'Renkli'}
                            </span>
                          </div>
                          
                          {/* Area Counts */}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                            {template.design_areas?.length || 0} tasarım, {template.text_areas?.length || 0} metin
                            {template.logo_area ? ', 1 logo' : ''}
                          </div>
                        </div>

                        {/* Template Info */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Oluşturulma: {formatDate(template.created_at)}
                        </div>

                        {/* Actions */}
                        <Button
                          onClick={() => openTemplateEditor(template)}
                          size="sm"
                          className="w-full"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Düzenle
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
                        Şablon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tip
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
                                {template.folder_name || 'Varsayılan Klasör'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(template.design_type)}`}>
                            {template.design_type === 'black' ? 'Siyah' : 
                             template.design_type === 'white' ? 'Beyaz' : 'Renkli'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex space-x-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs">
                              {template.design_areas?.length || 0} tasarım
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs">
                              {template.text_areas?.length || 0} metin
                            </span>
                            {template.logo_area && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs">
                                1 logo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(template.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openTemplateEditor(template)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Şablonu düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicateTemplate(template.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Şablonu kopyala"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Şablonu sil"
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
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={createFolder}
                  className="flex-1"
                  disabled={!newFolderName.trim() || isCreatingFolder}
                >
                  {isCreatingFolder ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      <span>Klasör Oluştur</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={isCreatingFolder}
                >
                  İptal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
              </h2>
            </div>
            
            <div className="flex h-[calc(90vh-200px)] overflow-hidden">
              {/* Left Panel - Canvas */}
              <div className="w-2/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Şablon Adı:
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Örn: T-Shirt Mockup"
                    className="w-full"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tasarım Tipi:
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={designType === 'black'}
                        onChange={() => setDesignType('black')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Siyah Tasarım</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={designType === 'white'}
                        onChange={() => setDesignType('white')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Beyaz Tasarım</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={designType === 'color'}
                        onChange={() => setDesignType('color')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Renkli Tasarım</span>
                    </label>
                  </div>
                </div>
                
                {!editingTemplate && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Şablon Görseli:
                    </label>
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                      >
                        Görsel Seç
                      </Button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {templateImage ? templateImage.name : 'Dosya seçilmedi'}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
                
                {/* Canvas */}
                {templateImageUrl && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <Stage
                      width={stageSize.width}
                      height={stageSize.height}
                      ref={stageRef}
                      onMouseDown={handleStageMouseDown}
                      onMouseMove={handleStageMouseMove}
                      onMouseUp={handleStageMouseUp}
                      style={{ background: '#f0f0f0' }}
                    >
                      <Layer>
                        {/* Background Image */}
                        <KonvaImage
                          image={(() => {
                            const img = new window.Image();
                            img.src = templateImageUrl;
                            return img;
                          })()}
                          width={stageSize.width}
                          height={stageSize.height}
                        />
                        
                        {/* Design Areas */}
                        {showAreas && designAreas.map((area) => (
                          <Rect
                            key={area.id}
                            id={area.id}
                            x={area.x}
                            y={area.y}
                            width={area.width}
                            height={area.height}
                            fill="rgba(255, 100, 50, 0.3)"
                            stroke="#ff6432"
                            strokeWidth={2}
                            draggable
                            rotation={area.rotation || 0}
                            onTransformEnd={handleTransformEnd}
                          />
                        ))}
                        
                        {/* Text Areas */}
                        {showAreas && textAreas.map((area) => (
                          <Rect
                            key={area.id}
                            id={area.id}
                            x={area.x}
                            y={area.y}
                            width={area.width}
                            height={area.height}
                            fill="rgba(50, 100, 255, 0.3)"
                            stroke="#3264ff"
                            strokeWidth={2}
                            draggable
                            rotation={area.rotation || 0}
                            onTransformEnd={handleTransformEnd}
                          />
                        ))}
                        
                        {/* Logo Area */}
                        {showAreas && logoArea && (
                          <Rect
                            id={logoArea.id}
                            x={logoArea.x}
                            y={logoArea.y}
                            width={logoArea.width}
                            height={logoArea.height}
                            fill="rgba(50, 200, 50, 0.3)"
                            stroke="#32c832"
                            strokeWidth={2}
                            draggable
                            rotation={logoArea.rotation || 0}
                            onTransformEnd={handleTransformEnd}
                          />
                        )}
                        
                        {/* Transformer */}
                        {selectedId && selectedId.startsWith('area-') && (
                          <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                              // Limit minimum size
                              if (newBox.width < 10 || newBox.height < 10) {
                                return oldBox;
                              }
                              return newBox;
                            }}
                          />
                        )}
                      </Layer>
                    </Stage>
                  </div>
                )}
              </div>
              
              {/* Right Panel - Controls */}
              <div className="w-1/3 p-6 overflow-y-auto">
                {/* Add Elements */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Add Elements
                  </h3>
                  <div className="space-y-2">
                    <Button
                      onClick={addDesignArea}
                      variant="secondary"
                      className="w-full flex items-center justify-center"
                    >
                      <div className="w-4 h-4 border border-current mr-2"></div>
                      Add Design Area
                    </Button>
                    <Button
                      onClick={addTextArea}
                      variant="secondary"
                      className="w-full flex items-center justify-center"
                    >
                      <span className="mr-2">T</span>
                      Add Text Area
                    </Button>
                    <Button
                      onClick={addLogoArea}
                      variant="secondary"
                      className="w-full flex items-center justify-center"
                    >
                      <span className="mr-2">○</span>
                      Add Logo Area
                    </Button>
                  </div>
                </div>
                
                {/* Visibility */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Visibility
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAreas(!showAreas)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                    >
                      {showAreas ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span>{showAreas ? 'Hide Areas' : 'Show Areas'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Selected Area Properties */}
                {selectedId && selectedId.startsWith('area-') && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Selected Area Properties
                    </h3>
                    
                    {(() => {
                      const area = getSelectedArea();
                      if (!area) return null;
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Type: {area.type === 'design' ? 'Design Area' : area.type === 'text' ? 'Text Area' : 'Logo Area'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Position: X: {Math.round(area.x)}, Y: {Math.round(area.y)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Size: {Math.round(area.width)} × {Math.round(area.height)}
                            </p>
                            {area.rotation && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Rotation: {Math.round(area.rotation)}°
                              </p>
                            )}
                          </div>
                          
                          {area.type === 'text' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Font Size:
                              </label>
                              <Input
                                type="number"
                                value={area.fontSize || 20}
                                onChange={(e) => {
                                  const fontSize = parseInt(e.target.value);
                                  setTextAreas(
                                    textAreas.map(a => 
                                      a.id === area.id 
                                        ? { ...a, fontSize } 
                                        : a
                                    )
                                  );
                                }}
                                min={8}
                                max={72}
                                className="w-full"
                              />
                            </div>
                          )}
                          
                          <Button
                            onClick={deleteArea}
                            variant="danger"
                            size="sm"
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Area
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Save Button */}
                <div className="mt-auto pt-6">
                  <Button
                    onClick={saveTemplate}
                    className="w-full"
                    disabled={!templateName.trim() || (!templateImageUrl && !editingTemplate) || isCreatingTemplate}
                  >
                    {isCreatingTemplate ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>{editingTemplate ? 'Güncelleniyor...' : 'Oluşturuluyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        <span>{editingTemplate ? 'Şablonu Güncelle' : 'Şablonu Kaydet'}</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={resetTemplateForm}
                    variant="secondary"
                    className="w-full mt-2"
                    disabled={isCreatingTemplate}
                  >
                    İptal
                  </Button>
                </div>
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
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MockupTemplatesPage;