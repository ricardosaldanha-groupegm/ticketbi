"use client"

import { useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

import { ArrowLeft, Edit, Save, X } from "lucide-react"

import TasksList from "./TasksList"
import CommentsList from "./CommentsList"
import AttachmentsList from "./AttachmentsList"

interface Ticket {
  id: string
  assunto: string
  descricao: string | null
  objetivo: string | null
  estado: string
  prioridade: number
  urgencia: number
  importancia: number
  pedido_por: string
  data_pedido: string
  data_esperada: string | null
  sla_date: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  gestor_id: string | null
  created_by_user: { name: string; email: string }
  gestor: { name: string; email: string } | null
}

const updateTicketSchema = z.object({
  descricao: z.string().min(1, "Campo obrigatorio"),
  objetivo: z.string().min(1, "Campo obrigatorio"),
  internal_notes: z.string().optional(),
  urgencia: z.number().int().min(1).max(3).optional(),
  importancia: z.number().int().min(1).max(3).optional(),
})

type UpdateTicketForm = z.infer<typeof updateTicketSchema>

const statusColors: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  em_curso: "bg-orange-100 text-orange-800",
  em_validacao: "bg-purple-100 text-purple-800",
  concluido: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  bloqueado: "bg-gray-100 text-gray-800",
}

const priorityColors: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-orange-100 text-orange-800",
  4: "bg-red-100 text-red-800",
  5: "bg-red-200 text-red-900",
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    novo: "Novo",
    em_analise: "Em an├ílise",
    em_curso: "Em curso",
    em_validacao: "Em valida├º├úo",
    concluido: "Conclu├¡do",
    rejeitado: "Rejeitado",
    bloqueado: "Bloqueado",
  }
  return labels[status] ?? status
}

const getLevelLabel = (value: number) => {
  const labels: Record<number, string> = {
    1: "Baixa",
    2: "M├®dia",
    3: "Elevada",
  }
  return labels[value] ?? String(value)
}

const formatDate = (value: string) => {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function TicketDetails({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const { toast } = useToast()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("tasks")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [taskPeople, setTaskPeople] = useState<string[]>([])
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [biUsers, setBiUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedGestorId, setSelectedGestorId] = useState<string>("")
  const [isUpdatingGestor, setIsUpdatingGestor] = useState(false)
  // Interessados (watchers) – estado (sem UI)
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [interestedIds, setInterestedIds] = useState<string[]>([])
  const [savingInterested, setSavingInterested] = useState(false)
  const [openInterested, setOpenInterested] = useState(false)
  // Dropdown de interessados (edição)
  const [openInterestedEdit, setOpenInterestedEdit] = useState(false)
  const [interestedQuery, setInterestedQuery] = useState("")

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateTicketForm>({
    resolver: zodResolver(updateTicketSchema),
  })

  const fetchTicket = async () => {
    try {
      setLoading(true)
      // Build effective headers; derive from Supabase if state not ready yet
      let effUserId = currentUserId
      let effRole = currentRole
      if (!effUserId) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // resolve app users.id by id or email
            const { data: byId } = await supabase.from('users').select('id, role').eq('id', user.id).maybeSingle()
            effUserId = (byId as any)?.id ?? null
            effRole = (byId as any)?.role ?? effRole
            if (!effUserId && user.email) {
              const { data: byEmail } = await supabase.from('users').select('id, role').eq('email', user.email).maybeSingle()
              effUserId = (byEmail as any)?.id ?? null
              effRole = effRole ?? (byEmail as any)?.role ?? null
            }
          }
        } catch {}
      }
      const headers: HeadersInit = {}
      if (effUserId) (headers as any)['X-User-Id'] = effUserId
      if (effRole) (headers as any)['X-User-Role'] = effRole
      const response = await fetch(`/api/tickets/${ticketId}`, { headers })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar ticket")
      }

      setTicket(data)
      setSelectedGestorId(data.gestor_id ?? "")
      reset({
        descricao: data.descricao ?? "",
        objetivo: data.objetivo ?? "",
        internal_notes: data.internal_notes ?? "",
        urgencia: data.urgencia ?? 1,
        importancia: data.importancia ?? 1,
      })
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao carregar ticket", variant: "destructive" })
      router.push("/tickets")
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskPeople = async () => {
    try {
      const headers: HeadersInit = {}
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole
      const response = await fetch(`/api/tickets/${ticketId}/subtickets`, { headers })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data)) return
      const names = Array.from(
        new Set(
          data
            .map((t: any) => t?.assignee?.name)
            .filter((n: any): n is string => typeof n === "string" && n.trim().length > 0)
        )
      )
      setTaskPeople(names)
    } catch (_) {
      // ignore silently for people list
    }
  }

  const fetchBIUsers = async () => {
    try {
      // apenas para admin/bi
      if (currentRole !== 'admin' && currentRole !== 'bi') return
      const response = await fetch(`/api/users`)
      const payload = await response.json()
      if (!response.ok || !Array.isArray(payload?.users)) return
      const list = (payload.users as any[])
        .filter((u: any) => (u?.role === 'bi' || u?.role === 'admin'))
        .slice()
        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
      setBiUsers(list)
    } catch (_) {
      // ignore silently
    }
  }

  // Guardar interessados (sem UI dedicada; chamado pelo botão no dropdown)
  const updateInterested = async () => {
    try {
      setSavingInterested(true)
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole
      const resp = await fetch('/api/tickets/' + ticketId + '/interested', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ users: interestedIds }),
      })
      const payload = await resp.json()
      if (!resp.ok) throw new Error(payload?.error || 'Erro ao atualizar interessados')
      toast({ title: 'Sucesso', description: 'Interessados atualizados.' })
      setOpenInterested(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao atualizar interessados', variant: 'destructive' })
    } finally {
      setSavingInterested(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const headers: HeadersInit = {}
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole
      const resp = await fetch(`/api/users`, { headers })
      const payload = await resp.json()
      if (resp.ok && Array.isArray(payload?.users)) {
        const list = (payload.users as any[])
          .slice()
          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
        setAllUsers(list.map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
      }
    } catch {}
  }

  const fetchInterested = async () => {
    try {
      const headers: HeadersInit = {}
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole
      const resp = await fetch(`/api/tickets/${ticketId}/interested`, { headers })
      const payload = await resp.json()
      if (resp.ok && Array.isArray(payload?.users)) {
        const ids = (payload.users as any[]).map((u: any) => u.id).filter(Boolean)
        setInterestedIds(ids)
      }
    } catch {}
  }


  const updateGestor = async () => {
    if (!ticket) return
    setIsUpdatingGestor(true)
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ gestor_id: selectedGestorId || null }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar gestor")
      }
      setTicket(data)
      toast({ title: "Sucesso", description: "Gestor atualizado com sucesso." })
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao atualizar gestor", variant: "destructive" })
    } finally {
      setIsUpdatingGestor(false)
    }
  }

  const onSubmit = async (formData: UpdateTicketForm) => {
    if (!ticket) return
    setIsSaving(true)
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      if (currentRole) (headers as any)['X-User-Role'] = currentRole
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(formData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar ticket")
      }
      const updated = await response.json()
      setTicket(updated)
      setIsEditing(false)
      toast({ title: "Sucesso", description: "Ticket atualizado com sucesso." })
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao atualizar ticket", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => setIsEditing(true)

  const handleCancel = () => {
    if (ticket) {
      reset({
        descricao: ticket.descricao ?? "",
        objetivo: ticket.objetivo ?? "",
        internal_notes: ticket.internal_notes ?? "",
        urgencia: ticket.urgencia ?? 1,
        importancia: ticket.importancia ?? 1,
      })
    }
    setIsEditing(false)
  }

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return
      // 1) Real Supabase session
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsAuthenticated(true)
          // Resolver utilizador da app (tabela users) por id ou email
          let appUserId: string | null = null
          const { data: byId } = await supabase.from('users').select('id, role').eq('id', user.id).maybeSingle()
          if (byId) appUserId = (byId as any).id
          if (!appUserId && user.email) {
            const { data: byEmail } = await supabase.from('users').select('id, role').eq('email', user.email).maybeSingle()
            appUserId = (byEmail as any)?.id ?? null
          }
          setCurrentUserId(appUserId || user.id)
          // fetch role from users; fallback to admin via env list
          let role: string | null = null
          const { data } = await supabase.from('users').select('role').eq('id', appUserId || user.id).maybeSingle()
          role = (data as any)?.role ?? null
          if (!role && user.email) {
            const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
              .split(',')
              .map(s => s.trim().toLowerCase())
              .filter(Boolean)
            if (admins.includes(user.email.toLowerCase())) role = 'admin'
          }
          setCurrentRole(role)
          fetchTicket()
          fetchTaskPeople()
          fetchBIUsers()
          fetchAllUsers()
          fetchInterested()
          return
        }
      } catch {}

      // 2) Dev fallback
      const devUser = localStorage.getItem('dev-user')
      if (devUser) {
        setIsAuthenticated(true)
        try {
          const parsed = JSON.parse(devUser)
          setCurrentRole(parsed?.role || null)
          setCurrentUserId(parsed?.id || null)
        } catch (_) {}
        fetchTicket()
        fetchTaskPeople()
        fetchBIUsers()
        fetchAllUsers()
        fetchInterested()
        return
      }
      router.push('/login')
    }
    checkAuth()
  }, [ticketId])

  useEffect(() => {
    // refetch BI users when role becomes known
    fetchBIUsers()
  }, [currentRole])

  if (!isAuthenticated) return null

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">A carregar ticket...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          aria-label="Voltar"
          className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
          onClick={() => router.push("/tickets")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-slate-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className={statusColors[ticket.estado] ?? "bg-slate-700 text-slate-100"}>
              {getStatusLabel(ticket.estado)}
            </Badge>
            <h1 className="text-2xl font-semibold">{ticket.assunto}</h1>
            <p className="text-sm text-slate-300">Pedido por {ticket.pedido_por}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 md:text-right">
            <div>
              <p className="text-slate-500">Prioridade</p>
              <Badge className={priorityColors[ticket.prioridade] ?? "bg-slate-700 text-slate-100"}>{ticket.prioridade}</Badge>
            </div>
            <div>
              <p className="text-slate-500">Data do pedido</p>
              <p>{formatDate(ticket.data_pedido)}</p>
            </div>
            {ticket.data_esperada && (
              <div>
                <p className="text-slate-500">Data esperada</p>
                <p>{formatDate(ticket.data_esperada)}</p>
              </div>
            )}
            {ticket.sla_date && (
              <div>
                <p className="text-slate-500">SLA</p>
                <p>{formatDate(ticket.sla_date)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,0.66fr)]">
        <div className="space-y-4">
          <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="comments">Coment├írios</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
              {isEditing && <TabsTrigger value="edit">Editar</TabsTrigger>}
            </TabsList>

            {isEditing && (
              <TabsContent value="edit" className="space-y-4">
                {(currentRole === 'admin' || currentRole === 'bi') && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle>Atribuir gestor</CardTitle>
                      <CardDescription>
                        Selecione um utilizador BI (ou admin) para gerir este ticket.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div className="space-y-2">
                          <Label htmlFor="gestor" className="text-slate-300">Gestor</Label>
                          <select
                            id="gestor"
                            className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                            value={selectedGestorId}
                            onChange={(e) => setSelectedGestorId(e.target.value)}
                          >
                            <option value="">Sem gestor</option>
                            {biUsers.map((u) => (
                              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3">
                          <Button type="button" onClick={updateGestor} disabled={isUpdatingGestor} className="bg-amber-600 hover:bg-amber-700">
                            {isUpdatingGestor ? 'A guardar...' : 'Guardar gestor'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {(currentRole === 'admin' || currentRole === 'bi') && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle>Utilizadores interessados</CardTitle>
                      <CardDescription>
                        Selecionar utilizadores (qualquer perfil) que podem consultar este ticket.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Interessados</Label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenInterestedEdit(v => !v)}
                            className="w-full flex items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-left text-slate-100 hover:bg-slate-700/80"
                            aria-haspopup="listbox"
                            aria-expanded={openInterestedEdit}
                          >
                            <span className="truncate">
                              {interestedIds.length === 0 ? 'Selecionar utilizadores...' : `Selecionados (${interestedIds.length})`}
                            </span>
                            <svg className={`h-4 w-4 transition-transform ${openInterestedEdit ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {openInterestedEdit && (
                            <div className="absolute z-50 mt-2 w-full rounded-md border border-slate-600 bg-slate-800 shadow-lg">
                              <div className="p-2 border-b border-slate-700">
                                <input
                                  type="text"
                                  value={interestedQuery}
                                  onChange={(e) => setInterestedQuery(e.target.value)}
                                  placeholder="Procurar por nome ou email..."
                                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none"
                                />
                              </div>
                              <div className="max-h-56 overflow-auto">
                                <ul className="p-2 space-y-1" role="listbox" aria-multiselectable="true">
                                  {allUsers
                                    .filter(u => {
                                      const q = interestedQuery.trim().toLowerCase()
                                      if (!q) return true
                                      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                                    })
                                    .map((u) => (
                                    <li key={u.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-700/60 rounded">
                                      <input
                                        type="checkbox"
                                        className="accent-amber-600"
                                        checked={interestedIds.includes(u.id)}
                                        onChange={(e) => {
                                          setInterestedIds(prev => e.target.checked ? Array.from(new Set([...prev, u.id])) : prev.filter(x => x !== u.id))
                                        }}
                                      />
                                      <span className="text-slate-100 truncate">{u.name}</span>
                                      <span className="text-slate-400 text-xs truncate">({u.email})</span>
                                    </li>
                                  ))}
                                  {allUsers.filter(u => {
                                    const q = interestedQuery.trim().toLowerCase()
                                    if (!q) return true
                                    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
                                  }).length === 0 && (
                                    <li className="px-3 py-2 text-sm text-slate-400">Sem resultados</li>
                                  )}
                                </ul>
                              </div>
                              <div className="p-2 border-t border-slate-700 flex items-center justify-between">
                                <span className="text-xs text-slate-400">{interestedIds.length} selecionado(s)</span>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" className="h-8 px-2" onClick={() => setOpenInterestedEdit(false)}>Fechar</Button>
                                  <Button type="button" onClick={async () => { await updateInterested(); setOpenInterestedEdit(false) }} disabled={savingInterested} className="bg-amber-600 hover:bg-amber-700 h-8 px-2">
                                    {savingInterested ? 'A guardar...' : 'Guardar'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle>Editar ticket</CardTitle>
                    <CardDescription>
                      Pode editar descri├º├úo, objetivo e notas internas. Os restantes campos s├úo apenas de leitura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-slate-300">Assunto</Label>
                          <div className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200">{ticket.assunto}</div>
                        </div>
                        <div>
                          <Label className="text-slate-300">Estado</Label>
                          <div className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200">{getStatusLabel(ticket.estado)}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descricao" className="text-slate-300">Descri├º├úo *</Label>
                        <Textarea id="descricao" rows={4} className="bg-slate-700 text-slate-100" {...register("descricao")} />
                        {errors.descricao && (<p className="text-sm text-red-400">{errors.descricao.message}</p>)}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="objetivo" className="text-slate-300">Objetivo do pedido *</Label>
                        <Textarea id="objetivo" rows={3} className="bg-slate-700 text-slate-100" {...register("objetivo")} />
                        {errors.objetivo && (<p className="text-sm text-red-400">{errors.objetivo.message}</p>)}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="urgencia" className="text-slate-300">Urg├¬ncia (1-3)</Label>
                          <select id="urgencia" className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" {...register("urgencia", { valueAsNumber: true })}>
                            <option value="1">1 - Baixa</option>
                            <option value="2">2 - M├®dia</option>
                            <option value="3">3 - Elevada</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="importancia" className="text-slate-300">Import├óncia (1-3)</Label>
                          <select id="importancia" className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" {...register("importancia", { valueAsNumber: true })}>
                            <option value="1">1 - Baixa</option>
                            <option value="2">2 - M├®dia</option>
                            <option value="3">3 - Elevada</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal_notes" className="text-slate-300">Notas internas</Label>
                        <Textarea id="internal_notes" rows={3} className="bg-slate-700 text-slate-100" {...register("internal_notes")} />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          variant="outline"
                          size="icon"
                          aria-label="Guardar"
                          className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                        >
                          {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Cancelar"
                          onClick={handleCancel}
                          className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="tasks">
              <TasksList ticketId={ticketId} onEditTicket={() => { setIsEditing(true); setActiveTab('edit') }} />
            </TabsContent>

            <TabsContent value="comments">
              <CommentsList ticketId={ticketId} />
            </TabsContent>

            <TabsContent value="attachments">
              <AttachmentsList ticketId={ticketId} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Prioridades</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Urg├¬ncia</span>
                <Badge className={priorityColors[ticket.urgencia] ?? "bg-slate-700 text-slate-100"}>{getLevelLabel(ticket.urgencia)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Import├óncia</span>
                <Badge className={priorityColors[ticket.importancia] ?? "bg-slate-700 text-slate-100"}>{getLevelLabel(ticket.importancia)}</Badge>
              </div>
              <div className="flex items-center justify-between order-[-1]">
                <span className="font-semibold">Prioridade</span>
                <Badge className={priorityColors[ticket.prioridade] ?? "bg-slate-700 text-slate-100"}>{ticket.prioridade}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Pessoas envolvidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <div>
                <p className="text-slate-400">Pedido por</p>
                <p>{ticket.pedido_por}</p>
              </div>
              <div>
                <p className="text-slate-400">Criado por</p>
                <p>{ticket.created_by_user.name}</p>
                <p className="text-xs text-slate-500">{ticket.created_by_user.email}</p>
              </div>
              {ticket.gestor && (
                <div>
                  <p className="text-slate-400">Gestor</p>
                  <p>{ticket.gestor.name}</p>
                  <p className="text-xs text-slate-500">{ticket.gestor.email}</p>
                </div>
              )}
              {taskPeople.filter((n) => ![ticket.pedido_por, ticket.created_by_user.name, ticket.gestor?.name].includes(n)).length > 0 && (
                <div>
                  <p className="text-slate-400">Envolvidos nas tarefas</p>
                  <ul className="mt-1 space-y-1">
                    {taskPeople
                      .filter((n) => ![ticket.pedido_por, ticket.created_by_user.name, ticket.gestor?.name].includes(n))
                      .map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-slate-400">Interessados</p>
                {interestedIds.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {interestedIds.map((id) => {
                      const u = allUsers.find((x) => x.id === id)
                      return (
                        <li key={id} className="text-slate-200">
                          {u ? (
                            <>
                              <span>{u.name}</span>
                              <span className="text-xs text-slate-500"> {u.email}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">Utilizador {id}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-500">Nenhum interessado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <div>
                <p className="text-slate-400">Criado em</p>
                <p>{formatDate(ticket.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-400">Atualizado em</p>
                <p>{formatDate(ticket.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>ID do ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all font-mono text-sm text-slate-300">{ticket.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

