import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold">Gainsy</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="hover:text-orange-400 transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-orange-400 transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-orange-400 transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-orange-400 transition-colors">
              Contact
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-white hover:text-orange-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Supercharge Your
            <br />
            Etsy Store
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Manage your Etsy store with Gainsy, boost your sales, and automate your business.
            Everything you need in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-lg font-semibold"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/features"
              className="px-8 py-4 border border-gray-600 text-white rounded-lg hover:border-orange-500 transition-colors text-lg"
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">10,000+</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
            <div className="text-gray-400">User Rating</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">300%</div>
            <div className="text-gray-400">Sales Increase</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Zap className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-semibold">Gainsy</span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-400">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;