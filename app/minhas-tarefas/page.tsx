"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from '@/lib/supabase'
import AuthenticatedLayout from "@/components/AuthenticatedLayout"
// Normalized status labels and vibrant colors
const strongStatusLabels: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  em_curso: "Em curso",
  em_validacao: "Em validação",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
}
const strongStatusColors: Record<string, string> = {
  novo: "bg-sky-600 text-white",
  em_analise: "bg-amber-500 text-white",
  em_curso: "bg-orange-600 text-white",
  em_validacao: "bg-violet-600 text-white",
  concluido: "bg-emerald-600 text-white",
  rejeitado: "bg-rose-600 text-white",
  bloqueado: "bg-slate-700 text-white",
}
const normalizeStatus = (s: string): keyof typeof strongStatusLabels => {
  const x = (s || "").toLowerCase()
  if (x.includes("anal")) return "em_analise"
  if (x.includes("valid")) return "em_validacao"
  if (x.includes("curso")) return "em_curso"
  if (x.includes("concl")) return "concluido"
  if (x.includes("rej")) return "rejeitado"
  if (x.includes("bloq")) return "bloqueado"
  if (x.includes("novo")) return "novo"
  return "novo"
}
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  titulo: string
  descricao?: string | null
  estado: string
  prioridade: number
  urgencia: number
  importancia: number
  data_inicio: string | null
  data_inicio_planeado: string | null
  data_esperada: string | null
  data_conclusao: string | null
  created_at: string
  assignee: { id?: string; name: string; email: string } | null
  ticket?: { assunto: string } | null
}

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em an�lise",
  em_curso: "Em curso",
  em_valida��o: "Em valida��o",
  Conclu�do: "Conclu�do",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
  "Aguardando 3�s": "Aguardando 3�s",
  Standby: "Standby",
}

const allEstados = [
  "novo",
  "em_analise",
  "em_curso",
  "em_valida��o", "Aguardando 3�s", "Standby",
  "Conclu�do",
  "rejeitado",
  "bloqueado",
] as const

const statusColors: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  em_curso: "bg-orange-100 text-orange-800",
  em_valida��o: "bg-purple-100 text-purple-800",
  Conclu�do: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  bloqueado: "bg-gray-100 text-gray-800",
  "Aguardando 3�s": "bg-yellow-100 text-yellow-800",
  Standby: "bg-purple-100 text-purple-800",
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-PT")
}

export default function MinhasTarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const defaultEstados = allEstados.filter((s) => !["Conclu�do", "rejeitado", "bloqueado"].includes(s))
  const [estadoFilter, setEstadoFilter] = useState<string[]>(defaultEstados as unknown as string[])
  const [sortKey, setSortKey] = useState<"endAsc" | "endDesc" | "createdDesc">("endAsc")
  const [search, setSearch] = useState<string>("")
  const featureTimeline = ((process.env.NEXT_PUBLIC_FEATURE_MY_TASKS_TIMELINE ?? 'on').toString().toLowerCase()) !== 'off'

  useEffect(() => {
    const init = async () => {
      // 1) Try Supabase session and resolve app users.id (by id or email)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          let appUserId: string | null = null
          const { data: byId } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
          if (byId) appUserId = (byId as any).id
          if (!appUserId && user.email) {
            const { data: byEmail } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle()
            appUserId = (byEmail as any)?.id ?? null
          }
          if (appUserId) {
            setCurrentUser({ id: appUserId })
            return
          }
        }
      } catch {}
      // 2) Fallback to dev-user
      const raw = typeof window !== 'undefined' ? localStorage.getItem('dev-user') : null
      if (raw) {
        try { const parsed = JSON.parse(raw); if (parsed?.id) setCurrentUser({ id: parsed.id }) } catch {}
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const load = async () => {
      try {
        setLoading(true)
        const resp = await fetch("/api/subtickets/my", { headers: { "X-User-Id": currentUser.id } })
        const data = await resp.json()
        if (resp.ok) setTasks(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser])

  const withDays = useMemo(() => {
    const today = new Date()
    return tasks.map((t) => {
      const endRaw = t.data_esperada ?? t.data_conclusao
      const end = endRaw ? new Date(endRaw) : null
      let daysLeft: number | null = null
      if (end && !Number.isNaN(end.getTime())) {
        const diffMs = end.getTime() - today.getTime()
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      }
      return { ...t, _daysLeft: daysLeft as number | null, _end: end as Date | null }
    })
  }, [tasks])

  const filteredSorted = useMemo(() => {
    let arr: any[] = withDays
    if (Array.isArray(estadoFilter) && estadoFilter.length > 0) {
      arr = arr.filter((t) => estadoFilter.includes(t.estado))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      arr = arr.filter((t) =>
        (t.titulo || "").toLowerCase().includes(q) ||
        ((t.ticket?.assunto || "").toLowerCase().includes(q))
      )
    }
    if (sortKey === "endAsc") {
      arr = [...arr].sort((a, b) => {
        const ax = a._end ? a._end.getTime() : Infinity
        const bx = b._end ? b._end.getTime() : Infinity
        return ax - bx
      })
    } else if (sortKey === "endDesc") {
      arr = [...arr].sort((a, b) => {
        const ax = a._end ? a._end.getTime() : -Infinity
        const bx = b._end ? b._end.getTime() : -Infinity
        return bx - ax
      })
    } else {
      arr = [...arr].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return arr
  }, [withDays, estadoFilter, sortKey, search])

  const timeline = useMemo(() => {
    const parse = (value: string | null) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const rows = (filteredSorted as Task[])
      .map((task) => {
        const start = parse(task.data_inicio_planeado) ?? parse(task.data_inicio)
        const end = parse(task.data_esperada) ?? parse(task.data_conclusao)
        if (!start || !end || end.getTime() < start.getTime()) return null
        const titleParts = [task.titulo]
        if (task.ticket?.assunto) titleParts.push(`- ${task.ticket.assunto}`)
        return {
          id: task.id,
          titulo: titleParts.join(' '),
          start,
          end,
          rawStart: task.data_inicio_planeado ?? task.data_inicio,
          rawEnd: task.data_esperada ?? task.data_conclusao,
          status: normalizeStatus(task.estado),
        }
      })
      .filter(Boolean) as Array<{ id: string; titulo: string; start: Date; end: Date; rawStart: string | null; rawEnd: string | null }>

    if (!rows.length) return { rows: [], domainStart: null as Date | null, domainEnd: null as Date | null, totalDays: 0, todayPercent: null as number | null }

    const domainStart = rows.reduce((acc, row) => (row.start < acc ? row.start : acc), rows[0].start)
    const domainEnd = rows.reduce((acc, row) => (row.end > acc ? row.end : acc), rows[0].end)
    const totalMs = Math.max(1, domainEnd.getTime() - domainStart.getTime())
    const dayMs = 1000 * 60 * 60 * 24
    const totalDays = Math.max(1, Math.round(totalMs / dayMs))

    const items = rows.map((row) => {
      const offset = ((row.start.getTime() - domainStart.getTime()) / totalMs) * 100
      const width = Math.max(2, ((row.end.getTime() - row.start.getTime()) / totalMs) * 100)
      const durationDays = Math.max(1, Math.round((row.end.getTime() - row.start.getTime()) / (1000 * 60 * 60 * 24)))
      return { ...row, offset, width, durationDays }
    })
    const now = new Date()
    let todayPercent: number | null = null
    if (now >= domainStart && now <= domainEnd) {
      todayPercent = ((now.getTime() - domainStart.getTime()) / Math.max(1, domainEnd.getTime() - domainStart.getTime())) * 100
    }
    return { rows: items, domainStart, domainEnd, totalDays, todayPercent }
  }, [filteredSorted])

  return (
    <AuthenticatedLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Minhas Tarefas</h1>
            <p className="text-slate-400">Todas as tarefas onde � respons�vel</p>
          </div>
        </div>
        {featureTimeline && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-500">Cronograma das tarefas (filtradas)</h4>
              {timeline.domainStart && timeline.domainEnd ? (
                <span className="text-xs text-muted-foreground">
                  {formatDate((timeline.domainStart as any)?.toISOString?.() ?? null)} - {formatDate((timeline.domainEnd as any)?.toISOString?.() ?? null)} ({timeline.totalDays === 1 ? "1 dia" : `${timeline.totalDays} dias`})
                </span>
              ) : null}
            </div>

            {timeline.rows.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-700 p-4 text-center text-xs text-muted-foreground">
                Sem dados suficientes para desenhar o cronograma. Defina datas de in�cio/fim nas tarefas.
              </div>
            ) : (
              <div className="rounded-md border border-slate-700 bg-slate-900/60 p-4">
                <div className="relative">
                  {typeof timeline.todayPercent === 'number' ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-y-0 w-px bg-white/80"
                        style={{ left: `${timeline.todayPercent}%` }}
                        title="Hoje"
                      />
                      <div
                        className="pointer-events-none absolute -top-2 text-[10px] leading-none px-1.5 py-0.5 rounded bg-slate-800/80 text-white"
                        style={{ left: `${timeline.todayPercent}%`, transform: 'translateX(-50%)' }}
                      >
                        Hoje
                      </div>
                    </>
                  ) : null}
                  <div className="space-y-3">
                    {timeline.rows.map((row: any) => (
                      <div key={row.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{row.titulo}</span>
                          <span className="text-muted-foreground">
                            {formatDate(row.rawStart)} - {formatDate(row.rawEnd)} ({row.durationDays === 1 ? "1 dia" : `${row.durationDays} dias`})
                          </span>
                        </div>
                        <div className="relative h-6 rounded bg-slate-900/70">
                          <div
                            className={"absolute top-1/2 h-3 -translate-y-1/2 rounded shadow-sm " + (strongStatusColors[(row as any).status] ?? 'bg-slate-500 text-white')}
                            style={{ left: `${row.offset}%`, width: `${row.width}%` }}
                            title={`${formatDate(row.rawStart)} - ${formatDate(row.rawEnd)}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-slate-300">Estado:</span>
            {allEstados.map((s) => (
              <label key={s} className="inline-flex items-center gap-1 text-slate-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber-600"
                  checked={estadoFilter.includes(s)}
                  onChange={(e) => {
                    setEstadoFilter((prev) => {
                      const set = new Set(prev)
                      if (e.target.checked) set.add(s)
                      else set.delete(s)
                      return Array.from(set)
                    })
                  }}
                />
                <span>{statusLabels[s]}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-slate-300">Ordenar por:</label>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100">
              <option value="endAsc">Fim (mais cedo)</option>
              <option value="endDesc">Fim (mais tarde)</option>
              <option value="createdDesc">Mais recentes</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por t�tulo/assunto..."
              className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100 w-64"
              type="text"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center">A carregar...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">Sem tarefas atribu�das</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredSorted.map((t: any) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-100">{t.titulo}</div>
                  <div className="text-xs text-slate-400">{t.ticket?.assunto ?? "Ticket"}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className={strongStatusColors[normalizeStatus(t.estado)] ?? "bg-slate-200 text-slate-800"}>
                    {strongStatusLabels[normalizeStatus(t.estado)] ?? t.estado}
                  </Badge>
                  <div className="text-slate-300">In�cio: {formatDate(t.data_inicio_planeado ?? t.data_inicio)}</div>
                  <div className="text-slate-300">Fim: {formatDate(t.data_esperada ?? t.data_conclusao)}</div>
                  {typeof t._daysLeft === "number" ? (
                    <div className={`px-2 py-0.5 rounded text-xs ${t._daysLeft < 0 ? "bg-red-500/20 text-red-300" : t._daysLeft <= 3 ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                      {t._daysLeft < 0 ? `${Math.abs(t._daysLeft)} dias em atraso` : t._daysLeft === 0 ? "termina hoje" : `faltam ${t._daysLeft} dias`}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs">sem data fim</div>
                  )}
                  <a href={`/tickets/${(t as any).ticket_id ?? ""}`} className="text-amber-400 hover:underline">Abrir ticket</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}


"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from '@/lib/supabase'
import AuthenticatedLayout from "@/components/AuthenticatedLayout"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  titulo: string
  descricao?: string | null
  estado: string
  prioridade: number
  urgencia: number
  importancia: number
  data_inicio: string | null
  data_inicio_planeado: string | null
  data_esperada: string | null
  data_conclusao: string | null
  created_at: string
  assignee: { id?: string; name: string; email: string } | null
  ticket?: { assunto: string } | null
}

// Labels e cores vivas normalizadas por estado
const strongStatusLabels: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  em_curso: "Em curso",
  em_validacao: "Em validação",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
}
const strongStatusColors: Record<string, string> = {
  novo: "bg-sky-600 text-white",
  em_analise: "bg-amber-500 text-white",
  em_curso: "bg-orange-600 text-white",
  em_validacao: "bg-violet-600 text-white",
  concluido: "bg-emerald-600 text-white",
  rejeitado: "bg-rose-600 text-white",
  bloqueado: "bg-slate-700 text-white",
}
const normalizeStatus = (s: string): keyof typeof strongStatusLabels => {
  const x = (s || "").toLowerCase()
  if (x.includes("anal")) return "em_analise"
  if (x.includes("valid")) return "em_validacao"
  if (x.includes("curso")) return "em_curso"
  if (x.includes("concl")) return "concluido"
  if (x.includes("rej")) return "rejeitado"
  if (x.includes("bloq")) return "bloqueado"
  if (x.includes("novo")) return "novo"
  return "novo"
}

const allEstados = [
  "novo",
  "em_analise",
  "em_curso",
  "em_validacao",
  "concluido",
  "rejeitado",
  "bloqueado",
] as const

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-PT")
}

export default function MinhasTarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const defaultEstados = allEstados.filter((s) => !["concluido", "rejeitado", "bloqueado"].includes(s))
  const [estadoFilter, setEstadoFilter] = useState<string[]>(defaultEstados as unknown as string[])
  const [sortKey, setSortKey] = useState<"endAsc" | "endDesc" | "createdDesc">("endAsc")
  const [search, setSearch] = useState<string>("")
  const featureTimeline = ((process.env.NEXT_PUBLIC_FEATURE_MY_TASKS_TIMELINE ?? 'on').toString().toLowerCase()) !== 'off'

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          let appUserId: string | null = null
          const { data: byId } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
          if (byId) appUserId = (byId as any).id
          if (!appUserId && user.email) {
            const { data: byEmail } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle()
            appUserId = (byEmail as any)?.id ?? null
          }
          if (appUserId) {
            setCurrentUser({ id: appUserId })
            return
          }
        }
      } catch {}
      const raw = typeof window !== 'undefined' ? localStorage.getItem('dev-user') : null
      if (raw) {
        try { const parsed = JSON.parse(raw); if (parsed?.id) setCurrentUser({ id: parsed.id }) } catch {}
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const load = async () => {
      try {
        setLoading(true)
        const resp = await fetch("/api/subtickets/my", { headers: { "X-User-Id": currentUser.id } })
        const data = await resp.json()
        if (resp.ok) setTasks(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser])

  const withDays = useMemo(() => {
    const today = new Date()
    return tasks.map((t) => {
      const endRaw = t.data_esperada ?? t.data_conclusao
      const end = endRaw ? new Date(endRaw) : null
      let daysLeft: number | null = null
      if (end && !Number.isNaN(end.getTime())) {
        const diffMs = end.getTime() - today.getTime()
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      }
      return { ...t, _daysLeft: daysLeft as number | null, _end: end as Date | null }
    })
  }, [tasks])

  const filteredSorted = useMemo(() => {
    let arr: any[] = withDays
    if (Array.isArray(estadoFilter) && estadoFilter.length > 0) {
      arr = arr.filter((t) => estadoFilter.includes(normalizeStatus(t.estado)))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      arr = arr.filter((t) =>
        (t.titulo || "").toLowerCase().includes(q) ||
        ((t.ticket?.assunto || "").toLowerCase().includes(q))
      )
    }
    if (sortKey === "endAsc") {
      arr = [...arr].sort((a, b) => {
        const ax = a._end ? a._end.getTime() : Infinity
        const bx = b._end ? b._end.getTime() : Infinity
        return ax - bx
      })
    } else if (sortKey === "endDesc") {
      arr = [...arr].sort((a, b) => {
        const ax = a._end ? a._end.getTime() : -Infinity
        const bx = b._end ? b._end.getTime() : -Infinity
        return bx - ax
      })
    } else {
      arr = [...arr].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return arr
  }, [withDays, estadoFilter, sortKey, search])

  const timeline = useMemo(() => {
    const parse = (value: string | null) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const rows = (filteredSorted as Task[])
      .map((task) => {
        const start = parse(task.data_inicio_planeado) ?? parse(task.data_inicio)
        const end = parse(task.data_esperada) ?? parse(task.data_conclusao)
        if (!start || !end || end.getTime() < start.getTime()) return null
        const titleParts = [task.titulo]
        if (task.ticket?.assunto) titleParts.push(`- ${task.ticket.assunto}`)
        return {
          id: task.id,
          titulo: titleParts.join(' '),
          start,
          end,
          rawStart: task.data_inicio_planeado ?? task.data_inicio,
          rawEnd: task.data_esperada ?? task.data_conclusao,
          status: normalizeStatus(task.estado),
        }
      })
      .filter(Boolean) as Array<{ id: string; titulo: string; start: Date; end: Date; rawStart: string | null; rawEnd: string | null; status: keyof typeof strongStatusColors }>

    if (!rows.length) return { rows: [], domainStart: null as Date | null, domainEnd: null as Date | null, totalDays: 0, todayPercent: null as number | null }

    const domainStart = rows.reduce((acc, row) => (row.start < acc ? row.start : acc), rows[0].start)
    const domainEnd = rows.reduce((acc, row) => (row.end > acc ? row.end : acc), rows[0].end)
    const totalMs = Math.max(1, domainEnd.getTime() - domainStart.getTime())
    const dayMs = 1000 * 60 * 60 * 24
    const totalDays = Math.max(1, Math.round(totalMs / dayMs))

    const items = rows.map((row) => {
      const offset = ((row.start.getTime() - domainStart.getTime()) / totalMs) * 100
      const width = Math.max(2, ((row.end.getTime() - row.start.getTime()) / totalMs) * 100)
      const durationDays = Math.max(1, Math.round((row.end.getTime() - row.start.getTime()) / (1000 * 60 * 60 * 24)))
      return { ...row, offset, width, durationDays }
    })
    const now = new Date()
    let todayPercent: number | null = null
    if (now >= domainStart && now <= domainEnd) {
      todayPercent = ((now.getTime() - domainStart.getTime()) / Math.max(1, domainEnd.getTime() - domainStart.getTime())) * 100
    }
    return { rows: items, domainStart, domainEnd, totalDays, todayPercent }
  }, [filteredSorted])

  return (
    <AuthenticatedLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Minhas Tarefas</h1>
            <p className="text-slate-400">Todas as tarefas onde é responsável</p>
          </div>
        </div>
        {featureTimeline && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-500">Cronograma das tarefas (filtradas)</h4>
              {timeline.domainStart && timeline.domainEnd ? (
                <span className="text-xs text-muted-foreground">
                  {formatDate((timeline.domainStart as any)?.toISOString?.() ?? null)} - {formatDate((timeline.domainEnd as any)?.toISOString?.() ?? null)} ({timeline.totalDays === 1 ? "1 dia" : `${timeline.totalDays} dias`})
                </span>
              ) : null}
            </div>

            {timeline.rows.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-700 p-4 text-center text-xs text-muted-foreground">
                Sem dados suficientes para desenhar o cronograma. Defina datas de início/fim nas tarefas.
              </div>
            ) : (
              <div className="rounded-md border border-slate-700 bg-slate-900/60 p-4">
                <div className="relative">
                  {typeof timeline.todayPercent === 'number' ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-y-0 w-px bg-white/80"
                        style={{ left: `${timeline.todayPercent}%` }}
                        title="Hoje"
                      />
                      <div
                        className="pointer-events-none absolute -top-2 text-[10px] leading-none px-1.5 py-0.5 rounded bg-slate-800/80 text-white"
                        style={{ left: `${timeline.todayPercent}%`, transform: 'translateX(-50%)' }}
                      >
                        Hoje
                      </div>
                    </>
                  ) : null}
                  <div className="space-y-3">
                    {timeline.rows.map((row: any) => (
                      <div key={row.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{row.titulo}</span>
                          <span className="text-muted-foreground">
                            {formatDate(row.rawStart)} - {formatDate(row.rawEnd)} ({row.durationDays === 1 ? "1 dia" : `${row.durationDays} dias`})
                          </span>
                        </div>
                        <div className="relative h-6 rounded bg-slate-900/70">
                          <div
                            className={"absolute top-1/2 h-3 -translate-y-1/2 rounded shadow-sm " + (strongStatusColors[(row as any).status] ?? 'bg-slate-500 text-white')}
                            style={{ left: `${row.offset}%`, width: `${row.width}%` }}
                            title={`${formatDate(row.rawStart)} - ${formatDate(row.rawEnd)}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-slate-300">Estado:</span>
            {allEstados.map((s) => (
              <label key={s} className="inline-flex items-center gap-1 text-slate-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-amber-600"
                  checked={estadoFilter.includes(s)}
                  onChange={(e) => {
                    setEstadoFilter((prev) => {
                      const set = new Set(prev)
                      if (e.target.checked) set.add(s)
                      else set.delete(s)
                      return Array.from(set)
                    })
                  }}
                />
                <span>{strongStatusLabels[s] ?? s}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-slate-300">Ordenar por:</label>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100">
              <option value="endAsc">Fim (mais cedo)</option>
              <option value="endDesc">Fim (mais tarde)</option>
              <option value="createdDesc">Mais recentes</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por título/assunto..."
              className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100 w-64"
              type="text"
            />
          </div>
        </div>
        {loading ? (
          <div className="text-center">A carregar...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">Sem tarefas atribuídas</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredSorted.map((t: any) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-100">{t.titulo}</div>
                  <div className="text-xs text-slate-400">{t.ticket?.assunto ?? "Ticket"}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge className={strongStatusColors[normalizeStatus(t.estado)] ?? "bg-slate-200 text-slate-800"}>
                    {strongStatusLabels[normalizeStatus(t.estado)] ?? t.estado}
                  </Badge>
                  <div className="text-slate-300">Início: {formatDate(t.data_inicio_planeado ?? t.data_inicio)}</div>
                  <div className="text-slate-300">Fim: {formatDate(t.data_esperada ?? t.data_conclusao)}</div>
                  {typeof t._daysLeft === "number" ? (
                    <div className={`px-2 py-0.5 rounded text-xs ${t._daysLeft < 0 ? "bg-red-500/20 text-red-300" : t._daysLeft <= 3 ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                      {t._daysLeft < 0 ? `${Math.abs(t._daysLeft)} dias em atraso` : t._daysLeft === 0 ? "termina hoje" : `faltam ${t._daysLeft} dias`}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs">sem data fim</div>
                  )}
                  <a href={`/tickets/${(t as any).ticket_id ?? ""}`} className="text-amber-400 hover:underline">Abrir ticket</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
