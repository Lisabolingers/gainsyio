import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, error: authError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Show auth context error if present
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting to sign in with:', email);
      await signIn(email, password);
      console.log('✅ Sign in successful, redirecting to admin panel');
      navigate('/admin');
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Giriş sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 5000 5000" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3356.85,978.17c99.43-18.98,200.72-26.23,301.81-21.71,105.68,1.85,215.66,9.16,289.55,94.07,129.18,148.48,92.17,376.17,96.29,559.77h339.94V574.84c-114.01,52.74-238.61,78.47-364.14,75.23-365.62,9.76-735.12-44.33-1091.35,65.98-381.03,117.99-696.21,370.73-907.15,691.7h453.39v851.45h-738.9c-8.62,144.01,1.37,290.22,31.95,435.22,4.79,22.7,10.05,45.3,15.76,67.81h835.12c-129.85-664.1,21.65-1629.36,737.72-1784.06Z" fill="#f15a29" fillRule="evenodd"/>
              <path d="M3264.87,2271.57v305.47c117.62-.05,230.42,46.68,313.57,129.88,83.19,83.15,129.92,195.95,129.92,313.56v673.36c-75.28,4.76-150.79,2.64-225.65-6.34-65.06-7.05-126.61-20.08-184.63-38.52v354.84c180.65,2.7,363.68-11.66,542.57-8.16,182.02,3.56,374.73-14.53,543.71,62.92l-4.03-1019.59c0-255.12,206.82-461.95,462-461.95v-305.47h-1577.45Z" fill="#f15a29" fillRule="evenodd"/>
              <path d="M3298.07,3648.97v-886.74h-678.93c15.59,79.73,35.23,155.12,58.44,224.24,106.5,317.12,314.39,565.21,620.49,662.5Z" fill="#f15a29" fillRule="evenodd"/>
              <path d="M1784.01,2762.23h-188.82v1702.88h1702.88v-461.29c-115.21-1.72-229.45-10.38-341.03-35.05-585.44-129.42-1027.62-633.75-1173.03-1206.53Z" fill="#f15a29" fillRule="evenodd"/>
              <path d="M1623.75,1407.75v851.45h112.55c18.22-304.46,119.63-599.05,285.51-851.45h-398.05Z" fill="#f15a29" fillRule="evenodd"/>
              <rect x="157.68" y="1140.19" width="572.26" height="572.25" fill="#f15a29"/>
              <rect x="474.79" y="1985.55" width="961.56" height="961.59" fill="#f15a29"/>
              <rect x="1315.45" y="652.12" width="501.25" height="501.25" fill="#f15a29"/>
              <rect x="459.65" y="534.9" width="250.62" height="250.61" fill="#f15a29"/>
              <rect x="1113.09" y="1378.46" width="250.64" height="250.62" fill="#f15a29"/>
            </svg>
            <span className="text-2xl font-bold text-white">Gainsy</span>
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Hesabınıza Giriş Yapın
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-posta Adresi
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="ornek@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                  placeholder="Şifrenizi girin"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                Şifremi Unuttum
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-orange-400 hover:text-orange-300 transition-colors">
                Ücretsiz Kaydolun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;