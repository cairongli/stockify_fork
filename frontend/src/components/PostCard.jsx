'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/config/supabaseClient';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PostCard = ({ post, onFollow, isFollowing }) => {
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsCurrentUser(user?.id === post.author_id);
    };
    checkCurrentUser();
  }, [post.author_id]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'America/New_York'
    });
  };

  const handleFollowClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login?redirect=/posts');
      return;
    }
    onFollow(post.author_id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{post.author_name}</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created at {formatTime(post.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={handleFollowClick}
          disabled={isCurrentUser}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            isCurrentUser
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : isFollowing
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isCurrentUser ? 'Your Post' : isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-lg leading-relaxed">
        {post.content}
      </div>
    </motion.div>
  );
};

export default PostCard; 