//Mock Supabase client for unit tests
export const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    signUp: jest.fn(), 
    signInWithPassword: jest.fn(), 
    signIn: jest.fn(), 
    signOut: jest.fn(),
  },
};

// Test data utilities
export const mockPosts = [
  {
    id: 1,
    content: 'First post',
    author_name: 'User 1',
    author_id: '123',
    created_at: '2024-03-28T12:00:00Z'
  },
  {
    id: 2,
    content: 'Second post',
    author_name: 'User 2',
    author_id: '456',
    created_at: '2024-03-28T11:00:00Z'
  }
];

export const mockUser = {
  id: 'test-user',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User'
  }
};

// Test utility functions
export const setupMockSupabase = () => {
  jest.mock('@/config/supabaseClient', () => ({
    supabase: mockSupabase
  }));
};

export const setupMockUser = (isLoggedIn = true) => {
  jest.mock('@/config/UserContext', () => ({
    globalUser: jest.fn().mockReturnValue(isLoggedIn ? mockUser : null)
  }));
};

// Reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();
  mockSupabase.from.mockClear();
  mockSupabase.auth.getUser.mockClear();
  mockSupabase.auth.signIn.mockClear();
  mockSupabase.auth.signOut.mockClear();
}; 