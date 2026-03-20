export type PlanningLastEdited = 'duracao_prevista' | 'data_inicio_planeada' | 'data_prevista_conclusao'

export interface PlanningFieldsInput {
  duracao_prevista?: number | null
  data_inicio_planeada?: string | null
  data_prevista_conclusao?: string | null
  lastEdited?: PlanningLastEdited | null
}

export interface PlanningFieldsResult {
  duracao_prevista: number | null
  data_inicio_planeada: string | null
  data_prevista_conclusao: string | null
}

export interface PlanningCalendarTicket {
  id: string
  assunto: string
  estado: string
  prioridade: number
  urgencia: number
  importancia: number
  pedido_por: string
  gestor_id?: string | null
  gestor?: { name?: string | null; email?: string | null } | null
  data_inicio_planeada?: string | null
  data_prevista_conclusao?: string | null
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function normalizeDateOnly(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (DATE_ONLY_RE.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

export function parseDateOnly(value?: string | null): Date | null {
  const normalized = normalizeDateOnly(value)
  if (!normalized) return null
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function addBusinessDaysInclusive(startValue: string, duration: number): string | null {
  const start = parseDateOnly(startValue)
  if (!start || !Number.isInteger(duration) || duration < 1) return null

  const current = new Date(start)
  let remaining = duration - 1

  while (remaining > 0) {
    current.setDate(current.getDate() + 1)
    if (!isWeekend(current)) remaining -= 1
  }

  return formatDateOnly(current)
}

export function subtractBusinessDaysInclusive(endValue: string, duration: number): string | null {
  const end = parseDateOnly(endValue)
  if (!end || !Number.isInteger(duration) || duration < 1) return null

  const current = new Date(end)
  let remaining = duration - 1

  while (remaining > 0) {
    current.setDate(current.getDate() - 1)
    if (!isWeekend(current)) remaining -= 1
  }

  return formatDateOnly(current)
}

export function normalizeDuration(value?: number | null): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) return null
  return value
}

export function computePlanningFields(input: PlanningFieldsInput): PlanningFieldsResult {
  const duracao_prevista = normalizeDuration(input.duracao_prevista ?? null)
  let data_inicio_planeada = normalizeDateOnly(input.data_inicio_planeada)
  let data_prevista_conclusao = normalizeDateOnly(input.data_prevista_conclusao)

  if (duracao_prevista) {
    if (input.lastEdited === 'data_prevista_conclusao' && data_prevista_conclusao) {
      data_inicio_planeada = subtractBusinessDaysInclusive(data_prevista_conclusao, duracao_prevista)
    } else if (input.lastEdited === 'data_inicio_planeada' && data_inicio_planeada) {
      data_prevista_conclusao = addBusinessDaysInclusive(data_inicio_planeada, duracao_prevista)
    } else if (input.lastEdited === 'duracao_prevista') {
      if (data_prevista_conclusao) {
        data_inicio_planeada = subtractBusinessDaysInclusive(data_prevista_conclusao, duracao_prevista)
      } else if (data_inicio_planeada) {
        data_prevista_conclusao = addBusinessDaysInclusive(data_inicio_planeada, duracao_prevista)
      }
    }
  }

  return {
    duracao_prevista,
    data_inicio_planeada,
    data_prevista_conclusao,
  }
}

export function validatePlanningFields(input: PlanningFieldsResult): string | null {
  if (input.duracao_prevista != null && input.duracao_prevista < 1) {
    return 'A duração prevista deve ser um inteiro positivo.'
  }

  if (input.data_inicio_planeada && input.data_prevista_conclusao) {
    const start = parseDateOnly(input.data_inicio_planeada)
    const end = parseDateOnly(input.data_prevista_conclusao)
    if (!start || !end) return 'Datas de planeamento inválidas.'
    if (start.getTime() > end.getTime()) {
      return 'A data planeada de início não pode ser posterior à data prevista de conclusão.'
    }
  }

  return null
}

export function overlapsPeriod(
  startValue: string | null | undefined,
  endValue: string | null | undefined,
  fromValue: string,
  toValue: string,
) {
  const start = parseDateOnly(startValue)
  const end = parseDateOnly(endValue)
  const from = parseDateOnly(fromValue)
  const to = parseDateOnly(toValue)
  if (!start || !end || !from || !to) return false
  return start.getTime() <= to.getTime() && end.getTime() >= from.getTime()
}

export function splitPlanningTicketsBySchedule<T extends PlanningCalendarTicket>(
  tickets: T[],
  fromValue: string,
  toValue: string,
) {
  const scheduled: T[] = []
  const unscheduled: T[] = []

  for (const ticket of tickets) {
    const start = normalizeDateOnly(ticket.data_inicio_planeada)
    const end = normalizeDateOnly(ticket.data_prevista_conclusao)
    if (!start || !end) {
      unscheduled.push(ticket)
      continue
    }

    if (overlapsPeriod(start, end, fromValue, toValue)) {
      scheduled.push({
        ...ticket,
        data_inicio_planeada: start,
        data_prevista_conclusao: end,
      })
      continue
    }

    unscheduled.push({
      ...ticket,
      data_inicio_planeada: start,
      data_prevista_conclusao: end,
    })
  }

  return { scheduled, unscheduled }
}
