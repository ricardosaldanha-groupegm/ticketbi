import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vetdgmbmaiplqgythprf.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldGRnbWJtYWlwbHFneXRocHJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE3NDgwMCwiZXhwIjoyMDUwNzM0ODAwfQ'

// Server-side Supabase client
export const createServerSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
