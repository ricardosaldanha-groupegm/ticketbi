import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vetdgmbmaiplqgythprf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldGRnbWJtYWlwbHFneXRocHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxNzQ4MDAsImV4cCI6MjA1MDczNDgwMH0'

// Client-side Supabase client for components
export const createClientSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
