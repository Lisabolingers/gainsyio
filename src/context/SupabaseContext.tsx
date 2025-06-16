import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced error checking with helpful messages
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is missing from environment variables');
  console.error('Please add VITE_SUPABASE_URL to your .env file');
  console.error('You can find this in your Supabase project dashboard under Settings > API');
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is missing from environment variables');
  console.error('Please add VITE_SUPABASE_ANON_KEY to your .env file');
  console.error('You can find this in your Supabase project dashboard under Settings > API');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase ortam değişkenleri eksik. Lütfen .env dosyanızı kontrol edin ve VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerinin ayarlandığından emin olun.');
}

// Validate URL format
try {
  const url = new URL(supabaseUrl);
  console.log('✅ Supabase URL format is valid:', url.origin);
} catch (error) {
  console.error('❌ Invalid VITE_SUPABASE_URL format:', supabaseUrl);
  throw new Error('Geçersiz Supabase URL formatı. Lütfen .env dosyasındaki VITE_SUPABASE_URL değerini kontrol edin.');
}

// Test if URL is reachable (basic check)
const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
      },
    });
    
    if (response.ok) {
      console.log('✅ Supabase connection test successful');
    } else {
      console.warn('⚠️ Supabase connection test returned:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    console.error('This might indicate network issues or incorrect configuration');
  }
};

// Run connection test in development
if (import.meta.env.DEV) {
  testSupabaseConnection();
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    console.log('🔐 User signed in successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('🚪 User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Auth token refreshed');
  }
});

interface SupabaseContextType {
  supabase: SupabaseClient;
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

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};