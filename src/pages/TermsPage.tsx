import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

const TermsPage: React.FC = () => {
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

      {/* Terms Content */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          
          <div className="bg-gray-800 rounded-lg p-8 space-y-8">
            <div>
              <p className="text-gray-300 mb-4">
                Last updated: {new Date().toLocaleDateString('en-US')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                These terms of service govern your use of the Gainsy platform. 
                By using our services, you agree to these terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Service Description</h2>
              <p className="text-gray-300 leading-relaxed">
                Gainsy is a SaaS platform that helps Etsy sellers manage their stores. 
                It offers product listing, analytics, template management, and automation tools.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">User Responsibilities</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Keep your account information secure</li>
                <li>• Provide accurate and up-to-date information</li>
                <li>• Use the platform for legal purposes</li>
                <li>• Respect other users' rights</li>
                <li>• Do not infringe copyright</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Prohibited Activities</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Attempting to hack the platform</li>
                <li>• Sharing spam or harmful content</li>
                <li>• Using other people's accounts</li>
                <li>• Providing false information</li>
                <li>• Misusing the system</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Payment and Billing</h2>
              <div className="space-y-4 text-gray-300">
                <p>• Monthly or annual subscription payments</p>
                <p>• Automatic renewal (you can cancel anytime)</p>
                <p>• 14-day free trial period</p>
                <p>• Refund policy: Full refund within 30 days</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Service Interruptions</h2>
              <p className="text-gray-300 leading-relaxed">
                Service interruptions may occur due to planned maintenance or technical issues. 
                These situations are announced in advance and resolved as quickly as possible.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
              <p className="text-gray-300 leading-relaxed">
                The Gainsy platform and content are our intellectual property. 
                Users only receive a license for personal and commercial use. 
                Copying, distributing, or modifying the platform is prohibited.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                Gainsy is not responsible for damages resulting from service interruptions, 
                data loss, or other technical issues. Users are responsible for backing up their own data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Account Termination</h2>
              <p className="text-gray-300 leading-relaxed">
                Accounts that violate the terms of service may be closed without warning. 
                Users can close their accounts at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Changes</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update these terms of service from time to time. Significant 
                changes are notified by email. Continuing to use the platform after updates 
                means accepting the new terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                For questions about the terms of service:
              </p>
              <div className="mt-4 text-gray-300">
                <p>Email: legal@gainsy.io</p>
                <p>Phone: +1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;