import React, { useState, useEffect } from 'react';
import { X, Search, Folder, Image as ImageIcon, Store, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { Input } from '../ui/Input';

interface StoreImage {
  id: string;
  name: string;
  image_url: string;
  image_type: string;
  folder_path?: string;
  created_at: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  store_url?: string;
  is_active: boolean;
}

interface LogoSelectorProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
}

const LogoSelector: React.FC<LogoSelectorProps> = ({ onSelect, onClose }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [images, setImages] = useState<StoreImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStore) {
      loadLogoImages();
    }
  }, [selectedStore]);

  const loadStores = async () => {
    try {
      console.log('🔄 Logo Selector: Loading Etsy stores...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .eq('platform', 'etsy')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Logo Selector: Store loading error:', error);
        throw error;
      }

      console.log(`✅ Logo Selector: ${data?.length || 0} Etsy stores loaded`);
      setStores(data || []);
      
      // Auto-select first store
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Logo Selector: Store loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogoImages = async () => {
    if (!selectedStore) return;
    
    try {
      setLoadingImages(true);
      console.log(`🔄 Logo Selector: Loading logo images for store ${selectedStore}...`);
      
      // Get all images from logos folder OR logo type
      const { data, error } = await supabase
        .from('store_images')
        .select('*')
        .eq('user_id', user?.id)
        .eq('store_id', selectedStore)
        .or('folder_path.eq.logos,image_type.eq.logo') // Logos folder OR logo type
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Logo Selector: Image loading error:', error);
        throw error;
      }

      console.log(`✅ Logo Selector: ${data?.length || 0} logo images loaded`);
      setImages(data || []);
    } catch (error) {
      console.error('❌ Logo Selector: Image loading general error:', error);
      setImages([]); // Empty array on error
    } finally {
      setLoadingImages(false);
    }
  };

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageSelect = (imageUrl: string, imageName: string) => {
    console.log('🖼️ Logo Selector: Image selected:', imageName, imageUrl);
    onSelect(imageUrl);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <ImageIcon className="h-6 w-6 mr-2 text-orange-500" />
                Select Logo
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose a logo from Store Images logos folder
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Store Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center space-x-4">
            <Store className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etsy Store:
              </label>
              {stores.length > 0 ? (
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name} {store.store_url && `(${store.store_url})`}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={loadLogoImages}
                    variant="secondary"
                    size="sm"
                    disabled={loadingImages}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingImages ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    No Etsy stores added yet. 
                    <a href="/admin/stores" target="_blank" className="text-orange-500 hover:text-orange-600 ml-1 underline">
                      Add a store
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search logos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Images Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-350px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading stores...</p>
              </div>
            </div>
          ) : loadingImages ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading logo images...</p>
              </div>
            </div>
          ) : !selectedStore ? (
            <div className="text-center py-12">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select Store
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Please select an Etsy store first to choose a logo
              </p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No logos found' : 'No images in logos folder'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Add images to the logos folder in Store Images'
                }
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => window.open('/admin/store-images', '_blank')}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <Folder className="h-4 w-4" />
                  <span>Go to Store Images</span>
                </Button>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Search</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Logos Folder
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredImages.length} logos found
                </span>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
                    onClick={() => handleImageSelect(image.image_url, image.name)}
                  >
                    {/* Image */}
                    <div className="aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-center justify-center">
                      <Button
                        className="opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        Select This Logo
                      </Button>
                    </div>

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                      <div className="text-white">
                        <div className="font-medium text-sm truncate mb-1">{image.name}</div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <span>{getImageTypeIcon(image.image_type)}</span>
                            <span className="capitalize">{image.image_type}</span>
                          </div>
                          <span className="text-gray-300">
                            {formatDate(image.created_at)}
                          </span>
                        </div>
                        {image.folder_path && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Folder className="h-3 w-3" />
                            <span className="text-xs text-gray-300 capitalize">
                              {image.folder_path}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-orange-500 text-white rounded-full p-1">
                        <ImageIcon className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredImages.length > 0 && (
                <span>
                  {searchTerm ? `"${searchTerm}" search: ` : ''}
                  {filteredImages.length} logos found
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => window.open('/admin/store-images', '_blank')}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Folder className="h-4 w-4" />
                <span>Open Store Images</span>
              </Button>
              <Button onClick={onClose} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoSelector;