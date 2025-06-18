import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, executeWithTimeout, isConfigValid } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Package, Eye, Heart, ShoppingCart, Store, Plus, ArrowUpRight, Calendar, BarChart3, BookTemplate as FileTemplate, ChevronDown, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalStores: number;
  totalProducts: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  totalFavorites: number;
}

interface RecentActivity {
  id: string;
  type: 'product_created' | 'sale' | 'view' | 'favorite';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

interface EtsyStore {
  id: string;
  store_name: string;
  is_active: boolean;
}

const AdminDashboardPage: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStores: 0,
    totalProducts: 0,
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalFavorites: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [stores, setStores] = useState<EtsyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('last7days');
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  useEffect(() => {
    if (user || isDemoMode) {
      if (isDemoMode || !isConfigValid) {
        loadDemoData();
      } else {
        loadStores();
        fetchDashboardData();
      }
    }
  }, [user, selectedStore, selectedPeriod, isDemoMode]);

  const loadDemoData = () => {
    console.log('🎭 Loading demo dashboard data...');
    
    // Load demo stores
    const demoStores: EtsyStore[] = [
      { id: 'store1', store_name: 'Demo Etsy Store', is_active: true },
      { id: 'store2', store_name: 'Demo Craft Shop', is_active: true }
    ];
    setStores(demoStores);
    
    // Load demo stats
    setStats({
      totalStores: 2,
      totalProducts: 45,
      totalViews: 2547,
      totalSales: 87,
      totalRevenue: 1245.99,
      totalFavorites: 356
    });
    
    // Load demo activity
    setRecentActivity([
      {
        id: '1',
        type: 'product_created',
        title: 'New product added',
        description: 'Vintage Poster Design',
        timestamp: '2 hours ago',
      },
      {
        id: '2',
        type: 'sale',
        title: 'Sale completed',
        description: 'Minimalist Logo Design',
        timestamp: '4 hours ago',
        amount: 25.99,
      },
      {
        id: '3',
        type: 'favorite',
        title: 'Product favorited',
        description: 'Modern Typography Poster',
        timestamp: '6 hours ago',
      },
      {
        id: '4',
        type: 'view',
        title: 'Product viewed',
        description: 'Abstract Art Print',
        timestamp: '8 hours ago',
      },
    ]);
    
    setConnectionError('Using demo data - Database connection not available');
    setLoading(false);
  };

  const loadStores = async () => {
    try {
      console.log('🔄 Loading Etsy stores for dashboard...');
      
      const { data, error } = await executeWithTimeout(
        () => supabase
          .from('stores')
          .select('id, store_name, is_active')
          .eq('user_id', user?.id)
          .eq('platform', 'etsy')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        45000, // Increased from 30000 to 45000 milliseconds (45 seconds)
        3 // Increased from 2 to 3 retries
      );

      if (error) {
        console.error('❌ Store loading error:', error);
        
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('timeout') ||
            error.message?.includes('signal timed out')) {
          setConnectionError('Database connection failed. Using demo data.');
          loadDemoData();
          return;
        }
        
        throw error;
      }

      console.log(`✅ ${data?.length || 0} Etsy stores loaded for dashboard`);
      setStores(data || []);
      setConnectionError(null);
    } catch (error: any) {
      console.error('❌ Store loading general error:', error);
      
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('timeout') ||
          error.message?.includes('Query timeout') ||
          error.name === 'AbortError') {
        setConnectionError('Database connection timeout. Using demo data.');
        loadDemoData();
      } else {
        setConnectionError(`Database error: ${error.message}. Using demo data.`);
        loadDemoData();
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setConnectionError(null);

      // Test connection first
      if (!isConfigValid) {
        setConnectionError('Supabase is not properly configured. Using demo data.');
        loadDemoData();
        return;
      }

      // Fetch stores count with timeout
      let storesQuery = supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (selectedStore !== 'all') {
        storesQuery = storesQuery.eq('id', selectedStore);
      }

      let storesCount;
      try {
        const { count, error } = await executeWithTimeout(
          () => storesQuery,
          45000, // Increased from 30000 to 45000 milliseconds (45 seconds)
          3 // Increased from 2 to 3 retries
        );
        
        if (error) {
          console.error('❌ Stores query error:', error);
          
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('timeout') ||
              error.message?.includes('signal timed out')) {
            setConnectionError('Database connection failed. Using demo data.');
            loadDemoData();
            return;
          }
          
          throw error;
        }
        
        storesCount = count;
      } catch (error: any) {
        console.error('❌ Stores query error:', error);
        
        if (error.message?.includes('timeout') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Query timeout') ||
            error.name === 'AbortError') {
          setConnectionError('Database query timed out. Using demo data.');
          loadDemoData();
          return;
        }
        
        throw error;
      }

      // Fetch products count with timeout
      let productsQuery = supabase
        .from('products')
        .select('*, stores!inner(*)', { count: 'exact', head: true })
        .eq('stores.user_id', user?.id);

      if (selectedStore !== 'all') {
        productsQuery = productsQuery.eq('store_id', selectedStore);
      }

      let productsCount;
      try {
        const { count, error } = await executeWithTimeout(
          () => productsQuery,
          45000, // Increased from 30000 to 45000 milliseconds (45 seconds)
          3 // Increased from 2 to 3 retries
        );
        
        if (error) {
          console.error('❌ Products query error:', error);
          
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('timeout') ||
              error.message?.includes('signal timed out')) {
            setConnectionError('Database connection failed. Using demo data.');
            loadDemoData();
            return;
          }
          
          throw error;
        }
        
        productsCount = count;
      } catch (error: any) {
        console.error('❌ Products query error:', error);
        
        if (error.message?.includes('timeout') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('Query timeout') ||
            error.name === 'AbortError') {
          setConnectionError('Database query timed out. Using demo data.');
          loadDemoData();
          return;
        }
        
        throw error;
      }

      // Calculate date range based on selected period
      const dateRange = getDateRange(selectedPeriod);

      // Fetch analytics data with date filtering and timeout
      let analyticsQuery = supabase
        .from('analytics_data')
        .select(`
          views,
          favorites,
          sales,
          revenue,
          date,
          products!inner(
            stores!inner(user_id)
          )
        `)
        .eq('products.stores.user_id', user?.id);

      if (selectedStore !== 'all') {
        analyticsQuery = analyticsQuery.eq('products.store_id', selectedStore);
      }

      if (dateRange.start) {
        analyticsQuery = analyticsQuery.gte('date', dateRange.start);
      }
      if (dateRange.end) {
        analyticsQuery = analyticsQuery.lte('date', dateRange.end);
      }

      let analyticsData;
      try {
        const { data, error } = await executeWithTimeout(
          () => analyticsQuery,
          45000, // Increased from 30000 to 45000 milliseconds (45 seconds)
          3 // Increased from 2 to 3 retries
        );
        
        if (error) {
          console.error('❌ Analytics query error:', error);
          
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('timeout') ||
              error.message?.includes('signal timed out')) {
            // Don't throw error for analytics as it's not critical
            console.warn('Analytics data unavailable, using defaults');
            analyticsData = [];
          } else {
            // Don't throw error for analytics as it's not critical
            console.warn('Analytics data unavailable, using defaults');
            analyticsData = [];
          }
        } else {
          analyticsData = data;
        }
      } catch (error: any) {
        console.error('❌ Analytics query error:', error);
        // Don't throw error for analytics as it's not critical
        console.warn('Analytics data unavailable, using defaults');
        analyticsData = [];
      }

      // Calculate totals
      const totals = analyticsData?.reduce(
        (acc, item) => ({
          views: acc.views + item.views,
          favorites: acc.favorites + item.favorites,
          sales: acc.sales + item.sales,
          revenue: acc.revenue + parseFloat(item.revenue.toString()),
        }),
        { views: 0, favorites: 0, sales: 0, revenue: 0 }
      ) || { views: 0, favorites: 0, sales: 0, revenue: 0 };

      setStats({
        totalStores: selectedStore === 'all' ? (storesCount || 0) : 1,
        totalProducts: productsCount || 0,
        totalViews: totals.views,
        totalSales: totals.sales,
        totalRevenue: totals.revenue,
        totalFavorites: totals.favorites,
      });

      // Mock recent activity data (filtered by store and period)
      setRecentActivity([
        {
          id: '1',
          type: 'product_created',
          title: 'New product added',
          description: 'Vintage Poster Design',
          timestamp: '2 hours ago',
        },
        {
          id: '2',
          type: 'sale',
          title: 'Sale completed',
          description: 'Minimalist Logo Design',
          timestamp: '4 hours ago',
          amount: 25.99,
        },
        {
          id: '3',
          type: 'favorite',
          title: 'Product favorited',
          description: 'Modern Typography Poster',
          timestamp: '6 hours ago',
        },
        {
          id: '4',
          type: 'view',
          title: 'Product viewed',
          description: 'Abstract Art Print',
          timestamp: '8 hours ago',
        },
      ]);

      setConnectionError(null);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('timeout') ||
          error.message?.includes('Query timeout') ||
          error.name === 'AbortError') {
        setConnectionError('Unable to connect to the database. Using demo data.');
        loadDemoData();
      } else {
        setConnectionError(`Database error: ${error.message}. Using demo data.`);
        loadDemoData();
      }
    } finally {
      setLoading(false);
    }
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

  const statCards = [
    {
      title: 'Total Stores',
      value: stats.totalStores,
      icon: Store,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+18%',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Favorites',
      value: stats.totalFavorites,
      icon: Heart,
      color: 'bg-pink-500',
      change: '+5%',
      changeType: 'increase' as const,
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_created':
        return <Plus className="h-4 w-4" />;
      case 'sale':
        return <ShoppingCart className="h-4 w-4" />;
      case 'favorite':
        return <Heart className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'product_created':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'sale':
        return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'favorite':
        return 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400';
      case 'view':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status Warning */}
      {connectionError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                Database Connection Notice
              </h3>
              <p className="text-yellow-600 dark:text-yellow-300 mb-4">
                {connectionError}
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Using Demo Data
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The dashboard is currently displaying demo data. To use real data, please configure your Supabase connection.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Store and Period Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard {(isDemoMode || connectionError) && '(Demo Mode)'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getSelectedStoreName()} • {getSelectedPeriodLabel()}
          </p>
        </div>
        
        {/* Store and Period Selectors */}
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
        </div>
      </div>

      {/* No Store Warning */}
      {stores.length === 0 && !connectionError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Store className="h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                No Etsy stores connected
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                Connect your first Etsy store to see dashboard data.{' '}
                <Link to="/admin/stores" className="underline hover:text-yellow-800 dark:hover:text-yellow-200">
                  Add store now
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              {stat.changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                vs previous period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sales Trend - {getSelectedPeriodLabel()}
            </h3>
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View Details
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Chart will be added soon
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Showing data for {getSelectedStoreName()}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activities {(isDemoMode || connectionError) && '(Demo)'}
            </h3>
            <Link 
              to="/admin/analytics"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      {activity.timestamp}
                    </p>
                    {activity.amount && (
                      <p className="text-xs font-medium text-green-600">
                        +${activity.amount}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/stores"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Store className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Add Store</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connect new store</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>
          
          <Link
            to="/admin/listing"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">List Product</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create new product</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>
          
          <Link
            to="/admin/templates"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileTemplate className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create Template</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add new template</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>
          
          <Link
            to="/admin/analytics"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <BarChart3 className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Analytics</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Detailed reports</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;