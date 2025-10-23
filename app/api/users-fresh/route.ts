export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== FRESH USERS API CALL ===')
    
    // Create a completely fresh Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Direct query to Supabase with cache busting
    console.log('Querying users directly from Supabase...')
    
    // Use a simple query with timestamp to force fresh data
    const timestamp = Date.now()
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar utilizadores' },
        { status: 500 }
      )
    }
    
    console.log('Raw users from Supabase:', JSON.stringify(users, null, 2))
    
    // Add is_active field
    const usersWithStatus = users.map(user => ({
      ...user,
      is_active: true
    }))
    
    console.log('Processed users:', JSON.stringify(usersWithStatus, null, 2))
    
    return NextResponse.json({ users: usersWithStatus }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Error in fresh users API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


