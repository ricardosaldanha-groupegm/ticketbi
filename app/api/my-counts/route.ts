import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isSupabaseConfigured } from '@/lib/tickets-service'

// Estados abertos - tickets (ticket_status inclui Standby e Aguardando 3ºs)
const OPEN_TICKET_STATES = ['novo', 'em_analise', 'em_curso', 'em_validacao', 'Aguardando 3ºs', 'Standby']
// Estados abertos - tarefas/subtickets (subticket_status não tem Standby/Aguardando 3ºs)
const OPEN_SUBTICKET_STATES = ['novo', 'em_analise', 'em_curso', 'em_validacao']

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
    const userRole = (request.headers.get('x-user-role') || request.headers.get('X-User-Role') || '')
      .toString()
      .toLowerCase()

    if (!userId) {
      return NextResponse.json({ ticketsCount: 0, tasksCount: 0 })
    }

    // Apenas BI e admin podem ver estes contadores
    if (userRole !== 'bi' && userRole !== 'admin') {
      return NextResponse.json({ ticketsCount: 0, tasksCount: 0 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ticketsCount: 0, tasksCount: 0 })
    }

    const supabase = createServerSupabaseClient()

    // Resolver role a partir da BD se necessário
    let effectiveRole = userRole
    if (effectiveRole !== 'bi' && effectiveRole !== 'admin') {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      effectiveRole = (profile as any)?.role ?? 'requester'
    }
    if (effectiveRole !== 'bi' && effectiveRole !== 'admin') {
      return NextResponse.json({ ticketsCount: 0, tasksCount: 0 })
    }

    // 1) Tickets abertos onde o utilizador é gestor (estados: novo, em_analise, em_curso, em_validacao, Aguardando 3ºs, Standby)
    const { count: ticketsCount, error: ticketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('gestor_id', userId)
      .in('estado', OPEN_TICKET_STATES)

    if (ticketsError) {
      console.error('Error counting tickets:', ticketsError)
    }

    // 2) Tarefas abertas onde o utilizador é responsável (assignee)
    const { count: tasksCount, error: tasksError } = await supabase
      .from('subtickets')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_bi_id', userId)
      .in('estado', OPEN_SUBTICKET_STATES)

    if (tasksError) {
      console.error('Error counting tasks:', tasksError)
    }

    return NextResponse.json({
      ticketsCount: ticketsError ? 0 : (ticketsCount ?? 0),
      tasksCount: tasksError ? 0 : (tasksCount ?? 0),
    })
  } catch (error) {
    console.error('Error in GET my-counts:', error)
    return NextResponse.json({ ticketsCount: 0, tasksCount: 0 })
  }
}
