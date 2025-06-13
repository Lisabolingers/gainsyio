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
import MyFontPage from './pages/MyFontPage';
import ProtectedRoute from './components/ProtectedRoute';

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
                <Route path="templates/listing" element={<ListingTemplatesPage />} />
                <Route path="templates/mockup" element={<MockupTemplatesPage />} />
                <Route path="templates/update" element={<UpdateTemplatesPage />} />
                <Route path="listing" element={<ListingPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="store-images" element={<StoreImagesPage />} />
                <Route path="my-font" element={<MyFontPage />} />
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