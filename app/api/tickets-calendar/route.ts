import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isSupabaseConfigured, listTicketsInMemory } from '@/lib/tickets-service'
import { parseDateOnly, formatDateOnly, splitPlanningTicketsBySchedule } from '@/lib/ticket-planning'

type CalendarView = 'month' | 'week'

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0)
}

function startOfWeek(value: Date) {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfWeek(value: Date) {
  const date = startOfWeek(value)
  date.setDate(date.getDate() + 6)
  return date
}

function getPeriod(view: CalendarView, dateValue?: string | null) {
  const anchor = parseDateOnly(dateValue) ?? new Date()
  const start = view === 'week' ? startOfWeek(anchor) : startOfMonth(anchor)
  const end = view === 'week' ? endOfWeek(anchor) : endOfMonth(anchor)
  return {
    anchor: formatDateOnly(anchor),
    from: formatDateOnly(start),
    to: formatDateOnly(end),
  }
}

function normalizeRole(role?: string | null) {
  const normalized = (role || '').toLowerCase()
  return normalized === 'admin' || normalized === 'bi' ? normalized : null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') === 'week' ? 'week' : 'month'
    const { anchor, from, to } = getPeriod(view, searchParams.get('date'))

    const statusFilter = searchParams.get('estado') || 'all'
    const gestorFilter = searchParams.get('gestor') || 'me'
    const prioridadeFilter = searchParams.get('prioridade') || 'all'
    const urgenciaFilter = searchParams.get('urgencia') || 'all'

    if (!isSupabaseConfigured()) {
      const tickets = listTicketsInMemory()
        .filter((ticket: any) => !['concluido', 'rejeitado'].includes(ticket.estado))
      const split = splitPlanningTicketsBySchedule(tickets as any[], from, to)
      return NextResponse.json({
        period: { anchor, from, to, view },
        tickets: split.scheduled,
        unscheduledTickets: split.unscheduled,
        managers: [],
      })
    }

    const supabase = createServerSupabaseClient()
    const headerUserId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
    if (!headerUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', headerUserId)
      .maybeSingle()

    const role = normalizeRole((dbUser as any)?.role)
    if (!dbUser || !role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        assunto,
        estado,
        prioridade,
        urgencia,
        importancia,
        pedido_por,
        gestor_id,
        data_inicio_planeada,
        data_prevista_conclusao,
        duracao_prevista,
        gestor:users!tickets_gestor_id_fkey(name, email)
      `)
      .not('estado', 'in', '("concluido","rejeitado")')
      .order('prioridade', { ascending: false })
      .order('data_prevista_conclusao', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let tickets = (data || []) as any[]

    if (gestorFilter === 'me') {
      tickets = tickets.filter((ticket) => ticket.gestor_id === headerUserId)
    } else if (gestorFilter === 'none') {
      tickets = tickets.filter((ticket) => !ticket.gestor_id)
    } else if (gestorFilter !== 'all') {
      tickets = tickets.filter((ticket) => ticket.gestor_id === gestorFilter)
    }

    if (statusFilter !== 'all') {
      tickets = tickets.filter((ticket) => ticket.estado === statusFilter)
    }

    if (prioridadeFilter !== 'all') {
      const prioridade = Number(prioridadeFilter)
      if (Number.isFinite(prioridade)) {
        tickets = tickets.filter((ticket) => Number(ticket.prioridade) === prioridade)
      }
    }

    if (urgenciaFilter !== 'all') {
      const urgencia = Number(urgenciaFilter)
      if (Number.isFinite(urgencia)) {
        tickets = tickets.filter((ticket) => Number(ticket.urgencia) === urgencia)
      }
    }

    const split = splitPlanningTicketsBySchedule(tickets, from, to)
    const managers = Array.from(
      new Map(
        tickets
          .filter((ticket) => ticket.gestor_id)
          .map((ticket) => [
            ticket.gestor_id,
            {
              id: ticket.gestor_id,
              name: ticket.gestor?.name || ticket.gestor?.email || ticket.gestor_id,
            },
          ]),
      ).values(),
    ).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      period: { anchor, from, to, view },
      tickets: split.scheduled,
      unscheduledTickets: split.unscheduled,
      managers,
    })
  } catch (error) {
    console.error('Error loading tickets calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
