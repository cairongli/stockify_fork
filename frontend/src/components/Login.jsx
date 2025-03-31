'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseClient';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data: userData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if(userData) {
        router.push('/');
      }

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back arrow button in top left corner */}
      <motion.div 
        className="absolute top-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-white hover:text-blue-400 transition-colors"
          >
            ← Back
          </motion.button>
        </Link>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20"
      >
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Sign in to your account to continue
          </p>
        </motion.div>

        <motion.form variants={itemVariants} className="mt-8 space-y-6" onSubmit={login}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </motion.button>
          </div>
        </motion.form>

        <motion.div variants={itemVariants} className="text-center">
          <p className="text-sm text-gray-300">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
