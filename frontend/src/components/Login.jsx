'use client';
import { useState } from 'react';
import { supabase } from '@/config/supabaseClient';
import { redirect, useRouter } from 'next/navigation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const router = useRouter();

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
        router.push('/')
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
