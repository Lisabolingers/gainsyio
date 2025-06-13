import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Package, Eye, Heart, ShoppingCart, Store, Plus, ArrowUpRight, Calendar, Filter, BarChart3, BookTemplate as FileTemplate } from 'lucide-react';

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

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStores: 0,
    totalProducts: 0,
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalFavorites: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stores count
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*, stores!inner(*)', { count: 'exact', head: true })
        .eq('stores.user_id', user?.id);

      // Fetch analytics data
      const { data: analyticsData } = await supabase
        .from('analytics_data')
        .select(`
          views,
          favorites,
          sales,
          revenue,
          products!inner(
            stores!inner(user_id)
          )
        `)
        .eq('products.stores.user_id', user?.id);

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
        totalStores: storesCount || 0,
        totalProducts: productsCount || 0,
        totalViews: totals.views,
        totalSales: totals.sales,
        totalRevenue: totals.revenue,
        totalFavorites: totals.favorites,
      });

      // Mock recent activity data
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

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View your store's overall performance
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last 1 year</option>
          </select>
          <button className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

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
                from previous period
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
              Sales Trend
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
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activities
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