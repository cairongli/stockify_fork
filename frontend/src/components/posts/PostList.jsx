'use client';

import PostCard from './PostCard';

export default function PostList({ posts }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No posts yet. Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
} 