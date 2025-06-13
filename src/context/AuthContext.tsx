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
      // Test connection first
      const { error: connectionError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (connectionError) {
        console.error('Supabase connection failed:', connectionError);
        setError('Unable to connect to database. Please check your Supabase configuration.');
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
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase configuration is missing. Please set up your environment variables.');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Error connecting to authentication service.');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Ensure user profile exists in background (don't block UI)
      if (session?.user) {
        ensureUserProfile(session.user).catch(console.error);
      }
    }).catch((error) => {
      console.error('Error initializing auth:', error);
      setError('Failed to initialize authentication. Please refresh the page.');
      setLoading(false);
    });

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
      if (error.message.includes('Failed to fetch')) {
        setError('Unable to connect to authentication service. Please check your internet connection.');
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
      if (error.message.includes('Failed to fetch')) {
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