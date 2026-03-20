"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateOnly, parseDateOnly } from "@/lib/ticket-planning"

type CalendarView = "month" | "week"

interface CalendarTicket {
  id: string
  assunto: string
  estado: string
  prioridade: number
  urgencia: number
  importancia: number
  pedido_por: string
  gestor_id?: string | null
  gestor?: { name?: string | null; email?: string | null } | null
  data_inicio_planeada: string | null
  data_prevista_conclusao: string | null
  duracao_prevista?: number | null
}

interface CalendarResponse {
  period: {
    anchor: string
    from: string
    to: string
    view: CalendarView
  }
  tickets: CalendarTicket[]
  unscheduledTickets: CalendarTicket[]
  managers: Array<{ id: string; name: string }>
}

interface WeekSegment {
  ticket: CalendarTicket
  startIndex: number
  endIndex: number
  lane: number
}

interface WeekRow {
  days: string[]
  segments: WeekSegment[]
  laneCount: number
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em analise",
  em_curso: "Em curso",
  em_validacao: "Em validacao",
  bloqueado: "Bloqueado",
  "Aguardando 3ºs": "Aguardando 3ºs",
  Standby: "Standby",
}

const STATUS_STYLES: Record<string, string> = {
  novo: "border-sky-400/60 bg-sky-500/20 text-sky-100",
  em_analise: "border-amber-400/60 bg-amber-500/20 text-amber-100",
  em_curso: "border-orange-400/70 bg-orange-500/25 text-orange-50",
  em_validacao: "border-violet-400/60 bg-violet-500/20 text-violet-100",
  bloqueado: "border-slate-500/70 bg-slate-600/40 text-slate-100",
  "Aguardando 3ºs": "border-yellow-400/60 bg-yellow-500/20 text-yellow-100",
  Standby: "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100",
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return new Date(copy.getFullYear(), copy.getMonth(), copy.getDate())
}

function buildMonthDays(anchor: string) {
  const anchorDate = parseDateOnly(anchor) ?? new Date()
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const gridStart = startOfWeek(monthStart)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return formatDateOnly(date)
  })
}

function buildWeekDays(anchor: string) {
  const anchorDate = parseDateOnly(anchor) ?? new Date()
  const weekStart = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return formatDateOnly(date)
  })
}

function compareDateOnly(left?: string | null, right?: string | null) {
  const leftDate = parseDateOnly(left)
  const rightDate = parseDateOnly(right)
  if (!leftDate || !rightDate) return 0
  return leftDate.getTime() - rightDate.getTime()
}

function formatDateLabel(value: string) {
  const date = parseDateOnly(value)
  if (!date) return value
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })
}

function formatHeaderRange(from: string, to: string) {
  const start = parseDateOnly(from)
  const end = parseDateOnly(to)
  if (!start || !end) return `${from} - ${to}`
  return `${start.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}`
}

function isSameMonth(dayValue: string, anchor: string) {
  const day = parseDateOnly(dayValue)
  const current = parseDateOnly(anchor)
  if (!day || !current) return true
  return day.getMonth() === current.getMonth() && day.getFullYear() === current.getFullYear()
}

function isTicketActiveOnDay(ticket: CalendarTicket, dayValue: string) {
  return compareDateOnly(ticket.data_inicio_planeada, dayValue) <= 0 && compareDateOnly(ticket.data_prevista_conclusao, dayValue) >= 0
}

function loadDayCounters(tickets: CalendarTicket[], dayValue: string) {
  return tickets.reduce(
    (acc, ticket) => {
      if (ticket.data_inicio_planeada === dayValue) acc.starts += 1
      if (ticket.data_prevista_conclusao === dayValue) acc.ends += 1
      if (isTicketActiveOnDay(ticket, dayValue)) acc.active += 1
      return acc
    },
    { starts: 0, ends: 0, active: 0 },
  )
}

function buildWeekRows(days: string[], tickets: CalendarTicket[]) {
  const rows: WeekRow[] = []

  for (let offset = 0; offset < days.length; offset += 7) {
    const weekDays = days.slice(offset, offset + 7)
    const rawSegments = tickets
      .map((ticket) => {
        const startIndex = weekDays.findIndex((day) => compareDateOnly(day, ticket.data_inicio_planeada) >= 0)
        const endIndexFromRight = [...weekDays].reverse().findIndex((day) => compareDateOnly(day, ticket.data_prevista_conclusao) <= 0)
        if (startIndex === -1 || endIndexFromRight === -1) return null

        const endIndex = weekDays.length - 1 - endIndexFromRight
        if (startIndex > endIndex) return null
        return { ticket, startIndex, endIndex }
      })
      .filter((segment): segment is Omit<WeekSegment, "lane"> => !!segment)
      .sort((left, right) => {
        if (left.startIndex !== right.startIndex) return left.startIndex - right.startIndex
        return right.endIndex - left.endIndex
      })

    const laneEnds: number[] = []
    const segments: WeekSegment[] = rawSegments.map((segment) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd < segment.startIndex)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(segment.endIndex)
      } else {
        laneEnds[lane] = segment.endIndex
      }
      return { ...segment, lane }
    })

    rows.push({
      days: weekDays,
      segments,
      laneCount: Math.max(laneEnds.length, 1),
    })
  }

  return rows
}

export default function TicketsCalendarBars() {
  const [view, setView] = useState<CalendarView>("month")
  const [anchorDate, setAnchorDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [tickets, setTickets] = useState<CalendarTicket[]>([])
  const [unscheduledTickets, setUnscheduledTickets] = useState<CalendarTicket[]>([])
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([])
  const [gestorFilter, setGestorFilter] = useState<string>("me")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all")
  const [urgenciaFilter, setUrgenciaFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true)
        setError(null)

        let currentId: string | null = null
        let currentRole: string | null = null

        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: byId } = await supabase.from("users").select("id, role").eq("id", user.id).maybeSingle()
            currentId = (byId as any)?.id ?? null
            currentRole = (byId as any)?.role ?? null
            if (!currentId && user.email) {
              const { data: byEmail } = await supabase.from("users").select("id, role").eq("email", user.email).maybeSingle()
              currentId = (byEmail as any)?.id ?? null
              currentRole = (byEmail as any)?.role ?? currentRole
            }
          }
        } catch {}

        if (!currentId && typeof window !== "undefined") {
          const raw = localStorage.getItem("dev-user")
          if (raw) {
            const parsed = JSON.parse(raw)
            currentId = parsed?.id ?? null
            currentRole = parsed?.role ?? null
          }
        }

        const headers: HeadersInit = {}
        if (currentId) (headers as any)["X-User-Id"] = currentId
        if (currentRole) (headers as any)["X-User-Role"] = currentRole

        const params = new URLSearchParams({
          view,
          date: anchorDate,
          gestor: gestorFilter,
          estado: estadoFilter,
          prioridade: prioridadeFilter,
          urgencia: urgenciaFilter,
        })

        const response = await fetch(`/api/tickets-calendar?${params.toString()}`, { headers })
        const payload = await response.json() as CalendarResponse & { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || "Erro ao carregar calendario")
        }

        setTickets(payload.tickets || [])
        setUnscheduledTickets(payload.unscheduledTickets || [])
        setManagers(payload.managers || [])
      } catch (err: any) {
        setTickets([])
        setUnscheduledTickets([])
        setManagers([])
        setError(err?.message || "Erro ao carregar calendario")
      } finally {
        setLoading(false)
      }
    }

    fetchCalendar()
  }, [anchorDate, estadoFilter, gestorFilter, prioridadeFilter, urgenciaFilter, view])

  const days = useMemo(
    () => (view === "month" ? buildMonthDays(anchorDate) : buildWeekDays(anchorDate)),
    [anchorDate, view],
  )
  const today = new Date().toISOString().slice(0, 10)
  const rangeLabel = useMemo(() => {
    if (days.length === 0) return ""
    return formatHeaderRange(days[0], days[days.length - 1])
  }, [days])
  const weekRows = useMemo(() => buildWeekRows(days, tickets), [days, tickets])

  const shiftPeriod = (direction: -1 | 1) => {
    const anchor = parseDateOnly(anchorDate) ?? new Date()
    const next = new Date(anchor)
    if (view === "month") {
      next.setMonth(next.getMonth() + direction)
      next.setDate(1)
    } else {
      next.setDate(next.getDate() + (direction * 7))
    }
    setAnchorDate(formatDateOnly(next))
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Calendario de Planeamento</CardTitle>
              <CardDescription>
                Vista geral de inicio e conclusao previstos dos tickets em aberto.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700" onClick={() => shiftPeriod(-1)}>
                ‹ Anterior
              </Button>
              <Button type="button" variant="outline" className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700" onClick={() => setAnchorDate(new Date().toISOString().slice(0, 10))}>
                Hoje
              </Button>
              <Button type="button" variant="outline" className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700" onClick={() => shiftPeriod(1)}>
                Seguinte ›
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-300">{rangeLabel}</div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setView("month")} className={view === "month" ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-700 text-slate-100 hover:bg-slate-600"}>
                Mes
              </Button>
              <Button type="button" onClick={() => setView("week")} className={view === "week" ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-700 text-slate-100 hover:bg-slate-600"}>
                Semana
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Gestor</label>
              <select value={gestorFilter} onChange={(e) => setGestorFilter(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option value="me">Os meus tickets</option>
                <option value="all">Todos</option>
                <option value="none">Sem gestor</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Estado</label>
              <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option value="all">Todos</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Prioridade</label>
              <select value={prioridadeFilter} onChange={(e) => setPrioridadeFilter(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option value="all">Todas</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
                  <option key={value} value={String(value)}>{value}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Urgencia</label>
              <select value={urgenciaFilter} onChange={(e) => setUrgenciaFilter(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option value="all">Todas</option>
                {[1, 2, 3].map((value) => (
                  <option key={value} value={String(value)}>{value}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-rose-800 bg-rose-950/30">
          <CardContent className="py-4 text-sm text-rose-200">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wide text-slate-400">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="rounded-md bg-slate-800 px-3 py-2 text-center">{label}</div>
            ))}
          </div>

          {loading ? (
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="py-12 text-center text-slate-300">A carregar calendario...</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {weekRows.map((row, rowIndex) => (
                <div key={`week-${rowIndex}`} className="rounded-2xl border border-slate-700 bg-slate-800 p-2">
                  <div className="grid grid-cols-7 gap-2">
                    {row.days.map((day) => {
                      const counters = loadDayCounters(tickets, day)
                      const isToday = day === today
                      return (
                        <div
                          key={day}
                          className={`rounded-xl border px-3 py-3 ${isToday ? "border-amber-500 bg-slate-700/80 shadow-[0_0_0_1px_rgba(245,158,11,0.3)]" : "border-slate-700 bg-slate-900/50"} ${view === "month" && !isSameMonth(day, anchorDate) ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={`text-sm font-semibold ${isToday ? "text-amber-300" : "text-slate-100"}`}>
                              {formatDateLabel(day)}
                            </div>
                            <div className="text-right text-[10px] text-slate-400">
                              <div>I: {counters.starts}</div>
                              <div>F: {counters.ends}</div>
                            </div>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">{counters.active} ativo(s)</div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="relative mt-2" style={{ height: `${row.laneCount * 34}px` }}>
                    {row.segments.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-xs text-slate-500">
                        Sem tickets
                      </div>
                    ) : (
                      row.segments.map((segment) => {
                        const left = `${(segment.startIndex / 7) * 100}%`
                        const width = `${((segment.endIndex - segment.startIndex + 1) / 7) * 100}%`
                        const top = `${segment.lane * 34}px`
                        const isSegmentStart = row.days[segment.startIndex] === segment.ticket.data_inicio_planeada
                        const isSegmentEnd = row.days[segment.endIndex] === segment.ticket.data_prevista_conclusao

                        return (
                          <Link
                            key={`${segment.ticket.id}-${rowIndex}-${segment.lane}`}
                            href={`/tickets/${segment.ticket.id}`}
                            className="absolute block px-1"
                            style={{ left, width, top }}
                          >
                            <div
                              className={`h-7 overflow-hidden border px-2 text-[11px] leading-7 shadow-sm transition-colors hover:brightness-110 ${STATUS_STYLES[segment.ticket.estado] || "border-slate-600 bg-slate-700/70 text-slate-100"} ${isSegmentStart ? "rounded-l-md" : "rounded-l-sm"} ${isSegmentEnd ? "rounded-r-md" : "rounded-r-sm"}`}
                            >
                              <span className="block truncate font-medium">{segment.ticket.assunto}</span>
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Sem planeamento</CardTitle>
              <CardDescription>
                Tickets abertos sem inicio planeado ou sem data prevista de conclusao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {unscheduledTickets.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-400">
                  Nao ha tickets fora do calendario neste periodo.
                </div>
              ) : (
                unscheduledTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block rounded-lg border border-slate-700 bg-slate-900/60 p-3 transition-colors hover:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{ticket.assunto}</div>
                        <div className="mt-1 text-xs text-slate-400">{ticket.gestor?.name || "Sem gestor"}</div>
                      </div>
                      <Badge className={STATUS_STYLES[ticket.estado] || "border-slate-600 bg-slate-700/60 text-slate-100"}>
                        {STATUS_LABELS[ticket.estado] || ticket.estado}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {ticket.data_prevista_conclusao ? `Fim previsto: ${formatDateLabel(ticket.data_prevista_conclusao)}` : "Sem data prevista de conclusao"}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Regras da vista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>Os tickets aparecem no calendario quando tem inicio planeado e fim previsto.</p>
              <p>As barras sao desenhadas por semana e retomam na linha seguinte quando o ticket atravessa semanas.</p>
              <p>O calculo usa duracao prevista em dias uteis, sem considerar feriados na v1.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
