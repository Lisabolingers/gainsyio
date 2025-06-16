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

if (supabaseUrl.includes('localhost')) {
  console.error('❌ Invalid Supabase URL - contains localhost');
  console.error('Current URL:', supabaseUrl);
  throw new Error('Supabase URL geçersiz. Localhost URL\'i kullanılamaz.');
}

// Create Supabase client with enhanced error handling and CORS configuration
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
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export supabaseUrl for use in other modules
export { supabaseUrl };

// Enhanced connection test function with better error handling and increased timeouts
export const testSupabaseConnection = async (retries = 2): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      // Add increased timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      // Use auth session check instead of direct fetch
      const sessionPromise = supabase.auth.getSession();
      
      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (error && error.message.includes('Invalid API key')) {
        console.error('❌ Invalid Supabase API key');
        return false;
      }
      
      if (error && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed');
      }
      
      // Test basic database connectivity with a simple query
      const dbPromise = supabase
        .from('user_profiles')
        .select('count')
        .limit(0);
      
      const { error: dbError } = await Promise.race([dbPromise, timeoutPromise]) as any;
      
      if (dbError && !dbError.message.includes('RLS')) {
        console.log(`⚠️ Supabase database test failed (attempt ${attempt}):`, dbError);
        
        if (attempt === retries) {
          return false;
        }
        
        // Wait before retrying with exponential backoff
        const delay = 2000 * attempt;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (err: any) {
      console.log(`⚠️ Supabase connection test error (attempt ${attempt}):`, err.message);
      
      if (attempt === retries) {
        return false;
      }
      
      // Wait before retrying with exponential backoff
      const delay = 2000 * attempt;
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