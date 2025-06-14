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
      // First, test if we can reach Supabase at all
      const { error: healthError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(0);

      if (healthError) {
        console.error('Supabase health check failed:', healthError);
        
        // More specific error handling
        if (healthError.message?.includes('Failed to fetch') || 
            healthError.message?.includes('NetworkError') ||
            healthError.message?.includes('fetch') ||
            healthError.code === 'NETWORK_ERROR') {
          setError('Unable to connect to Supabase database. Please check your internet connection and make sure your Supabase configuration is correct.');
        } else if (healthError.message?.includes('Invalid API key') || 
                   healthError.message?.includes('JWT')) {
          setError('Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY in your .env file.');
        } else if (healthError.message?.includes('not found') || 
                   healthError.code === '404') {
          setError('Supabase project not found. Please check your VITE_SUPABASE_URL in your .env file.');
        } else {
          setError(`Database connection error: ${healthError.message}`);
        }
        return;
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
        setError('Error accessing user profile. Please try again.');
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
          setError('Error creating user profile. Please try again.');
        } else {
          console.log('User profile created successfully');
          setError(null); // Clear any previous errors
        }
      } else {
        setError(null); // Clear any previous errors
      }
    } catch (error: any) {
      console.error('Error ensuring user profile:', error);
      
      // More specific error handling
      if (error instanceof TypeError && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('fetch'))) {
        setError('Unable to connect to Supabase. Please check your internet connection and make sure your VITE_SUPABASE_URL in your .env file is correct.');
      } else if (error.name === 'NetworkError' || error.message?.includes('NetworkError')) {
        setError('Network connection error. Please check your internet connection.');
      } else if (error.message?.includes('CORS')) {
        setError('CORS error. Please check your Supabase configuration.');
      } else if (error.message?.includes('Invalid API key')) {
        setError('Invalid API key. Please check your Supabase configuration.');
      } else {
        setError(`Unexpected error: ${error.message || 'Unknown error'}`);
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
            setError('Unable to connect to authentication service. Please check your internet connection and Supabase configuration.');
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
        if (error.message?.includes('Failed to fetch') || 
            error instanceof TypeError) {
          setError('Unable to connect to Supabase. Please check your configuration in the .env file and refresh the page.');
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message?.includes('Failed to fetch') || 
          error instanceof TypeError) {
        setError('Unable to connect to authentication service. Please check your internet connection.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else {
        setError(error.message || 'Sign in failed. Please try again.');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
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
      if (error.message?.includes('Failed to fetch') || 
          error instanceof TypeError) {
        setError('Unable to connect to authentication service. Please check your internet connection.');
      } else {
        setError(error.message || 'Sign up failed. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError('Sign out failed. Please try again.');
      throw error;
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