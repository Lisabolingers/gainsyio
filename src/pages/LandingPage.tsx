import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black dark:from-black dark:to-gray-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
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
            <svg width="24" height="24" viewBox="0 0 5000 5000" fill="none" xmlns="http://www.w3.org/2000/svg">
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