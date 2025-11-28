"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from '@/lib/supabase'
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Eye, Trash, Copy } from "lucide-react"

interface Ticket {
  id: string
  assunto: string
  descricao: string | null
  estado: string
  pedido_por: string
  data_pedido: string
  data_esperada: string | null
  prioridade: number
  urgencia: number
  importancia: number
  gestor_id?: string | null
  gestor?: { name: string; email: string } | null
}

interface TicketsResponse {
  tickets: Ticket[]
  total: number
}

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  em_curso: "Em curso",
  em_validacao: "Em validação",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
  "Aguardando 3ºs": "Aguardando 3ºs",
  Standby: "Standby",
}

const allEstados = Object.keys(statusLabels)
const defaultEstados = allEstados.filter(
  (s) => !["concluido", "rejeitado", "bloqueado"].includes(s)
)

// Ordem específica para exibição dos grupos de estados
const estadoOrder = [
  "novo",
  "em_curso",
  "em_validacao",
  "em_analise",
  "Aguardando 3ºs",
  "Standby",
  "concluido",
  "bloqueado",
  "rejeitado",
]

const statusColors: Record<string, string> = {
  novo: "bg-sky-600 text-white",
  em_analise: "bg-amber-500 text-white",
  em_curso: "bg-orange-600 text-white",
  em_validacao: "bg-violet-600 text-white",
  concluido: "bg-emerald-600 text-white",
  rejeitado: "bg-rose-600 text-white",
  bloqueado: "bg-slate-700 text-white",
  "Aguardando 3ºs": "bg-amber-500 text-white",
  Standby: "bg-violet-600 text-white",
}

const priorityColors: Record<number, string> = {
  1: "bg-emerald-600 text-white",
  2: "bg-green-200 text-green-900",
  3: "bg-lime-200 text-lime-900",
  4: "bg-amber-500 text-white",
  5: "bg-yellow-200 text-yellow-900",
  6: "bg-orange-200 text-orange-900",
  7: "bg-orange-300 text-orange-900",
  8: "bg-rose-600 text-white",
  9: "bg-red-200 text-red-900",
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("pt-PT")
}

const formatPriority = (urgencia: number, importancia: number) => {
  if (!urgencia || !importancia) return "-"
  return urgencia * importancia
}

const daysUntil = (value: string | null | undefined) => {
  if (!value) return null
  const end = new Date(value)
  if (Number.isNaN(end.getTime())) return null
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const diffMs = endMid.getTime() - start.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export default function TicketsList() {
  const { toast } = useToast()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [estadoFilter, setEstadoFilter] = useState<string[]>(defaultEstados)
  const [responsavelFilter, setResponsavelFilter] = useState<"me" | "all" | "none">("me")
  const [search, setSearch] = useState<string>("")

  const fetchTickets = async () => {
    try {
      setLoading(true)
      // Descobrir utilizador atual e perfil para passar headers à API
      let currentId: string | null = null
      let currentRole: string | null = null
      let appUserId: string | null = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Resolver utilizador da app (tabela users) por id ou email
          const { data: byId } = await supabase.from('users').select('id, role, email').eq('id', user.id).maybeSingle()
          if (byId) {
            appUserId = (byId as any).id
            currentRole = (byId as any)?.role ?? null
          } else if (user.email) {
            const { data: byEmail } = await supabase.from('users').select('id, role').eq('email', user.email).maybeSingle()
            appUserId = (byEmail as any)?.id ?? null
            if (!currentRole) currentRole = (byEmail as any)?.role ?? null
          }
          // fallback por email para admin (igual ao Header)
          if (!currentRole && user.email) {
            const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
              .split(',')
              .map(s => s.trim().toLowerCase())
              .filter(Boolean)
            if (admins.includes(user.email.toLowerCase())) currentRole = 'admin'
          }
          currentId = appUserId || user.id
        }
      } catch {}
      if (!currentId && typeof window !== 'undefined') {
        const raw = localStorage.getItem('dev-user')
        if (raw) {
          try {
            const dev = JSON.parse(raw)
            currentId = dev?.id ?? null
            currentRole = dev?.role ?? null
          } catch {}
        }
      }

      const headers: HeadersInit = {}
      if (currentId) (headers as any)['X-User-Id'] = currentId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole

      const response = await fetch("/api/tickets", { headers })
      const data: TicketsResponse = await response.json()
      if (!response.ok) {
        throw new Error((data as any)?.error || "Erro ao carregar tickets")
      }
      setTickets(data.tickets || [])
      setCurrentUserId(currentId)
      setCurrentUserRole(currentRole)
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao carregar tickets", variant: "destructive" })
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const filteredTickets = useMemo(() => {
    let arr = tickets

    if (Array.isArray(estadoFilter) && estadoFilter.length > 0) {
      arr = arr.filter((t) => estadoFilter.includes(t.estado))
    }

    if (responsavelFilter === "me" && currentUserId) {
      arr = arr.filter((t) => t.gestor_id === currentUserId)
    } else if (responsavelFilter === "none") {
      arr = arr.filter((t) => !t.gestor_id)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      arr = arr.filter((t) =>
        (t.assunto || "").toLowerCase().includes(q) ||
        (t.descricao || "").toLowerCase().includes(q) ||
        (t.gestor?.name || "").toLowerCase().includes(q)
      )
    }

    return arr
  }, [tickets, estadoFilter, responsavelFilter, search, currentUserId])

  const canDelete = (t: Ticket) => {
    if (!currentUserId) return false
    if (currentUserRole === 'admin') return true
    if (t.gestor_id && t.gestor_id === currentUserId) return true
    return false
  }

  const handleDuplicate = async (ticket: Ticket) => {
    try {
      const headers: HeadersInit = {}
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentUserRole) (headers as any)['X-User-Role'] = currentUserRole

      const res = await fetch(`/api/tickets/${ticket.id}/duplicate`, {
        method: 'POST',
        headers,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any))
        throw new Error((data as any)?.error || 'Não foi possível duplicar o ticket')
      }

      toast({
        title: 'Ticket duplicado',
        description: 'Foi criado um novo ticket com os mesmos dados principais.',
      })

      await fetchTickets()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao duplicar o ticket',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (ticket: Ticket) => {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('Tem a certeza que pretende eliminar este ticket e todas as tarefas associadas? Esta ação é irreversível.')
      : false
    if (!confirmed) return

    try {
      const headers: HeadersInit = {}
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentUserRole) (headers as any)['X-User-Role'] = currentUserRole
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any))
        throw new Error((data as any)?.error || 'Não foi possível eliminar o ticket')
      }
      toast({ title: 'Eliminado', description: 'O ticket e as suas tarefas foram eliminados.' })
      setTickets(prev => prev.filter(t => t.id !== ticket.id))
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Falha ao eliminar o ticket', variant: 'destructive' })
    }
  }

  const groupedByEstado = useMemo(() => {
    const groups = new Map<string, Ticket[]>()
    for (const ticket of filteredTickets) {
      const group = groups.get(ticket.estado) ?? []
      group.push(ticket)
      groups.set(ticket.estado, group)
    }
    const entries = Array.from(groups.entries()).map(([estado, items]) => ({ estado, items }))
    // Ordenar grupos pela ordem definida
    return entries.sort((a, b) => {
      const indexA = estadoOrder.indexOf(a.estado)
      const indexB = estadoOrder.indexOf(b.estado)
      // Se o estado não estiver na ordem, colocar no final
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }, [filteredTickets])

if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">A carregar tickets...</div>
        </CardContent>
      </Card>
    )
  }

if (tickets.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>Ainda não existem tickets registados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm">
            Crie um novo ticket para começar a gerir o trabalho da equipa.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
              <span>{statusLabels[s] ?? s}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-300">Responsável:</span>
            <select
              value={responsavelFilter}
              onChange={(e) => setResponsavelFilter(e.target.value as any)}
              className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100"
            >
              <option value="me">Meus tickets</option>
              <option value="all">Todos</option>
              <option value="none">Sem responsável</option>
            </select>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar por assunto/descrição..."
            className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100 min-w-[220px]"
            type="text"
          />
        </div>
      </div>
      {groupedByEstado.map(({ estado, items }) => (
        <Card key={estado} className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Badge className={statusColors[estado] ?? "bg-slate-200 text-slate-800"}>
                {statusLabels[estado] ?? estado}
              </Badge>
            </div>
            <CardDescription className="text-slate-400">
              {items.length === 1 ? "Há 1 ticket neste estado." : `Há ${items.length} tickets neste estado.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Pedido por</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Data do pedido</TableHead>
                  <TableHead>Data conclusão esperada</TableHead>
                  <TableHead>Dias p/ fim</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ticket) => {
                  const computedPriority = formatPriority(ticket.urgencia, ticket.importancia)
                  const colorClass = typeof computedPriority === "number" ? priorityColors[computedPriority] : undefined
                  const d = daysUntil(ticket.data_esperada)
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{ticket.assunto}</span>
                          {ticket.gestor?.name && (
                            <span className="text-xs text-muted-foreground">Gestor: {ticket.gestor.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.pedido_por}</TableCell>
                      <TableCell>{ticket.gestor?.name ?? "-"}</TableCell>
                      <TableCell>{formatDate(ticket.data_pedido)}</TableCell>
                      <TableCell>{formatDate(ticket.data_esperada)}</TableCell>
                      <TableCell>
                        {d == null ? (
                          <span className="text-slate-400 text-xs">sem data</span>
                        ) : d < 0 ? (
                          <span className="text-red-300 text-xs">{Math.abs(d)} dias em atraso</span>
                        ) : d === 0 ? (
                          <span className="text-amber-300 text-xs">termina hoje</span>
                        ) : (
                          <span className="text-emerald-300 text-xs">faltam {d} dias</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={colorClass ?? "bg-slate-200 text-slate-800"}>{computedPriority}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/tickets/${ticket.id}`}>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label="Ver"
                              className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Duplicar"
                            className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                            onClick={() => handleDuplicate(ticket)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {canDelete(ticket) && (
                            <Button
                              variant="destructive"
                              size="icon"
                              aria-label="Eliminar"
                              className="h-9 w-9 p-0 rounded-md"
                              onClick={() => handleDelete(ticket)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
