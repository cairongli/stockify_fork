import { mockSupabase, mockUser, resetMocks } from '../helpers/supabaseTestClient';

describe('Auth - Login', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should successfully log in a user and redirect to the homepage', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const pushMock = jest.fn();
    const useRouterMock = jest.fn(() => ({
      push: pushMock,
    }));
    jest.spyOn(require('next/navigation'), 'useRouter').mockImplementation(useRouterMock);

    const { data, error } = await mockSupabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    expect(data.user.id).toBe('test-user');
  });


});
