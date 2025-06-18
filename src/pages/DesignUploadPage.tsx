import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download, Search, Filter, Grid, List, RefreshCw, AlertCircle, Clock, CheckCircle, X, Image as ImageIcon, FileUp, FileDown, FolderOpen, Store, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
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

interface MockupTemplate {
  id: string;
  name: string;
  image_url: string;
}

const DesignUploadPage: React.FC = () => {
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
  const [mockupTemplates, setMockupTemplates] = useState<MockupTemplate[]>([]);
  const [selectedMockupFolder, setSelectedMockupFolder] = useState<string>('');
  const [listingTemplates, setListingTemplates] = useState<{id: string, name: string}[]>([]);
  const [selectedListingTemplate, setSelectedListingTemplate] = useState<string>('');
  
  // Form data
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  
  // Preview mode
  const [showPreview, setShowPreview] = useState(false);
  const [generatingMockups, setGeneratingMockups] = useState(false);
  const [mockupPreviews, setMockupPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const designContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadDesigns();
      loadFolders();
      loadStores();
      loadStoreImagesFolders();
      loadMockupTemplates();
      loadListingTemplates();
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

  const loadMockupTemplates = async () => {
    try {
      // Mock mockup templates
      const mockTemplates: MockupTemplate[] = [
        { id: '1', name: 'T-Shirt Template 1', image_url: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '2', name: 'T-Shirt Template 2', image_url: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '3', name: 'Mug Template', image_url: 'https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '4', name: 'Poster Template', image_url: 'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=400' },
        { id: '5', name: 'Canvas Print', image_url: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400' }
      ];
      
      setMockupTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading mockup templates:', error);
    }
  };

  const loadListingTemplates = async () => {
    try {
      // Mock listing templates
      const mockTemplates = [
        { id: '1', name: 'Vintage Poster Template' },
        { id: '2', name: 'Modern Typography Template' },
        { id: '3', name: 'Botanical Illustration Template' },
        { id: '4', name: 'Abstract Art Template' },
        { id: '5', name: 'Minimalist Design Template' }
      ];
      
      setListingTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading listing templates:', error);
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

  // Handle next button click - show preview
  const handleNextClick = () => {
    if (!title.trim()) {
      alert('Please enter a title for your listing');
      return;
    }
    
    if (!tags.trim()) {
      alert('Please enter at least one tag for your listing');
      return;
    }
    
    if (!selectedStore) {
      alert('Please select a store');
      return;
    }
    
    // Animate transition
    if (designContainerRef.current && previewContainerRef.current) {
      designContainerRef.current.style.transform = 'translateX(-100%)';
      previewContainerRef.current.style.transform = 'translateX(0)';
    }
    
    setShowPreview(true);
    generateMockupPreviews();
  };

  // Handle back button click - hide preview
  const handleBackClick = () => {
    if (designContainerRef.current && previewContainerRef.current) {
      designContainerRef.current.style.transform = 'translateX(0)';
      previewContainerRef.current.style.transform = 'translateX(100%)';
    }
    
    setShowPreview(false);
  };

  // Generate mockup previews
  const generateMockupPreviews = async () => {
    setGeneratingMockups(true);
    
    try {
      // Simulate mockup generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mockup previews (in a real implementation, this would use the actual design and mockup templates)
      const mockPreviews = [
        'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg?auto=compress&cs=tinysrgb&w=400'
      ];
      
      setMockupPreviews(mockPreviews);
    } catch (error) {
      console.error('Error generating mockups:', error);
      alert('Failed to generate mockup previews');
    } finally {
      setGeneratingMockups(false);
    }
  };

  // Handle send to Etsy
  const handleSendToEtsy = () => {
    alert('Listing will be sent to Etsy! (This is a demo)');
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
      {/* Design Upload Container */}
      <div 
        ref={designContainerRef}
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: 'translateX(0)' }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Upload className="h-6 w-6 mr-2 text-orange-500" />
              Create Listing
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload designs and create Etsy listings
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <select
                value={designType}
                onChange={(e) => setDesignType(e.target.value as 'black' | 'white' | 'color')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="black">Black Design</option>
                <option value="white">White Design</option>
                <option value="color">Color Design</option>
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
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Design</span>
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
                ℹ️ Design Files Information
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                <strong>Temporary Storage:</strong> Design files are stored temporarily until they are used in an Etsy listing.
                <br />
                <strong>Expiration:</strong> Files will be automatically deleted after 24 hours if not used.
                <br />
                <strong>File Types:</strong> Upload black, white, or color designs in PNG or JPEG format (max 5MB).
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
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
                  <span className="text-gray-700 dark:text-gray-300">Upload Design</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="designType"
                    checked={false}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Auto Text Design</span>
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
                  className={`border border-gray-300 dark:border-gray-600 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${designType === 'black' ? 'bg-gray-800 text-white' : designType === 'white' ? 'bg-white text-gray-800' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}
                >
                  <div className="mb-2">{designType.charAt(0).toUpperCase() + designType.slice(1)}</div>
                  <div className="text-xs">Design Type</div>
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
                    maxLength={140}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Store Images Folder</span>
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
                      value={selectedListingTemplate}
                      onChange={(e) => setSelectedListingTemplate(e.target.value)}
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
                      <option value="t-shirt">T-Shirts</option>
                      <option value="mug">Mugs</option>
                      <option value="poster">Posters</option>
                      <option value="canvas">Canvas Prints</option>
                    </select>
                  </div>
                  
                  {/* Choose Shop */}
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-orange-500 mr-2">🏪</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Choose Shop</span>
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
              placeholder="Search designs..."
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
                {selectedDesigns.length} design(s) selected
              </span>
              <div className="flex space-x-2">
                <Button onClick={handleBulkDelete} variant="danger" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
                <Button onClick={() => setSelectedDesigns([])} variant="secondary" size="sm">
                  Clear Selection
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
              {searchTerm ? 'No designs found' : 'No designs uploaded yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Upload your first design to get started'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
              >
                <Upload className="h-4 w-4" />
                <span>Upload First Design</span>
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
                Select all ({filteredDesigns.length} designs)
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
                              {design.file_type.charAt(0).toUpperCase() + design.file_type.slice(1)}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(design.status)}`}>
                              {design.status === 'active' ? 'Active' : design.status === 'used' ? 'Used' : 'Expired'}
                            </span>
                          </div>
                          
                          {/* Overlay with actions */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => downloadDesign(design)}
                                className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteDesign(design.id)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                title="Delete"
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
                          <span>Expires in: {getTimeRemaining(design.expires_at)}</span>
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
                        Design
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Expires In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
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
                            {design.file_type.charAt(0).toUpperCase() + design.file_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatFileSize(design.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(design.status)}`}>
                            {design.status === 'active' ? 'Active' : design.status === 'used' ? 'Used' : 'Expired'}
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
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteDesign(design.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
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

      {/* Preview Container */}
      <div 
        ref={previewContainerRef}
        className="absolute top-0 left-0 w-full h-full transition-transform duration-500 ease-in-out bg-white dark:bg-gray-900"
        style={{ transform: 'translateX(100%)' }}
      >
        {/* Preview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <ImageIcon className="h-6 w-6 mr-2 text-orange-500" />
              Listing Preview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review your listing before sending to Etsy
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={handleBackClick}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={handleSendToEtsy}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            >
              <span>Send to Etsy</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mockup Previews */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mockup Previews</CardTitle>
              </CardHeader>
              <CardContent>
                {generatingMockups ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Generating mockups...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      These mockups will be uploaded to Etsy (maximum 10 images)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mockupPreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group">
                          <img
                            src={preview}
                            alt={`Mockup ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                            {index + 1}/10
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button className="p-2 bg-red-500 text-white rounded-full">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add more mockup placeholder */}
                      {mockupPreviews.length < 10 && (
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Add Mockup
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Listing Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Listing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</h3>
                  <p className="text-gray-900 dark:text-white">{title}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.split(',').map((tag, index) => (
                      tag.trim() && (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">
                          {tag.trim()}
                        </span>
                      )
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Store</h3>
                  <p className="text-gray-900 dark:text-white">
                    {stores.find(store => store.id === selectedStore)?.store_name || 'No store selected'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Listing Template</h3>
                  <p className="text-gray-900 dark:text-white">
                    {listingTemplates.find(template => template.id === selectedListingTemplate)?.name || 'No template selected'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Store Images Folder</h3>
                  <p className="text-gray-900 dark:text-white">
                    {storeImagesFolders.find(folder => folder.path === selectedStoreImagesFolder)?.name || 'No folder selected'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mockup Folder</h3>
                  <p className="text-gray-900 dark:text-white">
                    {selectedMockupFolder ? selectedMockupFolder.charAt(0).toUpperCase() + selectedMockupFolder.slice(1) : 'No folder selected'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Design Type</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm ${getDesignTypeColor(designType)}`}>
                    {designType.charAt(0).toUpperCase() + designType.slice(1)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignUploadPage;