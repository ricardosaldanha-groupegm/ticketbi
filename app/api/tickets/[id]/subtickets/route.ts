import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { canReadTicket, canCreateSubticket } from '@/lib/rbac'
import { z } from 'zod'

const createSubticketSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  assignee_bi_id: z.string().min(1),
  urgencia: z.number().min(1).max(3).default(1),
  importancia: z.number().min(1).max(3).default(1),
  data_inicio: z.string().optional(),
  data_inicio_planeado: z.string().optional(),
  data_esperada: z.string().optional(),
  data_conclusao: z.string().optional(),
  estado: z.enum(['novo', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado', 'Aguardando 3ºs', 'Standby']).optional(),
})

// GET /api/tickets/[id]/subtickets - List subtickets for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - return empty array
      console.log('GET /api/tickets/[id]/subtickets called - using development mode')
      return NextResponse.json([])
    }

    // Production mode - use Supabase with auth (tolerate no-session)
    const user = await getCurrentUser()
    const supabase = createServerSupabaseClient()
    const skipPermissions = !user
    
    // First check if user can read the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!skipPermissions && !canReadTicket(user, ticket)) {
      let allow = false
      const { data: w } = await supabase
        .from('ticket_watchers')
        .select('user_id')
        .eq('ticket_id', params.id)
        .eq('user_id', user!.id)
      if (w && w.length > 0) allow = true
      if (!allow) {
        const { data: myAssign } = await supabase
          .from('subtickets')
          .select('id')
          .eq('ticket_id', params.id)
          .eq('assignee_bi_id', user!.id)
        if (myAssign && myAssign.length > 0) allow = true
      }
      if (!allow) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get subtickets
    const { data: subtickets, error } = await supabase
      .from('subtickets')
      .select(`
        *,
        assignee:users!subtickets_assignee_bi_id_fkey(name, email)
      `)
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(subtickets || [])
  } catch (error) {
    console.error('Error fetching subtickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tickets/[id]/subtickets - Create new subticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Development mode short-circuit (no Supabase configured)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      const body = await request.json()
      return NextResponse.json({
        id: 'dev-' + Math.random().toString(36).slice(2),
        ticket_id: params.id,
        titulo: body?.titulo ?? '',
        descricao: body?.descricao ?? null,
        assignee_bi_id: body?.assignee_bi_id ?? null,
        estado: body?.estado ?? 'novo',
        urgencia: body?.urgencia ?? 1,
        importancia: body?.importancia ?? 1,
        prioridade: (body?.urgencia ?? 1) * (body?.importancia ?? 1),
        data_inicio: body?.data_inicio ?? null,
        data_inicio_planeado: body?.data_inicio_planeado ?? null,
        data_esperada: body?.data_esperada ?? null,
        data_conclusao: body?.data_conclusao ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: { name: 'Utilizador', email: 'dev@example.com' }
      }, { status: 201 })
    }

    const user = await getCurrentUser()
    const supabase = createServerSupabaseClient()
    const skipPermissions = !user
    
    const body = await request.json()
    const validatedData = createSubticketSchema.parse(body)

    // First check if user can read the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!skipPermissions && !canCreateSubticket(user, ticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify assignee exists (allow any role)
    const { data: assignee, error: assigneeError } = await supabase
      .from('users')
      .select('id')
      .eq('id', validatedData.assignee_bi_id)
      .single()

    if (assigneeError || !assignee) {
      return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 })
    }

    const normalized = {
      ...validatedData,
      data_inicio: validatedData.data_inicio && validatedData.data_inicio.trim() !== '' ? validatedData.data_inicio : null,
      data_inicio_planeado:
        validatedData.data_inicio_planeado && validatedData.data_inicio_planeado.trim() !== ''
          ? validatedData.data_inicio_planeado
          : null,
      data_esperada: validatedData.data_esperada && validatedData.data_esperada.trim() !== '' ? validatedData.data_esperada : null,
      data_conclusao: validatedData.data_conclusao && validatedData.data_conclusao.trim() !== '' ? validatedData.data_conclusao : null,
    }

    const subticketData = {
      ...normalized,
      ticket_id: params.id,
    }

    const { data: subticket, error } = await (supabase as any)
      .from('subtickets')
      .insert(subticketData as any)
      .select(`
        *,
        assignee:users!subtickets_assignee_bi_id_fkey(name, email)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(subticket, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating subticket:', error)
    const message = (error as any)?.message || 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}





