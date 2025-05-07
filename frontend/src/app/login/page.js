'use client';

import { Suspense } from 'react';
import Login from '@/components/Login';

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Login />
    </Suspense>
  );
};

export default LoginPage;