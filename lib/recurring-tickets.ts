import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createTicket, entregaTipoValues, naturezaValues } from '@/lib/tickets-service'
import type { AuthUser } from '@/lib/rbac'

const recurrenceFrequencies = ['daily', 'weekly', 'monthly'] as const

const recurringSubtaskSchema = z.object({
  id: z.string().uuid().optional(),
  assignee_bi_id: z.string().uuid(),
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  urgencia: z.number().int().min(1).max(3).default(1),
  importancia: z.number().int().min(1).max(3).default(1),
  estado: z.enum(['novo', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado']).default('novo'),
  data_inicio: z.string().optional(),
  data_inicio_planeado: z.string().optional(),
  data_esperada: z.string().optional(),
  data_conclusao: z.string().optional(),
  retrabalhos: z.number().int().min(0).default(0),
})

export const recurringTemplateSchema = z.object({
  active: z.boolean().optional(),
  pedido_por: z.string().min(1),
  assunto: z.string().min(1),
  descricao: z.string().min(1),
  objetivo: z.string().optional(),
  urgencia: z.number().int().min(1).max(3),
  importancia: z.number().int().min(1).max(3),
  data_esperada: z.string().optional(),
  data_prevista_conclusao: z.string().optional(),
  entrega_tipo: z.enum(entregaTipoValues),
  natureza: z.enum(naturezaValues).default('Novo'),
  gestor_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(recurrenceFrequencies),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  subtasks: z.array(recurringSubtaskSchema).default([]),
})

export const recurringTemplateUpdateSchema = recurringTemplateSchema.partial().extend({
  subtasks: z.array(recurringSubtaskSchema).optional(),
})

export type RecurringTemplateInput = z.infer<typeof recurringTemplateSchema>
export type RecurringTemplateUpdateInput = z.infer<typeof recurringTemplateUpdateSchema>

function normalizeDateOnly(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function calculateNextRunDate(baseDate: string, frequency: typeof recurrenceFrequencies[number]) {
  const next = parseDateOnly(baseDate)
  if (frequency === 'daily') {
    next.setUTCDate(next.getUTCDate() + 1)
  } else if (frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7)
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1)
  }
  return formatDateOnly(next)
}

export function getTodayInTimezone(timeZone = 'Europe/Lisbon') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

function ensureInternalUser(user: AuthUser) {
  if (user.role !== 'bi' && user.role !== 'admin') {
    throw new Error('Forbidden')
  }
}

function normalizeTemplatePayload(input: RecurringTemplateInput | RecurringTemplateUpdateInput) {
  return {
    active: input.active ?? true,
    pedido_por: input.pedido_por?.trim(),
    assunto: input.assunto?.trim(),
    descricao: input.descricao?.trim(),
    objetivo: input.objetivo?.trim() || null,
    urgencia: input.urgencia,
    importancia: input.importancia,
    data_esperada: normalizeDateOnly(input.data_esperada),
    data_prevista_conclusao: normalizeDateOnly(input.data_prevista_conclusao),
    entrega_tipo: input.entrega_tipo,
    natureza: input.natureza ?? 'Novo',
    gestor_id: input.gestor_id ?? null,
    frequency: input.frequency,
    start_date: normalizeDateOnly(input.start_date),
    end_date: normalizeDateOnly(input.end_date),
    subtasks: (input.subtasks ?? []).map((subtask) => ({
      ...subtask,
      descricao: subtask.descricao?.trim() || null,
      data_inicio: normalizeDateOnly(subtask.data_inicio),
      data_inicio_planeado: normalizeDateOnly(subtask.data_inicio_planeado),
      data_esperada: normalizeDateOnly(subtask.data_esperada),
      data_conclusao: normalizeDateOnly(subtask.data_conclusao),
    })),
  }
}

async function replaceTemplateSubtasks(templateId: string, subtasks: ReturnType<typeof normalizeTemplatePayload>['subtasks']) {
  const supabase = createServerSupabaseClient()
  const { error: deleteError } = await supabase
    .from('ticket_recurring_template_subtasks')
    .delete()
    .eq('template_id', templateId)
  if (deleteError) {
    throw new Error(deleteError.message || 'Erro ao limpar subtarefas do template')
  }

  if (!subtasks.length) return

  const subtasksToInsert = subtasks.map((subtask) => ({
    template_id: templateId,
    assignee_bi_id: subtask.assignee_bi_id,
    titulo: subtask.titulo,
    descricao: subtask.descricao,
    urgencia: subtask.urgencia,
    importancia: subtask.importancia,
    estado: subtask.estado,
    data_inicio: subtask.data_inicio,
    data_inicio_planeado: subtask.data_inicio_planeado,
    data_esperada: subtask.data_esperada,
    data_conclusao: subtask.data_conclusao,
    retrabalhos: subtask.retrabalhos,
  }))

  const { error: insertError } = await supabase
    .from('ticket_recurring_template_subtasks')
    .insert(subtasksToInsert as any)
  if (insertError) {
    throw new Error(insertError.message || 'Erro ao gravar subtarefas do template')
  }
}

export async function listRecurringTemplates(user: AuthUser) {
  ensureInternalUser(user)
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('ticket_recurring_templates')
    .select(`
      *,
      gestor:users!ticket_recurring_templates_gestor_id_fkey(id, name, email),
      creator:users!ticket_recurring_templates_created_by_fkey(id, name, email),
      subtasks:ticket_recurring_template_subtasks(
        *,
        assignee:users!ticket_recurring_template_subtasks_assignee_bi_id_fkey(id, name, email)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Erro ao listar templates recorrentes')
  }

  return data ?? []
}

export async function createRecurringTemplate(user: AuthUser, input: RecurringTemplateInput) {
  ensureInternalUser(user)
  const normalized = normalizeTemplatePayload(input)
  if (!normalized.start_date) {
    throw new Error('A data de início é obrigatória')
  }
  if (normalized.end_date && normalized.end_date < normalized.start_date) {
    throw new Error('A data final não pode ser anterior à data de início')
  }

  const supabase = createServerSupabaseClient()
  const insertPayload = {
    created_by: user.id,
    active: normalized.active,
    pedido_por: normalized.pedido_por,
    assunto: normalized.assunto,
    descricao: normalized.descricao,
    objetivo: normalized.objetivo,
    urgencia: normalized.urgencia,
    importancia: normalized.importancia,
    data_esperada: normalized.data_esperada,
    data_prevista_conclusao: normalized.data_prevista_conclusao,
    entrega_tipo: normalized.entrega_tipo,
    natureza: normalized.natureza,
    gestor_id: normalized.gestor_id,
    frequency: normalized.frequency,
    start_date: normalized.start_date,
    next_run_date: normalized.start_date,
    end_date: normalized.end_date,
  }

  const { data, error } = await (supabase as any)
    .from('ticket_recurring_templates')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message || 'Erro ao criar template recorrente')
  }

  await replaceTemplateSubtasks(data.id, normalized.subtasks)
  return data
}

export async function updateRecurringTemplate(user: AuthUser, templateId: string, input: RecurringTemplateUpdateInput) {
  ensureInternalUser(user)
  const supabase = createServerSupabaseClient()

  const { data: existing, error: loadError } = await supabase
    .from('ticket_recurring_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle()

  if (loadError) {
    throw new Error(loadError.message || 'Erro ao carregar template recorrente')
  }
  if (!existing) {
    throw new Error('Template recorrente não encontrado')
  }

  const normalized = normalizeTemplatePayload({
    active: input.active ?? existing.active,
    pedido_por: input.pedido_por ?? existing.pedido_por,
    assunto: input.assunto ?? existing.assunto,
    descricao: input.descricao ?? (existing.descricao ?? ''),
    objetivo: input.objetivo ?? (existing.objetivo ?? ''),
    urgencia: input.urgencia ?? existing.urgencia,
    importancia: input.importancia ?? existing.importancia,
    data_esperada: input.data_esperada ?? (existing.data_esperada ?? ''),
    data_prevista_conclusao: input.data_prevista_conclusao ?? (existing.data_prevista_conclusao ?? ''),
    entrega_tipo: input.entrega_tipo ?? existing.entrega_tipo,
    natureza: input.natureza ?? existing.natureza,
    gestor_id: input.gestor_id ?? existing.gestor_id,
    frequency: input.frequency ?? existing.frequency,
    start_date: input.start_date ?? existing.start_date,
    end_date: input.end_date ?? (existing.end_date ?? ''),
    subtasks: input.subtasks ?? [],
  })

  if (!normalized.start_date) {
    throw new Error('A data de início é obrigatória')
  }
  if (normalized.end_date && normalized.end_date < normalized.start_date) {
    throw new Error('A data final não pode ser anterior à data de início')
  }

  let nextRunDate = existing.next_run_date
  if (input.start_date || input.frequency) {
    const today = getTodayInTimezone()
    nextRunDate = normalized.start_date
    while (nextRunDate < today) {
      nextRunDate = calculateNextRunDate(nextRunDate, normalized.frequency!)
    }
  }

  if (normalized.end_date && nextRunDate > normalized.end_date) {
    nextRunDate = normalized.end_date
  }

  const updatePayload = {
    active: normalized.active,
    pedido_por: normalized.pedido_por,
    assunto: normalized.assunto,
    descricao: normalized.descricao,
    objetivo: normalized.objetivo,
    urgencia: normalized.urgencia,
    importancia: normalized.importancia,
    data_esperada: normalized.data_esperada,
    data_prevista_conclusao: normalized.data_prevista_conclusao,
    entrega_tipo: normalized.entrega_tipo,
    natureza: normalized.natureza,
    gestor_id: normalized.gestor_id,
    frequency: normalized.frequency,
    start_date: normalized.start_date,
    next_run_date: nextRunDate,
    end_date: normalized.end_date,
  }

  const { data, error } = await (supabase as any)
    .from('ticket_recurring_templates')
    .update(updatePayload)
    .eq('id', templateId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message || 'Erro ao atualizar template recorrente')
  }

  if (input.subtasks) {
    await replaceTemplateSubtasks(templateId, normalized.subtasks)
  }

  return data
}

export async function runDueRecurringTemplates(runDate = getTodayInTimezone()) {
  const supabase = createServerSupabaseClient()
  const { data: dueTemplates, error } = await supabase
    .from('ticket_recurring_templates')
    .select(`
      *,
      subtasks:ticket_recurring_template_subtasks(*)
    `)
    .eq('active', true)
    .lte('next_run_date', runDate)
    .order('next_run_date', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Erro ao carregar templates a executar')
  }

  const results: Array<{ templateId: string; createdTicketId?: string; skipped?: boolean; error?: string }> = []

  for (const template of dueTemplates ?? []) {
    const instanceDate = template.next_run_date
    let nextRunDate = calculateNextRunDate(instanceDate, template.frequency)
    const shouldDeactivate = !!template.end_date && nextRunDate > template.end_date

    try {
      const { data: existingTicket, error: existingError } = await supabase
        .from('tickets')
        .select('id')
        .eq('recurring_template_id', template.id)
        .eq('recurring_instance_date', instanceDate)
        .maybeSingle()

      if (existingError) {
        throw new Error(existingError.message || 'Erro ao verificar ocorrência existente')
      }

      if (existingTicket?.id) {
        const { error: updateExistingError } = await supabase
          .from('ticket_recurring_templates')
          .update({
            last_run_at: new Date().toISOString(),
            last_created_ticket_id: existingTicket.id,
            last_error: null,
            next_run_date: shouldDeactivate ? instanceDate : nextRunDate,
            active: shouldDeactivate ? false : true,
          } as any)
          .eq('id', template.id)
        if (updateExistingError) {
          throw new Error(updateExistingError.message || 'Erro ao atualizar template recorrente')
        }
        results.push({ templateId: template.id, createdTicketId: existingTicket.id, skipped: true })
        continue
      }

      const { ticket } = await createTicket({
        pedido_por: template.pedido_por,
        assunto: template.assunto,
        descricao: template.descricao ?? '',
        objetivo: template.objetivo ?? '',
        urgencia: template.urgencia,
        importancia: template.importancia,
        data_esperada: template.data_esperada ?? undefined,
        data_prevista_conclusao: template.data_prevista_conclusao ?? undefined,
        entrega_tipo: template.entrega_tipo,
        natureza: template.natureza,
        created_by_id: template.created_by,
        gestor_id: template.gestor_id,
        recurring_template_id: template.id,
        recurring_instance_date: instanceDate,
      })

      const subtasks = Array.isArray((template as any).subtasks) ? (template as any).subtasks : []
      if (subtasks.length > 0) {
        const subticketsToInsert = subtasks.map((st: any) => ({
          ticket_id: (ticket as any).id,
          titulo: st.titulo,
          descricao: st.descricao,
          assignee_bi_id: st.assignee_bi_id,
          urgencia: st.urgencia,
          importancia: st.importancia,
          data_inicio: st.data_inicio,
          data_inicio_planeado: st.data_inicio_planeado,
          data_esperada: st.data_esperada,
          data_conclusao: st.data_conclusao,
          estado: st.estado,
          retrabalhos: st.retrabalhos ?? 0,
        }))

        const { error: subticketInsertError } = await supabase
          .from('subtickets')
          .insert(subticketsToInsert as any)

        if (subticketInsertError) {
          throw new Error(subticketInsertError.message || 'Erro ao criar subtarefas recorrentes')
        }
      }

      const { error: updateError } = await supabase
        .from('ticket_recurring_templates')
        .update({
          last_run_at: new Date().toISOString(),
          last_created_ticket_id: (ticket as any).id,
          last_error: null,
          next_run_date: shouldDeactivate ? instanceDate : nextRunDate,
          active: shouldDeactivate ? false : true,
        } as any)
        .eq('id', template.id)

      if (updateError) {
        throw new Error(updateError.message || 'Erro ao atualizar metadata do template')
      }

      results.push({ templateId: template.id, createdTicketId: (ticket as any).id })
    } catch (error: any) {
      await supabase
        .from('ticket_recurring_templates')
        .update({
          last_run_at: new Date().toISOString(),
          last_error: error?.message || 'Erro ao gerar ticket recorrente',
          next_run_date: shouldDeactivate ? instanceDate : nextRunDate,
          active: shouldDeactivate ? false : true,
        } as any)
        .eq('id', template.id)
      results.push({ templateId: template.id, error: error?.message || 'Erro ao gerar ticket recorrente' })
    }
  }

  return {
    runDate,
    processed: results.length,
    created: results.filter((item) => item.createdTicketId && !item.skipped).length,
    skipped: results.filter((item) => item.skipped).length,
    failed: results.filter((item) => item.error).length,
    results,
  }
}
