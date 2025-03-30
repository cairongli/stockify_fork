'use client';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Layout from '@/components/Layout';
export default function Home() {


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
