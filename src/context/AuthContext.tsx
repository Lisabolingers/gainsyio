import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseContext';
import { supabase, testSupabaseConnection, isConfigValid } from '../lib/supabase';

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
  isDemoMode: boolean;
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

// Demo mode sample accounts
const DEMO_ACCOUNTS = [
  {
    email: 'user@example.com',
    password: 'password',
    profile: {
      id: 'demo-user-1',
      email: 'user@example.com',
      full_name: 'Demo User',
      subscription_plan: 'free',
      subscription_status: 'active',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    email: 'admin@example.com',
    password: 'password',
    profile: {
      id: 'demo-admin-1',
      email: 'admin@example.com',
      full_name: 'Demo Admin',
      subscription_plan: 'professional',
      subscription_status: 'active',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    email: 'superadmin@example.com',
    password: 'password',
    profile: {
      id: 'demo-superadmin-1',
      email: 'superadmin@example.com',
      full_name: 'Demo Super Admin',
      subscription_plan: 'enterprise',
      subscription_status: 'active',
      role: 'superadmin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);

  // Check Supabase connection first
  useEffect(() => {
    const checkConnection = async () => {
      if (!isConfigValid) {
        console.warn('⚠️ Supabase configuration is invalid. Using demo mode.');
        setIsDemoMode(true);
        setConnectionChecked(true);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Checking Supabase connection...');
        const connectionOk = await testSupabaseConnection();
        
        if (!connectionOk) {
          console.error('❌ Error checking Supabase connection: Connection timeout');
          setError('Connection timeout. Using demo mode with sample accounts.');
          setIsDemoMode(true);
        } else {
          console.log('✅ Supabase connection is working');
        }
      } catch (error: any) {
        console.error('❌ Error checking Supabase connection:', error);
        setError(`Connection error: ${error.message}. Using demo mode with sample accounts.`);
        setIsDemoMode(true);
      } finally {
        setConnectionChecked(true);
      }
    };

    checkConnection();
  }, []);

  // Initialize auth after connection check
  useEffect(() => {
    if (!connectionChecked) return;
    
    // Skip real auth initialization if in demo mode
    if (isDemoMode) {
      console.log('🎭 Running in demo mode with sample accounts');
      setLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          setError(`Authentication timeout. Using demo mode with sample accounts.`);
          setIsDemoMode(true);
        } else {
          console.log('✅ Session retrieved successfully');
          setSession(session);
          setUser(session?.user ?? null);
          
          // Ensure user profile exists in background (don't block UI)
          if (session?.user) {
            console.log('👤 User found, ensuring profile exists...');
            try {
              await ensureUserProfile(session.user);
              console.log('✅ Profile check completed successfully');
            } catch (error) {
              console.error('❌ Background profile check failed:', error);
              // Don't set error state here as it would block the UI
            }
          }
        }
      } catch (error: any) {
        console.error('❌ Error initializing auth:', error);
        
        if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
          setError('Authentication timeout. Using demo mode with sample accounts.');
          setIsDemoMode(true);
        } else {
          setError(error.message || 'Kimlik doğrulama başlatılamadı');
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
          console.log('🔍 Fetching user profile after auth change for:', session.user.id);
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('❌ Error fetching user profile:', error);
            throw error;
          }
          
          console.log('✅ User profile fetched successfully:', data);
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
  }, [supabase.auth, connectionChecked, isDemoMode]);

  const ensureUserProfile = async (user: User) => {
    if (isDemoMode) return null;
    
    try {
      console.log('🔍 Checking user profile for:', user.id);
      
      // Test basic connectivity first
      const { error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connectivity test failed:', testError);
        throw new Error(`Veritabanı bağlantısı başarısız: ${testError.message}`);
      }
      
      console.log('✅ Supabase connectivity test passed');

      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if profile doesn't exist
        console.error('❌ Error checking user profile:', fetchError);
        throw new Error(`Profil kontrolü başarısız: ${fetchError.message}`);
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
          throw new Error(`Profil oluşturma başarısız: ${insertError.message}`);
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
        const networkError = 'Bağlantı hatası: Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
        setError(networkError);
        throw new Error(networkError);
      }
      
      // Check if it's a CORS error
      if (error.message?.includes('CORS') || error.message?.includes('Access-Control')) {
        const corsError = 'CORS hatası: Sunucu yapılandırma sorunu. Lütfen daha sonra tekrar deneyin.';
        setError(corsError);
        throw new Error(corsError);
      }
      
      // Generic error
      setError(`Kullanıcı profili hatası: ${error.message}`);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    // Demo mode sign in
    if (isDemoMode) {
      const demoAccount = DEMO_ACCOUNTS.find(account => account.email === email && account.password === password);
      
      if (demoAccount) {
        console.log('🎭 Demo mode: Signing in with demo account:', demoAccount.email);
        // Create a fake user object
        const fakeUser = {
          id: demoAccount.profile.id,
          email: demoAccount.email,
          app_metadata: {},
          user_metadata: {},
          aud: 'demo',
          created_at: demoAccount.profile.created_at
        } as User;
        
        setUser(fakeUser);
        setUserProfile(demoAccount.profile as UserProfile);
        return;
      } else {
        throw new Error('Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin.');
      }
    }
    
    // Real sign in
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Attempting sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      console.log('✅ Sign in successful');
      
      // Fetch user profile after sign in
      if (data.user) {
        console.log('🔍 Fetching user profile after sign in for:', data.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error('❌ Error fetching user profile after sign in:', profileError);
          
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            console.log('📝 Profile not found, creating new profile...');
            await ensureUserProfile(data.user);
          } else {
            throw profileError;
          }
        } else {
          console.log('✅ User profile fetched after sign in:', profileData);
          setUserProfile(profileData);
        }
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Bağlantı hatası: Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin.');
      } else {
        setError(error.message || 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    // Demo mode sign up
    if (isDemoMode) {
      console.log('🎭 Demo mode: Creating new demo account');
      
      // Create a new demo account
      const newDemoId = `demo-user-${Date.now()}`;
      const newDemoProfile = {
        id: newDemoId,
        email: email,
        full_name: 'New Demo User',
        subscription_plan: 'free',
        subscription_status: 'active',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserProfile;
      
      // Create a fake user object
      const fakeUser = {
        id: newDemoId,
        email: email,
        app_metadata: {},
        user_metadata: {},
        aud: 'demo',
        created_at: newDemoProfile.created_at
      } as User;
      
      setUser(fakeUser);
      setUserProfile(newDemoProfile);
      return;
    }
    
    // Real sign up
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
        try {
          await ensureUserProfile(data.user);
          console.log('✅ Profile created after signup');
        } catch (profileError) {
          console.error('❌ Profile creation after signup failed:', profileError);
          // Don't throw here as signup was successful
        }
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Bağlantı hatası: Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        setError(error.message || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Demo mode sign out
    if (isDemoMode) {
      console.log('🎭 Demo mode: Signing out');
      setUser(null);
      setUserProfile(null);
      return;
    }
    
    // Real sign out
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
        setError('Bağlantı hatası: Çıkış sırasında sunucuya ulaşılamıyor.');
      } else {
        setError('Çıkış sırasında bir hata oluştu. Lütfen tekrar deneyin.');
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
    isDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};