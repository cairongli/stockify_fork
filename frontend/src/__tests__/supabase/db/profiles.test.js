import { 
  mockSupabaseDb, 
  mockProfiles, 
  mockSuccessfulResponse, 
  mockErrorResponse,
  resetMockSupabaseDb 
} from '../../helpers/supabaseDbTestClient';

describe('Profiles Database Operations', () => {
  beforeEach(() => {
    resetMockSupabaseDb();
  });

  describe('Fetch Profile', () => {
    it('should fetch a user profile by user_id', async () => {
      const userId = 'test-user-1';
      const mockProfile = mockProfiles[0];
      
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse(mockProfile));

      const { data, error } = await mockSupabaseDb
        .from('profiles')
        .select()
        .eq('user_id', userId)
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(mockProfile);
    });

    it('should handle profile not found', async () => {
      const userId = 'non-existent-user';
      
      mockSupabaseDb.setMockResponse(mockErrorResponse('Profile not found'));

      const { data, error } = await mockSupabaseDb
        .from('profiles')
        .select()
        .eq('user_id', userId)
        .single();

      expect(data).toBeNull();
      expect(error.message).toBe('Profile not found');
    });
  });

  describe('Update Profile', () => {
    it('should update user wallet amount', async () => {
      const userId = 'test-user-1';
      const newAmount = 12000.0;
      
      mockSupabaseDb.setMockResponse(
        mockSuccessfulResponse({ ...mockProfiles[0], wallet_amt: newAmount })
      );

      const { data, error } = await mockSupabaseDb
        .from('profiles')
        .update({ wallet_amt: newAmount })
        .eq('user_id', userId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.wallet_amt).toBe(newAmount);
    });

    it('should handle update errors', async () => {
      const userId = 'test-user-1';
      const newAmount = -1000.0; // Invalid amount
      
      mockSupabaseDb.setMockResponse(mockErrorResponse('Invalid wallet amount'));

      const { data, error } = await mockSupabaseDb
        .from('profiles')
        .update({ wallet_amt: newAmount })
        .eq('user_id', userId)
        .select()
        .single();

      expect(data).toBeNull();
      expect(error.message).toBe('Invalid wallet amount');
    });
  });

  describe('Create Profile', () => {
    it('should create a new user profile', async () => {
      const newProfile = {
        user_id: 'new-user',
        user_name: 'New User',
        wallet_amt: 10000.0
      };
      
      mockSupabaseDb.setMockResponse(mockSuccessfulResponse(newProfile));

      const { data, error } = await mockSupabaseDb
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toEqual(newProfile);
    });

    it('should handle duplicate user_id', async () => {
      const duplicateProfile = {
        user_id: 'test-user-1', // Already exists
        user_name: 'Duplicate User',
        wallet_amt: 10000.0
      };
      
      mockSupabaseDb.setMockResponse(
        mockErrorResponse('duplicate key value violates unique constraint')
      );

      const { data, error } = await mockSupabaseDb
        .from('profiles')
        .insert([duplicateProfile])
        .select()
        .single();

      expect(data).toBeNull();
      expect(error.message).toContain('duplicate key value');
    });
  });
}); 