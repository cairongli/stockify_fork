'use client';
import Posts from '@/components/Posts';

const PostsPage = () => {
  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Posts />
        </div>
      </main>
    </>
  );
};

export default PostsPage; 