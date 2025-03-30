'use client';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Layout from '@/components/Layout';
import { globalUser } from '@/config/UserContext';
export default function Home() {

  const user = globalUser();
  return (
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
  );
}
