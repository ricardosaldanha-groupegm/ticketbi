import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { addTicket, deleteTicket as deleteTicketFromMemory, getAllTickets } from '@/lib/dev-storage'

export const createTicketSchema = z.object({
  pedido_por: z.string().min(1),
  assunto: z.string().min(1),
  descricao: z.string().min(1),
  objetivo: z.string().min(1),
  urgencia: z.number().min(1).max(3),
  importancia: z.number().min(1).max(3),
  data_esperada: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

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

  const insertPayload = {
    pedido_por: data.pedido_por,
    assunto: data.assunto,
    descricao: data.descricao,
    objetivo: data.objetivo,
    urgencia: data.urgencia,
    importancia: data.importancia,
    data_esperada: normalizedDate,
    created_by: createdById,
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert([insertPayload as any])
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
