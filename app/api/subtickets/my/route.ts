import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import type { Database } from '@/lib/supabase'

// GET /api/subtickets/my - list subtickets where current user is assignee
async function resolveAuthUser(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const headerUserId = request.headers.get('x-user-id')
  if (headerUserId) {
    const { data, error } = await supabase
      .from<Database['public']['Tables']['users']['Row']>('users')
      .select('*')
      .eq('id', headerUserId)
      .single()
    if (data && !error) return data
  }
  const current = await getCurrentUser()
  // current may be null in dev; return as-is
  return current as any
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // In dev mode without Supabase configured, allow header-based identity and return empty list
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      const headerUserId = request.headers.get('x-user-id')
      if (!headerUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json([])
    }

    const current = await resolveAuthUser(request)
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('subtickets')
      .select(`
        *,
        assignee:users!subtickets_assignee_bi_id_fkey(name, email),
        ticket:tickets!subtickets_ticket_id_fkey(assunto)
      `)
      .eq('assignee_bi_id', (current as any).id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching my subtickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
