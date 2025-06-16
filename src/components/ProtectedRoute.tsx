import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Yükleniyor...</p>
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
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
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