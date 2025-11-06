import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireBIOrAdmin } from '@/lib/auth'

// GET /api/users/bi - List BI users
export async function GET(request: NextRequest) {
  try {
    await requireBIOrAdmin()
    const supabase = createServerSupabaseClient()
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .in('role', ['bi', 'admin'])
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Error fetching BI users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
