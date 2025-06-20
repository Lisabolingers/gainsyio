import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

// Check if configuration is valid
const isConfigValid = !(!supabaseUrl || !supabaseAnonKey || 
  supabaseUrl === 'https://your-project-id.supabase.co' || 
  supabaseAnonKey === 'your-anon-key');

// Create appropriate client based on configuration
let supabase: SupabaseClient;

if (!isConfigValid) {
  console.warn('⚠️ Supabase configuration incomplete. Using mock client.');
  
  // Create a comprehensive mock query builder that supports chaining
  const createMockQueryBuilder = () => {
    const mockQueryBuilder: any = {
      select: () => mockQueryBuilder,
      eq: () => mockQueryBuilder,
      neq: () => mockQueryBuilder,
      gt: () => mockQueryBuilder,
      gte: () => mockQueryBuilder,
      lt: () => mockQueryBuilder,
      lte: () => mockQueryBuilder,
      like: () => mockQueryBuilder,
      ilike: () => mockQueryBuilder,
      is: () => mockQueryBuilder,
      in: () => mockQueryBuilder,
      contains: () => mockQueryBuilder,
      containedBy: () => mockQueryBuilder,
      rangeGt: () => mockQueryBuilder,
      rangeGte: () => mockQueryBuilder,
      rangeLt: () => mockQueryBuilder,
      rangeLte: () => mockQueryBuilder,
      rangeAdjacent: () => mockQueryBuilder,
      overlaps: () => mockQueryBuilder,
      textSearch: () => mockQueryBuilder,
      match: () => mockQueryBuilder,
      not: () => mockQueryBuilder,
      or: () => mockQueryBuilder,
      filter: () => mockQueryBuilder,
      order: () => mockQueryBuilder,
      limit: () => mockQueryBuilder,
      range: () => mockQueryBuilder,
      abortSignal: () => mockQueryBuilder,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
      catch: (reject: any) => mockQueryBuilder,
    };
    return mockQueryBuilder;
  };

  // Create a mock client to prevent app crashes
  supabase = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => {
      const mockQueryBuilder = createMockQueryBuilder();
      
      // Add additional methods that return the query builder for chaining
      mockQueryBuilder.insert = () => {
        const insertBuilder = createMockQueryBuilder();
        insertBuilder.select = () => insertBuilder;
        insertBuilder.single = () => Promise.resolve({ data: null, error: null });
        return insertBuilder;
      };
      
      mockQueryBuilder.update = () => {
        const updateBuilder = createMockQueryBuilder();
        updateBuilder.eq = () => updateBuilder;
        updateBuilder.select = () => updateBuilder;
        updateBuilder.single = () => Promise.resolve({ data: null, error: null });
        return updateBuilder;
      };
      
      mockQueryBuilder.delete = () => {
        const deleteBuilder = createMockQueryBuilder();
        deleteBuilder.eq = () => deleteBuilder;
        return deleteBuilder;
      };
      
      mockQueryBuilder.upsert = () => {
        const upsertBuilder = createMockQueryBuilder();
        upsertBuilder.select = () => upsertBuilder;
        upsertBuilder.single = () => Promise.resolve({ data: null, error: null });
        return upsertBuilder;
      };
      
      return mockQueryBuilder;
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        download: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        remove: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        list: () => Promise.resolve({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
  } as unknown as SupabaseClient;
} else {
  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    console.log('✅ Supabase URL format is valid:', url.origin);
  } catch (error) {
    console.error('❌ Invalid VITE_SUPABASE_URL format:', supabaseUrl);
    throw new Error('Geçersiz Supabase URL formatı. Lütfen .env dosyasındaki VITE_SUPABASE_URL değerini kontrol edin.');
  }

  // Create real client with improved timeout and retry settings
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'gainsy_auth_token',
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
      // Improved fetch with better timeout handling
      fetch: (url: RequestInfo, options?: RequestInit) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased from 15000 to 20000 ms (20 seconds)
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    },
    // Add database connection settings
    db: {
      schema: 'public',
    },
    // Add realtime settings
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// Export supabase client
export { supabase, supabaseUrl, isConfigValid };

// Enhanced connection test function with better error handling
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => { // Increased retries from 2 to 3
  if (!isConfigValid) {
    console.warn('⚠️ Supabase configuration is invalid, skipping connection test');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`⏰ Connection test attempt ${attempt} timed out after 10 seconds`);
      }, 10000); // 10 second timeout per attempt (increased from 8 seconds)
      
      try {
        // Use a simple health check that doesn't require authentication
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok || response.status === 401) {
          // 401 is also acceptable as it means the server is responding
          console.log('✅ Supabase connection test successful');
          return true;
        } else {
          console.warn(`⚠️ Supabase connection test returned: ${response.status} ${response.statusText}`);
          
          // If this is the last attempt, return false
          if (attempt === retries) {
            return false;
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.warn(`⏰ Connection test attempt ${attempt} was aborted (timeout)`);
        } else {
          console.error(`❌ Fetch error in attempt ${attempt}:`, fetchError.message);
        }
        
        // If this is the last attempt, return false
        if (attempt === retries) {
          return false;
        }
      }
    } catch (err: any) {
      console.error(`❌ Supabase connection test error (attempt ${attempt}):`, err.message);
      
      // If this is the last attempt, return false
      if (attempt === retries) {
        return false;
      }
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < retries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds (reduced from 8 seconds)
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Helper function to handle database queries with timeout and retry
export const executeWithTimeout = async <T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 15000, // Increased from 10000 to 15000 ms (15 seconds)
  retries: number = 2
): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create a promise that rejects after timeoutMs
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      // Race between the query and the timeout
      const result = await Promise.race([queryFn(), timeoutPromise]);
      return result;
    } catch (error: any) {
      console.error(`Query attempt ${attempt} failed:`, error.message);
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000); // Max 3 seconds
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('All query attempts failed');
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