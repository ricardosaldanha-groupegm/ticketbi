import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { addTicket, deleteTicket as deleteTicketFromMemory, getAllTickets } from '@/lib/dev-storage'
import type { Database } from '@/lib/supabase'

export const entregaTipoValues = [
  'BI', 'PHC', 'Salesforce', 'Automação', 'Suporte', 'Dados/Análises', 'Interno',
] as const

export const naturezaValues = [
  'Novo', 'Correção', 'Retrabalho', 'Esclarecimento', 'Ajuste', 'Suporte', 'Reunião/Discussão', 'Interno',
] as const

export const createTicketSchema = z.object({
  pedido_por: z.string().min(1),
  assunto: z.string().min(1),
  descricao: z.string().min(1),
  objetivo: z.string().min(1),
  urgencia: z.number().min(1).max(3),
  importancia: z.number().min(1).max(3),
  data_esperada: z.string().optional(),
  data_prevista_conclusao: z.string().optional(),
  entrega_tipo: z.enum(entregaTipoValues).default('Interno'),
  natureza: z.enum(naturezaValues).default('Novo'),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
type TicketInsert = Database['public']['Tables']['tickets']['Insert']

export function isSupabaseConfigured() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(
    supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes('your-project') &&
      !supabaseKey.includes('your-'),
  )
}

export function listTicketsInMemory() {
  return getAllTickets()
}

export async function createTicket(data: CreateTicketInput) {
  if (!isSupabaseConfigured()) {
    const ticket = {
      id: `ticket-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      estado: 'novo',
    }
    addTicket(ticket)
    return { ticket, source: 'memory' as const }
  }

  const supabase = createServerSupabaseClient()

  // Map pedido_por (nome) -> created_by (uuid)
  let createdById: string | null = null

  const { data: userByName } = await supabase
    .from('users')
    .select('id, name')
    .eq('name', data.pedido_por)
    .limit(1)
    .maybeSingle()

  if ((userByName as any)?.id) {
    createdById = (userByName as any).id
  } else {
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()
    if ((adminUser as any)?.id) createdById = (adminUser as any).id
  }

  const normalizedDate =
    data.data_esperada && data.data_esperada.trim() !== ''
      ? data.data_esperada
      : null

  if (!createdById) {
    throw new Error('Unable to resolve requester user for ticket')
  }

  const insertPayload: any = {
    pedido_por: data.pedido_por,
    assunto: data.assunto,
    descricao: data.descricao,
    objetivo: data.objetivo,
    urgencia: data.urgencia,
    importancia: data.importancia,
    data_esperada: normalizedDate,
    data_prevista_conclusao: data.data_prevista_conclusao ?? null,
    created_by: createdById,
    entrega_tipo: data.entrega_tipo,
    natureza: data.natureza,
  }

  const { data: ticket, error } = await (supabase as any)
    .from('tickets')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Error creating ticket')
  }

  return { ticket, source: 'supabase' as const }
}

export async function deleteTicket(id: string) {
  if (!isSupabaseConfigured()) {
    const removed = deleteTicketFromMemory(id)
    if (!removed) {
      throw new Error('Ticket not found')
    }
    return { removed: true, source: 'memory' as const }
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) {
    throw new Error(error.message || 'Error deleting ticket')
  }
  return { removed: true, source: 'supabase' as const }
}
