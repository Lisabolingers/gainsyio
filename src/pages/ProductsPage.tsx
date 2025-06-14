import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Eye, Search, Filter, List, ExternalLink, Star, Heart, TrendingUp, Store, Calendar, DollarSign, Tag, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface Product {
  id: string;
  store_id: string;
  external_id?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  images: string[];
  status: 'draft' | 'active' | 'inactive' | 'sold';
  views: number;
  favorites: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
  store?: {
    store_name: string;
    platform: string;
  };
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low' | 'views' | 'sales'>('newest');

  useEffect(() => {
    if (user) {
      loadStores();
      loadProducts();
    }
  }, [user, selectedStore, statusFilter, sortBy]);

  const loadStores = async () => {
    try {
      console.log('🔄 Loading Etsy stores...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('id, store_name, is_active')
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
    } catch (error) {
      console.error('❌ Store loading general error:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products...');
      
      // For now, we'll create sample data since we don't have real products yet
      const sampleProducts: Product[] = [
        {
          id: '1',
          store_id: 'store1',
          external_id: 'etsy_123456',
          title: 'Vintage Style Poster Design - Digital Download',
          description: 'Beautiful vintage-style poster perfect for home decoration. High-quality digital download ready for printing. Includes multiple formats: PDF, PNG, JPG.',
          price: 4.99,
          currency: 'USD',
          tags: ['vintage', 'poster', 'digital download', 'printable', 'wall art', 'home decor', 'retro', 'design'],
          images: ['https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400'],
          status: 'active',
          views: 1247,
          favorites: 89,
          sales_count: 23,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-20T14:22:00Z',
          store: {
            store_name: 'Creative Designs Studio',
            platform: 'etsy'
          }
        },
        {
          id: '2',
          store_id: 'store1',
          external_id: 'etsy_789012',
          title: 'Modern Typography Print - Instant Download',
          description: 'Clean and modern typography design. Perfect for office or home decoration. Instant digital download with commercial license included.',
          price: 3.99,
          currency: 'USD',
          tags: ['typography', 'modern', 'print', 'instant download', 'office decor', 'minimalist', 'black white'],
          images: ['https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400'],
          status: 'active',
          views: 892,
          favorites: 67,
          sales_count: 15,
          created_at: '2024-01-10T09:15:00Z',
          updated_at: '2024-01-18T16:45:00Z',
          store: {
            store_name: 'Creative Designs Studio',
            platform: 'etsy'
          }
        },
        {
          id: '3',
          store_id: 'store1',
          external_id: 'etsy_345678',
          title: 'Botanical Illustration Set - Digital Art',
          description: 'Set of 4 botanical illustrations. High-resolution files perfect for printing and framing. Nature-inspired artwork for modern homes.',
          price: 7.99,
          currency: 'USD',
          tags: ['botanical', 'illustration', 'nature', 'plants', 'digital art', 'set', 'printable', 'green'],
          images: ['https://images.pexels.com/photos/1055379/pexels-photo-1055379.jpeg?auto=compress&cs=tinysrgb&w=400'],
          status: 'active',
          views: 2156,
          favorites: 134,
          sales_count: 41,
          created_at: '2024-01-05T14:20:00Z',
          updated_at: '2024-01-22T11:30:00Z',
          store: {
            store_name: 'Creative Designs Studio',
            platform: 'etsy'
          }
        },
        {
          id: '4',
          store_id: 'store1',
          external_id: 'etsy_901234',
          title: 'Abstract Geometric Art - Printable Wall Art',
          description: 'Contemporary abstract geometric design. Perfect for modern interiors. Available in multiple sizes and formats.',
          price: 5.99,
          currency: 'USD',
          tags: ['abstract', 'geometric', 'modern', 'wall art', 'contemporary', 'printable', 'colorful'],
          images: ['https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400'],
          status: 'draft',
          views: 0,
          favorites: 0,
          sales_count: 0,
          created_at: '2024-01-25T16:45:00Z',
          updated_at: '2024-01-25T16:45:00Z',
          store: {
            store_name: 'Creative Designs Studio',
            platform: 'etsy'
          }
        },
        {
          id: '5',
          store_id: 'store1',
          external_id: 'etsy_567890',
          title: 'Minimalist Quote Print - Motivational Art',
          description: 'Inspirational quote in minimalist design. Perfect for office, bedroom, or living room. Instant download with multiple format options.',
          price: 2.99,
          currency: 'USD',
          tags: ['quote', 'motivational', 'minimalist', 'inspiration', 'typography', 'office', 'bedroom'],
          images: ['https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400'],
          status: 'inactive',
          views: 456,
          favorites: 23,
          sales_count: 8,
          created_at: '2024-01-08T12:00:00Z',
          updated_at: '2024-01-15T09:30:00Z',
          store: {
            store_name: 'Creative Designs Studio',
            platform: 'etsy'
          }
        },
        {
          id: '6',
          store_id: 'store1',
          external_id: 'etsy_234567',
          title: 'Watercolor Floral Bundle - Digital Clipart',
          description: 'Beautiful watercolor floral elements. Perfect for wedding invitations, greeting cards, and crafting projects. Commercial use included.',
          price: 12.99,
          currency: 'USD',
          tags: ['watercolor', 'floral', 'clipart', 'wedding', 'invitation', 'commercial use', 'bundle'],
          images: ['https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=400'],
          status: 'active',
          views: 3421,
          favorites: 287,
          sales_count: 76,
          created_at: '2024-01-01T08:00:00Z',
          updated_at: '2024-01-24T13:15:00Z',
          store: {
            store_name: 'Creative Designs Studio',
            platform: 'etsy'
          }
        }
      ];

      setProducts(sampleProducts);
      console.log(`✅ ${sampleProducts.length} sample products loaded`);
    } catch (error) {
      console.error('❌ Product loading general error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesStore = selectedStore === 'all' || product.store_id === selectedStore;
      
      return matchesSearch && matchesStatus && matchesStore;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_high':
          return b.price - a.price;
        case 'price_low':
          return a.price - b.price;
        case 'views':
          return b.views - a.views;
        case 'sales':
          return b.sales_count - a.sales_count;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'draft': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'sold': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'draft': return '🟡';
      case 'inactive': return '🔴';
      case 'sold': return '🔵';
      default: return '⚪';
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getSelectedStoreName = () => {
    if (selectedStore === 'all') return 'All Stores';
    const store = stores.find(s => s.id === selectedStore);
    return store ? store.store_name : 'Unknown Store';
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Package className="h-6 w-6 mr-2 text-orange-500" />
            Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getSelectedStoreName()} • {filteredProducts.length} products
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => alert('Create product functionality will be implemented')}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Store Filter */}
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.store_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_high">Price: High to Low</option>
            <option value="price_low">Price: Low to High</option>
            <option value="views">Most Viewed</option>
            <option value="sales">Best Selling</option>
          </select>

          {/* List View Indicator */}
          <div className="flex items-center px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <List className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2" />
            <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">List View</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Bulk Edit
              </Button>
              <Button variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
              <Button onClick={() => setSelectedProducts([])} variant="secondary" size="sm">
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Start by adding your first product'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              onClick={() => alert('Create product functionality will be implemented')}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Product</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={selectedProducts.length === filteredProducts.length}
              onChange={selectAllProducts}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Select all ({filteredProducts.length} products)
            </label>
          </div>

          {/* List View - Always Displayed */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={selectAllProducts}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 max-w-xs">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.store?.store_name} • ID: {product.external_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {getStatusIcon(product.status)} {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${product.price}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {product.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1" title="Views">
                          <Eye className="h-4 w-4" />
                          <span>{product.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Favorites">
                          <Heart className="h-4 w-4" />
                          <span>{product.favorites}</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Sales">
                          <TrendingUp className="h-4 w-4" />
                          <span>{product.sales_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => alert('View product details')}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => alert('Edit product')}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => alert('View on Etsy')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="View on Etsy"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => alert('More actions')}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Sample Data Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Package className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              📦 Sample Product Data - List View Only
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Products are now displayed in a clean, detailed list format for better data visibility. 
              This view shows all product information in a compact, scannable table format.
              <br />
              <strong>Features:</strong> Enhanced product details, performance metrics, tag display, 
              and quick action buttons for efficient product management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;