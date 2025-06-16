import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, RefreshCw, Download, Search, Filter, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  details?: string;
}

const LogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading system logs...');
      
      // In a real implementation, this would fetch actual data from Supabase
      // For now, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock logs data
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          level: 'error',
          message: 'Database connection error: Connection refused',
          source: 'database',
          details: 'Error: Connection refused at PostgresClient.connect (postgres.js:245)\nCaused by: Error: connect ECONNREFUSED 127.0.0.1:5432'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          level: 'warning',
          message: 'High memory usage detected: 85%',
          source: 'system',
          details: 'Memory usage has exceeded the warning threshold of 80%. Current usage: 85%.'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          level: 'info',
          message: 'User login successful: user@example.com',
          source: 'auth',
          details: 'User ID: 123456\nIP Address: 192.168.1.1\nUser Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
          level: 'error',
          message: 'API rate limit exceeded for endpoint: /api/products',
          source: 'api',
          details: 'Rate limit: 100 requests per minute\nCurrent rate: 120 requests per minute\nClient IP: 192.168.1.2'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1500000).toISOString(), // 25 minutes ago
          level: 'info',
          message: 'System backup completed successfully',
          source: 'system',
          details: 'Backup size: 1.2GB\nBackup location: /backups/daily/2023-06-15.sql.gz\nDuration: 45 seconds'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          level: 'debug',
          message: 'Cache hit ratio: 78.5%',
          source: 'cache',
          details: 'Total requests: 1000\nCache hits: 785\nCache misses: 215'
        },
        {
          id: '7',
          timestamp: new Date(Date.now() - 2100000).toISOString(), // 35 minutes ago
          level: 'warning',
          message: 'Slow query detected: SELECT * FROM products WHERE category = ?',
          source: 'database',
          details: 'Query time: 2.5s\nQuery plan: Seq Scan on products (cost=0.00..1000.00 rows=1000 width=100)'
        },
        {
          id: '8',
          timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
          level: 'info',
          message: 'New user registered: newuser@example.com',
          source: 'auth',
          details: 'User ID: 123457\nIP Address: 192.168.1.3\nRegistration source: web'
        },
        {
          id: '9',
          timestamp: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
          level: 'error',
          message: 'Payment processing failed for order #12345',
          source: 'payment',
          details: 'Error: Invalid card number\nOrder ID: 12345\nAmount: $99.99\nPayment provider: Stripe'
        },
        {
          id: '10',
          timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
          level: 'info',
          message: 'Scheduled maintenance started',
          source: 'system',
          details: 'Maintenance type: Database optimization\nEstimated duration: 30 minutes\nAffected services: None'
        }
      ];
      
      setLogs(mockLogs);
      
      console.log('✅ System logs loaded successfully');
    } catch (error) {
      console.error('❌ Error loading system logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (logId: string) => {
    if (showDetails === logId) {
      setShowDetails(null);
    } else {
      setShowDetails(logId);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    
    return matchesSearch && matchesLevel && matchesSource;
  });

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

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'debug': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get unique sources for filter
  const sources = ['all', ...new Set(logs.map(log => log.source))];

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
            <FileText className="h-6 w-6 mr-2 text-orange-500" />
            Sistem Logları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem loglarını görüntüleyin ve sorunları tespit edin
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Yenile</span>
          </button>
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Logları İndir</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Loglarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex space-x-4">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tüm Seviyeler</option>
            <option value="error">Hata</option>
            <option value="warning">Uyarı</option>
            <option value="info">Bilgi</option>
            <option value="debug">Debug</option>
          </select>
          
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {sources.map(source => (
              <option key={source} value={source}>
                {source === 'all' ? 'Tüm Kaynaklar' : source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zaman
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Seviye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kaynak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mesaj
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Detaylar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Log bulunamadı
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getLevelColor(log.level)}`}>
                          {getLevelIcon(log.level)}
                          <span className="ml-1 capitalize">
                            {log.level === 'error' ? 'Hata' : 
                             log.level === 'warning' ? 'Uyarı' : 
                             log.level === 'info' ? 'Bilgi' : 'Debug'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                        {log.source}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {log.details ? (
                          <button
                            onClick={() => toggleDetails(log.id)}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          >
                            {showDetails === log.id ? 'Gizle' : 'Göster'}
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Yok</span>
                        )}
                      </td>
                    </tr>
                    {showDetails === log.id && log.details && (
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                              {log.details}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;