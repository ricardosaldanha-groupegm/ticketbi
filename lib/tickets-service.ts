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
  // Utilizador que faz o pedido (nome ou email, hoje usamos o nome no UI)
  pedido_por: z.string().min(1),
  // Assunto / título do ticket
  assunto: z.string().min(1),
  // Descrição detalhada do pedido
  descricao: z.string().min(1),
  // Objetivo de negócio do pedido
  objetivo: z.string().min(1),
  // Email do gestor a atribuir ao ticket (opcional, usado sobretudo na integração n8n)
  // Aceita string vazia e trata como "sem gestor"
  // Deve corresponder a um `users.email` válido; caso contrário o backend devolve erro.
  gestor_email: z
    .union([z.string().email(), z.literal('')])
    .optional(),
  // Urgência (1–3)
  urgencia: z.number().min(1).max(3),
  // Importância (1–3)
  importancia: z.number().min(1).max(3),
  // Data esperada (string no formato YYYY-MM-DD; o backend faz a normalização)
  data_esperada: z.string().optional(),
  // Data prevista de conclusão (string YYYY-MM-DD; opcional)
  data_prevista_conclusao: z.string().optional(),
  // Tipo de entrega e natureza (strings pré-definidas)
  // Se não vier nada, assume "Interno" por omissão (compatível com integrações existentes)
  entrega_tipo: z.enum(entregaTipoValues).default('Interno'),
  natureza: z.enum(naturezaValues).default('Novo'),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
type TicketInsert = Database['public']['Tables']['tickets']['Insert']

function normalizeDateInput(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Se já vier no formato YYYY-MM-DD, aceita diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  // Tenta converter qualquer outra string para Date válida
  const d = new Date(trimmed)
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  }

  // Caso não seja uma data válida (ex: "Não tenho deadline..."), devolve null
  return null
}

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
  let gestorId: string | null = null

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

  const normalizedDate = normalizeDateInput(data.data_esperada)
  const normalizedPrevistaConclusao = normalizeDateInput(data.data_prevista_conclusao)

  if (!createdById) {
    throw new Error('Unable to resolve requester user for ticket')
  }

  // Se vier gestor_email (não vazio), tentar resolver para gestor_id
  const rawGestorEmail = (data as any).gestor_email as string | undefined
  const gestorEmail = rawGestorEmail && rawGestorEmail.trim() !== '' ? rawGestorEmail.trim() : undefined

  if (gestorEmail) {
    const { data: gestorUser, error: gestorError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', gestorEmail)
      .maybeSingle<{
        id: string
        email: string
        role: 'requester' | 'bi' | 'admin'
      }>()

    if (gestorError) {
      throw new Error(gestorError.message || 'Error looking up gestor by email')
    }

    if (!gestorUser) {
      throw new Error(
        `Nenhum utilizador encontrado com o email do gestor: ${gestorEmail}`,
      )
    }

    // Opcional: garantir que o gestor é BI ou Admin
    if (gestorUser.role !== 'bi' && gestorUser.role !== 'admin') {
      throw new Error(
        `O email indicado para Gestor (${gestorEmail}) não pertence a um utilizador BI/Admin`,
      )
    }

    gestorId = gestorUser.id
  }

  const insertPayload: any = {
    pedido_por: data.pedido_por,
    assunto: data.assunto,
    descricao: data.descricao,
    objetivo: data.objetivo,
    urgencia: data.urgencia,
    importancia: data.importancia,
    data_esperada: normalizedDate,
    data_prevista_conclusao: normalizedPrevistaConclusao,
    created_by: createdById,
    entrega_tipo: data.entrega_tipo,
    natureza: data.natureza,
  }

  if (gestorId) {
    insertPayload.gestor_id = gestorId
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
