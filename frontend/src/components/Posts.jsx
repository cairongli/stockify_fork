'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabaseClient';
import PostSubmissionForm from './PostSubmissionForm';
import PostList from './PostList';
import { globalUser } from '@/config/UserContext';

const Posts = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const currentUser = globalUser();

  useEffect(() => {
    setUser(currentUser);
  }, [currentUser]);

  const handlePostSubmit = async (content) => {
    if (!user) {
      router.push('/login?redirect=/posts');
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Dispatch custom event to refresh posts
      window.dispatchEvent(new Event('postCreated'));
    } catch (error) {
      console.error('Error creating post:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleFollow = async (userId) => {
    if (!user) {
      router.push('/login?redirect=/posts');
      return;
    }
    // TODO: Implement follow functionality
    console.log('Following user:', userId);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Community Posts
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Share your thoughts and connect with other traders
            </p>
          </div>
        </div>
        {user ? (
          <PostSubmissionForm onSubmit={handlePostSubmit} />
        ) : (
          <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg">
              Join our community to create posts and follow other traders
            </p>
            <button
              onClick={() => router.push('/login?redirect=/posts')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              Log In to Post
            </button>
          </div>
        )}
      </div>
      <PostList onFollow={handleFollow} user={user} />
    </div>
  );
};

export default Posts; 