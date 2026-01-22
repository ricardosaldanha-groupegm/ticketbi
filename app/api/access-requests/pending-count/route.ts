import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAllAccessRequests } from '@/lib/dev-storage'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - count in-memory data
      const allRequests = getAllAccessRequests()
      const pendingCount = allRequests.filter(req => req.status === 'pending').length
      return NextResponse.json({ count: pendingCount })
    }
    
    // Production mode - use Supabase
    try {
      const supabase = createServerSupabaseClient()
      
      // Check if access_requests table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('access_requests')
        .select('id')
        .limit(1)
      
      if (tableError) {
        // Fallback to dev storage
        const allRequests = getAllAccessRequests()
        const pendingCount = allRequests.filter(req => req.status === 'pending').length
        return NextResponse.json({ count: pendingCount })
      }
      
      // Count pending requests
      const { count, error } = await supabase
        .from('access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      if (error) {
        console.error('Error counting pending requests:', error)
        return NextResponse.json({ count: 0 })
      }
      
      return NextResponse.json({ count: count || 0 })
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError)
      // Fallback to dev storage
      const allRequests = getAllAccessRequests()
      const pendingCount = allRequests.filter(req => req.status === 'pending').length
      return NextResponse.json({ count: pendingCount })
    }
  } catch (error) {
    console.error('Error in GET pending count:', error)
    return NextResponse.json({ count: 0 })
  }
}
