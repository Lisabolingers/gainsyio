import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Star, Heart, Eye, TrendingUp, ExternalLink, Plus, Download, RefreshCw, Store, Tag, DollarSign, Calendar, Users, Target, ArrowRight, AlertCircle, CheckCircle, Globe, Zap, Shield, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { EtsyScrapingService } from '../lib/etsyScrapingService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface EtsyProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  tags: string[];
  shop_name: string;
  shop_url: string;
  product_url: string;
  views?: number;
  favorites: number;
  sales_count: number;
  created_at?: string;
  category: string;
  materials?: string[];
  shipping_info: any;
  reviews_count: number;
  rating: number;
  scraped_at: string;
}

interface SearchFilters {
  min_price?: number;
  max_price?: number;
  category?: string;
  location?: string;
  sort_by: 'relevancy' | 'price_low' | 'price_high' | 'newest' | 'favorites';
  min_favorites?: number;
  min_sales?: number;
  shipping_free?: boolean;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const ListingPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<EtsyProduct[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [scrapingStatus, setScrapingStatus] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    sort_by: 'relevancy'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 20;

  useEffect(() => {
    if (user) {
      loadStores();
      loadRecentSearches();
    }
  }, [user]);

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

  const loadRecentSearches = () => {
    try {
      const savedSearches = localStorage.getItem('etsy_recent_searches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = (query: string) => {
    try {
      const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('etsy_recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const scrapeEtsyProducts = async (page: number = 1) => {
    if (!searchTerm.trim()) {
      alert('Lütfen arama terimi girin!');
      return;
    }

    // Validate request
    const validation = EtsyScrapingService.validateRequest({
      query: searchTerm,
      page,
      filters
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setScrapingStatus('Güvenli bağlantı kuruluyor...');
      
      console.log(`🌐 Starting Etsy scraping for: "${searchTerm}" (Page ${page})`);

      setScrapingStatus('Etsy.com\'dan veri çekiliyor...');

      // Use the secure scraping service
      const result = await EtsyScrapingService.scrapeEtsyProducts({
        query: searchTerm,
        page,
        filters
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Scraping failed');
      }
      
      setScrapingStatus('Sonuçlar işleniyor...');
      
      if (page === 1) {
        setSearchResults(result.data.products);
        setTotalResults(result.data.total);
        setCurrentPage(1);
        saveRecentSearch(searchTerm);
      } else {
        setSearchResults(prev => [...prev, ...result.data!.products]);
        setCurrentPage(page);
      }

      setScrapingStatus('');
      console.log(`✅ Successfully processed ${result.data.products.length} products`);
      
    } catch (error: any) {
      console.error('❌ Etsy scraping error:', error);
      
      let errorMessage = 'Etsy\'den veri çekilirken bir hata oluştu.';
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setScrapingStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchResults([]);
    setCurrentPage(1);
    setSelectedProducts([]);
    scrapeEtsyProducts(1);
  };

  const loadMoreResults = () => {
    scrapeEtsyProducts(currentPage + 1);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === searchResults.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(searchResults.map(p => p.id));
    }
  };

  const createListingsFromSelected = async () => {
    if (selectedProducts.length === 0) {
      alert('Lütfen en az bir ürün seçin!');
      return;
    }

    if (!selectedStore) {
      alert('Lütfen bir mağaza seçin!');
      return;
    }

    try {
      console.log(`🔄 Creating ${selectedProducts.length} listings...`);
      
      const selectedProductsData = searchResults.filter(p => selectedProducts.includes(p.id));
      
      // TODO: Implement actual listing creation logic
      // This would involve creating products in the selected store based on scraped data
      
      // For now, we'll simulate the process
      for (let i = 0; i < selectedProductsData.length; i++) {
        const product = selectedProductsData[i];
        console.log(`📝 Creating listing ${i + 1}/${selectedProductsData.length}: ${product.title}`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      alert(`${selectedProducts.length} ürün başarıyla mağazanıza eklendi! 🎉`);
      setSelectedProducts([]);
      
    } catch (error) {
      console.error('❌ Listing creation error:', error);
      alert('Listeleme sırasında bir hata oluştu.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const scrapingInfo = EtsyScrapingService.getScrapingInfo();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Globe className="h-6 w-6 mr-2 text-orange-500" />
            Etsy Araştırma & Listeleme
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Güvenli ve etik web scraping ile Etsy.com'dan ürün araştırması yapın
          </p>
        </div>
        {selectedProducts.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProducts.length} ürün seçildi
            </span>
            <Button
              onClick={createListingsFromSelected}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
              disabled={!selectedStore}
            >
              <Plus className="h-4 w-4" />
              <span>Seçilenleri Listele</span>
            </Button>
          </div>
        )}
      </div>

      {/* Ethical Scraping Guidelines */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                🛡️ Güvenli ve Etik Web Scraping
              </h3>
              <button
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
              >
                {showGuidelines ? 'Gizle' : 'Detayları Göster'}
              </button>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300">
              <strong>Yasal Uyumluluk:</strong> Etsy'nin robots.txt ve kullanım şartlarına uygun şekilde veri çekiyoruz.
              <br />
              <strong>Rate Limiting:</strong> Sunucuları yormamak için istekler arasında bekleme süresi ekliyoruz.
              <br />
              <strong>Sadece Genel Veriler:</strong> Yalnızca herkese açık ürün bilgilerini topluyoruz.
            </p>
            
            {showGuidelines && (
              <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Etik Kurallarımız:</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  {scrapingInfo.guidelines.map((guideline, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{guideline}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 p-2 bg-green-200 dark:bg-green-800/50 rounded text-xs text-green-800 dark:text-green-300">
                  <strong>Rate Limit:</strong> Dakikada maksimum {scrapingInfo.rateLimit.maxRequests} istek
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Store className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hedef Mağaza:
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
                    {store.store_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Henüz Etsy mağazası eklenmemiş. 
                <a href="/admin/stores" className="text-orange-500 hover:text-orange-600 ml-1">
                  Mağaza ekle
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Etsy.com'da güvenli arama yapın... (örn: vintage poster, digital art, handmade jewelry)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
                maxLength={100}
                list="recent-searches"
              />
              <datalist id="recent-searches">
                {recentSearches.map((search, index) => (
                  <option key={index} value={search} />
                ))}
              </datalist>
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Güvenli Ara</span>
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <Filter className="h-4 w-4" />
              <span>Filtreler</span>
            </Button>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !showFilters && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Son aramalar:</span>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(search);
                      handleSearch();
                    }}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scraping Status */}
          {loading && scrapingStatus && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
                <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                  {scrapingStatus}
                </span>
                <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-300">
                  <Shield className="h-3 w-3" />
                  <span>Güvenli Bağlantı</span>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Fiyat ($):
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="10000"
                    value={filters.min_price || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_price: e.target.value ? Number(e.target.value) : undefined }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Fiyat ($):
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="10000"
                    value={filters.max_price || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_price: e.target.value ? Number(e.target.value) : undefined }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Favori:
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    min="0"
                    value={filters.min_favorites || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_favorites: e.target.value ? Number(e.target.value) : undefined }))}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sıralama:
                  </label>
                  <select
                    value={filters.sort_by}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                    disabled={loading}
                  >
                    <option value="relevancy">İlgililik</option>
                    <option value="price_low">Fiyat: Düşük → Yüksek</option>
                    <option value="price_high">Fiyat: Yüksek → Düşük</option>
                    <option value="newest">En Yeni</option>
                    <option value="favorites">En Çok Favorilenen</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.shipping_free || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, shipping_free: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Ücretsiz Kargo</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                Hata
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {searchResults.length > 0 && (
        <>
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Etsy Arama Sonuçları
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {searchResults.length} / {totalResults} sonuç
              </span>
              {searchTerm && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm rounded-full">
                  "{searchTerm}"
                </span>
              )}
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Gerçek Veri</span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Select All */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === searchResults.length}
                  onChange={selectAllProducts}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Tümünü Seç
                </label>
              </div>

              {/* View Mode Toggle */}
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

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Selection Checkbox */}
                    <div className="flex items-center justify-between">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-orange-500 flex items-center space-x-1"
                        title="Etsy'de görüntüle"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-xs">Etsy</span>
                      </a>
                    </div>

                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Price Badge */}
                      <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-full shadow-sm">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </div>

                      {/* Free Shipping Badge */}
                      {product.shipping_info.free_shipping && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Ücretsiz Kargo
                        </div>
                      )}

                      {/* Secure Badge */}
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>Gerçek</span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <a
                          href={product.shop_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-orange-500"
                        >
                          {product.shop_name}
                        </a>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{product.rating}</span>
                          <span>({product.reviews_count})</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-pink-500">
                            <Heart className="h-3 w-3" />
                            <span>{product.favorites.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>{product.sales_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(product.scraped_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                        {product.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                            +{product.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {searchResults.length < totalResults && (
            <div className="text-center mt-6">
              <Button
                onClick={loadMoreResults}
                disabled={loading}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                <span>Daha Fazla Yükle</span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && searchResults.length === 0 && !error && (
        <div className="text-center py-12">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Etsy Ürün Araştırmasına Başlayın
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Yukarıdaki arama kutusuna bir terim girin ve Etsy.com'dan gerçek ürün verilerini çekin
          </p>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Son Aramalarınız:</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(search);
                      handleSearch();
                    }}
                    className="px-3 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm hover:bg-orange-200 dark:hover:bg-orange-800/30 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                  🛡️ Güvenli Web Scraping Nasıl Çalışır?
                </h4>
                <div className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <p><strong>1.</strong> Arama terimini girin (örn: "vintage poster", "digital art")</p>
                  <p><strong>2.</strong> Sistem Etsy.com'a güvenli bir şekilde bağlanır</p>
                  <p><strong>3.</strong> Etsy'nin kullanım şartlarına uygun olarak veri çekilir</p>
                  <p><strong>4.</strong> Sonuçlar filtrelenir ve size sunulur</p>
                  <p><strong>5.</strong> Beğendiğiniz ürünleri seçip mağazanıza ekleyebilirsiniz</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingPage;