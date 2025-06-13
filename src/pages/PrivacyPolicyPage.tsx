import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
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

      {/* Privacy Policy Content */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          
          <div className="bg-gray-800 rounded-lg p-8 space-y-8">
            <div>
              <p className="text-gray-300 mb-4">
                Last updated: {new Date().toLocaleDateString('en-US')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                At Gainsy, we are committed to protecting the privacy of your personal data. 
                This privacy policy explains how we use the information we collect when you use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">Personal Information</h3>
                  <p>Your identity information such as name, surname, email address, phone number.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">Usage Information</h3>
                  <p>Data about how you use our platform, IP address, browser information.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">Business Information</h3>
                  <p>Your Etsy store information, product data, sales statistics.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Information</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• To provide and improve our services</li>
                <li>• To provide customer support</li>
                <li>• Security and fraud prevention</li>
                <li>• To fulfill legal obligations</li>
                <li>• To provide personalized recommendations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Information Sharing</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not share your personal information with third parties. We may only 
                share information in the following situations:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• Legal obligations</li>
                <li>• Our service providers (encrypted data)</li>
                <li>• With your explicit consent</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We use industry-standard security measures to protect your data. 
                We protect your information with SSL encryption, secure servers, and regular security audits.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Right to access your personal data</li>
                <li>• Right to request correction of data</li>
                <li>• Right to request deletion of data</li>
                <li>• Right to object to data processing</li>
                <li>• Right to data portability</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Cookies</h2>
              <p className="text-gray-300 leading-relaxed">
                We use cookies on our website to improve your experience. 
                You can manage your cookie preferences from your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have questions about our privacy policy, you can contact us:
              </p>
              <div className="mt-4 text-gray-300">
                <p>Email: privacy@gainsy.io</p>
                <p>Phone: +1 (555) 123-4567</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Changes</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you 
                when there are significant changes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;