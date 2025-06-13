import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, Store, BarChart3, BookTemplate as Template, Wand2, Image, Type } from 'lucide-react';

const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Store,
      title: 'Store Management',
      description: 'Manage multiple Etsy stores from a single dashboard. Track store performance.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Analyze your sales data and discover your best-selling products.',
    },
    {
      icon: Template,
      title: 'Listing Templates',
      description: 'Use customizable templates for quick product creation.',
    },
    {
      icon: Wand2,
      title: 'AI-Powered Automation',
      description: 'Automatic title and tag generation with artificial intelligence.',
    },
    {
      icon: Image,
      title: 'Mockup Creation',
      description: 'Automatically create professional product mockups.',
    },
    {
      icon: Type,
      title: 'Font Management',
      description: 'Upload your custom fonts and use them in your designs.',
    },
  ];

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

      {/* Features Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Powerful Features
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            All the tools you need to manage your Etsy store with Gainsy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-8 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg mb-6">
                <feature.icon className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            to="/register"
            className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-lg font-semibold"
          >
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FeaturesPage;