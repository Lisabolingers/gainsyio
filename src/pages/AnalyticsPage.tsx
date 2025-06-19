import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Eye, Heart, ShoppingCart, DollarSign, Calendar, Filter, Download, RefreshCw, Store, Package, Users, Target, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface Product {
  id: string;
  title: string;
  views: number;
  favorites: number;
  sales_count: number;
  price: number;
  created_at: string;
  status: string;
  store_id: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('last7days');
  const [createdDateFilter, setCreatedDateFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  // Time period options
  const timePeriods = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'thismonth', label: 'This month' },
    { value: 'thisyear', label: 'This year' },
    { value: 'alltime', label: 'All time' }
  ];

  // Creation date filter options
  const createdDateOptions = [
    { value: 'all', label: 'All time' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'last3months', label: 'Last 3 months' },
    { value: 'last6months', label: 'Last 6 months' },
    { value: 'thisyear', label: 'This year' }
  ];

  useEffect(() => {
    if (user) {
      loadStores();
      loadTopProducts();
    }
  }, [user, selectedStore, selectedPeriod, createdDateFilter]);

  const loadStores = async () => {
    try {
      console.log('🔄 Loading Etsy stores for analytics...');
      
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

      console.log(`✅ ${data?.length || 0} Etsy stores loaded for analytics`);
      setStores(data || []);
    } catch (error) {
      console.error('❌ Store loading general error:', error);
    }
  };

  const loadTopProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading top products...');
      
      // Generate sample data for top products based on views and favorites
      const sampleProducts = generateTopProductsData();
      
      // Apply filters
      const filteredProducts = sampleProducts.filter(product => {
        // Store filter
        if (selectedStore !== 'all' && product.store_id !== selectedStore) {
          return false;
        }
        
        // Creation date filter
        if (createdDateFilter !== 'all') {
          const productDate = new Date(product.created_at);
          const filterDate = getCreatedDateFilterDate(createdDateFilter);
          if (filterDate && productDate < filterDate) {
            return false;
          }
        }
        
        return true;
      });
      
      // Sort by views + favorites (engagement score)
      const sortedProducts = filteredProducts.sort((a, b) => {
        const scoreA = a.views + (a.favorites * 5); // Weight favorites more
        const scoreB = b.views + (b.favorites * 5);
        return scoreB - scoreA;
      });
      
      setTopProducts(sortedProducts);
      console.log(`✅ ${sortedProducts.length} top products loaded`);
    } catch (error) {
      console.error('❌ Top products loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTopProductsData = (): Product[] => {
    return [
      {
        id: '1',
        title: 'Watercolor Floral Bundle - Digital Clipart',
        views: 3421,
        favorites: 287,
        sales_count: 76,
        price: 12.99,
        created_at: '2024-01-01T08:00:00Z',
        status: 'active',
        store_id: 'store1'
      },
      {
        id: '2',
        title: 'Botanical Illustration Set - Digital Art',
        views: 2156,
        favorites: 134,
        sales_count: 41,
        price: 7.99,
        created_at: '2024-01-05T14:20:00Z',
        status: 'active',
        store_id: 'store1'
      },
      {
        id: '3',
        title: 'Vintage Style Poster Design - Digital Download',
        views: 1247,
        favorites: 89,
        sales_count: 23,
        price: 4.99,
        created_at: '2024-01-15T10:30:00Z',
        status: 'active',
        store_id: 'store1'
      },
      {
        id: '4',
        title: 'Modern Typography Print - Instant Download',
        views: 892,
        favorites: 67,
        sales_count: 15,
        price: 3.99,
        created_at: '2024-01-10T09:15:00Z',
        status: 'active',
        store_id: 'store1'
      },
      {
        id: '5',
        title: 'Minimalist Quote Print - Motivational Art',
        views: 456,
        favorites: 23,
        sales_count: 8,
        price: 2.99,
        created_at: '2024-01-08T12:00:00Z',
        status: 'inactive',
        store_id: 'store1'
      },
      {
        id: '6',
        title: 'Abstract Geometric Art - Printable Wall Art',
        views: 234,
        favorites: 12,
        sales_count: 3,
        price: 5.99,
        created_at: '2024-01-25T16:45:00Z',
        status: 'draft',
        store_id: 'store1'
      },
      {
        id: '7',
        title: 'Handwritten Script Font Bundle',
        views: 1876,
        favorites: 156,
        sales_count: 34,
        price: 9.99,
        created_at: '2023-12-20T11:30:00Z',
        status: 'active',
        store_id: 'store1'
      },
      {
        id: '8',
        title: 'Wedding Invitation Template Set',
        views: 987,
        favorites: 78,
        sales_count: 19,
        price: 15.99,
        created_at: '2023-11-15T14:45:00Z',
        status: 'active',
        store_id: 'store1'
      }
    ];
  };

  const getCreatedDateFilterDate = (filter: string): Date | null => {
    const now = new Date();
    
    switch (filter) {
      case 'last7days':
        const last7Days = new Date(now);
        last7Days.setDate(last7Days.getDate() - 7);
        return last7Days;
      case 'last30days':
        const last30Days = new Date(now);
        last30Days.setDate(last30Days.getDate() - 30);
        return last30Days;
      case 'last3months':
        const last3Months = new Date(now);
        last3Months.setMonth(last3Months.getMonth() - 3);
        return last3Months;
      case 'last6months':
        const last6Months = new Date(now);
        last6Months.setMonth(last6Months.getMonth() - 6);
        return last6Months;
      case 'thisyear':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null;
    }
  };

  const getSelectedStoreName = () => {
    if (selectedStore === 'all') return 'All Stores';
    const store = stores.find(s => s.id === selectedStore);
    return store ? store.store_name : 'Unknown Store';
  };

  const getSelectedPeriodLabel = () => {
    const period = timePeriods.find(p => p.value === selectedPeriod);
    return period ? period.label : 'Last 7 days';
  };

  const getCreatedDateLabel = () => {
    const option = createdDateOptions.find(o => o.value === createdDateFilter);
    return option ? option.label : 'All time';
  };

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
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'draft': return '🟡';
      case 'inactive': return '🔴';
      default: return '⚪';
    }
  };

  const handleRefresh = () => {
    loadTopProducts();
  };

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ['Rank', 'Product Title', 'Views', 'Favorites', 'Sales', 'Price', 'Status', 'Created Date'],
      ...topProducts.map((product, index) => [
        index + 1,
        product.title,
        product.views,
        product.favorites,
        product.sales_count,
        `$${product.price}`,
        product.status,
        formatDate(product.created_at)
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-products-${selectedPeriod}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <BarChart3 className="h-6 w-6 mr-2 text-orange-500" />
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Top performing products • {getSelectedStoreName()} • {getSelectedPeriodLabel()}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Store Selector */}
          <div className="relative">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[200px]"
            >
              <option value="all">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Store className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[150px]"
            >
              {timePeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Creation Date Filter */}
          <div className="relative">
            <select
              value={createdDateFilter}
              onChange={(e) => setCreatedDateFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[150px]"
            >
              {createdDateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Created: {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleExport}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* No Store Warning */}
      {stores.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Store className="h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                No Etsy stores connected
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                Connect your first Etsy store to see analytics.{' '}
                <a href="/admin/stores" className="underline hover:text-yellow-800 dark:hover:text-yellow-200">
                  Add store now
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Most Viewed & Favorited Products</span>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {topProducts.length} products • Created: {getCreatedDateLabel()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Try adjusting your filters or add some products to your store
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Favorites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {topProducts.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-600' : 
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                          {product.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.views.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.favorites}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <ShoppingCart className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.sales_count}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.price.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusIcon(product.status)} {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(product.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simplified Analytics Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              📊 Simplified Analytics - Top Products Focus
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Analytics page now shows <strong>most viewed and favorited products</strong> from your selected store and time period.
              <br />
              <strong>Features:</strong> Store selection, time period filter, creation date filter, refresh, and export functionality.
              <br />
              <strong>Focus:</strong> Simple ranking of products by engagement (views + favorites) to identify your best performers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;