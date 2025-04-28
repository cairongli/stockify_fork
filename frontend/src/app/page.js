'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabaseClient';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
  }, []);

  return (
    <main className="min-h-screen bg-black">
      <Navbar user={user} />
      <Hero user={user} />
      <Features />
    </main>
  );
}
