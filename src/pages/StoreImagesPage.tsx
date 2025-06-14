import React, { useState, useEffect, useRef } from 'react';
import { Image, Plus, Edit, Trash2, Copy, Search, Filter, Grid, List, Save, Download, Store, Upload, Move, FolderPlus, Folder, FolderOpen, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface StoreImage {
  id: string;
  user_id: string;
  store_id?: string;
  name: string;
  image_url: string;
  image_type: 'logo' | 'banner' | 'background' | 'watermark' | 'general';
  auto_apply: boolean;
  folder_path?: string;
  created_at: string;
  updated_at: string;
}

interface ImageFolder {
  id: string;
  name: string;
  path: string;
  parent_path?: string;
  image_count: number;
  created_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const StoreImagesPage: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<StoreImage[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadImageType, setUploadImageType] = useState<'logo' | 'banner' | 'background' | 'watermark' | 'general'>('logo');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadStores();
      loadFolders();
      loadImages();
    }
  }, [user, currentFolder]);

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

  const loadFolders = async () => {
    try {
      // Mock folder data - this will come from Supabase in real implementation
      const mockFolders: ImageFolder[] = [
        {
          id: '1',
          name: 'Logos',
          path: 'logos',
          image_count: 5,
          created_at: '2024-01-15'
        },
        {
          id: '2',
          name: 'Banners',
          path: 'banners',
          image_count: 3,
          created_at: '2024-01-10'
        },
        {
          id: '3',
          name: 'Backgrounds',
          path: 'backgrounds',
          image_count: 8,
          created_at: '2024-01-05'
        },
        {
          id: '4',
          name: 'Watermarks',
          path: 'watermarks',
          image_count: 2,
          created_at: '2024-01-01'
        }
      ];
      
      setFolders(mockFolders);
    } catch (error) {
      console.error('❌ Folder loading error:', error);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading store images...');
      
      let query = supabase
        .from('store_images')
        .select('*')
        .eq('user_id', user?.id);

      // If folder is selected, get images from that folder
      if (currentFolder) {
        query = query.eq('folder_path', currentFolder);
      }

      // If store is selected, get images from that store
      if (selectedStore) {
        query = query.eq('store_id', selectedStore);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Image loading error:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} images loaded`);
      setImages(data || []);
    } catch (error) {
      console.error('❌ Image loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Folder name is required!');
      return;
    }

    try {
      // TODO: In real implementation, folder will be saved to Supabase
      const newFolder: ImageFolder = {
        id: Date.now().toString(),
        name: newFolderName,
        path: newFolderName.toLowerCase().replace(/\s+/g, '-'),
        parent_path: currentFolder || undefined,
        image_count: 0,
        created_at: new Date().toISOString()
      };

      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      alert('Folder created successfully! 🎉');
    } catch (error) {
      console.error('❌ Folder creation error:', error);
      alert('Error occurred while creating folder.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      (file.type.includes('png') || file.type.includes('jpeg') || file.type.includes('jpg'))
    );
    
    if (validFiles.length !== files.length) {
      alert('Only PNG and JPEG format images can be uploaded!');
    }
    
    setUploadFiles(validFiles);
    if (validFiles.length > 0) {
      setShowUploadModal(true);
    }
  };

  const uploadImages = async () => {
    if (uploadFiles.length === 0) return;

    try {
      setUploading(true);
      console.log(`🔄 Uploading ${uploadFiles.length} images...`);

      for (const file of uploadFiles) {
        // Convert to base64 for storage
        const base64 = await fileToBase64(file);
        
        const imageData = {
          user_id: user?.id,
          store_id: selectedStore || null,
          name: file.name.split('.')[0],
          image_url: base64,
          image_type: uploadImageType,
          folder_path: currentFolder || null,
          auto_apply: false
        };

        const { error } = await supabase
          .from('store_images')
          .insert(imageData);

        if (error) {
          console.error('❌ Image upload error:', error);
          throw error;
        }
      }

      console.log('✅ All images uploaded successfully');
      await loadImages();
      setUploadFiles([]);
      setShowUploadModal(false);
      
      alert('Images uploaded successfully! 🎉');
    } catch (error) {
      console.error('❌ Image upload general error:', error);
      alert('Error occurred while uploading images.');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const deleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase
        .from('store_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      setSelectedImages(prev => prev.filter(id => id !== imageId));
    } catch (error) {
      console.error('Image deletion error:', error);
      alert('Error occurred while deleting image');
    }
  };

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    if (folder.image_count > 0) {
      if (!window.confirm(`This folder contains ${folder.image_count} images. Are you sure you want to delete the folder and all its images?`)) {
        return;
      }
    }

    try {
      // TODO: In real implementation, folder and its images will be deleted from Supabase
      setFolders(prev => prev.filter(f => f.id !== folderId));
      
      // Delete images in the folder
      const imagesToDelete = images.filter(img => img.folder_path === folder.path);
      for (const image of imagesToDelete) {
        await deleteImage(image.id);
      }
      
      // If we're in the deleted folder, go back to root
      if (currentFolder === folder.path) {
        setCurrentFolder('');
      }
      
      alert('Folder deleted successfully!');
    } catch (error) {
      console.error('Folder deletion error:', error);
      alert('Error occurred while deleting folder');
    }
  };

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getImageTypeColor = (type: string) => {
    const colors = {
      'logo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'banner': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'background': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'watermark': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'general': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'logo': return '🏷️';
      case 'banner': return '🎌';
      case 'background': return '🖼️';
      case 'watermark': return '💧';
      default: return '📷';
    }
  };

  const getCurrentFolderName = () => {
    if (!currentFolder) return 'Root Directory';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Image className="h-6 w-6 mr-2 text-orange-500" />
            Store Images
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize your store images in folders ({images.length} images)
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
            <span>Upload Image</span>
          </Button>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Etsy Store:
            </label>
            {stores.length > 0 ? (
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.store_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                No Etsy stores added yet. 
                <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                  Add a store
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => setCurrentFolder('')}
          className="hover:text-orange-500 flex items-center space-x-1"
        >
          <Folder className="h-4 w-4" />
          <span>Root Directory</span>
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
            placeholder="Search images..."
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

      {/* Folders and Images Display */}
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
                        {folder.image_count} images
                      </p>
                    </div>
                    
                    {/* Folder Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
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
            <span>Back to Root Directory</span>
          </Button>
        )}

        {/* Images Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Image className="h-5 w-5 mr-2 text-orange-500" />
            {getCurrentFolderName()} - Images ({filteredImages.length})
          </h2>

          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No images found' : 'No images in this folder'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Start by uploading your first image'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload First Image</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredImages.map((image) => (
                <Card key={image.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Image Preview */}
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={image.image_url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Image Actions Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            onClick={() => window.open(image.image_url, '_blank')}
                            className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                            title="View large"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteImage(image.id)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image Info */}
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {image.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs ${getImageTypeColor(image.image_type)}`}>
                            {getImageTypeIcon(image.image_type)} {image.image_type}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(image.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                  placeholder="e.g. Logos, Banners..."
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload Images
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {uploadFiles.length} images selected
              </p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Image Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Type:
                </label>
                <select
                  value={uploadImageType}
                  onChange={(e) => setUploadImageType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="logo">🏷️ Logo</option>
                  <option value="banner">🎌 Banner</option>
                  <option value="background">🖼️ Background</option>
                  <option value="watermark">💧 Watermark</option>
                  <option value="general">📷 General</option>
                </select>
              </div>

              {/* Current Folder Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Target Folder:</strong> {getCurrentFolderName()}
                </p>
              </div>

              {/* File Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadFiles.map((file, index) => (
                  <div key={index} className="space-y-2">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <Button
                  onClick={uploadImages}
                  className="flex-1"
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                  }}
                  variant="secondary"
                  className="flex-1"
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreImagesPage;