import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureUserProfile = async (user: User) => {
    try {
      // Test basic connectivity to Supabase first with a simple timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Supabase connection failed: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Connection timeout: Supabase server is not responding');
        }
        throw fetchError;
      }

      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if profile doesn't exist
        console.error('Error checking user profile:', fetchError);
        setError(`Database error: ${fetchError.message}. Please check your Supabase project status.`);
        return;
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            subscription_plan: 'free',
            subscription_status: 'active'
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          setError(`Error creating user profile: ${insertError.message}`);
        } else {
          console.log('User profile created successfully');
          setError(null); // Clear any previous errors
        }
      } else {
        setError(null); // Clear any previous errors
      }
    } catch (error: any) {
      console.error('Error ensuring user profile:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError(`Unable to connect to Supabase. Please check:
        1. Your internet connection
        2. Supabase project URL: ${import.meta.env.VITE_SUPABASE_URL}
        3. Make sure your Supabase project is not paused
        4. Verify your API key is correct`);
      } else if (error.message?.includes('NetworkError') || error.message?.includes('ERR_NETWORK')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('CORS')) {
        setError('CORS error. Please check your Supabase project configuration.');
      } else if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
        setError('Invalid API key. Please check your VITE_SUPABASE_ANON_KEY in your .env file.');
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        setError('Supabase project not found. Please verify your VITE_SUPABASE_URL is correct.');
      } else if (error.message?.includes('timeout')) {
        setError('Connection timeout. Supabase server is not responding. Please check if your project is active.');
      } else {
        setError(`Connection error: ${error.message || 'Unknown error occurred'}`);
      }
    }
  };

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase configuration missing. Please set your environment variables.');
      setLoading(false);
      return;
    }

    // Validate URL format
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes('supabase.co')) {
        setError('Invalid Supabase URL. URL must contain supabase.co domain.');
        setLoading(false);
        return;
      }
    } catch (urlError) {
      setError('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in your .env file.');
      setLoading(false);
      return;
    }

    // Get initial session with better error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (sessionError.message?.includes('Failed to fetch') || 
              sessionError.message?.includes('NetworkError')) {
            setError(`Unable to connect to Supabase authentication service. 
            Please check:
            1. Your internet connection
            2. Supabase project status (not paused)
            3. Project URL: ${supabaseUrl}`);
          } else if (sessionError.message?.includes('Invalid API key')) {
            setError('Invalid API key. Please check your VITE_SUPABASE_ANON_KEY in your .env file.');
          } else {
            setError(`Authentication error: ${sessionError.message}`);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Ensure user profile exists in background (don't block UI)
          if (session?.user) {
            ensureUserProfile(session.user).catch(console.error);
          }
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error);
        if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
          setError(`Unable to connect to Supabase. Please verify:
          1. Internet connection is working
          2. Supabase project URL is correct: ${supabaseUrl}
          3. Supabase project is not paused
          4. Restart your development server after making changes`);
        } else {
          setError(`Authentication initialization failed: ${error.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Ensure user profile exists in background (don't block UI)
      if (session?.user) {
        ensureUserProfile(session.user).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        setError('Unable to connect to authentication service. Please check your internet connection and Supabase project status.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else {
        setError(error.message || 'Sign in failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      // Create user profile record if user was successfully created
      // This runs in background, doesn't block the signup process
      if (data.user) {
        ensureUserProfile(data.user).catch(console.error);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
        setError('Unable to connect to authentication service. Please check your internet connection and Supabase project status.');
      } else {
        setError(error.message || 'Sign up failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError('Sign out failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};