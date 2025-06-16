import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseContext';
import { testSupabaseConnection } from '../lib/supabase';

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

// Demo user accounts for development/testing
const DEMO_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'password123',
    profile: {
      id: '1',
      email: 'admin@example.com',
      full_name: 'Admin User',
      subscription_plan: 'professional' as const,
      subscription_status: 'active' as const,
      role: 'admin' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '2',
    email: 'superadmin@example.com',
    password: 'password123',
    profile: {
      id: '2',
      email: 'superadmin@example.com',
      full_name: 'Super Admin',
      subscription_plan: 'enterprise' as const,
      subscription_status: 'active' as const,
      role: 'superadmin' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '3',
    email: 'user@example.com',
    password: 'password123',
    profile: {
      id: '3',
      email: 'user@example.com',
      full_name: 'Regular User',
      subscription_plan: 'free' as const,
      subscription_status: 'active' as const,
      role: 'user' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { supabase, isConfigured } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalAuth, setUseLocalAuth] = useState(false);

  // Check connection and decide whether to use local auth
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!isConfigured) {
          console.log('⚠️ Supabase not configured, using demo mode');
          setError('Supabase is not configured. Using demo mode with sample accounts.');
          setUseLocalAuth(true);
          setLoading(false);
          return;
        }

        console.log('🔄 Testing Supabase connection...');
        const connectionWorks = await testSupabaseConnection();
        
        if (!connectionWorks) {
          console.log('⚠️ Supabase connection failed, using demo mode');
          setError('Could not connect to Supabase. Using demo mode with sample accounts.');
          setUseLocalAuth(true);
        } else {
          console.log('✅ Supabase connection successful');
          setUseLocalAuth(false);
          setError(null);
        }
      } catch (err: any) {
        console.log('⚠️ Error checking connection:', err.message);
        setError('Connection error: ' + err.message);
        setUseLocalAuth(true);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [isConfigured]);

  // Initialize auth state
  useEffect(() => {
    if (useLocalAuth) {
      // Check for locally stored user
      const storedUser = localStorage.getItem('local_auth_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            id: parsedUser.id,
            email: parsedUser.email,
            app_metadata: {},
            user_metadata: {},
            aud: 'local',
            created_at: parsedUser.profile.created_at
          } as User);
          setUserProfile(parsedUser.profile);
        } catch (err) {
          console.error('Error parsing stored user:', err);
          localStorage.removeItem('local_auth_user');
        }
      }
      setLoading(false);
    } else if (isConfigured) {
      // Use Supabase auth
      const initializeAuth = async () => {
        try {
          console.log('🚀 Initializing authentication...');
          
          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Authentication timeout')), 10000)
          );
          
          // Create a session promise
          const sessionPromise = supabase.auth.getSession();
          
          // Race the promises
          const { data: { session }, error: sessionError } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;
          
          if (sessionError) {
            console.log('⚠️ Error getting session:', sessionError);
            setError(`Authentication error: ${sessionError.message}`);
            setUseLocalAuth(true);
          } else {
            console.log('✅ Session retrieved successfully');
            setSession(session);
            setUser(session?.user ?? null);
            
            // Fetch user profile if user exists
            if (session?.user) {
              try {
                const { data, error } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                  
                if (error) {
                  console.log('⚠️ Error fetching user profile:', error);
                  
                  // If profile doesn't exist, create it
                  if (error.code === 'PGRST116') {
                    await ensureUserProfile(session.user);
                  }
                } else {
                  console.log('✅ User profile fetched successfully');
                  setUserProfile(data);
                }
              } catch (error) {
                console.log('⚠️ Error fetching user profile:', error);
              }
            }
          }
        } catch (error: any) {
          console.log('⚠️ Error initializing auth:', error);
          
          if (error.message?.includes('timeout')) {
            setError('Authentication timeout. Using demo mode with sample accounts.');
            setUseLocalAuth(true);
          } else if (error.message?.includes('Failed to fetch')) {
            setError('Network error: Could not connect to authentication server. Using demo mode.');
            setUseLocalAuth(true);
          } else {
            setError(error.message || 'Authentication initialization failed');
            setUseLocalAuth(true);
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
              
            if (error) {
              console.log('⚠️ Error fetching user profile:', error);
              
              // If profile doesn't exist, create it
              if (error.code === 'PGRST116') {
                await ensureUserProfile(session.user);
              }
            } else {
              console.log('✅ User profile fetched successfully');
              setUserProfile(data);
            }
          } catch (error) {
            console.log('⚠️ Error fetching user profile:', error);
          }
        } else {
          setUserProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [useLocalAuth, isConfigured, supabase]);

  const ensureUserProfile = async (user: User) => {
    try {
      console.log('🔍 Creating user profile for:', user.id);
      
      const { data, error } = await supabase
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

      if (error) {
        console.log('⚠️ Error creating user profile:', error);
        throw error;
      }

      console.log('✅ User profile created successfully');
      setUserProfile(data);
    } catch (error: any) {
      console.log('⚠️ Error in ensureUserProfile:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      if (useLocalAuth) {
        // Demo mode authentication
        console.log('🔐 Using demo mode for sign in');
        const user = DEMO_USERS.find(u => u.email === email && u.password === password);
        
        if (!user) {
          throw new Error('Invalid email or password');
        }
        
        // Store user in localStorage
        localStorage.setItem('local_auth_user', JSON.stringify(user));
        
        // Set user state
        setUser({
          id: user.id,
          email: user.email,
          app_metadata: {},
          user_metadata: {},
          aud: 'local',
          created_at: user.profile.created_at
        } as User);
        setUserProfile(user.profile);
        
        console.log('✅ Demo mode sign in successful');
      } else {
        // Supabase authentication with timeout protection
        console.log('🔐 Attempting sign in with:', email);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign in timeout')), 10000)
        );
        
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        console.log('✅ Sign in successful');
        
        // Fetch user profile after sign in
        if (data.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
              
            if (profileError) {
              console.log('⚠️ Error fetching user profile after sign in:', profileError);
              
              // If profile doesn't exist, create it
              if (profileError.code === 'PGRST116') {
                await ensureUserProfile(data.user);
              } else {
                throw profileError;
              }
            } else {
              console.log('✅ User profile fetched after sign in');
              setUserProfile(profileData);
            }
          } catch (profileError) {
            console.log('⚠️ Profile fetch error:', profileError);
            // Don't throw here as sign in was successful
          }
        }
      }
    } catch (error: any) {
      console.log('⚠️ Sign in error:', error);
      
      // Handle network errors
      if (error.message?.includes('timeout')) {
        setError('Connection timeout. Please try again or use demo accounts.');
        
        // Try demo mode as fallback
        if (!useLocalAuth) {
          setUseLocalAuth(true);
          const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
          if (demoUser) {
            localStorage.setItem('local_auth_user', JSON.stringify(demoUser));
            setUser({
              id: demoUser.id,
              email: demoUser.email,
              app_metadata: {},
              user_metadata: {},
              aud: 'local',
              created_at: demoUser.profile.created_at
            } as User);
            setUserProfile(demoUser.profile);
            setError('Using demo mode due to connection issues.');
            return;
          }
        }
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Network error: Please check your internet connection.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(error.message || 'An error occurred during sign in.');
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
      
      if (useLocalAuth) {
        // Demo mode sign up
        console.log('🔐 Using demo mode for sign up');
        
        // Check if user already exists
        if (DEMO_USERS.some(u => u.email === email)) {
          throw new Error('User with this email already exists');
        }
        
        // Create new user
        const newUser = {
          id: (DEMO_USERS.length + 1).toString(),
          email,
          password,
          profile: {
            id: (DEMO_USERS.length + 1).toString(),
            email,
            full_name: '',
            subscription_plan: 'free' as const,
            subscription_status: 'active' as const,
            role: 'user' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        
        // Add to demo users
        DEMO_USERS.push(newUser);
        
        // Store user in localStorage
        localStorage.setItem('local_auth_user', JSON.stringify(newUser));
        
        // Set user state
        setUser({
          id: newUser.id,
          email: newUser.email,
          app_metadata: {},
          user_metadata: {},
          aud: 'local',
          created_at: newUser.profile.created_at
        } as User);
        setUserProfile(newUser.profile);
        
        console.log('✅ Demo mode sign up successful');
      } else {
        // Supabase sign up with timeout protection
        console.log('📝 Attempting sign up...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign up timeout')), 10000)
        );
        
        const signUpPromise = supabase.auth.signUp({
          email,
          password,
        });
        
        const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        console.log('✅ Sign up successful');

        // Create user profile if user was created
        if (data.user) {
          try {
            await ensureUserProfile(data.user);
          } catch (profileError) {
            console.log('⚠️ Profile creation failed:', profileError);
            // Don't throw here as signup was successful
          }
        }
      }
    } catch (error: any) {
      console.log('⚠️ Sign up error:', error);
      
      if (error.message?.includes('timeout')) {
        setError('Connection timeout. Please try again or use demo accounts.');
        
        // Switch to demo mode
        if (!useLocalAuth) {
          setUseLocalAuth(true);
        }
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Network error: Please check your internet connection.');
      } else {
        setError(error.message || 'An error occurred during registration.');
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
      
      if (useLocalAuth) {
        // Demo mode sign out
        console.log('🚪 Using demo mode for sign out');
        
        // Remove user from localStorage
        localStorage.removeItem('local_auth_user');
        
        // Clear user state
        setUser(null);
        setUserProfile(null);
        
        console.log('✅ Demo mode sign out successful');
      } else {
        // Supabase sign out with timeout protection
        console.log('🚪 Attempting sign out...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign out timeout')), 5000)
        );
        
        const signOutPromise = supabase.auth.signOut();
        
        const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        
        console.log('✅ Sign out successful');
        setUserProfile(null);
      }
    } catch (error: any) {
      console.log('⚠️ Sign out error:', error);
      
      if (error.message?.includes('timeout') || error.message?.includes('Failed to fetch')) {
        // Force sign out locally even if server request fails
        setUser(null);
        setUserProfile(null);
        setSession(null);
        localStorage.removeItem('local_auth_user');
        setError('Network issue during sign out, but you have been signed out locally.');
      } else {
        setError('An error occurred during sign out.');
        throw error;
      }
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