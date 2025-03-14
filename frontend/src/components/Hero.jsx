'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <Image
          src="/market-data.png"
          alt="Stock Market Analytics"
          fill
          priority
          quality={90}
          className="opacity-80 object-cover object-center"
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/50"></div>
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Learn Trading
              <span className="text-blue-400"> Risk-Free</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Master stock trading through our gamified platform. Practice with virtual money, learn from experience.
            </p>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Trading Now
              </motion.button>
              <p className="text-gray-400 text-sm">No credit card required • Start with $100,000 virtual cash</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative h-[500px] backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-pink-500/5 to-transparent mix-blend-overlay rounded-2xl"></div>
              <div className="relative h-full flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold text-xl">Your Trading Journey Starts Here</h3>
                    <div className="h-[2px] bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span>🎮</span>
                      </div>
                      <p className="text-white/80">Learn through gameplay</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span>💰</span>
                      </div>
                      <p className="text-white/80">Risk-free trading</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span>📊</span>
                      </div>
                      <p className="text-white/80">Real market data</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">Virtual Portfolio Value</span>
                    <span className="text-green-400 font-semibold">$100,000</span>
                  </div>
                  <p className="text-white/60 text-sm">Start trading with virtual cash and track your progress</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Subtle Animated Background Elements */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </motion.div>
    </section>
  );
};

export default Hero; 