import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [userFonts, setUserFonts] = useState<UserFont[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    },
    { 
      display: 'Roboto', 
      value: 'Roboto, sans-serif',
      category: 'sans-serif',
      description: 'Modern Google font'
    },
    { 
      display: 'Open Sans', 
      value: 'Open Sans, sans-serif',
      category: 'sans-serif',
      description: 'Friendly and readable sans-serif'
    },
    { 
      display: 'Lobster', 
      value: 'Lobster, cursive',
      category: 'cursive',
      description: 'Bold script font for headlines'
    }
  ];

  // Load user fonts on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadUserFonts();
    }
  }, [user]);

  const loadUserFonts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading user fonts...');
      
      const fonts = await FontService.getUserFonts(user.id);
      setUserFonts(fonts);

      // Load fonts into browser with improved reliability
      console.log(`🔄 Loading ${fonts.length} user fonts into browser...`);
      
      const loadedFonts = await FontService.loadAllUserFonts(user.id);
      
      console.log(`🎉 Font loading complete. ${loadedFonts.length}/${fonts.length} fonts loaded successfully.`);
      
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Failed to load user fonts:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFont = async (file: File): Promise<UserFont> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Uploading font: ${file.name}`);
      const savedFont = await FontService.uploadAndSaveFont(file, user.id);
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
      console.error(`❌ Font upload failed: ${err.message}`);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFont = async (fontId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      await FontService.deleteFont(fontId, user.id);
      
      // Update local state immediately
      setUserFonts(prev => prev.filter(font => font.id !== fontId));
    } catch (err: any) {
      setError(err.message);
      throw err;
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
    loadUserFonts
  };
};