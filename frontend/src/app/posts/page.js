'use client';

import { useState, useEffect } from 'react';
import PostList from '@/components/posts/PostList';
import PostSubmissionForm from '@/components/posts/PostSubmissionForm';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Posts</h1>
      <PostSubmissionForm onPostCreated={(newPost) => setPosts([newPost, ...posts])} />
      <PostList posts={posts} />
    </div>
  );
} 