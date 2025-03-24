'use client';
import { useState } from 'react';
import { supabase } from '@/config/supabaseClient';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  async function signUpNewUser(e) {
    e.preventDefault(); 
    try {
      const { data: userData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: 'http://localhost:3000/login',
        },
      });

      if (error) {
        console.error('Error during sign-up:', error.message);
        return;
      }

      if (userData) {
        console.log('User signed up successfully:', userData);
        alert("Verify Email To Continue. If You Don't See An Email, Check Spam Folder");

        const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ user_id: userData.user.id, wallet_amt: 10000.0 }]);
      
        if (profileError) {
          console.error('Error creating profile:', profileError.message);
        } else {
          console.log('Profile created successfully');
        }
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
      <form onSubmit={signUpNewUser}>
        <label>Email</label>
        <input type='text' name='email' value={formData.email} onChange={handleChange} />
        
        <label>Password</label>
        <input type='password' name='password' value={formData.password} onChange={handleChange} />
        
        <button type='submit'>Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;
