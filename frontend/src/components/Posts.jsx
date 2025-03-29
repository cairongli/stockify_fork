'use client';
import React, { useState } from 'react';
import PostSubmissionForm from './PostSubmissionForm';
import PostList from './PostList';

const Posts = () => {
  const handlePostSubmit = async (content) => {
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
        <PostSubmissionForm onSubmit={handlePostSubmit} />
      </div>
      <PostList onFollow={handleFollow} />
    </div>
  );
};

export default Posts; 