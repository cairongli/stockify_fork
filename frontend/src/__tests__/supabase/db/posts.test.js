import { 
  mockSupabaseDb, 
  mockPosts, 
  mockSuccessfulResponse, 
  mockErrorResponse,
  resetMockSupabaseDb 
} from '../../helpers/supabaseDbTestClient';

describe('Posts Database Operations', () => {
  beforeEach(() => {
    resetMockSupabaseDb();
  });

  describe('Fetch Posts', () => {
    it('should fetch all posts', async () => {
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse(mockPosts));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(mockPosts);
    });

    it('should fetch posts by user_id', async () => {
      const userId = 'test-user-1';
      const userPosts = mockPosts.filter(post => post.user_id === userId);
      
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse(userPosts));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .select()
        .eq('user_id', userId)
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(userPosts);
    });

    it('should handle no posts found', async () => {
      const userId = 'non-existent-user';
      
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse([]));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .select()
        .eq('user_id', userId)
        .single();

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe('Create Post', () => {
    it('should create a new post', async () => {
      const newPost = {
        user_id: 'test-user-1',
        title: 'New Test Post',
        content: 'This is a new test post',
        created_at: new Date().toISOString()
      };
      
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse(newPost));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .insert([newPost])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(newPost);
    });

    it('should handle creation errors', async () => {
      const invalidPost = {
        // Missing required fields
        title: 'Invalid Post'
      };
      
      mockSupabaseDb.setMockResponse(
        mockErrorResponse('null value in column "user_id" violates not-null constraint')
      );

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .insert([invalidPost])
        .select()
        .single();

      expect(data).toBeNull();
      expect(error.message).toContain('null value in column "user_id"');
    });
  });

  describe('Update Post', () => {
    it('should update a post', async () => {
      const postId = 1;
      const updatedContent = 'Updated content for test post';
      
      mockSupabaseDb.setMockResponse(
        mockSuccessfulResponse({ ...mockPosts[0], content: updatedContent })
      );

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .update({ content: updatedContent })
        .eq('id', postId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.content).toBe(updatedContent);
    });

    it('should handle update errors', async () => {
      const postId = 999; // Non-existent post
      
      mockSupabaseDb.setMockResponse(mockErrorResponse('Post not found'));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .update({ content: 'Updated content' })
        .eq('id', postId)
        .select()
        .single();

      expect(data).toBeNull();
      expect(error.message).toBe('Post not found');
    });
  });

  describe('Delete Post', () => {
    it('should delete a post', async () => {
      const postId = 1;
      
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse({ id: postId }));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .delete()
        .eq('id', postId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.id).toBe(postId);
    });

    it('should handle delete errors', async () => {
      const postId = 999; // Non-existent post
      
      mockSupabaseDb.setMockResponse(mockErrorResponse('Post not found'));

      const { data, error } = await mockSupabaseDb
        .from('posts')
        .delete()
        .eq('id', postId)
        .select()
        .single();

      expect(data).toBeNull();
      expect(error.message).toBe('Post not found');
    });
  });
}); 