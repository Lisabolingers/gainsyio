import { supabase } from './supabase';
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
   * CRITICAL: Generate CSS font family with appropriate fallbacks
   * This is the most important function for font rendering
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
   * Get the correct MIME type for font files
   */
  private static getFontMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff': 'font/woff',
      'woff2': 'font/woff2'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
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
   * CRITICAL: Generate CSS font family name that works with Konva
   * This is the most important function for font rendering
   */
  private static generateCssFontFamily(originalFileName: string): string {
    // Remove file extension and clean the name
    let fontFamily = originalFileName.replace(/\.[^/.]+$/, '');
    
    // CRITICAL: Keep the original font name structure but make it CSS-safe
    // Remove only problematic characters, preserve the font's identity
    fontFamily = fontFamily.replace(/[^\w\s-]/g, '');
    
    // Replace spaces with underscores for CSS compatibility but keep readable
    fontFamily = fontFamily.replace(/\s+/g, '_');
    
    // If the name starts with a number, prefix it
    if (/^\d/.test(fontFamily)) {
      fontFamily = 'Font_' + fontFamily;
    }
    
    // IMPORTANT: Don't add random suffixes that break font recognition
    // Instead, use the original font name as much as possible
    return fontFamily;
  }

  /**
   * Upload a font file to Supabase Storage
   */
  static async uploadFont(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    // Validate file format
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(fileExt || '')) {
      throw new Error('Invalid font format. Only TTF, OTF, WOFF, and WOFF2 files are supported.');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Font file is too large. Maximum size is 5MB.');
    }

    // Get the correct MIME type for the font file
    const contentType = this.getFontMimeType(fileExt || '');

    // Create a new Blob with the correct MIME type
    const fontBlob = new Blob([file], { type: contentType });

    const { data, error } = await supabase.storage
      .from('user-fonts')
      .upload(fileName, fontBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    if (error) {
      throw new Error(`Failed to upload font: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-fonts')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Check if a font name exists for the user and generate a unique name if needed
   */
  static async generateUniqueFontName(userId: string, baseFontName: string): Promise<string> {
    // First check if the base name is available
    const { data: existingFont, error } = await supabase
      .from('user_fonts')
      .select('font_name')
      .eq('user_id', userId)
      .eq('font_name', baseFontName)
      .maybeSingle();

    if (error) {
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
      const { data: duplicateCheck } = await supabase
        .from('user_fonts')
        .select('font_name')
        .eq('user_id', userId)
        .eq('font_name', uniqueName)
        .maybeSingle();

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
  }

  /**
   * Save font metadata to database
   */
  static async saveFontMetadata(
    userId: string,
    fontName: string,
    fontFamily: string,
    fileUrl: string,
    fileSize: number,
    fontFormat: string
  ): Promise<UserFont> {
    // Generate font family with appropriate fallbacks
    const fontFamilyWithFallbacks = this.generateFontFamilyWithFallbacks(fontName, fontFamily);
    
    const { data, error } = await supabase
      .from('user_fonts')
      .insert({
        user_id: userId,
        font_name: fontName,
        font_family: fontFamilyWithFallbacks, // Store with fallbacks
        file_url: fileUrl,
        file_size: fileSize,
        font_format: fontFormat,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate font name)
      if (error.code === '23505' && error.message.includes('user_fonts_user_id_font_name_key')) {
        throw new Error('A font with this name already exists in your account. Please rename the font file or choose a different one.');
      }
      throw new Error(`Failed to save font metadata: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's fonts
   */
  static async getUserFonts(userId: string): Promise<UserFont[]> {
    const { data, error } = await supabase
      .from('user_fonts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch fonts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a font
   */
  static async deleteFont(fontId: string, userId: string): Promise<void> {
    // First get the font to get the file URL
    const { data: font, error: fetchError } = await supabase
      .from('user_fonts')
      .select('file_url, font_family')
      .eq('id', fontId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch font: ${fetchError.message}`);
    }

    // Remove font from browser
    this.removeFontFromBrowser(font.font_family);

    // Extract file path from URL
    const filePath = font.file_url.split('/').slice(-2).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-fonts')
      .remove([filePath]);

    if (storageError) {
      console.warn('Failed to delete font file from storage:', storageError.message);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('user_fonts')
      .delete()
      .eq('id', fontId)
      .eq('user_id', userId);

    if (dbError) {
      throw new Error(`Failed to delete font: ${dbError.message}`);
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
   * CRITICAL: Enhanced font loading with proper CSS injection and validation
   * This is the core function that makes fonts work in Konva.js
   */
  static async loadFontInBrowser(font: UserFont): Promise<void> {
    // Extract the main font family name (without fallbacks)
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    console.log(`🚀 CRITICAL: Starting font load process for: ${font.font_name} -> ${mainFontFamily}`);
    
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
    const loadingPromise = this.doLoadFont(font);
    this.fontLoadPromises.set(mainFontFamily, loadingPromise);

    try {
      await loadingPromise;
      this.loadedFonts.add(mainFontFamily);
      console.log(`🎉 CRITICAL SUCCESS: Font loaded and ready: ${font.font_name} (${mainFontFamily})`);
    } catch (error) {
      this.fontLoadPromises.delete(mainFontFamily);
      console.error(`❌ CRITICAL ERROR: Font loading failed: ${font.font_name}`, error);
      throw error;
    }
  }

  /**
   * CRITICAL: The actual font loading implementation
   * Enhanced for Konva.js compatibility with aggressive loading
   */
  private static async doLoadFont(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    console.log(`🔥 AGGRESSIVE FONT LOADING: ${font.font_name} with family: ${mainFontFamily}`);

    try {
      // Step 1: Aggressive CSS injection
      await this.aggressiveInjectFontCSS(font);
      
      // Step 2: Force FontFace loading
      await this.forceLoadFontFace(font);
      
      // Step 3: Canvas validation and forcing
      await this.forceCanvasRecognition(font);
      
      console.log(`🎯 FONT FULLY LOADED AND READY: ${font.font_name}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`💥 CRITICAL FONT LOADING FAILURE ${font.font_name}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * CRITICAL: Aggressive CSS font injection
   */
  private static async aggressiveInjectFontCSS(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    const styleId = `font-style-${mainFontFamily}`;
    
    // Remove existing style if present
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      console.log(`🗑️ Removed existing font style: ${mainFontFamily}`);
    }

    // Create aggressive CSS with multiple font-face declarations
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: "${mainFontFamily}";
        src: url("${font.file_url}") format("${this.getFontFormat(font.font_format)}");
        font-display: block;
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: "${mainFontFamily}";
        src: url("${font.file_url}") format("${this.getFontFormat(font.font_format)}");
        font-display: swap;
        font-weight: 400;
        font-style: normal;
      }
      
      /* Force immediate loading */
      .font-preload-${mainFontFamily.replace(/\s+/g, '_')} {
        font-family: "${mainFontFamily}", Arial, sans-serif !important;
        position: absolute;
        left: -9999px;
        top: -9999px;
        visibility: hidden;
        font-size: 1px;
      }
    `;
    
    // Insert at the very beginning of head for highest priority
    document.head.insertBefore(style, document.head.firstChild);
    
    // Create preload element to force immediate font loading
    const preloadElement = document.createElement('div');
    preloadElement.className = `font-preload-${mainFontFamily.replace(/\s+/g, '_')}`;
    preloadElement.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    document.body.appendChild(preloadElement);
    
    // Force reflow
    preloadElement.offsetHeight;
    
    console.log(`💉 AGGRESSIVE CSS INJECTION COMPLETE: ${mainFontFamily}`);
    
    // Wait for CSS to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * CRITICAL: Force FontFace loading with retries
   */
  private static async forceLoadFontFace(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    try {
      // Remove any existing FontFace with same family
      const existingFontFaces = Array.from(document.fonts).filter(f => f.family === mainFontFamily);
      existingFontFaces.forEach(f => document.fonts.delete(f));
      
      // Create new FontFace with aggressive settings
      const fontFace = new FontFace(mainFontFamily, `url("${font.file_url}")`, {
        display: 'block', // Force immediate loading
        weight: 'normal',
        style: 'normal'
      });
      
      console.log(`🔄 FORCE LOADING FontFace: ${mainFontFamily}`);
      
      // Load with aggressive timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('FontFace loading timeout after 15 seconds')), 15000);
      });

      // Load the font with timeout
      const loadedFont = await Promise.race([fontFace.load(), timeoutPromise]);
      
      // Add to document fonts
      document.fonts.add(loadedFont);
      
      // Force document.fonts to recognize it
      await document.fonts.ready;
      
      console.log(`🔤 FONTFACE FORCE LOADED: ${mainFontFamily}`);
      
    } catch (fontFaceError) {
      console.warn(`⚠️ FontFace force loading failed for ${font.font_name}, continuing with CSS method:`, fontFaceError);
      // Don't throw here - CSS method might still work
    }
  }

  /**
   * CRITICAL: Force Canvas/Konva recognition with aggressive validation
   */
  private static async forceCanvasRecognition(font: UserFont): Promise<void> {
    const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
    
    console.log(`🎯 FORCING CANVAS RECOGNITION: ${mainFontFamily}`);
    
    // Wait for all fonts to be ready
    await document.fonts.ready;
    
    // Create multiple test elements with different approaches
    const testMethods = [
      () => this.createCanvasTest(mainFontFamily),
      () => this.createDOMTest(mainFontFamily),
      () => this.createKonvaTest(mainFontFamily)
    ];
    
    // Run all test methods
    const results = await Promise.allSettled(testMethods.map(method => method()));
    
    // Check if any method succeeded
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (successCount === 0) {
      console.warn(`⚠️ Canvas recognition tests failed for ${mainFontFamily}, but continuing...`);
    } else {
      console.log(`✅ Canvas recognition successful for ${mainFontFamily} (${successCount}/3 tests passed)`);
    }
    
    // Final aggressive wait to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Canvas-based font test
   */
  private static async createCanvasTest(fontFamily: string): Promise<void> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    // Test with multiple font sizes and styles
    const testSizes = [12, 16, 24, 32];
    
    for (const size of testSizes) {
      ctx.font = `${size}px "${fontFamily}", Arial, sans-serif`;
      ctx.fillText('Test Font Loading', 0, size);
    }
    
    console.log(`🎨 Canvas test completed for: ${fontFamily}`);
  }

  /**
   * DOM-based font test
   */
  private static async createDOMTest(fontFamily: string): Promise<void> {
    const testElement = document.createElement('div');
    testElement.style.fontFamily = `"${fontFamily}", Arial, sans-serif`;
    testElement.style.fontSize = '16px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.style.visibility = 'hidden';
    testElement.style.whiteSpace = 'nowrap';
    testElement.textContent = 'Font Loading Test Text';
    
    document.body.appendChild(testElement);
    
    // Force multiple reflows
    for (let i = 0; i < 5; i++) {
      testElement.offsetWidth;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Check computed style
    const computedStyle = window.getComputedStyle(testElement);
    const actualFontFamily = computedStyle.fontFamily;
    
    console.log(`📏 DOM test for ${fontFamily}: computed font = ${actualFontFamily}`);
    
    // Clean up after delay
    setTimeout(() => {
      if (testElement.parentNode) {
        testElement.parentNode.removeChild(testElement);
      }
    }, 2000);
  }

  /**
   * Konva-specific font test
   */
  private static async createKonvaTest(fontFamily: string): Promise<void> {
    try {
      // Create a temporary canvas for Konva testing
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Test Konva-style font rendering
      ctx.font = `24px "${fontFamily}", Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#000000';
      ctx.fillText('Konva Font Test', 10, 10);
      
      // Measure text to ensure font is working
      const metrics = ctx.measureText('Konva Font Test');
      
      console.log(`🎭 Konva test for ${fontFamily}: text width = ${metrics.width}px`);
      
    } catch (error) {
      console.warn(`⚠️ Konva test failed for ${fontFamily}:`, error);
    }
  }

  /**
   * Load all user fonts into browser
   */
  static async loadAllUserFonts(userId: string): Promise<string[]> {
    const fonts = await this.getUserFonts(userId);
    const loadedFonts: string[] = [];

    console.log(`🚀 STARTING AGGRESSIVE FONT LOADING: ${fonts.length} fonts`);

    // Load fonts with controlled concurrency but more aggressive approach
    const maxConcurrent = 1; // One at a time for maximum reliability
    for (let i = 0; i < fonts.length; i += maxConcurrent) {
      const batch = fonts.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (font) => {
        try {
          console.log(`🔥 LOADING FONT ${i + 1}/${fonts.length}: ${font.font_name}`);
          await this.loadFontInBrowser(font);
          const mainFontFamily = font.font_family.split(',')[0].replace(/['"]/g, '').trim();
          loadedFonts.push(mainFontFamily);
          console.log(`✅ FONT LOADED SUCCESSFULLY: ${font.font_name}`);
          return mainFontFamily;
        } catch (error) {
          console.error(`❌ FONT LOADING FAILED: ${font.font_name}`, error);
          return null;
        }
      });
      
      await Promise.all(batchPromises);
      
      // Longer delay between fonts for stability
      if (i + maxConcurrent < fonts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🎉 AGGRESSIVE FONT LOADING COMPLETE: ${loadedFonts.length}/${fonts.length} fonts loaded successfully`);
    return loadedFonts;
  }

  /**
   * Upload and save font (combined operation)
   */
  static async uploadAndSaveFont(file: File, userId: string): Promise<UserFont> {
    // Extract clean font info from file name
    const cleanFontName = this.extractCleanFontName(file.name);
    // Generate CSS font family name that preserves font identity
    const cssFontFamily = this.generateCssFontFamily(file.name);
    const fontFormat = file.name.split('.').pop()?.toLowerCase() || 'ttf';

    // Generate a unique font name to avoid constraint violations
    const uniqueFontName = await this.generateUniqueFontName(userId, cleanFontName);

    // Upload file
    const fileUrl = await this.uploadFont(file, userId);

    // Save metadata with unique font name and CSS font family name with fallbacks
    const savedFont = await this.saveFontMetadata(
      userId,
      uniqueFontName,
      cssFontFamily, // This will be processed to include fallbacks
      fileUrl,
      file.size,
      fontFormat
    );

    // CRITICAL: Immediately load font into browser with aggressive approach
    try {
      console.log(`🚀 IMMEDIATELY LOADING UPLOADED FONT: ${savedFont.font_name}`);
      await this.loadFontInBrowser(savedFont);
      console.log(`🎉 UPLOADED FONT READY FOR IMMEDIATE USE: ${savedFont.font_name}`);
    } catch (error) {
      console.error(`❌ CRITICAL: Uploaded font failed to load immediately: ${error}`);
      // Don't throw here - the font is saved, just not loaded
    }

    return savedFont;
  }

  /**
   * Force reload all fonts (useful for refresh functionality)
   */
  static async forceReloadAllFonts(userId: string): Promise<void> {
    console.log('🔥 FORCE RELOADING ALL FONTS WITH AGGRESSIVE APPROACH...');
    
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reload all fonts with aggressive approach
    await this.loadAllUserFonts(userId);
    
    console.log('🎉 ALL FONTS AGGRESSIVELY RELOADED AND READY!');
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
   * CRITICAL: Get Konva-compatible font family name
   * This ensures fonts work properly in Konva.js
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