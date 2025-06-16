import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Users, Store, Package, DollarSign, Clock, Download, Filter } from 'lucide-react';

const SuperAdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');

  // Time period options
  const timePeriods = [
    { value: 'today', label: 'Bugün' },
    { value: 'yesterday', label: 'Dün' },
    { value: 'last7days', label: 'Son 7 gün' },
    { value: 'last30days', label: 'Son 30 gün' },
    { value: 'thismonth', label: 'Bu ay' },
    { value: 'thisyear', label: 'Bu yıl' },
    { value: 'alltime', label: 'Tüm zamanlar' }
  ];

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading analytics data...');
      
      // In a real implementation, this would fetch actual data from Supabase
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Analytics data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPeriodLabel = () => {
    const period = timePeriods.find(p => p.value === selectedPeriod);
    return period ? period.label : 'Son 30 gün';
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
            Sistem Analitiği
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Detaylı sistem performans metrikleri • {getSelectedPeriodLabel()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
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

          {/* Refresh Button */}
          <button
            onClick={loadAnalyticsData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Yenile</span>
          </button>
          
          {/* Export Button */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Yeni Kullanıcılar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                128
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +12%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              vs önceki dönem
            </span>
          </div>
        </div>

        {/* New Stores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Yeni Mağazalar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                45
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Store className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +8%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              vs önceki dönem
            </span>
          </div>
        </div>

        {/* New Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Yeni Ürünler
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                1,245
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +23%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              vs önceki dönem
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Gelir
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                $12,450
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-sm font-medium text-red-600">
              -5%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              vs önceki dönem
            </span>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Kullanıcı Büyümesi
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getSelectedPeriodLabel()}
              </span>
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Grafik yakında eklenecek
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gelir Analizi
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getSelectedPeriodLabel()}
              </span>
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                Grafik yakında eklenecek
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Sistem Performansı
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Response Time */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ortalama Yanıt Süresi</h3>
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">245ms</p>
            <div className="flex items-center mt-2">
              <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs font-medium text-green-600">
                -12ms
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                vs önceki dönem
              </span>
            </div>
          </div>
          
          {/* Error Rate */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Hata Oranı</h3>
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">0.12%</p>
            <div className="flex items-center mt-2">
              <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs font-medium text-green-600">
                -0.05%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                vs önceki dönem
              </span>
            </div>
          </div>
          
          {/* Uptime */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Çalışma Süresi</h3>
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">99.98%</p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs font-medium text-green-600">
                +0.01%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                vs önceki dönem
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAnalyticsPage;