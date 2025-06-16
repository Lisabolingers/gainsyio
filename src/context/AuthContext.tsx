import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

// Mock user data for local development
const MOCK_USERS = [
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

  // Check if we should use local auth
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!isConfigured) {
          console.log('⚠️ Supabase not configured, using local auth');
          setUseLocalAuth(true);
          setLoading(false);
          return;
        }

        // Try to get session from Supabase with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error || !data) {
          console.log('⚠️ Supabase connection failed, using local auth:', error?.message);
          setUseLocalAuth(true);
        } else {
          console.log('✅ Supabase connection successful');
          setUseLocalAuth(false);
        }
      } catch (err: any) {
        console.error('❌ Error checking Supabase connection:', err.message);
        setUseLocalAuth(true);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [isConfigured, supabase]);

  // Initialize auth state
  useEffect(() => {
    if (useLocalAuth) {
      // Check if user is logged in locally
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
          setLoading(false);
        } catch (err) {
          console.error('❌ Error parsing stored user:', err);
          localStorage.removeItem('local_auth_user');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } else if (isConfigured) {
      // Use Supabase auth
      const initializeAuth = async () => {
        try {
          console.log('🚀 Initializing Supabase authentication...');
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Authentication timeout')), 10000)
          );
          
          const sessionPromise = supabase.auth.getSession();
          
          const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          
          if (sessionError) {
            console.error('❌ Error getting session:', sessionError);
            setError(`Session error: ${sessionError.message}`);
            // Fall back to local auth on session error
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
                  console.error('❌ Error fetching user profile:', error);
                } else {
                  console.log('✅ User profile fetched successfully');
                  setUserProfile(data);
                }
              } catch (error) {
                console.error('❌ Error fetching user profile:', error);
              }
            }
          }
        } catch (error: any) {
          console.error('❌ Error initializing auth:', error);
          if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
            setError('Connection timeout: Unable to reach the server. Using offline mode.');
            setUseLocalAuth(true);
          } else {
            setError('Connection error: Unable to reach the server. Please check your internet connection.');
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
          try {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error('❌ Error fetching user profile:', error);
            } else {
              setUserProfile(data);
            }
          } catch (error) {
            console.error('❌ Error fetching user profile:', error);
          }
        } else {
          setUserProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [useLocalAuth, isConfigured, supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      if (useLocalAuth) {
        // Local authentication
        console.log('🔐 Using local auth for sign in');
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);
        
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
        
        console.log('✅ Local sign in successful');
      } else {
        // Supabase authentication with timeout
        console.log('🔐 Attempting Supabase sign in with:', email);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign in timeout')), 10000)
        );
        
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        console.log('✅ Supabase sign in successful');
        
        // Fetch user profile after sign in
        if (data.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('❌ Error fetching user profile after sign in:', profileError);
          } else {
            console.log('✅ User profile fetched after sign in:', profileData);
            setUserProfile(profileData);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('timeout') || error.name === 'TypeError') {
        setError('Connection error: Unable to reach the server. Please check your internet connection.');
        // Switch to local auth on connection error
        if (!useLocalAuth) {
          console.log('🔄 Switching to local auth due to connection error');
          setUseLocalAuth(true);
          // Retry with local auth
          const user = MOCK_USERS.find(u => u.email === email && u.password === password);
          if (user) {
            localStorage.setItem('local_auth_user', JSON.stringify(user));
            setUser({
              id: user.id,
              email: user.email,
              app_metadata: {},
              user_metadata: {},
              aud: 'local',
              created_at: user.profile.created_at
            } as User);
            setUserProfile(user.profile);
            console.log('✅ Fallback to local sign in successful');
            return;
          }
        }
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
      
      if (useLocalAuth) {
        // Local authentication
        console.log('🔐 Using local auth for sign up');
        
        // Check if user already exists
        if (MOCK_USERS.some(u => u.email === email)) {
          throw new Error('User with this email already exists');
        }
        
        // Create new user
        const newUser = {
          id: (MOCK_USERS.length + 1).toString(),
          email,
          password,
          profile: {
            id: (MOCK_USERS.length + 1).toString(),
            email,
            full_name: '',
            subscription_plan: 'free' as const,
            subscription_status: 'active' as const,
            role: 'user' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        
        // Add to mock users (in a real app, this would persist to a database)
        MOCK_USERS.push(newUser);
        
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
        
        console.log('✅ Local sign up successful');
      } else {
        // Supabase authentication with timeout
        console.log('📝 Attempting Supabase sign up...');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign up timeout')), 10000)
        );
        
        const signUpPromise = supabase.auth.signUp({
          email,
          password,
        });
        
        const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;
        
        if (error) throw error;
        console.log('✅ Supabase sign up successful');

        // Create user profile if user was created
        if (data.user) {
          try {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                subscription_plan: 'free',
                subscription_status: 'active',
                role: 'user'
              });
              
            if (profileError) {
              console.error('❌ Error creating user profile:', profileError);
            } else {
              console.log('✅ User profile created successfully');
              
              // Fetch the created profile
              const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
                
              setUserProfile(profileData);
            }
          } catch (profileError) {
            console.error('❌ Profile creation failed:', profileError);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('timeout') || error.name === 'TypeError') {
        setError('Connection error: Unable to reach the server. Please check your internet connection.');
        // Switch to local auth on connection error
        if (!useLocalAuth) {
          console.log('🔄 Switching to local auth due to connection error');
          setUseLocalAuth(true);
        }
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
      
      if (useLocalAuth) {
        // Local authentication
        console.log('🚪 Using local auth for sign out');
        
        // Remove user from localStorage
        localStorage.removeItem('local_auth_user');
        
        // Clear user state
        setUser(null);
        setUserProfile(null);
        
        console.log('✅ Local sign out successful');
      } else {
        // Supabase authentication
        console.log('🚪 Attempting Supabase sign out...');
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        console.log('✅ Supabase sign out successful');
        setUserProfile(null);
      }
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

  // Role check functions
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