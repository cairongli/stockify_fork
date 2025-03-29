'use client';

import { useState } from 'react';

export default function PostSubmissionForm({ onPostCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement post creation with Supabase
    onPostCreated({
      id: Date.now(),
      ...formData,
      author: 'User', // TODO: Get actual user name
      created_at: new Date().toISOString()
    });
    setFormData({ title: '', content: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Content
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows="4"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Post
      </button>
    </form>
  );
} 