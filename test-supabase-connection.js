const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vetdgmbmaiplqgythprf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldGRnbWJtYWlwbHFneXRocHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgxMTA4MywiZXhwIjoyMDc0Mzg3MDgzfQ.OUt_qQvnWYlHlb4hdrvfkmT1l7zE5JMpMWldgWonAUk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    console.log('Users from Supabase:')
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    
  } catch (err) {
    console.error('Connection error:', err)
  }
}

testConnection()
