import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'
import {
  createTicket,
  createTicketSchema,
  isSupabaseConfigured,
  listTicketsInMemory,
} from '@/lib/tickets-service'

// GET /api/tickets - List tickets
export async function GET(request: NextRequest) {
  try {
    const supabaseEnabled = isSupabaseConfigured()

    if (!supabaseEnabled) {
      const memoryTickets = listTicketsInMemory()
      console.log('GET /api/tickets called - using development mode (in-memory)')
      return NextResponse.json({
        tickets: memoryTickets,
        total: memoryTickets.length,
        page: 1,
        limit: 20,
        pagination: {
          pages: Math.ceil(memoryTickets.length / 20),
        },
      })
    }

    // Production mode - use Supabase
    console.log('GET /api/tickets called - using Supabase')
    const supabase = createServerSupabaseClient()

    // Identify requester (header X-User-Id) and resolve role server-side
    const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id') || null

    // Resolve role from DB when possible; also consider header as hint (for admin/bi)
    let resolvedRole: string | null = null
    let requesterName: string | null = null
    let requesterEmail: string | null = null
    const hintedRole = (request.headers.get('x-user-role') || request.headers.get('X-User-Role') || '')
      .toString()
      .toLowerCase()
    if (userId) {
      const { data: roleRow } = await supabase
        .from('users')
        .select('role, name, email')
        .eq('id', userId)
        .maybeSingle()
      resolvedRole = (roleRow as any)?.role ?? null
      requesterName = (roleRow as any)?.name ?? null
      requesterEmail = (roleRow as any)?.email ?? null
    }
    // Compute effective role:
    // - If DB says admin/bi/requester, use that
    // - Else if header hints admin/bi, use that
    // - Else default to requester (safe default)
    const effectiveRole = resolvedRole
      ? resolvedRole
      : (hintedRole === 'admin' || hintedRole === 'bi')
        ? hintedRole
        : 'requester'

    let ticketsData: any[] | null = null
    let error: any = null

    if (userId && effectiveRole === 'requester') {
      // 1) Tickets criados pelo utilizador
      const { data: mine, error: e1 } = await supabase
        .from('tickets')
        .select(`
          *,
          created_by_user:users!tickets_created_by_fkey(name, email),
          gestor:users!tickets_gestor_id_fkey(name, email)
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (e1) error = e1

      // 1b) Tickets onde "pedido_por" corresponde ao utilizador
      let byRequester: any[] = []
      const pedidoPorValues = [requesterName, requesterEmail].filter(Boolean)
      if (pedidoPorValues.length > 0) {
        const { data: requested, error: e1b } = await supabase
          .from('tickets')
          .select(`
            *,
            created_by_user:users!tickets_created_by_fkey(name, email),
            gestor:users!tickets_gestor_id_fkey(name, email)
          `)
          .in('pedido_por', pedidoPorValues as any)
          .order('created_at', { ascending: false })
        if (e1b && !error) error = e1b
        byRequester = requested || []
      }

      // 2) Tickets onde o utilizador tem subtarefas atribuÃ­das
      const { data: mySubs, error: e2 } = await supabase
        .from('subtickets')
        .select('ticket_id')
        .eq('assignee_bi_id', userId)

      if (e2 && !error) error = e2

      const ticketIdsFromSubs = Array.from(new Set((mySubs || []).map((s: any) => s.ticket_id)))

      // 3) Tickets onde o utilizador e gestor
      const { data: managed, error: e4 } = await supabase
        .from('tickets')
        .select(`
          *,
          created_by_user:users!tickets_created_by_fkey(name, email),
          gestor:users!tickets_gestor_id_fkey(name, email)
        `)
        .eq('gestor_id', userId)
        .order('created_at', { ascending: false })
      if (e4 && !error) error = e4

      // 4) Tickets onde o utilizador e interessado (watcher)
      const { data: watchRows, error: e5 } = await supabase
        .from('ticket_watchers')
        .select('ticket_id')
        .eq('user_id', userId)
      if (e5 && !error) error = e5
      const ticketIdsFromWatch = Array.from(new Set((watchRows || []).map((w: any) => w.ticket_id)))
      

      let byAssigned: any[] = []
      if (ticketIdsFromSubs.length > 0) {
        const { data: extra, error: e3 } = await supabase
          .from('tickets')
          .select(`
            *,
            created_by_user:users!tickets_created_by_fkey(name, email),
            gestor:users!tickets_gestor_id_fkey(name, email)
          `)
          .in('id', ticketIdsFromSubs)
          .order('created_at', { ascending: false })
        if (e3 && !error) error = e3
        byAssigned = extra || []
      }

      let byWatched: any[] = []
      if (ticketIdsFromWatch.length > 0) {
        const { data: extraW, error: e6 } = await supabase
          .from('tickets')
          .select(`
            *,
            created_by_user:users!tickets_created_by_fkey(name, email),
            gestor:users!tickets_gestor_id_fkey(name, email)
          `)
          .in('id', ticketIdsFromWatch)
          .order('created_at', { ascending: false })
        if (e6 && !error) error = e6
        byWatched = extraW || []
      }

      const combined = [...(mine || []), ...byRequester, ...byAssigned, ...(managed || []), ...byWatched]
      // dedupe by id
      const seen = new Set<string>()
      ticketsData = combined.filter((t: any) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    } else {
      // Admin/BI or unknown: return all
      const { data, error: e } = await supabase
        .from('tickets')
        .select(`
          *,
          created_by_user:users!tickets_created_by_fkey(name, email),
          gestor:users!tickets_gestor_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
      error = e
      ticketsData = data as any[] | null
    }
    
    if (error) {
      console.error('Error fetching tickets from Supabase:', error)
      return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      tickets: ticketsData || [], 
      total: ticketsData?.length || 0, 
      page: 1, 
      limit: 20,
      pagination: {
        pages: Math.ceil((ticketsData?.length || 0) / 20)
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tickets - Create ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = createTicketSchema.parse(body)

    const { ticket } = await createTicket(validatedData)

    return NextResponse.json(ticket, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Error creating ticket:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 },
    )
  }
}








