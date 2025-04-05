import { createClient } from '@supabase/supabase-js'

describe('Supabase Connection', () => {
  it('should connect to Supabase', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'your-project-url',
      process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    )
    
    const { data, error } = await supabase.from('profiles').select('count')
    expect(error).toBeNull()
  })
}) 