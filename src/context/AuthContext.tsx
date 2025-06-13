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
      // Test connection with a simple health check first
      const { error: connectionError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)
        .single();

      if (connectionError) {
        console.error('Supabase connection failed:', connectionError);
        
        // Check if it's a network/fetch error
        if (connectionError.message?.includes('Failed to fetch') || 
            connectionError.message?.includes('NetworkError') ||
            connectionError.message?.includes('fetch')) {
          setError('Supabase veritabanına bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve Supabase yapılandırmanızın doğru olduğundan emin olun.');
        } else {
          setError(`Veritabanı bağlantı hatası: ${connectionError.message}`);
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
        setError('Kullanıcı profiline erişim hatası. Lütfen tekrar deneyin.');
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
          setError('Kullanıcı profili oluşturma hatası. Lütfen tekrar deneyin.');
        } else {
          console.log('User profile created successfully');
          setError(null); // Clear any previous errors
        }
      } else {
        setError(null); // Clear any previous errors
      }
    } catch (error: any) {
      console.error('Error ensuring user profile:', error);
      
      // Handle different types of network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Supabase\'e bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve .env dosyanızdaki VITE_SUPABASE_URL değerinin doğru olduğundan emin olun.');
      } else if (error.name === 'NetworkError' || error.message?.includes('NetworkError')) {
        setError('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.message?.includes('CORS')) {
        setError('CORS hatası. Supabase yapılandırmanızı kontrol edin.');
      } else {
        setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase yapılandırması eksik. Lütfen ortam değişkenlerinizi ayarlayın.');
      setLoading(false);
      return;
    }

    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch (urlError) {
      setError('Geçersiz Supabase URL formatı. Lütfen .env dosyanızdaki VITE_SUPABASE_URL değerini kontrol edin.');
      setLoading(false);
      return;
    }

    // Get initial session with better error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (sessionError.message?.includes('Failed to fetch')) {
            setError('Kimlik doğrulama servisine bağlanılamıyor. Lütfen internet bağlantınızı ve Supabase yapılandırmanızı kontrol edin.');
          } else {
            setError('Kimlik doğrulama servisine bağlanırken hata oluştu.');
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
        if (error.message?.includes('Failed to fetch')) {
          setError('Supabase\'e bağlanılamıyor. Lütfen .env dosyanızdaki yapılandırmayı kontrol edin ve sayfayı yenileyin.');
        } else {
          setError('Kimlik doğrulama başlatılamadı. Lütfen sayfayı yenileyin.');
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
      if (error.message?.includes('Failed to fetch')) {
        setError('Kimlik doğrulama servisine bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Geçersiz e-posta veya şifre.');
      } else {
        setError(error.message || 'Giriş başarısız. Lütfen tekrar deneyin.');
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
      if (error.message?.includes('Failed to fetch')) {
        setError('Kimlik doğrulama servisine bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        setError(error.message || 'Kayıt başarısız. Lütfen tekrar deneyin.');
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
      setError('Çıkış başarısız. Lütfen tekrar deneyin.');
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