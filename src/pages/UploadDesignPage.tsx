import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download, Search, Filter, Grid, List, RefreshCw, AlertCircle, Clock, CheckCircle, X, Image as ImageIcon, FileUp, FileDown, FolderOpen, Store, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface DesignFile {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: 'black' | 'white' | 'color';
  file_size: number;
  created_at: string;
  expires_at: string;
  status: 'active' | 'used' | 'expired';
}

interface StoreFolder {
  id: string;
  name: string;
  path: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

interface ListingTemplate {
  id: string;
  name: string;
}

interface MockupTemplate {
  id: string;
  name: string;
  image_url: string;
}

const UploadDesignPage: React.FC = () => {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<DesignFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [designType, setDesignType] = useState<'black' | 'white' | 'color'>('black');
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<StoreFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [storeImagesFolders, setStoreImagesFolders] = useState<StoreFolder[]>([]);
  const [selectedStoreImagesFolder, setSelectedStoreImagesFolder] = useState<string>('');
  const [listingTemplates, setListingTemplates] = useState<ListingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [mockupTemplates, setMockupTemplates] = useState<MockupTemplate[]>([]);
  const [selectedMockupFolder, setSelectedMockupFolder] = useState<string>('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatingMockups, setGeneratingMockups] = useState(false);
  const [mockupPreviews, setMockupPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadDesigns();
      loadFolders();
      loadStores();
      loadStoreImagesFolders();
      loadListingTemplates();
      loadMockupTemplates();
    }
  }, [user]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading design files...');
      
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use mock data
      const mockDesigns: DesignFile[] = [
        {
          id: '1',
          user_id: user?.id || '',
          file_name: 'Black Design 1.png',
          file_url: 'https://images.pexels.com/photos/3094218/pexels-photo-3094218.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'black',
          file_size: 245000,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
          status: 'active'
        },
        {
          id: '2',
          user_id: user?.id || '',
          file_name: 'White Design 1.png',
          file_url: 'https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'white',
          file_size: 198000,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
          status: 'active'
        },
        {
          id: '3',
          user_id: user?.id || '',
          file_name: 'Color Design 1.png',
          file_url: 'https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'color',
          file_size: 320000,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
          status: 'active'
        },
        {
          id: '4',
          user_id: user?.id || '',
          file_name: 'Black Design 2.png',
          file_url: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'black',
          file_size: 275000,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
          status: 'active'
        },
        {
          id: '5',
          user_id: user?.id || '',
          file_name: 'White Design 2.png',
          file_url: 'https://images.pexels.com/photos/1055379/pexels-photo-1055379.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'white',
          file_size: 210000,
          created_at: new Date(Date.now() - 18000000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
          status: 'used'
        }
      ];
      
      setDesigns(mockDesigns);
      console.log(`✅ ${mockDesigns.length} design files loaded`);
    } catch (error: any) {
      console.error('❌ Error loading designs:', error);
      setError('Failed to load designs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      // Mock folders data
      const mockFolders: StoreFolder[] = [
        { id: '1', name: 'Logos', path: 'logos' },
        { id: '2', name: 'Banners', path: 'banners' },
        { id: '3', name: 'Backgrounds', path: 'backgrounds' },
        { id: '4', name: 'Watermarks', path: 'watermarks' },
        { id: '5', name: 'General', path: 'general' }
      ];
      
      setFolders(mockFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadStoreImagesFolders = async () => {
    try {
      // Mock store images folders data
      const mockStoreImagesFolders: StoreFolder[] = [
        { id: '1', name: 'Logos', path: 'logos' },
        { id: '2', name: 'Banners', path: 'banners' },
        { id: '3', name: 'Product Images', path: 'product-images' },
        { id: '4', name: 'Backgrounds', path: 'backgrounds' },
        { id: '5', name: 'Watermarks', path: 'watermarks' }
      ];
      
      setStoreImagesFolders(mockStoreImagesFolders);
    } catch (error) {
      console.error('Error loading store images folders:', error);
    }
  };

  const loadStores = async () => {
    try {
      // Mock stores data
      const mockStores: EtsyStore[] = [
        { id: '1', store_name: 'My Etsy Store', is_active: true },
        { id: '2', store_name: 'Craft Shop', is_active: true },
        { id: '3', store_name: 'Digital Downloads', is_active: false }
      ];
      
      setStores(mockStores);
      if (mockStores.length > 0) {
        setSelectedStore(mockStores[0].id);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadListingTemplates = async () => {
    try {
      // Mock listing templates data
      const mockTemplates: ListingTemplate[] = [
        { id: '1', name: 'Vintage Poster Template' },
        { id: '2', name: 'Modern Typography Template' },
        { id: '3', name: 'Botanical Illustration Template' },
        { id: '4', name: 'Abstract Art Template' }
      ];
      
      setListingTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading listing templates:', error);
    }
  };

  const loadMockupTemplates = async () => {
    try {
      // Mock mockup templates data
      const mockTemplates: MockupTemplate[] = [
        { id: '1', name: 'T-Shirt Mockup 1', image_url: 'https://images.pexels.com/photos/1484516/pexels-photo-1484516.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '2', name: 'T-Shirt Mockup 2', image_url: 'https://images.pexels.com/photos/1926620/pexels-photo-1926620.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '3', name: 'Mug Mockup', image_url: 'https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '4', name: 'Poster Mockup', image_url: 'https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '5', name: 'Canvas Mockup', image_url: 'https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400' }
      ];
      
      setMockupTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading mockup templates:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    // Validate file types
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      (file.type.includes('png') || file.type.includes('jpeg') || file.type.includes('jpg'))
    );
    
    if (validFiles.length !== files.length) {
      alert('Only PNG and JPEG images are allowed.');
      return;
    }
    
    // Validate file sizes (max 5MB)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Some files exceed the 5MB size limit.');
      return;
    }
    
    uploadFiles(validFiles);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      console.log(`🔄 Uploading ${files.length} design files...`);
      
      // In a real implementation, this would upload to Supabase Storage
      // For now, we'll simulate the upload
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
      
      // Create new design entries
      const newDesigns: DesignFile[] = files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        user_id: user?.id || '',
        file_name: file.name,
        file_url: URL.createObjectURL(file), // In real implementation, this would be a Supabase URL
        file_type: designType,
        file_size: file.size,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        status: 'active'
      }));
      
      setDesigns(prev => [...newDesigns, ...prev]);
      console.log(`✅ ${files.length} design files uploaded successfully`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error('❌ Error uploading designs:', error);
      alert('Failed to upload designs: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteDesign = async (designId: string) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return;
    
    try {
      console.log(`🗑️ Deleting design: ${designId}`);
      
      // In a real implementation, this would delete from Supabase
      // For now, we'll just remove from state
      
      setDesigns(prev => prev.filter(design => design.id !== designId));
      setSelectedDesigns(prev => prev.filter(id => id !== designId));
      
      console.log(`✅ Design deleted successfully`);
    } catch (error: any) {
      console.error('❌ Error deleting design:', error);
      alert('Failed to delete design: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDesigns.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedDesigns.length} selected design(s)?`)) return;
    
    try {
      console.log(`🗑️ Deleting ${selectedDesigns.length} designs...`);
      
      // In a real implementation, this would delete from Supabase
      // For now, we'll just remove from state
      
      setDesigns(prev => prev.filter(design => !selectedDesigns.includes(design.id)));
      setSelectedDesigns([]);
      
      console.log(`✅ ${selectedDesigns.length} designs deleted successfully`);
    } catch (error: any) {
      console.error('❌ Error deleting designs:', error);
      alert('Failed to delete designs: ' + error.message);
    }
  };

  const downloadDesign = (design: DesignFile) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = design.file_url;
    link.download = design.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesigns(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const selectAllDesigns = () => {
    if (selectedDesigns.length === filteredDesigns.length) {
      setSelectedDesigns([]);
    } else {
      setSelectedDesigns(filteredDesigns.map(design => design.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'used': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'expired': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getDesignTypeColor = (type: string) => {
    const colors = {
      'black': 'bg-gray-900 text-white',
      'white': 'bg-gray-100 text-gray-900 border border-gray-300',
      'color': 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
    };
    return colors[type as keyof typeof colors] || colors.black;
  };

  // Filter designs based on search term
  const filteredDesigns = designs.filter(design =>
    design.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.file_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNextClick = () => {
    // Generate mockup previews
    setGeneratingMockups(true);
    
    // Simulate mockup generation
    setTimeout(() => {
      // Generate random mockup previews
      const mockups = mockupTemplates.slice(0, 5).map(template => template.image_url);
      setMockupPreviews(mockups);
      setGeneratingMockups(false);
      setShowPreview(true);
    }, 2000);
  };

  const handleBackClick = () => {
    setShowPreview(false);
  };

  const handleSendToEtsy = () => {
    alert('Ürün Etsy\'e gönderildi! 🎉');
    setShowPreview(false);
    // Reset form
    setTitle('');
    setTags('');
    setSelectedStore('');
    setSelectedTemplate('');
    setSelectedStoreImagesFolder('');
    setSelectedMockupFolder('');
    setMockupPreviews([]);
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
    <div className="p-6 relative overflow-hidden">
      {/* Main Container with sliding panels */}
      <div className="relative overflow-hidden" style={{ minHeight: '80vh' }}>
        {/* Design Upload Panel */}
        <div 
          className="transition-transform duration-500 ease-in-out w-full"
          style={{ 
            transform: showPreview ? 'translateX(-100%)' : 'translateX(0)',
            position: showPreview ? 'absolute' : 'relative',
            width: '100%'
          }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Upload className="h-6 w-6 mr-2 text-orange-500" />
                Tasarım Yükle
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tasarım dosyalarınızı yükleyin ve yönetin ({designs.length} tasarım)
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <div className="flex items-center space-x-2">
                <select
                  value={designType}
                  onChange={(e) => setDesignType(e.target.value as 'black' | 'white' | 'color')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="black">Siyah Tasarım</option>
                  <option value="white">Beyaz Tasarım</option>
                  <option value="color">Renkli Tasarım</option>
                </select>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Tasarım Yükle</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                  ℹ️ Tasarım Dosyaları Bilgisi
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  <strong>Geçici Depolama:</strong> Tasarım dosyaları, bir Etsy listesinde kullanılana kadar geçici olarak saklanır.
                  <br />
                  <strong>Süre Sonu:</strong> Dosyalar kullanılmazsa 24 saat sonra otomatik olarak silinir.
                  <br />
                  <strong>Dosya Türleri:</strong> PNG veya JPEG formatında siyah, beyaz veya renkli tasarımlar yükleyin (maks. 5MB).
                </p>
              </div>
            </div>
          </div>

          {/* Design Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 border-2 overflow-hidden mb-6">
            <div className="px-6 py-4 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasarım #1</h2>
                
                {/* Design Type Selection */}
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="designType"
                      checked={true}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Tasarım Yükle</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="designType"
                      checked={false}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Otomatik Metin Tasarımı</span>
                  </label>
                </div>
                
                {/* Color Selection */}
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="colorType"
                      checked={designType === 'black'}
                      onChange={() => setDesignType('black')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Siyah</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="colorType"
                      checked={designType === 'white'}
                      onChange={() => setDesignType('white')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Beyaz</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="colorType"
                      checked={designType === 'color'}
                      onChange={() => setDesignType('color')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Renkli</span>
                  </label>
                </div>
                
                {/* Upload Buttons and Input Fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div 
                    className="border border-gray-300 dark:border-gray-600 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-gray-400 mb-2">+</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Yükle</div>
                  </div>
                  
                  <div 
                    className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer ${
                      designType === 'black' 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : designType === 'white' 
                        ? 'bg-gray-100 border-gray-300 hover:bg-gray-200' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-400 hover:opacity-90'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`mb-2 ${designType === 'white' ? 'text-gray-800' : 'text-white'}`}>+</div>
                    <div className={`text-xs ${designType === 'white' ? 'text-gray-800' : 'text-white'}`}>Yükle</div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="mb-2 flex items-center">
                      <span className="text-orange-500 mr-2">📝</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Başlık</span>
                      <span className="text-gray-400 text-xs ml-auto">{title.length}/140</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ürün başlığını girin..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      maxLength={140}
                    />
                    <button className="mt-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm flex items-center">
                      <span className="mr-1">🔥</span>
                      AI Öner
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <span className="text-orange-500 mr-2">🏷️</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Etiketler</span>
                      <span className="text-gray-400 text-xs ml-auto">{tags.split(',').filter(tag => tag.trim()).length}/13</span>
                    </div>
                    <textarea
                      placeholder="Etiketleri virgülle ayırarak girin..."
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={4}
                    ></textarea>
                    <button className="mt-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm flex items-center">
                      <span className="mr-1">🔥</span>
                      AI Öner
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Store Images Folder */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-orange-500 mr-2">🗂️</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Store Images Klasörü</span>
                      </div>
                      <select 
                        value={selectedStoreImagesFolder}
                        onChange={(e) => setSelectedStoreImagesFolder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Klasör seçin...</option>
                        {storeImagesFolders.map(folder => (
                          <option key={folder.id} value={folder.path}>{folder.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Listeleme Şablonu */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-orange-500 mr-2">📋</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Listeleme Şablonu</span>
                      </div>
                      <select 
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Şablon seçin...</option>
                        {listingTemplates.map(template => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Mockup Klasörü */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-orange-500 mr-2">🖼️</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Mockup Klasörü</span>
                      </div>
                      <select 
                        value={selectedMockupFolder}
                        onChange={(e) => setSelectedMockupFolder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Klasör seçin...</option>
                        <option value="t-shirts">T-Shirts</option>
                        <option value="mugs">Mugs</option>
                        <option value="posters">Posters</option>
                        <option value="canvas">Canvas Prints</option>
                      </select>
                    </div>
                    
                    {/* Choose Shop */}
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-orange-500 mr-2">🏪</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Mağaza Seçin</span>
                      </div>
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Mağaza seçin</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>{store.store_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleNextClick}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
                    disabled={!title || !tags || !selectedStore}
                  >
                    <span>İleri</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Tasarımlarda ara..."
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
          {selectedDesigns.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-orange-700 dark:text-orange-400">
                  {selectedDesigns.length} tasarım seçildi
                </span>
                <div className="flex space-x-2">
                  <Button onClick={handleBulkDelete} variant="danger" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Seçilenleri Sil
                  </Button>
                  <Button onClick={() => setSelectedDesigns([])} variant="secondary" size="sm">
                    Seçimi Temizle
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Designs Display */}
          {filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Tasarım bulunamadı' : 'Henüz tasarım yüklenmemiş'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? 'Arama terimlerinizi değiştirmeyi deneyin'
                  : 'Başlamak için ilk tasarımınızı yükleyin'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
                >
                  <Upload className="h-4 w-4" />
                  <span>İlk Tasarımı Yükle</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                <input
                  type="checkbox"
                  checked={selectedDesigns.length === filteredDesigns.length}
                  onChange={selectAllDesigns}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Tümünü seç ({filteredDesigns.length} tasarım)
                </label>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredDesigns.map((design) => (
                    <Card key={design.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Design Preview */}
                          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={design.file_url}
                              alt={design.file_name}
                              className="w-full h-full object-contain"
                            />
                            
                            {/* Design Type Badge */}
                            <div className="absolute top-2 left-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(design.file_type)}`}>
                                {design.file_type === 'black' ? 'Siyah' : design.file_type === 'white' ? 'Beyaz' : 'Renkli'}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(design.status)}`}>
                                {design.status === 'active' ? 'Aktif' : design.status === 'used' ? 'Kullanıldı' : 'Süresi Doldu'}
                              </span>
                            </div>
                            
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => downloadDesign(design)}
                                  className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                                  title="İndir"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteDesign(design.id)}
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Design Info */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedDesigns.includes(design.id)}
                                  onChange={() => toggleDesignSelection(design.id)}
                                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {design.file_name}
                                </h3>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatFileSize(design.file_size)} • {formatDate(design.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Expiration Info */}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Süre sonu: {getTimeRemaining(design.expires_at)}</span>
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
                            checked={selectedDesigns.length === filteredDesigns.length}
                            onChange={selectAllDesigns}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tasarım
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tür
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Boyut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Oluşturulma
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Süre Sonu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredDesigns.map((design) => (
                        <tr key={design.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedDesigns.includes(design.id)}
                              onChange={() => toggleDesignSelection(design.id)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden">
                                <img
                                  src={design.file_url}
                                  alt={design.file_name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {design.file_name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDesignTypeColor(design.file_type)}`}>
                              {design.file_type === 'black' ? 'Siyah' : design.file_type === 'white' ? 'Beyaz' : 'Renkli'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatFileSize(design.file_size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(design.status)}`}>
                              {design.status === 'active' ? 'Aktif' : design.status === 'used' ? 'Kullanıldı' : 'Süresi Doldu'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(design.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {getTimeRemaining(design.expires_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => downloadDesign(design)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="İndir"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteDesign(design.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Sil"
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

        {/* Preview Panel */}
        <div 
          className="transition-transform duration-500 ease-in-out w-full"
          style={{ 
            transform: showPreview ? 'translateX(0)' : 'translateX(100%)',
            position: showPreview ? 'relative' : 'absolute',
            width: '100%'
          }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <ImageIcon className="h-6 w-6 mr-2 text-orange-500" />
                Mockup Önizleme
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Etsy'e göndermeden önce ürününüzü önizleyin
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button
                onClick={handleBackClick}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Geri</span>
              </Button>
              <Button
                onClick={handleSendToEtsy}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Etsy'e Gönder</span>
              </Button>
            </div>
          </div>

          {/* Mockup Generation Loading */}
          {generatingMockups && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Mockuplar Oluşturuluyor
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Lütfen bekleyin, tasarımınız mockuplara uygulanıyor...
                </p>
              </div>
            </div>
          )}

          {/* Mockup Previews */}
          {!generatingMockups && mockupPreviews.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-orange-500" />
                Mockup Görselleri ({mockupPreviews.length}/10)
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {mockupPreviews.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group">
                    <img
                      src={imageUrl}
                      alt={`Mockup ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Number Badge */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                      {index + 1}
                    </div>
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                          title="İndir"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                          title="Kaldır"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add More Button (if less than 10 images) */}
                {mockupPreviews.length < 10 && (
                  <div 
                    className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Mockup Ekle</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Information */}
          {!generatingMockups && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ürün Bilgileri
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Başlık
                  </h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-900 dark:text-white">
                      {title || 'Başlık girilmemiş'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Etiketler
                  </h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm">
                          {tag.trim()}
                        </span>
                      ))}
                      {tags.split(',').filter(tag => tag.trim()).length === 0 && (
                        <span className="text-gray-500 dark:text-gray-400">Etiket girilmemiş</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seçilen Ayarlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mağaza:</span>
                    </div>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {stores.find(s => s.id === selectedStore)?.store_name || 'Seçilmemiş'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileUp className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Listeleme Şablonu:</span>
                    </div>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {listingTemplates.find(t => t.id === selectedTemplate)?.name || 'Seçilmemiş'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Store Images Klasörü:</span>
                    </div>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {storeImagesFolders.find(f => f.path === selectedStoreImagesFolder)?.name || 'Seçilmemiş'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mockup Klasörü:</span>
                    </div>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedMockupFolder || 'Seçilmemiş'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send to Etsy Button (Bottom) */}
          {!generatingMockups && (
            <div className="flex justify-end">
              <Button
                onClick={handleSendToEtsy}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Etsy'e Gönder</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDesignPage;