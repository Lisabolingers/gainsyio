import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FontService } from '../lib/fontService';
import { UserFont } from '../lib/supabase';

interface FontOption {
  display: string;
  value: string;
  category?: string;
  description?: string;
}

export const useFonts = () => {
  const { user, isDemoMode } = useAuth();
  const [userFonts, setUserFonts] = useState<UserFont[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontsInitialized, setFontsInitialized] = useState(false);

  // Default system fonts with web-safe options and categories
  const systemFonts: FontOption[] = [
    { 
      display: 'Arial', 
      value: 'Arial, sans-serif',
      category: 'sans-serif',
      description: 'Clean, modern sans-serif font'
    },
    { 
      display: 'Times New Roman', 
      value: 'Times New Roman, serif',
      category: 'serif',
      description: 'Classic serif font for formal documents'
    },
    { 
      display: 'Helvetica', 
      value: 'Helvetica, Arial, sans-serif',
      category: 'sans-serif',
      description: 'Popular Swiss sans-serif font'
    },
    { 
      display: 'Georgia', 
      value: 'Georgia, serif',
      category: 'serif',
      description: 'Elegant serif font designed for screens'
    },
    { 
      display: 'Verdana', 
      value: 'Verdana, sans-serif',
      category: 'sans-serif',
      description: 'Highly legible sans-serif font'
    },
    { 
      display: 'Comic Sans MS', 
      value: 'Comic Sans MS, cursive',
      category: 'cursive',
      description: 'Casual, handwriting-style font'
    },
    { 
      display: 'Courier New', 
      value: 'Courier New, monospace',
      category: 'monospace',
      description: 'Fixed-width font for code and data'
    }
  ];

  // Demo fonts for when in demo mode
  const demoFonts: UserFont[] = [
    {
      id: 'demo-font-1',
      user_id: user?.id || 'demo-user',
      font_name: 'Demo Script',
      font_family: 'Demo Script, cursive',
      file_url: '',
      file_size: 125000,
      font_format: 'ttf',
      is_active: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-font-2',
      user_id: user?.id || 'demo-user',
      font_name: 'Demo Sans',
      font_family: 'Demo Sans, sans-serif',
      file_url: '',
      file_size: 98000,
      font_format: 'otf',
      is_active: true,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Helper function to check if error is network-related
  const isNetworkError = (error: any): boolean => {
    return error?.message?.includes('Failed to fetch') ||
           error?.message?.includes('NetworkError') ||
           error?.message?.includes('fetch') ||
           error?.code === 'NETWORK_ERROR' ||
           error instanceof TypeError && error.message.includes('fetch');
  };

  // Helper function to get user-friendly error message
  const getErrorMessage = (error: any): string => {
    if (isNetworkError(error)) {
      return 'Supabase veritabanına bağlanılamıyor. İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
    }
    return error?.message || 'Bilinmeyen bir hata oluştu';
  };

  // Load user fonts with memoization to prevent unnecessary rerenders
  const loadUserFonts = useCallback(async () => {
    if (!user && !isDemoMode) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading user fonts...');
      
      // If in demo mode, return demo fonts
      if (isDemoMode) {
        console.log('🎭 Using demo fonts');
        setUserFonts(demoFonts);
        setFontsInitialized(true);
        return demoFonts;
      }
      
      const fonts = await FontService.getUserFonts(user?.id || '');
      setUserFonts(fonts);

      // Load fonts into browser with improved reliability
      if (fonts.length > 0) {
        console.log(`🔄 Loading ${fonts.length} user fonts into browser...`);
        
        try {
          // Load fonts in batches of 3 to prevent browser overload
          const batchSize = 3;
          for (let i = 0; i < fonts.length; i += batchSize) {
            const batch = fonts.slice(i, i + batchSize);
            await Promise.all(batch.map(font => FontService.loadFontInBrowser(font)));
            // Small delay between batches
            if (i + batchSize < fonts.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          console.log('✅ All fonts loaded to browser');
        } catch (loadError) {
          console.warn('⚠️ Some fonts could not be loaded to browser:', loadError);
          // Continue despite font loading errors - we'll use fallbacks
        }
      }
      
      setFontsInitialized(true);
      console.log('🎉 FONT INITIALIZATION COMPLETED');
      return fonts;
      
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('❌ Failed to load user fonts:', errorMessage);
      
      // Set empty array as fallback to prevent UI crashes
      setUserFonts([]);
      setFontsInitialized(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  // Load user fonts on component mount and when user changes
  useEffect(() => {
    if ((user || isDemoMode) && !fontsInitialized) {
      loadUserFonts();
    }
  }, [user, isDemoMode, fontsInitialized, loadUserFonts]);

  const uploadFont = async (file: File): Promise<UserFont> => {
    if (!user && !isDemoMode) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Uploading font: ${file.name}`);
      
      // If in demo mode, create a demo font
      if (isDemoMode) {
        console.log('🎭 Creating demo font');
        const demoFont: UserFont = {
          id: `demo-font-${Date.now()}`,
          user_id: user?.id || 'demo-user',
          font_name: file.name.split('.')[0],
          font_family: `${file.name.split('.')[0]}, sans-serif`,
          file_url: URL.createObjectURL(file),
          file_size: file.size,
          font_format: (file.name.split('.').pop() || 'ttf') as 'ttf' | 'otf' | 'woff' | 'woff2',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Update state immediately
        setUserFonts(prev => [demoFont, ...prev]);
        
        return demoFont;
      }
      
      const savedFont = await FontService.uploadAndSaveFont(file, user?.id || '');
      console.log(`✅ Font uploaded successfully: ${savedFont.font_name}`);
      
      // CRITICAL: Update local state immediately for instant UI refresh
      setUserFonts(prev => [savedFont, ...prev]);
      
      // CRITICAL: Force reload fonts in browser for immediate canvas availability
      try {
        await FontService.loadFontInBrowser(savedFont);
        console.log(`🎨 Font ${savedFont.font_name} loaded in browser for immediate use`);
      } catch (loadError) {
        console.warn(`⚠️ Font uploaded but failed to load in browser immediately:`, loadError);
      }
      
      return savedFont;
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      console.error(`❌ Font upload failed: ${errorMessage}`);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteFont = async (fontId: string) => {
    if (!user && !isDemoMode) return;

    try {
      setLoading(true);
      setError(null);

      // If in demo mode, just remove from state
      if (isDemoMode) {
        console.log('🎭 Removing demo font');
        setUserFonts(prev => prev.filter(font => font.id !== fontId));
        return;
      }

      await FontService.deleteFont(fontId, user?.id || '');
      
      // Update local state immediately
      setUserFonts(prev => prev.filter(font => font.id !== fontId));
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get all available fonts (system + user) as FontOption objects
  const getAllFonts = (): FontOption[] => {
    const userFontOptions: FontOption[] = userFonts.map(font => {
      const categoryInfo = FontService.getFontCategoryInfo(font.font_name);
      return {
        display: font.font_name, // Human-readable name (e.g., "Angkanya Sebelas")
        value: font.font_family, // CSS font family with fallbacks
        category: categoryInfo.category,
        description: `Custom ${categoryInfo.category} font`
      };
    });
    return [...systemFonts, ...userFontOptions];
  };

  // Get fonts grouped by category
  const getFontsByCategory = () => {
    const allFonts = getAllFonts();
    const categories = {
      'sans-serif': [] as FontOption[],
      'serif': [] as FontOption[],
      'monospace': [] as FontOption[],
      'cursive': [] as FontOption[],
      'fantasy': [] as FontOption[],
      'other': [] as FontOption[]
    };

    allFonts.forEach(font => {
      const category = font.category || 'other';
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].push(font);
      } else {
        categories.other.push(font);
      }
    });

    return categories;
  };

  return {
    userFonts,
    systemFonts,
    allFonts: getAllFonts(),
    fontsByCategory: getFontsByCategory(),
    loading,
    error,
    uploadFont,
    deleteFont,
    loadUserFonts,
    fontsInitialized
  };
};