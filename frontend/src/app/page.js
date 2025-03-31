'use client';
<<<<<<< HEAD
import Hero from '../components/Hero';
import Features from '../components/Features';
import Layout from '@/components/Layout';
import { globalUser } from '@/config/UserContext';
export default function Home() {
=======

import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabaseClient';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
  }, []);
>>>>>>> main

  const user = globalUser();
  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {user ? (
        <>
        <h1>LOGGED IN {user.email}</h1>
        </>
        
      ) : (
        <>
        <Hero />
        <Features />
        </>
      )}
      
    </div>
=======
    <main className="min-h-screen bg-black">
      <Navbar user={user} />
      <Hero user={user} />
      <Features />
      <Footer />
    </main>
>>>>>>> main
  );
}
