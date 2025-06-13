import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, Target, Users, Award } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold">Gainsy</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </nav>
      </header>

      {/* About Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Gainsy was founded to help Etsy sellers grow their businesses
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              At Gainsy, we aim to help small and medium-sized Etsy sellers 
              manage and grow their businesses more efficiently. With modern technology 
              and AI-powered tools, we help sellers save time and increase sales.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              Our goal is to support entrepreneurs who want to succeed in the e-commerce 
              world by providing them with powerful tools to realize their dreams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-lg mx-auto mb-4">
                <Target className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Goal-Oriented</h3>
              <p className="text-gray-400">
                We provide the necessary tools for sellers to reach their goals
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-lg mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-400">
                A strong community of 10,000+ active users
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-lg mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quality</h3>
              <p className="text-gray-400">
                High-quality service and continuous improvement-focused approach
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Why Gainsy?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-orange-400 mb-2">Easy to Use</h4>
                <p className="text-gray-300">
                  Anyone can easily use it with an intuitive interface
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-400 mb-2">Reliable</h4>
                <p className="text-gray-300">
                  Uninterrupted service with 99.9% uptime guarantee
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-400 mb-2">Fast Support</h4>
                <p className="text-gray-300">
                  We're here for you with 24/7 customer support
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-orange-400 mb-2">Continuous Development</h4>
                <p className="text-gray-300">
                  Regular updates and new features
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link
            to="/register"
            className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-lg font-semibold"
          >
            Get Started Now
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;