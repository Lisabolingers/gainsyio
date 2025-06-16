import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSuperAdmin = false,
  requireAdmin = false
}) => {
  const { user, userProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔒 Protected Route Check:', {
      user: user ? 'Exists' : 'None',
      userProfile: userProfile ? `Role: ${userProfile.role}` : 'None',
      loading,
      requireSuperAdmin,
      requireAdmin
    });
  }, [user, userProfile, loading, requireSuperAdmin, requireAdmin]);

  // Show retry button after 5 seconds if still loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setShowRetryButton(true);
      }, 5000);
    } else {
      setShowRetryButton(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // Auto-retry logic (max 3 times)
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 Auto-retrying authentication (attempt ${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        window.location.reload();
      }, 3000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [error, retryCount]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white mb-4">Yükleniyor...</p>
          {showRetryButton && (
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center mx-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-semibold mb-4">Bağlantı Hatası</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={handleRetry} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check for super admin access
  if (requireSuperAdmin && userProfile?.role !== 'superadmin') {
    console.log('❌ Super admin required but user is not super admin, redirecting to admin');
    return <Navigate to="/admin" replace />;
  }

  // Check for admin access (admin or superadmin)
  if (requireAdmin && !['admin', 'superadmin'].includes(userProfile?.role || '')) {
    console.log('❌ Admin required but user is not admin, redirecting to admin');
    return <Navigate to="/admin" replace />;
  }

  console.log('✅ Access granted to protected route');
  return <>{children}</>;
};

export default ProtectedRoute;