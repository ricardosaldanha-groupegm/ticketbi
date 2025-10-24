﻿import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { canReadTicket, canEditTicket, canDeleteTicket, createAuthUser, AuthUser } from '@/lib/rbac'
import { z } from 'zod'

const updateTicketSchema = z.object({
  descricao: z.string().min(1, 'Campo obrigat��rio'),
  objetivo: z.string().min(1, 'Campo obrigat��rio'),
  internal_notes: z.string().optional(),
  urgencia: z.number().min(1).max(3).optional(),
  importancia: z.number().min(1).max(3).optional(),
})

// GET /api/tickets/[id] - Get single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - return mock ticket so UI can render
      console.log('GET /api/tickets/[id] called - using development mode')
      return NextResponse.json({
        id: params.id,
        created_by: null,
        gestor_id: null,
        estado: 'novo',
        pedido_por: 'Utilizador Dev',
        data_pedido: new Date().toISOString(),
        assunto: 'Ticket de Desenvolvimento',
        descricao: 'Este Ã© um ticket simulado para desenvolvimento.',
        urgencia: 1,
        importancia: 1,
        prioridade: 1,
        data_esperada: null,
        sla_date: null,
        internal_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_user: { name: 'Utilizador', email: 'dev@example.com' },
        gestor: null
      })
    }

    // Use Supabase and enforce access control
    const supabase = createServerSupabaseClient()

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(name, email),
        gestor:users!tickets_gestor_id_fkey(name, email)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Resolve current user from header X-User-Id (client-side auth) or deny
    const headerUserId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
    if (!headerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role, email, name')
      .eq('id', headerUserId)
      .maybeSingle()
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const dbu: any = dbUser as any
    const user = {
      id: dbu.id as string,
      role: (dbu.role as 'admin' | 'bi' | 'requester'),
      name: dbu.name as string,
      email: dbu.email as string,
    }

    // Access rules: admin/bi full access; creator; gestor; watcher; assigned in subtarefas
    let allowed = false
    if (user.role === 'admin' || user.role === 'bi') allowed = true
    if (!allowed && ticket.created_by === user.id) allowed = true
    if (!allowed && (ticket as any).gestor_id === user.id) allowed = true
    if (!allowed) {
      const { data: w } = await supabase
        .from('ticket_watchers')
        .select('user_id')
        .eq('ticket_id', params.id)
        .eq('user_id', user.id)
      if (w && w.length > 0) allowed = true
    }
    if (!allowed) {
      const { data: subs } = await supabase
        .from('subtickets')
        .select('id')
        .eq('ticket_id', params.id)
        .eq('assignee_bi_id', user.id)
      if (subs && subs.length > 0) allowed = true
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tickets/[id] - Update ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const keys = Object.keys(body || {})
    const gestorOnly = keys.length === 1 && keys[0] === 'gestor_id'
    const validatedData = gestorOnly ? {} : updateTicketSchema.parse(body)
    // Suporte a atualizacao de gestor_id em separado do schema (para nao quebrar dev)
    const hasGestorUpdate = Object.prototype.hasOwnProperty.call(body, 'gestor_id')
    const nextGestorId = hasGestorUpdate ? (body.gestor_id ?? null) : undefined

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      const now = new Date().toISOString()
      const mockCurrent = {
        id: params.id,
        created_by: null,
        gestor_id: null,
        estado: 'novo',
        pedido_por: 'Utilizador Dev',
        data_pedido: now,
        assunto: 'Ticket de Desenvolvimento',
        descricao: 'Este Ǹ um ticket simulado para desenvolvimento.',
        urgencia: 1,
        importancia: 1,
        prioridade: 1,
        data_esperada: null,
        sla_date: null,
        internal_notes: null,
        created_at: now,
        updated_at: now,
        created_by_user: { name: 'Utilizador', email: 'dev@example.com' },
        gestor: null,
      }
      const merged = {
        ...mockCurrent,
        ...validatedData,
        ...(Object.prototype.hasOwnProperty.call(body, 'gestor_id') ? { gestor_id: body.gestor_id ?? null } : {}),
        prioridade: (((validatedData as any) && ('urgencia' in (validatedData as any)) ? (validatedData as any).urgencia : mockCurrent.urgencia) * (((validatedData as any) && ('importancia' in (validatedData as any)) ? (validatedData as any).importancia : mockCurrent.importancia))),
        updated_at: now,
      }
      return NextResponse.json(merged)
    }

    const supabase = createServerSupabaseClient()
    // Resolve user from header (client-side auth) or fallback to server auth
    let user: AuthUser | null = null
    const headerUserId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
    if (headerUserId) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', headerUserId)
        .maybeSingle()
      if (dbUser) user = createAuthUser(dbUser as any)
    }
    if (!user) {
      user = await requireAuth()
    }

    // Get current ticket
    const { data: currentTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions
    const fieldsToUpdate = Object.keys(validatedData)
    if (hasGestorUpdate && fieldsToUpdate.length === 0) {
      // Apenas a atribuicao de gestor
      // Validar que novo gestor existe (ou null para limpar)
      let validManager = true
      if (nextGestorId) {
        const { data: manager, error: mgrErr } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', nextGestorId)
          .in('role', ['bi', 'admin'])
          .maybeSingle()
        validManager = !!manager && !mgrErr
      }
      if (!validManager) {
        return NextResponse.json({ error: 'Gestor inválido' }, { status: 400 })
      }
      if (user.role !== 'admin' && user.role !== 'bi') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      // Regras normais para outros campos
      if (!canEditTicket(user, currentTicket, fieldsToUpdate)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Se tentar misturar gestor_id com outros campos, apenas admin pode
      if (hasGestorUpdate && fieldsToUpdate.length > 0 && user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update ticket
    const { data: ticket, error } = await (supabase as any)
      .from('tickets')
      .update({
        ...validatedData,
        ...(hasGestorUpdate ? { gestor_id: nextGestorId ?? null } : {}),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', params.id)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(name, email),
        gestor:users!tickets_gestor_id_fkey(name, email)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tickets/[id] - Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      return NextResponse.json({ message: 'Ticket deleted successfully (dev mode)' })
    }

    const user = await requireAuth()
    const supabase = createServerSupabaseClient()
    
    // Get current ticket
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!canDeleteTicket(user, ticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Ticket deleted successfully' })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






