import { supabase, testSupabaseConnection, executeWithTimeout } from './supabase';
import { UserFont } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export class FontService {
  private static loadedFonts = new Set<string>();
  private static fontLoadPromises = new Map<string, Promise<void>>();

  /**
   * Font family categories with appropriate fallbacks
   */
  private static fontFamilyCategories = {
    serif: ['serif'],
    'sans-serif': ['sans-serif'],
    monospace: ['monospace'],
    cursive: ['cursive'],
    fantasy: ['fantasy']
  };

  /**
   * Detect font family category based on font name and characteristics
   */
  private static detectFontCategory(fontName: string): string {
    const name = fontName.toLowerCase();
    
    // Serif fonts
    if (name.includes('serif') || 
        name.includes('times') || 
        name.includes('georgia') || 
        name.includes('garamond') ||
        name.includes('baskerville') ||
        name.includes('caslon') ||
        name.includes('minion')) {
      return 'serif';
    }
    
    // Monospace fonts
    if (name.includes('mono') || 
        name.includes('code') || 
        name.includes('courier') ||
        name.includes('console') ||
        name.includes('terminal') ||
        name.includes('source code') ||
        name.includes('fira code') ||
        name.includes('roboto mono')) {
      return 'monospace';
    }
    
    // Cursive/Script fonts
    if (name.includes('script') || 
        name.includes('cursive') || 
        name.includes('handwriting') ||
        name.includes('brush') ||
        name.includes('calligraphy') ||
        name.includes('signature') ||
        name.includes('dancing') ||
        name.includes('pacifico') ||
        name.includes('lobster') ||
        name.includes('great vibes')) {
      return 'cursive';
    }
    
    // Fantasy/Display fonts
    if (name.includes('fantasy') || 
        name.includes('display') || 
        name.includes('decorative') ||
        name.includes('gothic') ||
        name.includes('blackletter') ||
        name.includes('stencil') ||
        name.includes('impact') ||
        name.includes('bebas')) {
      return 'fantasy';
    }
    
    // Default to sans-serif for most modern fonts
    return 'sans-serif';
  }

  /**
   * Generate CSS font family with appropriate fallbacks
   */
  private static generateFontFamilyWithFallbacks(fontName: string, cssFontFamily: string): string {
    const category = this.detectFontCategory(fontName);
    
    // Create a comprehensive fallback stack
    let fontStack = `"${cssFontFamily}"`;
    
    // Add category-specific fallbacks
    switch (category) {
      case 'serif':
        fontStack += ', "Times New Roman", Times, serif';
        break;
      case 'monospace':
        fontStack += ', "Courier New", Courier, monospace';
        break;
      case 'cursive':
        fontStack += ', "Brush Script MT", cursive';
        break;
      case 'fantasy':
        fontStack += ', Impact, "Arial Black", fantasy';
        break;
      case 'sans-serif':
      default:
        fontStack += ', Arial, Helvetica, sans-serif';
        break;
    }
    
    return fontStack;
  }

  /**
   * Extract clean font name from file name
   */
  private static extractCleanFontName(fileName: string): string {
    // Remove file extension
    let name = fileName.replace(/\.[^/.]+$/, '');
    
    // Remove common prefixes/suffixes that might be added
    name = name.replace(/^(font-|Font-|FONT-)/i, '');
    name = name.replace(/(-font|-Font|-FONT)$/i, '');
    
    // Replace underscores and hyphens with spaces
    name = name.replace(/[_-]/g, ' ');
    
    // Remove extra spaces and clean up
    name = name.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter of each word properly
    name = name.split(' ').map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    return name;
  }

  /**
   * Generate CSS font family name that works with Konva
   */
  private static generateCssFontFamily(originalFileName: string): string {
    // Remove file extension and clean the name
    let fontFamily = originalFileName.replace(/\.[^/.]+$/, '');
    
    // Keep the original font name structure but make it CSS-safe
    fontFamily = fontFamily.replace(/[^\w\s-]/g, '');
    
    // Replace spaces with underscores for CSS compatibility but keep readable
    fontFamily = fontFamily.replace(/\s+/g, '_');
    
    // If the name starts with a number, prefix it
    if (/^\d/.test(fontFamily)) {
      fontFamily = 'Font_' + fontFamily;
    }
    
    return fontFamily;
  }

  /**
   * Convert file to base64
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get CSS font format string for @font-face
   */
  private static getFontFormat(fontFormat: string): string {
    const formatMap: Record<string, string> = {
      'ttf': 'truetype',
      'otf': 'opentype',
      'woff': 'woff',
      'woff2': 'woff2'
    };
    
    return formatMap[fontFormat.toLowerCase()] || 'truetype';
  }

  /**
   * Check if a font name exists for the user and generate a unique name if needed
   */
  static async generateUniqueFontName(userId: string, baseFontName: string): Promise<string> {
    try {
      // First check if the base name is available
      const { data: existingFont, error } = await supabase
        .from('user_fonts')
        .select('font_name')
        .eq('user_id', userId)
        .eq('font_name', baseFontName)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking font name availability:', error);
        throw new Error(`Failed to check font name availability: ${error.message}`);
      }

      // If no existing font found, the base name is available
      if (!existingFont) {
        return baseFontName;
      }

      // Generate a unique name by appending a number
      let counter = 1;
      let uniqueName = `${baseFontName} (${counter})`;
      
      while (true) {
        const { data: duplicateCheck, error: checkError } = await supabase
          .from('user_fonts')
          .select('font_name')
          .eq('user_id', userId)
          .eq('font_name', uniqueName)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking duplicate font name:', checkError);
          // If we can't check, use a UUID to ensure uniqueness
          const uniqueId = uuidv4().substring(0, 8);
          return `${baseFontName}-${uniqueId}`;
        }

        if (!duplicateCheck) {
          return uniqueName;
        }
        
        counter++;
        uniqueName = `${baseFontName} (${counter})`;
        
        // Safety check to prevent infinite loop
        if (counter > 100) {
          const uniqueId = uuidv4().substring(0, 8);
          return `${baseFontName}-${uniqueId}`;
        }
      }
    } catch (error) {
      console.error('❌ Error in generateUniqueFontName:', error);
      // Fallback: use UUID to ensure uniqueness
      const uniqueId = uuidv4().substring(0, 8);
      return `${baseFontName}-${uniqueId}`;
    }
  }

  /**
   * Save font metadata to database with base64 data
   */
  static async saveFontMetadata(
    userId: string,
    fontName: string,
    fontFamily: string,
    base64Data: string,
    fileSize: number,
    fontFormat: string
  ): Promise<UserFont> {
    try {
      // Generate font family with appropriate fallbacks
      const fontFamilyWithFallbacks = this.generateFontFamilyWithFallbacks(fontName, fontFamily);
      
      const { data, error } = await supabase
        .from('user_fonts')
        .insert({
          user_id: userId,
          font_name: fontName,
          font_family: fontFamilyWithFallbacks, // Store with fallbacks
          file_url: base64Data, // Store base64 data instead of URL
          file_size: fileSize,
          font_format: fontFormat,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving font metadata:', error);
        // Check for unique constraint violation (duplicate font name)
        if (error.code === '23505' && error.message.includes('user_fonts_user_id_font_name_key')) {
          throw new Error('A font with this name already exists in your account. Please rename the font file or choose a different one.');
        }
        throw new Error(`Failed to save font metadata: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in saveFontMetadata:', error);
      throw error;
    }
  }

  /**
   * Get user's fonts with enhanced error handling and timeout protection
   */
  static async getUserFonts(userId: string): Promise<UserFont[]> {
    try {
      console.log('🔄 Fetching user fonts for user:', userId);
      
      // Test connection first
      const connectionOk = await testSupabaseConnection();
      if (!connectionOk) {
        throw new Error('Supabase connection failed. Please check your internet connection and try again.');
      }

      // Use executeWithTimeout to prevent query timeout
      const result = await executeWithTimeout(
        async () => {
          const { data, error } = await supabase
            .from('user_fonts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ Error fetching user fonts:', error);
            throw new Error(`Failed to fetch fonts: ${error.message}`);
          }

          return data || [];
        },
        20000, // 20 seconds timeout
        2 // 2 retries
      );

      console.log(`✅ Successfully fetched ${result.length} user fonts`);
      return result;
    } catch (error) {
      console.error('❌ Error in getUserFonts:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching fonts');
    }
  }

  /**
   * Delete a font
   */
  static async deleteFont(fontId: string, userId: string): Promise<void> {
    try {
      // First get the font to get the font family
      const { data: font, error: fetchError } = await supabase
        .from('user_fonts')
        .select('font_family')
        .eq('id', fontId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching font for deletion:', fetchError);
        throw new Error(`Failed to fetch font: ${fetchError.message}`);
      }

      // If font doesn't exist (already deleted or invalid ID), consider deletion successful
      if (!font) {
        console.log(`Font ${fontId} not found - already deleted or invalid ID`);
        return;
      }

      // Remove font from browser
      this.removeFontFromBrowser(font.font_family);

      // Delete from database (no storage cleanup needed with base64)
      const { error: dbError } = await supabase
        .from('user_fonts')
        .delete()
        .eq('id', fontId)
        .eq('user_id', userId);

      if (dbError) {
        console.error('❌ Error deleting font from database:', dbError);
        throw new Error(`Failed to delete font: ${dbError.message}`);
      }

      console.log(`✅ Successfully deleted font: ${fontId}`);
    } catch (error) {
      console.error('❌ Error in deleteFont:', error);
      throw error;
    }
  }

  /**
   * Remove font from browser
   */
  private static removeFontFromBrowser(fontFamily: string): void {
    try {
      // Extract the main font name from the font family string
      const mainFontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      
      // Remove from document.fonts
      const fontFaces = Array.from(document.fonts);
      const fontToRemove = fontFaces.find(f => f.family === mainFontName);
      if (fontToRemove) {
        document.fonts.delete(fontToRemove);
      }

      // Remove style element
      const styleElement = document.getElementById(`font-style-${mainFontName}`);
      if (styleElement) {
        styleElement.remove();
      }

      // Remove from loaded fonts set
      this.loadedFonts.delete(mainFontName);
      this.fontLoadPromises.delete(mainFontName);

      console.log(`🗑️ Removed font from browser: ${mainFontName}`);
    } catch (err) {
      console.warn('Failed to remove font from browser:', err);
    }
  }

  /**
   * Enhanced font loading with base64 data
   */
  static async loadFontInBrowser(font: UserFont): Promise<void> {
    // Extract the main font family name (without fallbacks)
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    console.log(`🚀 Starting font load process for: ${font.font_name} -> ${mainFontFamily}`);
    
    // Check if font is already loaded
    if (this.loadedFonts.has(mainFontFamily)) {
      console.log(`✅ Font ${font.font_name} is already loaded`);
      return;
    }

    // Check if font is currently being loaded
    if (this.fontLoadPromises.has(mainFontFamily)) {
      console.log(`⏳ Font ${font.font_name} is already being loaded, waiting...`);
      return this.fontLoadPromises.get(mainFontFamily)!;
    }

    // Create loading promise
    const loadingPromise = this.doLoadFontFromBase64(font);
    this.fontLoadPromises.set(mainFontFamily, loadingPromise);

    try {
      await loadingPromise;
      this.loadedFonts.add(mainFontFamily);
      console.log(`🎉 Font loaded and ready: ${font.font_name} (${mainFontFamily})`);
    } catch (error) {
      this.fontLoadPromises.delete(mainFontFamily);
      console.error(`❌ Font loading failed: ${font.font_name}`, error);
      // Don't throw - allow fallback fonts to work
    }
  }

  /**
   * Load font from base64 data
   */
  private static async doLoadFontFromBase64(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    console.log(`🔥 Loading font from base64: ${font.font_name} with family: ${mainFontFamily}`);

    try {
      // Step 1: CSS injection with base64 data
      await this.injectBase64FontCSS(font);
      
      // Step 2: Force browser recognition
      await this.forceBrowserRecognition(font);
      
      console.log(`🎯 Font fully loaded and ready: ${font.font_name}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`💥 Font loading failure ${font.font_name}: ${errorMessage}`);
      // Don't throw - allow fallback fonts to work
    }
  }

  /**
   * Inject font CSS with base64 data
   */
  private static async injectBase64FontCSS(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    const styleId = `font-style-${mainFontFamily}`;
    
    // Remove existing style if present
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      console.log(`🗑️ Removed existing font style: ${mainFontFamily}`);
    }

    // Create CSS with base64 data
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: "${mainFontFamily}";
        src: url("${font.file_url}") format("${this.getFontFormat(font.font_format)}");
        font-display: swap;
        font-weight: normal;
        font-style: normal;
      }
    `;
    
    // Insert at the very beginning of head for highest priority
    document.head.insertBefore(style, document.head.firstChild);
    
    console.log(`💉 CSS injection complete with base64 data: ${mainFontFamily}`);
    
    // Wait for CSS to be processed
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Force browser recognition with simple approach
   */
  private static async forceBrowserRecognition(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    console.log(`🎯 Forcing browser recognition: ${mainFontFamily}`);
    
    // Wait for fonts to be ready
    await document.fonts.ready;
    
    // Create simple test element
    const testElement = document.createElement('div');
    testElement.style.fontFamily = `"${mainFontFamily}", Arial, sans-serif`;
    testElement.style.fontSize = '16px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.style.visibility = 'hidden';
    testElement.textContent = 'Font Test';
    
    document.body.appendChild(testElement);
    
    // Force reflow
    testElement.offsetHeight;
    
    // Wait a bit for font to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clean up
    if (testElement.parentNode) {
      testElement.parentNode.removeChild(testElement);
    }
    
    console.log(`✅ Browser recognition complete for: ${mainFontFamily}`);
  }

  /**
   * Load all user fonts into browser
   */
  static async loadAllUserFonts(userId: string): Promise<string[]> {
    try {
      const fonts = await this.getUserFonts(userId);
      const loadedFonts: string[] = [];

      console.log(`🚀 Starting font loading: ${fonts.length} fonts`);

      // Load fonts one by one for maximum reliability
      for (let i = 0; i < fonts.length; i++) {
        const font = fonts[i];
        try {
          console.log(`🔥 Loading font ${i + 1}/${fonts.length}: ${font.font_name}`);
          await this.loadFontInBrowser(font);
          const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
          loadedFonts.push(mainFontFamily);
          console.log(`✅ Font loaded successfully: ${font.font_name}`);
        } catch (error) {
          console.warn(`⚠️ Font loading failed (continuing): ${font.font_name}`, error);
          // Continue with other fonts
        }
        
        // Small delay between fonts
        if (i < fonts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      console.log(`🎉 Font loading complete: ${loadedFonts.length}/${fonts.length} fonts loaded successfully`);
      return loadedFonts;
    } catch (error) {
      console.error('❌ Error in loadAllUserFonts:', error);
      throw error;
    }
  }

  /**
   * Upload and save font (combined operation) - now with base64
   */
  static async uploadAndSaveFont(file: File, userId: string): Promise<UserFont> {
    try {
      // Validate file format
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!['ttf', 'otf', 'woff', 'woff2'].includes(fileExt || '')) {
        throw new Error('Invalid font format. Only TTF, OTF, WOFF, and WOFF2 files are supported.');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Font file is too large. Maximum size is 5MB.');
      }

      console.log(`🚀 FONT UPLOAD STARTING: ${file.name} (${file.size} bytes)`);

      // Extract clean font info from file name
      const cleanFontName = this.extractCleanFontName(file.name);
      const cssFontFamily = this.generateCssFontFamily(file.name);
      const fontFormat = fileExt || 'ttf';

      // Generate a unique font name to avoid constraint violations
      const uniqueFontName = await this.generateUniqueFontName(userId, cleanFontName);

      // Convert file to base64
      console.log(`📝 Converting font to base64: ${file.name}`);
      const base64Data = await this.fileToBase64(file);
      console.log(`✅ Base64 conversion complete: ${uniqueFontName}`);

      // Save metadata with base64 data
      const savedFont = await this.saveFontMetadata(
        userId,
        uniqueFontName,
        cssFontFamily,
        base64Data, // Store base64 instead of URL
        file.size,
        fontFormat
      );

      // Immediately load font into browser
      try {
        console.log(`🚀 Immediately loading uploaded font: ${savedFont.font_name}`);
        await this.loadFontInBrowser(savedFont);
        console.log(`🎉 Uploaded font ready for immediate use: ${savedFont.font_name}`);
      } catch (error) {
        console.warn(`⚠️ Uploaded font failed to load immediately (will retry later): ${error}`);
        // Don't throw here - the font is saved, just not loaded
      }

      return savedFont;
    } catch (error) {
      console.error('❌ Error in uploadAndSaveFont:', error);
      throw error;
    }
  }

  /**
   * Force reload all fonts (useful for refresh functionality)
   */
  static async forceReloadAllFonts(userId: string): Promise<void> {
    try {
      console.log('🔥 Force reloading all fonts...');
      
      // Clear all tracking
      this.loadedFonts.clear();
      this.fontLoadPromises.clear();
      
      // Remove all existing font styles
      const existingStyles = document.querySelectorAll('style[id^="font-style-"]');
      existingStyles.forEach(style => style.remove());
      
      // Clear document.fonts of user fonts
      try {
        const fontFaces = Array.from(document.fonts);
        fontFaces.forEach(fontFace => {
          // Remove fonts that look like user fonts (contain underscores or specific patterns)
          if (fontFace.family.includes('_') || fontFace.family.includes('Font')) {
            document.fonts.delete(fontFace);
          }
        });
      } catch (err) {
        console.warn('Failed to clear document.fonts:', err);
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload all fonts
      await this.loadAllUserFonts(userId);
      
      console.log('🎉 All fonts reloaded successfully!');
    } catch (error) {
      console.error('❌ Error in forceReloadAllFonts:', error);
      throw error;
    }
  }

  /**
   * Get font category information for UI display
   */
  static getFontCategoryInfo(fontName: string): { category: string; description: string; fallbacks: string[] } {
    const category = this.detectFontCategory(fontName);
    
    const categoryInfo = {
      serif: {
        description: 'Serif fonts have small decorative strokes. Good for print and formal documents.',
        fallbacks: ['Times New Roman', 'Times', 'serif']
      },
      'sans-serif': {
        description: 'Sans-serif fonts are clean and modern. Great for digital screens and UI.',
        fallbacks: ['Arial', 'Helvetica', 'sans-serif']
      },
      monospace: {
        description: 'Monospace fonts have equal character width. Perfect for code and data.',
        fallbacks: ['Courier New', 'Courier', 'monospace']
      },
      cursive: {
        description: 'Cursive fonts mimic handwriting. Ideal for decorative and personal touches.',
        fallbacks: ['Brush Script MT', 'cursive']
      },
      fantasy: {
        description: 'Fantasy fonts are decorative and unique. Best for headlines and branding.',
        fallbacks: ['Impact', 'Arial Black', 'fantasy']
      }
    };

    return {
      category,
      description: categoryInfo[category as keyof typeof categoryInfo].description,
      fallbacks: categoryInfo[category as keyof typeof categoryInfo].fallbacks
    };
  }

  /**
   * Get Konva-compatible font family name
   */
  static getKonvaFontFamily(fontValue: string): string {
    // Extract the first font family name from the CSS font stack
    // e.g., '"Angkanya_Sebelas", Arial, sans-serif' -> 'Angkanya_Sebelas'
    const match = fontValue.match(/^"([^"]+)"/);
    if (match) {
      return match[1];
    }
    
    // Fallback: take the first part before comma and remove quotes
    const firstFont = fontValue.split(',')[0].trim();
    return firstFont.replace(/['"]/g, '');
  }
}