import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
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
    const me = await requireAuth()

    const { data: ticket } = await supabase.from('tickets').select('gestor_id').eq('id', params.id).maybeSingle()
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    if (!(me.role === 'admin' || (me.role === 'bi' && ticket.gestor_id === me.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { users } = updateSchema.parse(body)

    const { error: delErr } = await supabase.from('ticket_watchers').delete().eq('ticket_id', params.id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
    if (users.length === 0) return NextResponse.json({ users: [] })

    const rows = users.map((uid: string) => ({ ticket_id: params.id, user_id: uid }))
    const { data, error } = await supabase.from('ticket_watchers').insert(rows).select('user_id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ users: data?.map((r: any) => r.user_id) || [] })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}