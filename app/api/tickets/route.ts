import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Simple in-memory storage for development (fallback)
let tickets: any[] = []

const createTicketSchema = z.object({
  pedido_por: z.string().min(1),
  assunto: z.string().min(1),
  descricao: z.string().min(1),
  objetivo: z.string().min(1),
  urgencia: z.number().min(1).max(3),
  importancia: z.number().min(1).max(3),
  data_esperada: z.string().optional(),
})

// GET /api/tickets - List tickets
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - use in-memory storage
      console.log('GET /api/tickets called - using development mode (in-memory)')
      return NextResponse.json({ 
        tickets: tickets, 
        total: tickets.length, 
        page: 1, 
        limit: 20,
        pagination: {
          pages: Math.ceil(tickets.length / 20)
        }
      })
    }

    // Production mode - use Supabase
    console.log('GET /api/tickets called - using Supabase')
    const supabase = createServerSupabaseClient()

    // Identify requester (header X-User-Id) and resolve role server-side
    const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id') || null

    // Resolve role from DB when possible; also consider header as hint (for admin/bi)
    let resolvedRole: string | null = null
    const hintedRole = (request.headers.get('x-user-role') || request.headers.get('X-User-Role') || '')
      .toString()
      .toLowerCase()
    if (userId) {
      const { data: roleRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      resolvedRole = (roleRow as any)?.role ?? null
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

      // 2) Tickets onde o utilizador tem subtarefas atribuídas
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
      // 3) Tickets onde o utilizador é gestor
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

      const combined = [...(mine || []), ...byAssigned, ...(managed || [])]
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
    console.log('Request body:', body)
    
    const validatedData = createTicketSchema.parse(body)
    console.log('Validated data:', validatedData)
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - use in-memory storage
      console.log('POST /api/tickets called - using development mode (in-memory)')
      
      const ticket = {
        id: `ticket-${Date.now()}`,
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estado: 'pendente'
      }
      
      tickets.push(ticket)
      console.log('Ticket added to memory:', ticket)
      
      return NextResponse.json(ticket, { status: 201 })
    }

    // Production mode - use Supabase
    console.log('POST /api/tickets called - using Supabase')
    const supabase = createServerSupabaseClient()

    // Map pedido_por (nome) -> created_by (uuid)
    let createdById: string | null = null

    // Try exact match by name
    const { data: userByName } = await supabase
      .from('users')
      .select('id, name')
      .eq('name', validatedData.pedido_por)
      .limit(1)
      .maybeSingle()

    if (((userByName as any)?.id)) {
      createdById = (userByName as any).id
    } else {
      // Fallback: pick an admin user to satisfy NOT NULL in dev
      const { data: adminUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle()
      if (((adminUser as any)?.id)) createdById = (adminUser as any).id
    }

    // Normalize optional date field to null if empty string
    const normalizedDate = validatedData.data_esperada && validatedData.data_esperada.trim() !== ''
      ? validatedData.data_esperada
      : null

    const insertPayload = {
      pedido_por: validatedData.pedido_por,
      assunto: validatedData.assunto,
      descricao: validatedData.descricao,
      objetivo: validatedData.objetivo,
      urgencia: validatedData.urgencia,
      importancia: validatedData.importancia,
      data_esperada: normalizedDate,
      created_by: createdById,
    }

    const { data: ticket, error } = await (supabase as any)
      .from('tickets')
      .insert([insertPayload as any])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating ticket in Supabase:', error)
      return NextResponse.json({ 
        error: 'Error creating ticket', 
        details: error.message 
      }, { status: 500 })
    }
    
    console.log('Ticket created in Supabase:', ticket)
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}







