import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Shield, Users, Database, Server, Activity, AlertTriangle, CheckCircle, Clock, RefreshCw, BarChart3, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalStores: number;
  totalProducts: number;
  databaseSize: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const SuperAdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    databaseSize: '0 MB',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    uptime: '0d 0h 0m'
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading super admin dashboard data...');
      
      // In a real implementation, this would fetch actual data from Supabase
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock system stats
      const mockStats: SystemStats = {
        totalUsers: 1254,
        activeUsers: 876,
        totalStores: 432,
        totalProducts: 15678,
        databaseSize: '1.2 GB',
        cpuUsage: 42,
        memoryUsage: 68,
        diskUsage: 57,
        uptime: '24d 7h 32m'
      };
      
      // Mock alerts
      const mockAlerts: AlertItem[] = [
        {
          id: '1',
          type: 'error',
          message: 'Database connection error occurred at 03:15 AM',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          type: 'warning',
          message: 'High CPU usage detected (85%)',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          resolved: true
        },
        {
          id: '3',
          type: 'info',
          message: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          resolved: true
        },
        {
          id: '4',
          type: 'success',
          message: 'New version deployed successfully',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          resolved: true
        }
      ];
      
      setStats(mockStats);
      setAlerts(mockAlerts);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'success': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
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
            <Shield className="h-6 w-6 mr-2 text-orange-500" />
            Süper Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem durumu ve genel istatistikler
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2 text-orange-500" />
          Sistem Durumu
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Usage */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU Kullanımı</h3>
              <span className={`text-sm font-medium ${stats.cpuUsage > 80 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.cpuUsage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  stats.cpuUsage > 80 ? 'bg-red-500' : 
                  stats.cpuUsage > 60 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`} 
                style={{ width: `${stats.cpuUsage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Memory Usage */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Bellek Kullanımı</h3>
              <span className={`text-sm font-medium ${stats.memoryUsage > 80 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.memoryUsage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  stats.memoryUsage > 80 ? 'bg-red-500' : 
                  stats.memoryUsage > 60 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`} 
                style={{ width: `${stats.memoryUsage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Disk Usage */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Disk Kullanımı</h3>
              <span className={`text-sm font-medium ${stats.diskUsage > 80 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.diskUsage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  stats.diskUsage > 80 ? 'bg-red-500' : 
                  stats.diskUsage > 60 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`} 
                style={{ width: `${stats.diskUsage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Database Size */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Veritabanı Boyutu</h3>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {stats.databaseSize}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Uptime: {stats.uptime}</span>
              <Database className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Kullanıcılar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalUsers}
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
              son 30 günde
            </span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Aktif Kullanıcılar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.activeUsers}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +8%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              son 30 günde
            </span>
          </div>
        </div>

        {/* Total Stores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Mağazalar
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalStores}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Server className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +15%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              son 30 günde
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Ürünler
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalProducts}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +23%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              son 30 günde
            </span>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Sistem Uyarıları
          </h2>
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300">
            {alerts.length} uyarı
          </span>
        </div>
        
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Şu anda aktif uyarı bulunmuyor
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-lg p-4 border ${getAlertColor(alert.type)} ${
                  alert.resolved ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${
                        alert.type === 'error' ? 'text-red-700 dark:text-red-400' :
                        alert.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                        alert.type === 'info' ? 'text-blue-700 dark:text-blue-400' :
                        'text-green-700 dark:text-green-400'
                      }`}>
                        {alert.message}
                      </p>
                      {alert.resolved && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                          Çözüldü
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-orange-500" />
            Kullanıcı Yönetimi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Kullanıcıları yönetin, rolleri düzenleyin ve erişim izinlerini kontrol edin.
          </p>
          <a 
            href="/superadmin/users" 
            className="flex items-center text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            <span>Kullanıcı Yönetimine Git</span>
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-orange-500" />
            Veritabanı Yönetimi
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Veritabanı performansını izleyin, yedeklemeleri yönetin ve bakım işlemlerini gerçekleştirin.
          </p>
          <a 
            href="/superadmin/system/database" 
            className="flex items-center text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            <span>Veritabanı Yönetimine Git</span>
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
            Sistem Analitiği
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Detaylı sistem analizlerini görüntüleyin, performans metriklerini takip edin.
          </p>
          <a 
            href="/superadmin/analytics" 
            className="flex items-center text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            <span>Analitiğe Git</span>
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;