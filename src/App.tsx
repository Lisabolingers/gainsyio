import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseProvider } from './context/SupabaseContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import AdminLayout from './components/layout/AdminLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import StoresPage from './pages/StoresPage';
import ProductsPage from './pages/ProductsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TemplatesPage from './pages/TemplatesPage';
import ListingPage from './pages/ListingPage';
import LibraryPage from './pages/LibraryPage';
import StoreImagesPage from './pages/StoreImagesPage';
import AutoTextToImagePage from './pages/AutoTextToImagePage';
import ListingTemplatesPage from './pages/ListingTemplatesPage';
import MockupTemplatesPage from './pages/MockupTemplatesPage';
import UpdateTemplatesPage from './pages/UpdateTemplatesPage';
import TextTemplatesPage from './pages/TextTemplatesPage';
import MyFontPage from './pages/MyFontPage';
import DesignUploadPage from './pages/DesignUploadPage';
import TemporaryFilesPage from './pages/TemporaryFilesPage';
import AIAgentPage from './pages/AIAgentPage';
import ProtectedRoute from './components/ProtectedRoute';

// Super Admin Pages
import SuperAdminDashboardPage from './pages/superadmin/SuperAdminDashboardPage';
import UserManagementPage from './pages/superadmin/UserManagementPage';
import SystemSettingsPage from './pages/superadmin/SystemSettingsPage';
import SuperAdminAnalyticsPage from './pages/superadmin/SuperAdminAnalyticsPage';
import DatabaseManagementPage from './pages/superadmin/DatabaseManagementPage';
import LogsPage from './pages/superadmin/LogsPage';
import ApiKeysPage from './pages/superadmin/ApiKeysPage';

function App() {
  return (
    <Router>
      <SupabaseProvider>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Protected admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboardPage />} />
                <Route path="stores" element={<StoresPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="templates/auto-text-to-image" element={<AutoTextToImagePage />} />
                <Route path="templates/text" element={<TextTemplatesPage />} />
                <Route path="templates/listing" element={<ListingTemplatesPage />} />
                <Route path="templates/mockup" element={<MockupTemplatesPage />} />
                <Route path="templates/update" element={<UpdateTemplatesPage />} />
                <Route path="listing" element={<ListingPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="store-images" element={<StoreImagesPage />} />
                <Route path="my-font" element={<MyFontPage />} />
                <Route path="upload-design" element={<DesignUploadPage />} />
                <Route path="temporary-files" element={<TemporaryFilesPage />} />
                <Route path="ai-agent" element={<AIAgentPage />} />
              </Route>

              {/* Super Admin Routes */}
              <Route path="/superadmin" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<SuperAdminDashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="analytics" element={<SuperAdminAnalyticsPage />} />
                <Route path="system" element={<SystemSettingsPage />} />
                <Route path="system/database" element={<DatabaseManagementPage />} />
                <Route path="system/logs" element={<LogsPage />} />
                <Route path="system/api-keys" element={<ApiKeysPage />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </SupabaseProvider>
    </Router>
  );
}

export default App;