import { createServerSupabaseClient } from '@/lib/supabase-server'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...')
  
  try {
    const supabase = createServerSupabaseClient()
    
    // Test connection by trying to get users
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('Users count:', data)
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}

testSupabaseConnection().catch(console.error)
