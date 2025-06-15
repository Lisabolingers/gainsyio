import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[PRESENT]' : '[MISSING]');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
try {
  const url = new URL(supabaseUrl);
  if (!url.hostname.includes('supabase.co')) {
    throw new Error('Invalid Supabase URL. URL must contain supabase.co domain.');
  }
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in the .env file.');
}

// Create Supabase client with enhanced error handling and timeout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Detect session from URL hash
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    fetch: (url, options = {}) => {
      // Add timeout to fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
});

// Export supabaseUrl for use in other modules
export { supabaseUrl };

// Enhanced connection test function with retry logic
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      // Test with a simple health check that doesn't require authentication
      const { error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(0);
      
      if (error) {
        console.error(`❌ Supabase connection test failed (attempt ${attempt}):`, error);
        
        // Provide more specific error information
        if (error.message?.includes('Failed to fetch') || 
            error.message?.includes('NetworkError')) {
          console.error('Network error: Unable to reach Supabase. Check your internet connection and URL.');
        } else if (error.message?.includes('Invalid API key') || 
                   error.message?.includes('JWT')) {
          console.error('Authentication error: Invalid API key. Check your VITE_SUPABASE_ANON_KEY.');
        } else if (error.code === '404') {
          console.error('Project not found: Check your VITE_SUPABASE_URL.');
        }
        
        // If this is the last attempt, return false
        if (attempt === retries) {
          return false;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (err: any) {
      console.error(`❌ Supabase connection test error (attempt ${attempt}):`, err);
      
      if (err.name === 'AbortError') {
        console.error('Connection timeout: Request took too long to complete.');
      } else if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error: Unable to reach Supabase servers.');
      }
      
      // If this is the last attempt, return false
      if (attempt === retries) {
        return false;
      }
      
      // Wait before retrying
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Database types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  platform: 'etsy' | 'shopify' | 'amazon' | 'ebay' | 'wallart';
  store_name: string;
  store_url?: string;
  api_credentials: Record<string, any>;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  external_id?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  images: any[];
  status: 'draft' | 'active' | 'inactive' | 'sold';
  views: number;
  favorites: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingTemplate {
  id: string;
  user_id: string;
  name: string;
  title_template: string;
  description_template: string;
  tags_template: string[];
  price_template?: number;
  category: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockupTemplate {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  design_areas: any[];
  text_areas: any[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutoTextTemplate {
  id: string;
  user_id: string;
  name: string;
  font_family: string;
  font_size: number;
  font_weight: string;
  text_color: string;
  background_color: string;
  style_settings: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFont {
  id: string;
  user_id: string;
  font_name: string;
  font_family: string;
  file_url: string;
  file_size: number;
  font_format: 'ttf' | 'otf' | 'woff' | 'woff2';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemporaryFile {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  expires_at: string;
  created_at: string;
}

export interface AnalyticsData {
  id: string;
  product_id: string;
  date: string;
  views: number;
  favorites: number;
  sales: number;
  revenue: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}