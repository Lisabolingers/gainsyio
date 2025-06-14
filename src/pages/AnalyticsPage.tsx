import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Eye, Heart, ShoppingCart, DollarSign, Calendar, Filter, Download, RefreshCw, Store, Package, Users, Target, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface AnalyticsData {
  id: string;
  product_id: string;
  date: string;
  views: number;
  favorites: number;
  sales: number;
  revenue: number;
  conversion_rate: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  status: string;
  store_id: string;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('last7days');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // Time period options
  const timePeriods = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'thismonth', label: 'This month' },
    { value: 'thisyear', label: 'This year' },
    { value: 'lastyear', label: 'Last year' },
    { value: 'alltime', label: 'All time' }
  ];

  useEffect(() => {
    if (user) {
      loadStores();
      loadAnalyticsData();
    }
  }, [user, selectedStore, selectedPeriod]);

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

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading analytics data...');
      
      // For now, we'll create comprehensive sample data
      const sampleAnalytics = generateSampleAnalyticsData();
      setAnalyticsData(sampleAnalytics);
      
      // Generate top products data
      const sampleTopProducts = generateTopProductsData();
      setTopProducts(sampleTopProducts);
      
      console.log(`✅ Analytics data loaded: ${sampleAnalytics.length} records`);
    } catch (error) {
      console.error('❌ Analytics loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAnalyticsData = (): AnalyticsData[] => {
    const data: AnalyticsData[] = [];
    const today = new Date();
    
    // Generate data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic e-commerce metrics
      const baseViews = Math.floor(Math.random() * 200) + 50;
      const favorites = Math.floor(baseViews * (Math.random() * 0.15 + 0.05)); // 5-20% of views
      const sales = Math.floor(favorites * (Math.random() * 0.3 + 0.1)); // 10-40% of favorites
      const avgPrice = 5.99;
      const revenue = sales * avgPrice * (Math.random() * 0.5 + 0.75); // Price variation
      const conversionRate = sales > 0 ? (sales / baseViews) * 100 : 0;
      
      data.push({
        id: `analytics_${i}`,
        product_id: `product_${Math.floor(Math.random() * 6) + 1}`,
        date: date.toISOString().split('T')[0],
        views: baseViews,
        favorites: favorites,
        sales: sales,
        revenue: Math.round(revenue * 100) / 100,
        conversion_rate: Math.round(conversionRate * 100) / 100
      });
    }
    
    return data.reverse(); // Oldest first
  };

  const generateTopProductsData = () => {
    return [
      {
        id: '1',
        title: 'Watercolor Floral Bundle - Digital Clipart',
        views: 3421,
        favorites: 287,
        sales: 76,
        revenue: 987.24,
        conversion_rate: 2.22,
        trend: 'up'
      },
      {
        id: '2',
        title: 'Botanical Illustration Set - Digital Art',
        views: 2156,
        favorites: 134,
        sales: 41,
        revenue: 327.59,
        conversion_rate: 1.90,
        trend: 'up'
      },
      {
        id: '3',
        title: 'Vintage Style Poster Design - Digital Download',
        views: 1247,
        favorites: 89,
        sales: 23,
        revenue: 114.77,
        conversion_rate: 1.84,
        trend: 'down'
      },
      {
        id: '4',
        title: 'Modern Typography Print - Instant Download',
        views: 892,
        favorites: 67,
        sales: 15,
        revenue: 59.85,
        conversion_rate: 1.68,
        trend: 'neutral'
      },
      {
        id: '5',
        title: 'Minimalist Quote Print - Motivational Art',
        views: 456,
        favorites: 23,
        sales: 8,
        revenue: 23.92,
        conversion_rate: 1.75,
        trend: 'up'
      }
    ];
  };

  const calculateMetrics = (): MetricCard[] => {
    const dateRange = getDateRange(selectedPeriod);
    const filteredData = analyticsData.filter(item => {
      const itemDate = new Date(item.date);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });

    const totalViews = filteredData.reduce((sum, item) => sum + item.views, 0);
    const totalFavorites = filteredData.reduce((sum, item) => sum + item.favorites, 0);
    const totalSales = filteredData.reduce((sum, item) => sum + item.sales, 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
    const avgConversionRate = filteredData.length > 0 
      ? filteredData.reduce((sum, item) => sum + item.conversion_rate, 0) / filteredData.length 
      : 0;

    return [
      {
        title: 'Total Views',
        value: totalViews.toLocaleString(),
        change: '+12.5%',
        changeType: 'increase',
        icon: Eye,
        color: 'bg-blue-500'
      },
      {
        title: 'Total Favorites',
        value: totalFavorites.toLocaleString(),
        change: '+8.3%',
        changeType: 'increase',
        icon: Heart,
        color: 'bg-pink-500'
      },
      {
        title: 'Total Sales',
        value: totalSales.toLocaleString(),
        change: '+15.7%',
        changeType: 'increase',
        icon: ShoppingCart,
        color: 'bg-green-500'
      },
      {
        title: 'Total Revenue',
        value: `$${totalRevenue.toFixed(2)}`,
        change: '+18.2%',
        changeType: 'increase',
        icon: DollarSign,
        color: 'bg-emerald-500'
      },
      {
        title: 'Conversion Rate',
        value: `${avgConversionRate.toFixed(2)}%`,
        change: '+2.1%',
        changeType: 'increase',
        icon: Target,
        color: 'bg-orange-500'
      },
      {
        title: 'Active Products',
        value: topProducts.length.toString(),
        change: '0%',
        changeType: 'neutral',
        icon: Package,
        color: 'bg-purple-500'
      }
    ];
  };

  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          start: yesterday.toISOString().split('T')[0],
          end: yesterday.toISOString().split('T')[0]
        };
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        return {
          start: last7Days.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        return {
          start: last30Days.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'thismonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: thisMonthStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'thisyear':
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        return {
          start: thisYearStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'lastyear':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
        return {
          start: lastYearStart.toISOString().split('T')[0],
          end: lastYearEnd.toISOString().split('T')[0]
        };
      case 'alltime':
      default:
        return { start: null, end: null };
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const metrics = calculateMetrics();

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
            {getSelectedStoreName()} • {getSelectedPeriodLabel()}
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

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={() => loadAnalyticsData()}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={() => alert('Export functionality will be implemented')}
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
                Connect your first Etsy store to see analytics data.{' '}
                <a href="/admin/stores" className="underline hover:text-yellow-800 dark:hover:text-yellow-200">
                  Add store now
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {metric.changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : metric.changeType === 'decrease' ? (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  metric.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 
                  metric.changeType === 'decrease' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  vs previous period
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart Placeholder */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Performance Trend</span>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Interactive charts will be added
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Views, Sales, Revenue trends over time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top Performing Products</span>
              <Button variant="secondary" size="sm">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {product.title}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{product.views} views</span>
                        <span>{product.sales} sales</span>
                        <span>${product.revenue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getTrendColor(product.trend)}`}>
                      {product.conversion_rate}%
                    </span>
                    {getTrendIcon(product.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
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
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analyticsData.slice(-7).reverse().map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.favorites}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${item.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.conversion_rate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
              📊 Comprehensive Analytics Dashboard
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              This analytics dashboard is ready for real Etsy data integration. Currently showing sample data with:
              <br />
              <strong>Features:</strong> Performance metrics, trend analysis, top products, detailed tables, 
              store filtering, time period selection, and export capabilities.
              <br />
              <strong>Ready for:</strong> Real-time Etsy API data, interactive charts, custom date ranges, 
              and advanced filtering when connected to live stores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;