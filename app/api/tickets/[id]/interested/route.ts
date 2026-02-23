import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { createAuthUser, AuthUser } from '@/lib/rbac'
import { z } from 'zod'

const updateSchema = z.object({ users: z.array(z.string()) })

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('ticket_watchers')
      .select('user_id, users:users!ticket_watchers_user_id_fkey(id, name, email, role)')
      .eq('ticket_id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const users = (data || []).map((row: any) => row.users).filter(Boolean)
    return NextResponse.json({ users })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    // Resolve utilizador a partir do header (cliente) ou auth do servidor
    let me: AuthUser | null = null
    const headerUserId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
    if (headerUserId) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', headerUserId)
        .maybeSingle()
      if (dbUser) me = createAuthUser(dbUser as any)
    }
    if (!me) {
      me = await requireAuth()
    }

    const { data: ticket } = await supabase.from('tickets').select('gestor_id').eq('id', params.id).maybeSingle()
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    const gestorId = (ticket as any)?.gestor_id as string | null | undefined
    if (!(me.role === 'admin' || (me.role === 'bi' && gestorId === me.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { users } = updateSchema.parse(body)

    const { error: delErr } = await supabase.from('ticket_watchers').delete().eq('ticket_id', params.id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
    if (users.length === 0) return NextResponse.json({ users: [] })

    // Normalize UUIDs (trim whitespace) and dedupe
    const userIds = Array.from(new Set(users.map((u: string) => (u && typeof u === 'string' ? u.trim() : '').toLowerCase()).filter(Boolean)))

    // Validate that all user_ids exist in users table (prevents FK violation)
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .in('id', userIds)
    const validIds = new Set((existingUsers || []).map((u: any) => (u?.id || '').toLowerCase()))
    const invalidIds = userIds.filter((uid: string) => !validIds.has(uid))
    if (invalidIds.length > 0) {
      console.warn('[interested] Invalid user ids (not in users table):', invalidIds)
      return NextResponse.json(
        {
          error:
            'Um ou mais utilizadores selecionados não existem na base de dados. Atualize a página e volte a selecionar.',
        },
        { status: 400 }
      )
    }

    // Use original case from DB for insert (Postgres UUID is case-insensitive but keep consistency)
    const idMap = new Map((existingUsers || []).map((u: any) => [(u?.id || '').toLowerCase(), u.id]))
    const rows = userIds.map((uid: string) => ({
      ticket_id: params.id,
      user_id: idMap.get(uid) || uid,
    }))

    const { data, error } = await (supabase as any)
      .from('ticket_watchers')
      .insert(rows as any)
      .select('user_id')
    if (error) {
      console.error('[interested] Insert error:', error)
      const isFk = (error.message || '').toLowerCase().includes('foreign key')
      return NextResponse.json(
        { error: isFk ? 'Um ou mais utilizadores não existem na base de dados. Atualize a página e tente novamente.' : error.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ users: data?.map((r: any) => r.user_id) || [] })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
