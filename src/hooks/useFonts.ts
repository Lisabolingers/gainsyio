import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FontService } from '../lib/fontService';
import { UserFont } from '../lib/supabase';

interface FontOption {
  display: string;
  value: string;
  category?: string;
  description?: string;
  isGoogleFont?: boolean;
}

export const useFonts = () => {
  const { user } = useAuth();
  const [userFonts, setUserFonts] = useState<UserFont[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleFontsLoaded, setGoogleFontsLoaded] = useState(false);

  // Enhanced system fonts with Google Fonts support
  const systemFonts: FontOption[] = [
    { 
      display: 'Arial', 
      value: 'Arial, sans-serif',
      category: 'sans-serif',
      description: 'Clean, modern sans-serif font',
      isGoogleFont: false
    },
    { 
      display: 'Times New Roman', 
      value: 'Times New Roman, serif',
      category: 'serif',
      description: 'Classic serif font for formal documents',
      isGoogleFont: false
    },
    { 
      display: 'Helvetica', 
      value: 'Helvetica, Arial, sans-serif',
      category: 'sans-serif',
      description: 'Popular Swiss sans-serif font',
      isGoogleFont: false
    },
    { 
      display: 'Georgia', 
      value: 'Georgia, serif',
      category: 'serif',
      description: 'Elegant serif font designed for screens',
      isGoogleFont: false
    },
    { 
      display: 'Verdana', 
      value: 'Verdana, sans-serif',
      category: 'sans-serif',
      description: 'Highly legible sans-serif font',
      isGoogleFont: false
    },
    { 
      display: 'Comic Sans MS', 
      value: 'Comic Sans MS, cursive',
      category: 'cursive',
      description: 'Casual, handwriting-style font',
      isGoogleFont: false
    },
    { 
      display: 'Courier New', 
      value: 'Courier New, monospace',
      category: 'monospace',
      description: 'Fixed-width font for code and data',
      isGoogleFont: false
    },
    // Google Fonts
    { 
      display: 'Roboto', 
      value: 'Roboto, Arial, sans-serif',
      category: 'sans-serif',
      description: 'Modern Google font',
      isGoogleFont: true
    },
    { 
      display: 'Open Sans', 
      value: 'Open Sans, Arial, sans-serif',
      category: 'sans-serif',
      description: 'Friendly and readable sans-serif',
      isGoogleFont: true
    },
    { 
      display: 'Lobster', 
      value: 'Lobster, cursive',
      category: 'cursive',
      description: 'Bold script font for headlines',
      isGoogleFont: true
    }
  ];

  // Load Google Fonts on component mount
  useEffect(() => {
    loadGoogleFonts();
  }, []);

  // Load user fonts on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadUserFonts();
    }
  }, [user]);

  const loadGoogleFonts = async () => {
    try {
      console.log('🔄 Loading Google Fonts...');
      
      // Check if Google Fonts are already loaded
      const existingLink = document.querySelector('link[href*="fonts.googleapis.com"]');
      if (existingLink) {
        console.log('✅ Google Fonts already loaded');
        setGoogleFontsLoaded(true);
        return;
      }

      // Create Google Fonts link
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = 'https://fonts.gstatic.com';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      // Load the actual fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lobster&display=swap';
      
      // Wait for fonts to load
      fontLink.onload = () => {
        console.log('✅ Google Fonts loaded successfully');
        setGoogleFontsLoaded(true);
        
        // Wait for fonts to be ready
        document.fonts.ready.then(() => {
          console.log('🎉 All Google Fonts are ready');
        });
      };
      
      fontLink.onerror = () => {
        console.warn('⚠️ Failed to load Google Fonts');
        setGoogleFontsLoaded(true); // Continue anyway
      };
      
      document.head.appendChild(fontLink);
      
    } catch (error) {
      console.error('❌ Error loading Google Fonts:', error);
      setGoogleFontsLoaded(true); // Continue anyway
    }
  };

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
      const errorMessage = err?.message || 'An unexpected error occurred while loading fonts';
      setError(errorMessage);
      console.error('❌ Failed to load user fonts:', errorMessage);
      
      // Show user-friendly error message
      if (errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Supabase connection failed')) {
        setError('Database connection failed. Please refresh the page and try again.');
      } else {
        setError(errorMessage);
      }
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
      const errorMessage = err?.message || 'An unexpected error occurred during font upload';
      console.error(`❌ Font upload failed: ${errorMessage}`);
      setError(errorMessage);
      throw new Error(errorMessage);
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
      const errorMessage = err?.message || 'An unexpected error occurred while deleting the font';
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
        description: `Custom ${categoryInfo.category} font`,
        isGoogleFont: false
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
    googleFontsLoaded,
    uploadFont,
    deleteFont,
    loadUserFonts,
    loadGoogleFonts
  };
};