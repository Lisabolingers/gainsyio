import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseContext';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  trial_ends_at?: string;
  role: 'user' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isAdminOrSuperAdmin: () => boolean;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureUserProfile = async (user: User) => {
    try {
      console.log('🔍 Checking user profile for:', user.id);
      
      // Test basic connectivity first
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connectivity test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('✅ Supabase connectivity test passed');

      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if profile doesn't exist
        console.error('❌ Error checking user profile:', fetchError);
        throw new Error(`Profile check failed: ${fetchError.message}`);
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        console.log('📝 Creating new user profile...');
        const { data, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            subscription_plan: 'free',
            subscription_status: 'active',
            role: 'user' // Default role is 'user'
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError);
          throw new Error(`Profile creation failed: ${insertError.message}`);
        } else {
          console.log('✅ User profile created successfully');
          setUserProfile(data);
        }
      } else {
        console.log('✅ User profile already exists');
        setUserProfile(existingProfile);
      }
    } catch (error: any) {
      console.error('❌ Error in ensureUserProfile:', error);
      
      // Check if it's a network error
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        const networkError = 'Connection error: Unable to reach the server. Please check your internet connection and try again.';
        setError(networkError);
        throw new Error(networkError);
      }
      
      // Check if it's a CORS error
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control')) {
        const corsError = 'CORS error: Server configuration issue. Please try again later.';
        setError(corsError);
        throw new Error(corsError);
      }
      
      // Generic error
      setError(`User profile error: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          setError(`Session error: ${sessionError.message}`);
        } else {
          console.log('✅ Session retrieved successfully');
          setSession(session);
          setUser(session?.user ?? null);
          
          // Ensure user profile exists in background (don't block UI)
          if (session?.user) {
            console.log('👤 User found, ensuring profile exists...');
            ensureUserProfile(session.user).catch((error) => {
              console.error('❌ Background profile check failed:', error);
              // Don't set error state here as it would block the UI
            });
          }
        }
      } catch (error: any) {
        console.error('❌ Error initializing auth:', error);
        
        if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
          setError('Connection error: Unable to reach the server. Please check your internet connection.');
        } else {
          setError(error.message || 'Failed to initialize authentication');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile when auth state changes
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) throw error;
          setUserProfile(data);
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
          // Don't set error state here as it would block the UI
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Attempting sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      console.log('✅ Sign in successful');
      
      // Fetch user profile after sign in
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) throw profileError;
        setUserProfile(profileData);
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Connection error: Unable to reach the server. Please check your internet connection.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(error.message || 'An error occurred during sign in. Please try again.');
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
      console.log('📝 Attempting sign up...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      console.log('✅ Sign up successful');

      // Create user profile record if user was successfully created
      if (data.user) {
        ensureUserProfile(data.user).catch((error) => {
          console.error('❌ Profile creation after signup failed:', error);
          // Don't throw here as signup was successful
        });
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Connection error: Unable to reach the server. Please check your internet connection.');
      } else {
        setError(error.message || 'An error occurred during registration. Please try again.');
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
      console.log('🚪 Attempting sign out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Sign out successful');
      setUserProfile(null);
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Connection error: Unable to reach the server during sign out.');
      } else {
        setError('An error occurred during sign out. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to check user roles
  const isSuperAdmin = () => {
    return userProfile?.role === 'superadmin';
  };

  const isAdminOrSuperAdmin = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'superadmin';
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isSuperAdmin,
    isAdminOrSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};