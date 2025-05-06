'use client';
import Profile from '@/components/Profile';

const ProfilePage = () => {
  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Profile />
        </div>
      </main>
    </>
  );
};

export default ProfilePage; 