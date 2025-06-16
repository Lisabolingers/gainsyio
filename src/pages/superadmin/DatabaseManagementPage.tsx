import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, RefreshCw, Download, Clock, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  lastVacuum: string;
}

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  created: string;
  status: 'completed' | 'in_progress' | 'failed';
}

const DatabaseManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [dbStats, setDbStats] = useState({
    size: '0 GB',
    connections: 0,
    uptime: '0d 0h 0m',
    version: 'PostgreSQL 14.5'
  });

  useEffect(() => {
    if (user) {
      loadDatabaseInfo();
    }
  }, [user]);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading database information...');
      
      // In a real implementation, this would fetch actual data from Supabase
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock tables data
      const mockTables: TableInfo[] = [
        {
          name: 'user_profiles',
          rows: 1254,
          size: '24.5 MB',
          lastVacuum: '2023-06-10 08:45:12'
        },
        {
          name: 'stores',
          rows: 432,
          size: '8.2 MB',
          lastVacuum: '2023-06-10 08:45:15'
        },
        {
          name: 'products',
          rows: 15678,
          size: '156.3 MB',
          lastVacuum: '2023-06-10 08:45:18'
        },
        {
          name: 'analytics_data',
          rows: 45678,
          size: '312.7 MB',
          lastVacuum: '2023-06-10 08:45:21'
        },
        {
          name: 'mockup_templates',
          rows: 256,
          size: '45.2 MB',
          lastVacuum: '2023-06-10 08:45:24'
        },
        {
          name: 'listing_templates',
          rows: 189,
          size: '12.8 MB',
          lastVacuum: '2023-06-10 08:45:27'
        },
        {
          name: 'auto_text_templates',
          rows: 124,
          size: '8.5 MB',
          lastVacuum: '2023-06-10 08:45:30'
        },
        {
          name: 'user_fonts',
          rows: 342,
          size: '18.9 MB',
          lastVacuum: '2023-06-10 08:45:33'
        }
      ];
      
      // Mock backups data
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          name: 'daily_backup_2023_06_15',
          size: '578.4 MB',
          created: '2023-06-15 03:00:00',
          status: 'completed'
        },
        {
          id: '2',
          name: 'daily_backup_2023_06_14',
          size: '572.1 MB',
          created: '2023-06-14 03:00:00',
          status: 'completed'
        },
        {
          id: '3',
          name: 'daily_backup_2023_06_13',
          size: '568.7 MB',
          created: '2023-06-13 03:00:00',
          status: 'completed'
        },
        {
          id: '4',
          name: 'weekly_backup_2023_06_11',
          size: '565.2 MB',
          created: '2023-06-11 02:00:00',
          status: 'completed'
        },
        {
          id: '5',
          name: 'monthly_backup_2023_06_01',
          size: '552.8 MB',
          created: '2023-06-01 01:00:00',
          status: 'completed'
        }
      ];
      
      // Mock DB stats
      const mockDbStats = {
        size: '1.2 GB',
        connections: 24,
        uptime: '24d 7h 32m',
        version: 'PostgreSQL 14.5'
      };
      
      setTables(mockTables);
      setBackups(mockBackups);
      setDbStats(mockDbStats);
      
      console.log('✅ Database information loaded successfully');
    } catch (error) {
      console.error('❌ Error loading database information:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
            <Database className="h-6 w-6 mr-2 text-orange-500" />
            Veritabanı Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Veritabanı performansını izleyin ve yedeklemeleri yönetin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDatabaseInfo}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Yenile</span>
          </button>
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Yedekleme Oluştur</span>
          </button>
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Veritabanı Boyutu</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.size}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Aktif Bağlantılar</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.connections}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Çalışma Süresi</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.uptime}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">PostgreSQL Versiyonu</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.version}</p>
        </div>
      </div>

      {/* Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Veritabanı Tabloları
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tablo Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Satır Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Boyut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Son Vacuum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tables.map((table) => (
                <tr key={table.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {table.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {table.rows.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {table.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(table.lastVacuum)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300">
                      Vacuum
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Veritabanı Yedeklemeleri
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Yedekleme Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Boyut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Oluşturulma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {backup.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(backup.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(backup.status)}`}>
                      <span className="flex items-center">
                        {getStatusIcon(backup.status)}
                        <span className="ml-1">
                          {backup.status === 'completed' ? 'Tamamlandı' : 
                           backup.status === 'in_progress' ? 'Devam Ediyor' : 'Başarısız'}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        İndir
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagementPage;