'use client';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import {supabase} from '@/config/supabaseClient';
import { useEffect, useState } from 'react';
export default function Home() {
  //This is where we will store the user session
  const [user, setUser] = useState(null);

  useEffect(() =>{
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error.message);
        return;
      }
      if (data?.session?.user) {
        setUser(data.session.user);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)});

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar user={user} />
      {user ? (
        <>
        <Footer />
        <h1>LOGGED IN {user.email}</h1>
        </>
        
      ) : (
        <>
        <Hero />
        <Features />
        <Footer />
        </>
      )}
      
    </div>
  );
}
