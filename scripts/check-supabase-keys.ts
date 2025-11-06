// Check if the Supabase keys are valid
const supabaseUrl = 'https://vetdgmbmaiplqgythprf.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldGRnbWJtYWlwbHFneXRocHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNzQ4MDAsImV4cCI6MjA1MDczNDgwMH0'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldGRnbWJtYWlwbHFneXRocHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE3NDgwMCwiZXhwIjoyMDUwNzM0ODAwfQ'

console.log('Testing Supabase keys...')
console.log('URL:', supabaseUrl)
console.log('Anon Key (first 20):', anonKey.substring(0, 20) + '...')
console.log('Service Key (first 20):', serviceKey.substring(0, 20) + '...')

// Test with anon key
fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  }
})
.then(response => {
  console.log('Anon key test - Status:', response.status)
  if (response.ok) {
    console.log('✅ Anon key is valid')
  } else {
    console.log('❌ Anon key is invalid')
  }
})
.catch(error => {
  console.log('❌ Anon key test failed:', error.message)
})

// Test with service key
fetch(`${supabaseUrl}/rest/v1/`, {
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`
  }
})
.then(response => {
  console.log('Service key test - Status:', response.status)
  if (response.ok) {
    console.log('✅ Service key is valid')
  } else {
    console.log('❌ Service key is invalid')
  }
})
.catch(error => {
  console.log('❌ Service key test failed:', error.message)
})
