'use client';

import { format } from 'date-fns';

export default function PostCard({ post }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{post.content}</p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>By {post.author}</span>
          <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
} 