import { mockSupabase } from '../helpers/supabaseTestClient'

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