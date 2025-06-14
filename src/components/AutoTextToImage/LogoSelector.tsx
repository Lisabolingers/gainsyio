import React, { useState, useEffect } from 'react';
import { X, Search, Folder, Image as ImageIcon, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('logos'); // Default to logos folder

  useEffect(() => {
    if (user) {
      loadStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStore) {
      loadImages();
    }
  }, [selectedStore, currentFolder]);

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
      
      // İlk mağazayı otomatik seç
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('❌ Mağaza yükleme genel hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      console.log(`🔄 ${selectedStore} mağazası için resimler yükleniyor...`);
      
      let query = supabase
        .from('store_images')
        .select('*')
        .eq('user_id', user?.id)
        .eq('store_id', selectedStore);

      // Logo klasörü veya logo tipindeki resimleri getir
      if (currentFolder === 'logos') {
        query = query.or('folder_path.eq.logos,image_type.eq.logo');
      } else {
        query = query.eq('folder_path', currentFolder);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Resim yükleme hatası:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} resim yüklendi`);
      setImages(data || []);
    } catch (error) {
      console.error('❌ Resim yükleme genel hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageSelect = (imageUrl: string) => {
    console.log('🖼️ Resim seçildi:', imageUrl);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Logo Seçin
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Store Images'dan logo seçin ve tasarımınıza ekleyin
          </p>
        </div>

        {/* Store Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Store className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etsy Mağazası:
              </label>
              {stores.length > 0 ? (
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  Henüz Etsy mağazası eklenmemiş.
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
              placeholder="Logo ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Images Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'Logo bulunamadı' : 'Logo klasöründe resim yok'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'Arama terimlerinizi değiştirmeyi deneyin'
                  : 'Store Images bölümünden logo klasörüne resim ekleyin'
                }
              </p>
              <Button
                onClick={() => window.open('/admin/store-images', '_blank')}
                variant="secondary"
              >
                Store Images'a Git
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleImageSelect(image.image_url)}
                >
                  {/* Image */}
                  <div className="aspect-square">
                    <img
                      src={image.image_url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <Button
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      size="sm"
                    >
                      Seç
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="text-white text-xs">
                      <div className="font-medium truncate">{image.name}</div>
                      <div className="flex items-center space-x-1 mt-1">
                        <span>{getImageTypeIcon(image.image_type)}</span>
                        <span className="capitalize">{image.image_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredImages.length} logo bulundu
            </div>
            <Button onClick={onClose} variant="secondary">
              İptal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoSelector;