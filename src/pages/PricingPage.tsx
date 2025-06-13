import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, Check } from 'lucide-react';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      description: 'Perfect for small stores',
      features: [
        '1 Etsy store',
        '100 product listings',
        'Basic analytics',
        'Email support',
        '5 templates',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$19',
      period: '/month',
      description: 'For growing businesses',
      features: [
        '3 Etsy stores',
        'Unlimited products',
        'Advanced analytics',
        'Priority support',
        'Unlimited templates',
        'AI automation',
        'Mockup creation',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$39',
      period: '/month',
      description: 'For large businesses',
      features: [
        'Unlimited stores',
        'Unlimited products',
        'Custom analytics',
        '24/7 support',
        'Custom templates',
        'Advanced AI',
        'API access',
        'Custom integrations',
      ],
      popular: false,
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

      {/* Pricing Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs and get started today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-gray-800 rounded-lg p-8 relative ${
                plan.popular ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`w-full block text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">
            All plans come with a 14-day free trial
          </p>
          <p className="text-sm text-gray-500">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;