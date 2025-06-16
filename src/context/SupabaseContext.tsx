import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Define types and context at top level
interface SupabaseContextType {
  supabase: SupabaseClient;
  isConfigured: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

// Determine if configuration is valid
const isConfigurationValid = !(!supabaseUrl || !supabaseAnonKey || 
  supabaseUrl === 'https://your-project-id.supabase.co' || 
  supabaseAnonKey === 'your-anon-key' ||
  supabaseUrl.includes('localhost'));

// Create appropriate client based on configuration
let supabaseClient: SupabaseClient;
let isConfigured: boolean;

if (!isConfigurationValid) {
  console.warn('⚠️ Supabase configuration incomplete or invalid. Using mock client.');
  console.warn('Current URL:', supabaseUrl);
  console.warn('URL valid:', supabaseUrl && !supabaseUrl.includes('localhost') && supabaseUrl !== 'https://your-project-id.supabase.co');
  console.warn('Key valid:', supabaseAnonKey && supabaseAnonKey !== 'your-anon-key');
  
  // Create a mock client to prevent app crashes
  supabaseClient = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    }),
  } as any;
  
  isConfigured = false;
} else {
  try {
    console.log('✅ Creating Supabase client with URL:', supabaseUrl);
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'gainsy_auth_token',
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
    isConfigured = true;
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    
    // Fallback to mock client
    supabaseClient = {
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signUp: () => Promise.resolve({ data: null, error: new Error('Supabase client creation failed') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase client creation failed') }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            limit: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase client creation failed') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase client creation failed') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase client creation failed') }),
      }),
    } as any;
    
    isConfigured = false;
  }
}

// Enhanced connection test function with retry logic
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => {
  if (!isConfigured) {
    console.log('⚠️ Supabase not configured, skipping connection test');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      
      // Test with auth session check instead of direct fetch to avoid CORS issues
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed');
      }
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (err: any) {
      console.warn(`⚠️ Supabase connection test failed (attempt ${attempt}):`, err.message);
      
      // If this is the last attempt, return false
      if (attempt === retries) {
        console.error('❌ All connection attempts failed');
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

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, isConfigured }}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Export supabase client for use in other modules
export { supabaseClient as supabase, supabaseUrl };