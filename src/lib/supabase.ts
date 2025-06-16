import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
console.log('URL Valid:', supabaseUrl && !supabaseUrl.includes('localhost') && supabaseUrl !== 'https://your-project-id.supabase.co' ? '✅ Valid' : '❌ Invalid');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || '[MISSING]');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[PRESENT]' : '[MISSING]');
  throw new Error('Supabase ortam değişkenleri eksik. Lütfen .env dosyanızı kontrol edin.');
}

// Create Supabase client with robust error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  // Add reasonable timeouts to prevent hanging
  realtime: {
    timeout: 30000, // 30 seconds
  },
});

// Export supabaseUrl for use in other modules
export { supabaseUrl };

// Robust connection test function with proper error handling
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );
      
      // Create a connection test promise
      const testPromise = supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
        .then(result => {
          // Even if we get a permission error, the connection is working
          if (result.error && result.error.code === 'PGRST301') {
            return { success: true }; // RLS policy error means connection works
          }
          return result;
        });
      
      // Race the promises
      const result = await Promise.race([testPromise, timeoutPromise]) as any;
      
      // If we got a result (even with permission error), the connection works
      if (result && !result.error) {
        console.log('✅ Supabase connection test successful');
        return true;
      }
      
      if (result && result.success) {
        console.log('✅ Supabase connection works (with permission error)');
        return true;
      }
      
      if (result && result.error) {
        console.log(`⚠️ Supabase returned error: ${result.error.message}`);
        
        // If it's a permission error, the connection is working
        if (result.error.code === 'PGRST301') {
          console.log('✅ Supabase connection works (with permission error)');
          return true;
        }
        
        // If it's an invalid API key, fail immediately
        if (result.error.message.includes('invalid API key')) {
          console.error('❌ Invalid Supabase API key');
          return false;
        }
      }
      
      // If this is the last attempt, return false
      if (attempt === retries) {
        console.error('❌ All connection attempts failed');
        return false;
      }
      
      // Wait before retrying with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (err: any) {
      console.log(`⚠️ Supabase connection test error (attempt ${attempt}):`, err.message);
      
      // If this is the last attempt, return false
      if (attempt === retries) {
        console.error('❌ All connection attempts failed');
        return false;
      }
      
      // Wait before retrying with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
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
  role: 'user' | 'admin' | 'superadmin';
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
  logo_area?: any;
  store_id?: string;
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