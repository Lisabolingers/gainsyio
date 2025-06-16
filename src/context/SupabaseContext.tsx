import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error checking with helpful messages
if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  console.error('❌ VITE_SUPABASE_URL is missing or using placeholder value');
  console.error('Please add your actual VITE_SUPABASE_URL to your .env file');
  console.error('You can find this in your Supabase project dashboard under Settings > API');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing or using placeholder value');
  console.error('Please add your actual VITE_SUPABASE_ANON_KEY to your .env file');
  console.error('You can find this in your Supabase project dashboard under Settings > API');
}

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
  supabaseAnonKey === 'your-anon-key');

// Create appropriate client based on configuration
let supabaseClient: SupabaseClient;
let isConfigured: boolean;

if (!isConfigurationValid) {
  console.warn('⚠️ Supabase configuration incomplete. Using mock client.');
  
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
  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    console.log('✅ Supabase URL format is valid:', url.origin);
  } catch (error) {
    console.error('❌ Invalid VITE_SUPABASE_URL format:', supabaseUrl);
    throw new Error('Geçersiz Supabase URL formatı. Lütfen .env dosyasındaki VITE_SUPABASE_URL değerini kontrol edin.');
  }

  // Create the Supabase client with robust configuration
  try {
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
      // Add reasonable timeouts to prevent hanging
      realtime: {
        timeout: 30000, // 30 seconds
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Add connection monitoring
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log('🔐 User signed in successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Auth token refreshed');
      }
    });

    isConfigured = true;
    console.log('✅ Supabase client created successfully');
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error);
    
    // Create a mock client as fallback
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

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, isConfigured }}>
      {children}
    </SupabaseContext.Provider>
  );
};