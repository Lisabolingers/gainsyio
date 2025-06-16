import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Download, Search, Filter, Grid, List, RefreshCw, AlertCircle, CheckCircle, X, Image as ImageIcon, FileUp, FileDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface TemporaryFile {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  expires_at: string;
}

const TemporaryFilesPage: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<TemporaryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadFiles();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadFiles();
      }, 30000);
      
      setRefreshInterval(interval);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading temporary files...');
      
      const { data, error } = await supabase
        .from('temporary_files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error loading temporary files:', error);
        throw error;
      }
      
      // If we have real data, use it
      if (data && data.length > 0) {
        setFiles(data);
        console.log(`✅ ${data.length} temporary files loaded`);
        return;
      }
      
      // Otherwise use mock data
      const mockFiles: TemporaryFile[] = [
        {
          id: '1',
          user_id: user?.id || '',
          file_name: 'Auto Text Design 1.png',
          file_url: 'https://images.pexels.com/photos/3094218/pexels-photo-3094218.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'image/png',
          file_size: 245000,
          created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          expires_at: new Date(Date.now() + 300000).toISOString() // 5 minutes from now
        },
        {
          id: '2',
          user_id: user?.id || '',
          file_name: 'Auto Text Design 2.png',
          file_url: 'https://images.pexels.com/photos/1109354/pexels-photo-1109354.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'image/png',
          file_size: 198000,
          created_at: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
          expires_at: new Date(Date.now() + 360000).toISOString() // 6 minutes from now
        },
        {
          id: '3',
          user_id: user?.id || '',
          file_name: 'Auto Text Design 3.png',
          file_url: 'https://images.pexels.com/photos/1070945/pexels-photo-1070945.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'image/png',
          file_size: 320000,
          created_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          expires_at: new Date(Date.now() + 420000).toISOString() // 7 minutes from now
        },
        {
          id: '4',
          user_id: user?.id || '',
          file_name: 'Auto Text Design 4.png',
          file_url: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'image/png',
          file_size: 275000,
          created_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
          expires_at: new Date(Date.now() + 480000).toISOString() // 8 minutes from now
        },
        {
          id: '5',
          user_id: user?.id || '',
          file_name: 'Auto Text Design 5.png',
          file_url: 'https://images.pexels.com/photos/1055379/pexels-photo-1055379.jpeg?auto=compress&cs=tinysrgb&w=400',
          file_type: 'image/png',
          file_size: 210000,
          created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          expires_at: new Date(Date.now() + 540000).toISOString() // 9 minutes from now
        }
      ];
      
      setFiles(mockFiles);
      console.log(`✅ ${mockFiles.length} temporary files loaded (mock data)`);
    } catch (error: any) {
      console.error('❌ Error loading files:', error);
      setError('Failed to load temporary files: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      console.log(`🗑️ Deleting file: ${fileId}`);
      
      const { error } = await supabase
        .from('temporary_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Error deleting file:', error);
        throw error;
      }
      
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
      
      console.log(`✅ File deleted successfully`);
    } catch (error: any) {
      console.error('❌ Error deleting file:', error);
      alert('Failed to delete file: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`)) return;
    
    try {
      console.log(`🗑️ Deleting ${selectedFiles.length} files...`);
      
      // In a real implementation with Supabase, we would use .in() to delete multiple files
      const { error } = await supabase
        .from('temporary_files')
        .delete()
        .in('id', selectedFiles)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('❌ Error deleting files:', error);
        throw error;
      }
      
      setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
      setSelectedFiles([]);
      
      console.log(`✅ ${selectedFiles.length} files deleted successfully`);
    } catch (error: any) {
      console.error('❌ Error deleting files:', error);
      alert('Failed to delete files: ' + error.message);
    }
  };

  const downloadFile = (file: TemporaryFile) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(file => file.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${diffMins}m ${diffSecs}s`;
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.file_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Clock className="h-6 w-6 mr-2 text-orange-500" />
            Geçici Dosyalar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Auto Text to Image'dan oluşturulan dosyalar ({files.length} dosya)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={loadFiles}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
              ⏱️ Çok Kısa Süreli Depolama
            </h3>
            <p className="text-sm text-orange-600 dark:text-orange-300">
              <strong>Otomatik Silme:</strong> Bu bölümdeki dosyalar 10 dakika sonra otomatik olarak silinir.
              <br />
              <strong>Amaç:</strong> Bu dosyalar, Auto Text to Image şablonlarından oluşturulur ve Etsy listelerinde hemen kullanım içindir.
              <br />
              <strong>Gerekli İşlem:</strong> Saklamak istediğiniz dosyaları süresi dolmadan indirin.
            </p>
          </div>
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Dosyalarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedFiles.length} dosya seçildi
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Seçilenleri Sil
              </Button>
              <Button onClick={() => setSelectedFiles([])} variant="secondary" size="sm">
                Seçimi Temizle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Dosya bulunamadı' : 'Henüz geçici dosya yok'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Arama terimlerinizi değiştirmeyi deneyin'
              : 'Dosyaları görmek için Auto Text to Image ile tasarımlar oluşturun'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={() => window.location.href = '/admin/listing/upload-design'}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-2 mx-auto"
            >
              <FileUp className="h-4 w-4" />
              <span>Auto Text Tasarım Oluştur</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={selectedFiles.length === filteredFiles.length}
              onChange={selectAllFiles}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Tümünü seç ({filteredFiles.length} dosya)
            </label>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* File Preview */}
                      <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-contain"
                        />
                        
                        {/* Expiration Badge */}
                        <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{getTimeRemaining(file.expires_at)}</span>
                        </div>
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadFile(file)}
                              className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
                              title="İndir"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => toggleFileSelection(file.id)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {file.file_name}
                            </h3>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedFiles.length === filteredFiles.length}
                        onChange={selectAllFiles}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dosya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Boyut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Oluşturulma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kalan Süre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden">
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.file_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {file.file_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-xs font-medium flex items-center w-fit">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeRemaining(file.expires_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadFile(file)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="İndir"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TemporaryFilesPage;