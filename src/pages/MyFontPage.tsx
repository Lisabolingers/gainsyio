import React, { useState, useEffect } from 'react';
import { Type, Upload, Trash2, Download, Search, Filter, Grid, List, RefreshCw, Info } from 'lucide-react';
import { useFonts } from '../hooks/useFonts';
import { FontService } from '../lib/fontService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import FontUploadButton from '../components/AutoTextToImage/FontUploadButton';

const MyFontPage: React.FC = () => {
  const { user } = useAuth();
  const { userFonts, fontsByCategory, loading, error, deleteFont, loadUserFonts } = useFonts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'category'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFonts, setSelectedFonts] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter and sort fonts
  const filteredFonts = userFonts
    .filter(font => {
      const matchesSearch = font.font_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           font.font_family.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedCategory === 'all') return matchesSearch;
      
      const categoryInfo = FontService.getFontCategoryInfo(font.font_name);
      return matchesSearch && categoryInfo.category === selectedCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.font_name.localeCompare(b.font_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'category':
          const catA = FontService.getFontCategoryInfo(a.font_name).category;
          const catB = FontService.getFontCategoryInfo(b.font_name).category;
          return catA.localeCompare(catB);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleDeleteFont = async (fontId: string) => {
    if (window.confirm('Are you sure you want to delete this font?')) {
      try {
        await deleteFont(fontId);
      } catch (err) {
        console.error('Failed to delete font:', err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFonts.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedFonts.length} font(s)?`)) {
      try {
        await Promise.all(selectedFonts.map(fontId => deleteFont(fontId)));
        setSelectedFonts([]);
      } catch (err) {
        console.error('Failed to delete fonts:', err);
      }
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing fonts...');
      
      // Force reload all fonts with improved loading
      await FontService.forceReloadAllFonts(user.id);
      
      // Reload the fonts list
      await loadUserFonts();
      
      console.log('✅ Fonts refreshed successfully!');
    } catch (err) {
      console.error('❌ Failed to refresh fonts:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFontSelection = (fontId: string) => {
    setSelectedFonts(prev => 
      prev.includes(fontId) 
        ? prev.filter(id => id !== fontId)
        : [...prev, fontId]
    );
  };

  const selectAllFonts = () => {
    if (selectedFonts.length === filteredFonts.length) {
      setSelectedFonts([]);
    } else {
      setSelectedFonts(filteredFonts.map(font => font.id));
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'serif': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'sans-serif': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'monospace': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'cursive': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      'fantasy': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const FontPreview: React.FC<{ font: any }> = ({ font }) => {
    const categoryInfo = FontService.getFontCategoryInfo(font.font_name);
    
    // CRITICAL: Proper font style application with fallback and improved visibility
    const fontStyle = {
      fontFamily: font.font_family, // Use the full font family with fallbacks
      fontSize: '24px', // Increased font size for better visibility
      lineHeight: '1.4',
      fontWeight: 'normal' as const,
      fontStyle: 'normal' as const,
      fontVariant: 'normal' as const,
      textRendering: 'optimizeLegibility' as const,
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale' as const
    };

    return (
      <div className="space-y-2">
        <div 
          className="text-lg p-4 bg-white dark:bg-gray-700 rounded border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 min-h-[80px] flex items-center shadow-sm"
          style={fontStyle}
        >
          The quick brown fox jumps over the lazy dog
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full ${getCategoryBadgeColor(categoryInfo.category)}`}>
            {categoryInfo.category}
          </span>
          <span className="text-gray-500 dark:text-gray-400" title={categoryInfo.description}>
            <Info className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  };

  // Get category counts for filter dropdown
  const categoryCounts = React.useMemo(() => {
    const counts = { all: userFonts.length };
    userFonts.forEach(font => {
      const category = FontService.getFontCategoryInfo(font.font_name).category;
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [userFonts]);

  if (loading && userFonts.length === 0) {
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
            <Type className="h-6 w-6 mr-2 text-orange-500" />
            My Fonts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your custom fonts ({userFonts.length} fonts)
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <FontUploadButton 
            onFontUploaded={() => loadUserFonts()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          />
          <Button 
            onClick={handleRefresh} 
            variant="secondary"
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search fonts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories ({categoryCounts.all})</option>
            {Object.entries(categoryCounts).map(([category, count]) => (
              category !== 'all' && count > 0 && (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                </option>
              )
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'category')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
            <option value="size">Sort by Size</option>
          </select>
          
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
      {selectedFonts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400">
              {selectedFonts.length} font(s) selected
            </span>
            <div className="flex space-x-2">
              <Button onClick={handleBulkDelete} variant="danger" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
              <Button onClick={() => setSelectedFonts([])} variant="secondary" size="sm">
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fonts Display */}
      {filteredFonts.length === 0 ? (
        <div className="text-center py-12">
          <Type className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No fonts found' : 'No fonts uploaded yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search terms or filters'
              : 'Upload your first custom font to get started'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <FontUploadButton 
              onFontUploaded={() => loadUserFonts()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto"
            />
          )}
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              checked={selectedFonts.length === filteredFonts.length}
              onChange={selectAllFonts}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Select all ({filteredFonts.length} fonts)
            </label>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFonts.map((font) => {
                const categoryInfo = FontService.getFontCategoryInfo(font.font_name);
                return (
                  <Card key={font.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedFonts.includes(font.id)}
                            onChange={() => toggleFontSelection(font.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <CardTitle className="text-lg truncate">{font.font_name}</CardTitle>
                        </div>
                        <button
                          onClick={() => handleDeleteFont(font.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete font"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FontPreview font={font} />
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
                        <div className="flex justify-between">
                          <span>Format:</span>
                          <span className="uppercase font-medium">{font.font_format}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(font.file_size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span>{formatDate(font.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            font.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {font.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                        checked={selectedFonts.length === filteredFonts.length}
                        onChange={selectAllFonts}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Font Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFonts.map((font) => {
                    const categoryInfo = FontService.getFontCategoryInfo(font.font_name);
                    return (
                      <tr key={font.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedFonts.includes(font.id)}
                            onChange={() => toggleFontSelection(font.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {font.font_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {font.font_family}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="text-lg p-3 bg-white dark:bg-gray-700 rounded border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 min-w-[140px] shadow-sm"
                            style={{ 
                              fontFamily: font.font_family,
                              fontWeight: 'normal',
                              fontStyle: 'normal',
                              textRendering: 'optimizeLegibility',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale'
                            }}
                          >
                            Aa Bb Cc
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryBadgeColor(categoryInfo.category)}`}>
                            {categoryInfo.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="uppercase text-sm font-medium text-gray-900 dark:text-white">
                            {font.font_format}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatFileSize(font.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(font.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            font.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {font.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteFont(font.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete font"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyFontPage;