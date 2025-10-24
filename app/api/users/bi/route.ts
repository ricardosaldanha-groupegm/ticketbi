import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/users/bi - List BI users
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    // Header-based auth resolution (to work with client-only auth)
    const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
    let role: string | null = null
    if (userId) {
      const { data } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
      role = (data as any)?.role ?? null
    }
    const hinted = (request.headers.get('x-user-role') || request.headers.get('X-User-Role') || '').toString().toLowerCase()
    const effective = role ?? (hinted === 'admin' || hinted === 'bi' ? hinted : null)
    if (effective !== 'admin' && effective !== 'bi') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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
