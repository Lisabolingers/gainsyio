import React from 'react';

const MockupTemplatesPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mockup Templates
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Mockup Templates Coming Soon
          </h2>
          <p className="text-gray-600">
            This feature is currently under development. You'll be able to manage your mockup templates here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MockupTemplatesPage;