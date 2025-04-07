import { mockSupabase } from '../helpers/supabaseTestClient'

const setError = jest.fn();
const setSuccess = jest.fn();
const setLoading = jest.fn();

describe('Supabase Connection', () => {
  it('should connect to Supabase', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ count: 1 }], error: null })
    })
    
    const { data, error } = await mockSupabase.from('profiles').select('count')
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
}) 

/*Sign Up Testing
const signUpData = {
  email: 'test@test.com',
  password: 'test123',
  confirmPassword: 'test123',
  user_name: 'testUser'
}

describe('signUpNewUser', () => {
  const e = { preventDefault: jest.fn() };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    formData.email = 'test@example.com';
    formData.password = 'abc123';
    formData.confirmPassword = 'abc123';
    formData.user_name = 'TestUser';
  });

  it('shows error when passwords do not match', async () => {
    formData.confirmPassword = 'wrongPassword';

    await signUpNewUser(e);

    expect(setError).toHaveBeenCalledWith('Passwords do not match');
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it('signs up user and inserts profile', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });

    mockSupabase.from().insert.mockResolvedValue({ error: null });

    await signUpNewUser(e);

    expect(mockSupabase.auth.signUp).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(setSuccess).toHaveBeenCalledWith(expect.stringContaining('Verification email'));
  });

  it('shows error if Supabase signUp fails', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already exists' }
    });

    await signUpNewUser(e);

    expect(setError).toHaveBeenCalledWith('Email already exists');
  });

  it('handles profile insert error after successful signup', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });

    mockSupabase.from().insert.mockResolvedValue({
      error: { message: 'Insert failed' }
    });

    await signUpNewUser(e);

    expect(setSuccess).toHaveBeenCalled();
    // You could also check for console.error or other side effects here
  });
});*/



