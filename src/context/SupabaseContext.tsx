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
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
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

  // Test if URL is reachable (basic check) - only in development
  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Supabase connection test successful');
      } else {
        console.warn('⚠️ Supabase connection test returned:', response.status, response.statusText);
        console.warn('This might indicate incorrect API key or project configuration');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ Supabase connection test timed out');
        console.warn('This might indicate network issues or slow connection');
      } else {
        console.warn('⚠️ Supabase connection test failed:', error);
        console.warn('This might indicate network issues or incorrect configuration');
        console.warn('The app will still work, but database features may not function properly');
      }
    }
  };

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

  // Run connection test in development with delay to avoid blocking app startup
  if (import.meta.env.DEV) {
    setTimeout(() => {
      testSupabaseConnection();
    }, 1000);
  }

  isConfigured = true;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, isConfigured }}>
      {children}
    </SupabaseContext.Provider>
  );
};