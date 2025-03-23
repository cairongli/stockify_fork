'use client';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import {supabase} from '@/config/supabaseClient';

export default function Home() {
  console.log(supabase)
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
