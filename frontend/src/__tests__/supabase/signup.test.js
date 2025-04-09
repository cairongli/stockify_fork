import { mockSupabase, mockUser, resetMocks } from '../helpers/supabaseTestClient';

describe('Auth - Signup', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('sign up new user with no error', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const fromMock = jest.fn().mockReturnValue({
      insert: insertMock
    });
    mockSupabase.from = fromMock;

    const { data, error } = await mockSupabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'http://localhost:3000/login?redirect=/',
      },
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'http://localhost:3000/login?redirect=/',
      },
    });
    expect(error).toBeNull();
    expect(data.user.id).toBe('test-user');

    // Create a profile for the user
    const { error: profileError } = await mockSupabase
      .from('profiles')
      .insert([{ user_id: data.user.id, wallet_amt: 10000.0, user_name: data.user.user_metadata.name }]);

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(insertMock).toHaveBeenCalledWith([
      { 
        user_id: mockUser.id, 
        wallet_amt: 10000.0, 
        user_name: mockUser.user_metadata.name 
      }
    ]);
  });
});
