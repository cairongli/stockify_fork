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

    const insertMock = jest.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({ insert: insertMock });

    const { data, error } = await mockSupabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalled();
    expect(data.user.id).toBe('test-user');

    expect(insertMock).toHaveBeenCalledWith([
      { user_id: mockUser.id, wallet_amt: 10000.0, user_name: 'Test User' }
    ]);
  });
});
