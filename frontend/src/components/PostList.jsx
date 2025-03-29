'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PostCard from './PostCard';

const PostList = ({ onFollow }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching posts...');
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      console.log('Fetched posts data:', data);
      setPosts(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for custom event to refresh posts
  useEffect(() => {
    const handlePostCreated = () => {
      console.log('Post created, refreshing posts...');
      fetchPosts();
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div role="status" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading posts: {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onFollow={onFollow}
          isFollowing={false} // TODO: Implement following state
        />
      ))}
      {posts.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No posts yet. Be the first to post!
        </div>
      )}
    </motion.div>
  );
};

export default PostList;