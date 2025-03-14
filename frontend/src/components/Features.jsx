'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: "Learn by Playing",
    description: "Experience the thrill of trading with zero risk. Start with $100,000 in virtual cash and learn the ropes of stock trading.",
    icon: "🎮"
  },
  {
    title: "Real Market Data",
    description: "Practice with real-time market data and stock prices. Learn to analyze trends and make informed decisions.",
    icon: "📊"
  },
  {
    title: "AI Trading Assistant",
    description: "Get instant help from our AI chat bot that explains stock concepts, answers your questions, and provides trading guidance.",
    icon: "🤖"
  },
  {
    title: "Risk-Free Trading",
    description: "Make mistakes and learn from them without losing real money. Perfect your strategy before trading with real funds.",
    icon: "🛡️"
  },
  {
    title: "Community Support",
    description: "Join a community of learners, share strategies, and learn from experienced traders in a supportive environment.",
    icon: "👥"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Learn with Stockify?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Master stock trading in a risk-free environment with our gamified learning platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 