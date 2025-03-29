'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const redirectTo = searchParams.get('redirect') || '/';
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [router, searchParams]);

  async function login(e) {
    e.preventDefault(); 
    try {
      const { data: userData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        alert('Error during login:', error.message);
        return;
      }

      if(userData){
        const redirectTo = searchParams.get('redirect') || '/';
        router.push(redirectTo);
      }

    } catch (err) {
      console.error('Unexpected error:', err);
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
    <div>
      <form onSubmit={login}>
        <label>Email</label>
        <input type='text' name='email' value={formData.email} onChange={handleChange} />
        
        <label>Password</label>
        <input type='password' name='password' value={formData.password} onChange={handleChange} />
        
        <button type='submit'>Log in</button>
      </form>
    </div>
  );
};

export default Login;
