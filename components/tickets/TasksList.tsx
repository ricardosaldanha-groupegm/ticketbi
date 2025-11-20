"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from '@/lib/supabase'
import { Eye, Edit, MessageSquarePlus } from "lucide-react"
import CommentsList from "./CommentsList"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  assignee_bi_id?: string | null
}

interface UserOption {
  id: string
  name: string
  email: string
}

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  em_curso: "Em curso",
  em_validacao: "Em validação",
  concluido: "Concluído",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
}

const statusColors: Record<string, string> = {
  // cores mais vivas e distinguíveis
  novo: "bg-sky-600 text-white",
  em_analise: "bg-amber-500 text-white",
  em_curso: "bg-orange-600 text-white",
  em_validacao: "bg-violet-600 text-white",
  concluido: "bg-emerald-600 text-white",
  rejeitado: "bg-rose-600 text-white",
  bloqueado: "bg-slate-700 text-white",
}

const priorityColors: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-orange-100 text-orange-800",
  4: "bg-red-100 text-red-800",
  5: "bg-red-200 text-red-900",
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("pt-PT")
}

const diffLabel = (start: string | null | undefined, end: string | null | undefined) => {
  if (!start || !end) return ""
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return ""
  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs <= 0) return ""
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return ""
  return diffDays === 1 ? "1 dia" : `${diffDays} dias`
}

const formatDateWithDiff = (value: string | null, start: string | null) => {
  const label = formatDate(value)
  const diff = diffLabel(start, value)
  return diff ? `${label} (${diff})` : label
}

export default function TasksList({ ticketId, onEditTicket }: { ticketId: string, onEditTicket?: () => void }) {
  const { toast } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [biUsers, setBiUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [sortBy, setSortBy] = useState<'titulo' | 'estado' | 'prioridade' | 'responsavel' | 'inicio_planeado' | 'esperada'>('esperada')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newAssigneeId, setNewAssigneeId] = useState("")
  const [newUrgencia, setNewUrgencia] = useState(1)
  const [newImportancia, setNewImportancia] = useState(1)
  const [newDataInicioPlaneado, setNewDataInicioPlaneado] = useState("")
  const [newDataEsperada, setNewDataEsperada] = useState("")

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editAssigneeId, setEditAssigneeId] = useState("")
  const [originalAssigneeId, setOriginalAssigneeId] = useState("")
  const [editUrgencia, setEditUrgencia] = useState(1)
  const [editImportancia, setEditImportancia] = useState(1)
  const [editEstado, setEditEstado] = useState("novo")
  const [editDataInicioPlaneado, setEditDataInicioPlaneado] = useState("")
  const [editDataEsperada, setEditDataEsperada] = useState("")
  const [editDataInicio, setEditDataInicio] = useState("")
  const [editDataConclusao, setEditDataConclusao] = useState("")
  // Comment modal state
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [isCommentUploading, setIsCommentUploading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null)

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}/subtickets`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar tarefas")
      }
      setTasks(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao carregar tarefas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTasks() }, [ticketId])

  const loadBIUsers = async () => {
    try {
      const resp = await fetch('/api/users')
      const data = await resp.json()
      if (resp.ok && Array.isArray(data?.users)) setBiUsers(data.users)
    } catch (_) {}
  }
  useEffect(() => { loadBIUsers() }, [])
  // Resolve current dev user for comments
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('dev-user')
      if (stored) setCurrentUser(JSON.parse(stored))
    } catch {}
  }, [])

  const openCreate = () => {
    setNewTitle("")
    setNewDesc("")
    setNewAssigneeId("")
    setNewUrgencia(1)
    setNewImportancia(1)
    setNewDataInicioPlaneado("")
    setNewDataEsperada("")
    setCreateOpen(true)
  }

  const submitCreate = async () => {
    if (!newTitle || !newAssigneeId) {
      toast({ title: 'Erro', description: 'Preencha título e responsável', variant: 'destructive' })
      return
    }
    setIsCreating(true)
    try {
      const resp = await fetch(`/api/tickets/${ticketId}/subtickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: newTitle,
          descricao: newDesc || undefined,
          assignee_bi_id: newAssigneeId,
          urgencia: newUrgencia,
          importancia: newImportancia,
          data_inicio_planeado: newDataInicioPlaneado || undefined,
          data_esperada: newDataEsperada || undefined,
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Erro ao criar tarefa')
      toast({ title: 'Sucesso', description: 'Tarefa criada com sucesso.' })
      setCreateOpen(false)
      loadTasks()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao criar tarefa', variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  const timeline = useMemo(() => {
    const parse = (value: string | null) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
    const rows = tasks
      .map((task) => {
        const start = parse(task.data_inicio_planeado) ?? parse(task.data_inicio)
        const end = parse(task.data_esperada) ?? parse(task.data_conclusao)
        if (!start || !end || end.getTime() < start.getTime()) return null
        const assigneeName = task.assignee?.name ?? null
        const title = assigneeName ? `${task.titulo} - ${assigneeName}` : task.titulo
        return {
          id: task.id,
          titulo: title,
          start,
          end,
          rawStart: task.data_inicio_planeado ?? task.data_inicio,
          rawEnd: task.data_esperada ?? task.data_conclusao,
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
  }, [tasks])

  const openTaskDetail = (id: string) => {
    const t = tasks.find((x) => x.id === id) || null
    setViewTask(t)
    setViewModalOpen(true)
  }
  const openCommentFor = (id: string) => {
    setCommentTaskId(id)
    setCommentText("")
    setCommentFiles([])
    setCommentOpen(true)
  }

  const openEdit = (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    setEditTaskId(t.id)
    setEditTitle(t.titulo)
    setEditDesc(t.descricao ?? "")
    const origAssignee = t.assignee_bi_id || t.assignee?.id || ""
    setEditAssigneeId(origAssignee)
    setOriginalAssigneeId(origAssignee)
    setEditUrgencia(t.urgencia)
    setEditImportancia(t.importancia)
    setEditEstado(t.estado)
    setEditDataInicioPlaneado(t.data_inicio_planeado ?? "")
    setEditDataEsperada(t.data_esperada ?? "")
    setEditDataInicio(t.data_inicio ?? "")
    setEditDataConclusao(t.data_conclusao ?? "")
    setEditOpen(true)
  }

  const submitUpdate = async () => {
    if (!editTaskId) return
    if (!editTitle || !editAssigneeId) {
      toast({ title: 'Erro', description: 'Preencha título e responsável', variant: 'destructive' })
      return
    }
    setIsUpdating(true)
    try {
      const payload: any = {
        titulo: editTitle,
        descricao: editDesc || undefined,
        urgencia: editUrgencia,
        importancia: editImportancia,
        estado: editEstado,
        data_inicio_planeado: editDataInicioPlaneado || undefined,
        data_esperada: editDataEsperada || undefined,
        data_inicio: editDataInicio || undefined,
        data_conclusao: editDataConclusao || undefined,
      }
      if (editAssigneeId && editAssigneeId !== originalAssigneeId) {
        payload.assignee_bi_id = editAssigneeId
      }
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (currentUser?.id) (headers as any)['X-User-Id'] = currentUser.id
      const resp = await fetch(`/api/subtickets/${editTaskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Erro ao atualizar tarefa')
      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso.' })
      setEditOpen(false)
      setEditTaskId(null)
      loadTasks()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao atualizar tarefa', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }
  const sortedTasks = useMemo(() => {
    const arr = [...tasks]
    const getDate = (v: string | null) => {
      if (!v) return null
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? null : d
    }
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'titulo') return dir * ((a.titulo || '').localeCompare(b.titulo || ''))
      if (sortBy === 'estado') return dir * ((a.estado || '').localeCompare(b.estado || ''))
      if (sortBy === 'prioridade') return dir * ((a.prioridade || 0) - (b.prioridade || 0))
      if (sortBy === 'responsavel') return dir * ((a.assignee?.name || '').localeCompare(b.assignee?.name || ''))
      if (sortBy === 'inicio_planeado') {
        const ad = getDate(a.data_inicio_planeado)
        const bd = getDate(b.data_inicio_planeado)
        if (!ad && !bd) return 0
        if (!ad) return 1
        if (!bd) return -1
        return dir * (ad.getTime() - bd.getTime())
      }
      // esperada (default)
      const ad = getDate(a.data_esperada)
      const bd = getDate(b.data_esperada)
      if (!ad && !bd) return 0
      if (!ad) return 1
      if (!bd) return -1
      return dir * (ad.getTime() - bd.getTime())
    })
    return arr
  }, [tasks, sortBy, sortDir])

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }
  const sortIndicator = (key: typeof sortBy) => sortBy === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
  const submitComment = async () => {
    if (!commentTaskId) return
    if (!currentUser) {
      toast({ title: 'Sessão', description: 'Autenticação necessária para comentar.', variant: 'destructive' })
      return
    }
    let body = commentText
    try {
      setIsCommentUploading(true)
      for (const f of commentFiles) {
        const fd = new FormData()
        fd.append('file', f)
        const resp = await fetch('/api/uploads', { method: 'POST', body: fd })
        const uploaded = await resp.json()
        if (resp.ok && uploaded?.url) {
          const isImage = (f.type || '').startsWith('image/')
          body += "\n" + (isImage ? `![${f.name}](${uploaded.url})` : `[${f.name}](${uploaded.url})`)
        }
      }
    } finally {
      setIsCommentUploading(false)
    }
    try {
      setIsCommentSubmitting(true)
      const resp = await fetch(`/api/subtickets/${commentTaskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({ body })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Erro ao criar comentário')
      toast({ title: 'Sucesso', description: 'Comentário adicionado.' })
      setCommentOpen(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Erro ao criar comentário', variant: 'destructive' })
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">A carregar tarefas...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tarefas ({tasks.length})</CardTitle>
              <CardDescription>Gestuo de tarefas para este ticket</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Editar ticket"
                onClick={() => onEditTicket && onEditTicket()}
                className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={openCreate}>
                Nova Tarefa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-500">Cronograma das tarefas</h4>
              {timeline.domainStart && timeline.domainEnd ? (
                <span className="text-xs text-muted-foreground">
                  {formatDate(timeline.domainStart.toISOString())} - {formatDate(timeline.domainEnd.toISOString())} ({timeline.totalDays === 1 ? "1 dia" : `${timeline.totalDays} dias`})
                </span>
              ) : null}
            </div>

            {timeline.rows.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-700 p-4 text-center text-xs text-muted-foreground">
                Sem dados suficientes para desenhar o cronograma. Defina data in?cio planeada e data conclus?o esperada nas tarefas.
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
                    {timeline.rows.map((row) => (
                      <div key={row.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">{row.titulo}</span>
                          <span className="text-muted-foreground">
                            {formatDate(row.rawStart)} - {formatDate(row.rawEnd)} ({row.durationDays === 1 ? "1 dia" : `${row.durationDays} dias`})
                          </span>
                        </div>
                        <div className="relative h-6 rounded bg-slate-900/70">
                          <div
                            className="absolute top-1/2 h-3 -translate-y-1/2 rounded bg-amber-500 shadow-sm"
                            style={{ left: `${(row as any).offset}%`, width: `${(row as any).width}%` }}
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

          {tasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhuma tarefa encontrada</div>
          ) : (
            <>
            <div className="mb-3 flex items-center justify-end gap-3 text-xs text-slate-300">
              <label>Ordenar por:</label>
              <select
                value={`${sortBy}:${sortDir}`}
                onChange={(e) => {
                  const [k, d] = e.target.value.split(":") as any
                  setSortBy(k)
                  setSortDir(d)
                }}
                className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-100"
              >
                <option value="esperada:asc">Fim esperado (mais cedo)</option>
                <option value="esperada:desc">Fim esperado (mais tarde)</option>
                <option value="titulo:asc">Título (A-Z)</option>
                <option value="titulo:desc">Título (Z-A)</option>
                <option value="estado:asc">Estado (A-Z)</option>
                <option value="estado:desc">Estado (Z-A)</option>
                <option value="prioridade:asc">Prioridade (1-9)</option>
                <option value="prioridade:desc">Prioridade (9-1)</option>
                <option value="responsavel:asc">Responsável (A-Z)</option>
                <option value="responsavel:desc">Responsável (Z-A)</option>
                <option value="inicio_planeado:asc">Início planeado (mais cedo)</option>
                <option value="inicio_planeado:desc">Início planeado (mais tarde)</option>
              </select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data início planeada</TableHead>
                  <TableHead>Data conclusão esperada</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task) => {
                  const expectedStart = task.data_inicio_planeado ?? task.data_inicio
                  const handleOpen = () => openTaskDetail(task.id)
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{task.titulo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.estado] ?? "bg-slate-200 text-slate-800"}>
                          {statusLabels[task.estado] ?? task.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[task.prioridade] ?? "bg-slate-200 text-slate-800"}>{task.prioridade}</Badge>
                      </TableCell>
                      <TableCell>{task.assignee?.name ?? "-"}</TableCell>
                      <TableCell>{formatDate(task.data_inicio_planeado)}</TableCell>
                      <TableCell>{formatDateWithDiff(task.data_esperada, expectedStart)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Ver tarefa"
                            onClick={handleOpen}
                            className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Editar tarefa"
                            onClick={() => openEdit(task.id)}
                            className="h-9 w-9 p-0 rounded-md border-slate-500/50 bg-slate-700/30 text-slate-200 hover:bg-slate-700 hover:border-slate-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhe da tarefa</DialogTitle>
            <DialogDescription>Consulte as informações da tarefa selecionada.</DialogDescription>
          </DialogHeader>
          {!viewTask ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sem tarefa selecionada.</div>
          ) : (
            <div className="space-y-4 text-sm">
              <section>
                <h4 className="text-sm font-semibold text-slate-200">Informação geral</h4>
                <dl className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Título</dt>
                    <dd className="mt-2 text-base font-semibold text-slate-50">{viewTask.titulo}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</dt>
                    <dd className="mt-2 text-sm text-slate-100 whitespace-pre-wrap">{viewTask.descricao || '-'}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</dt>
                    <dd className="mt-2">
                      <Badge className={statusColors[viewTask.estado] ?? "bg-slate-200 text-slate-800"}>
                        {statusLabels[viewTask.estado] ?? viewTask.estado}
                      </Badge>
                    </dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsável</dt>
                    <dd className="mt-2 text-sm text-slate-100">{viewTask.assignee?.name ?? "Sem Responsável"}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Urgência (1-3)</dt>
                    <dd className="mt-2 text-sm text-slate-100">{viewTask.urgencia}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Importância (1-3)</dt>
                    <dd className="mt-2 text-sm text-slate-100">{viewTask.importancia}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prioridade</dt>
                    <dd className="mt-2 text-sm text-slate-100">{viewTask.prioridade}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Criado em</dt>
                    <dd className="mt-2 text-sm text-slate-100">{formatDate(viewTask.created_at)}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data início planeada</dt>
                    <dd className="mt-2 text-sm text-slate-100">{formatDate(viewTask.data_inicio_planeado)}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data conclusão esperada</dt>
                    <dd className="mt-2 text-sm text-slate-100">{formatDate(viewTask.data_esperada)}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data início</dt>
                    <dd className="mt-2 text-sm text-slate-100">{formatDate(viewTask.data_inicio)}</dd>
                  </div>
                  <div className="">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data conclusão</dt>
                    <dd className="mt-2 text-sm text-slate-100">{formatDate(viewTask.data_conclusao)}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => viewTask && openCommentFor(viewTask.id)}>
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    Comentar esta tarefa
                  </Button>
                </div>
              </section>
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">Comentários</h4>
                <CommentsList subticketId={viewTask.id} hideForm />
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comment Modal */}
      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo comentário</DialogTitle>
            <DialogDescription>Escreva o comentário e anexe ficheiros.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <label className="text-slate-300">Anexos</label>
              <input type="file" multiple onChange={(e) => setCommentFiles(Array.from(e.target.files || []))} />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300">Comentário</label>
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={4} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCommentOpen(false)}>Cancelar</Button>
              <Button onClick={submitComment} disabled={isCommentSubmitting || isCommentUploading} className="bg-amber-600 hover:bg-amber-700">
                {isCommentSubmitting || isCommentUploading ? 'A enviar...' : 'Enviar coment�rio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>Atualize os campos da tarefa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <label className="text-slate-300">Título *</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300">Descrição</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-slate-300">Responsável *</label>
                <select value={editAssigneeId} onChange={(e) => setEditAssigneeId(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                  <option value="">Selecione...</option>
                  {biUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-300">Urgência (1-3)</label>
                  <select value={editUrgencia} onChange={(e) => setEditUrgencia(Number(e.target.value))} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                    <option value={1}>1 - Baixa</option><option value={2}>2 - Média</option><option value={3}>3 - Elevada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-300">Importância (1-3)</label>
                  <select value={editImportancia} onChange={(e) => setEditImportancia(Number(e.target.value))} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                    <option value={1}>1 - Baixa</option><option value={2}>2 - Média</option><option value={3}>3 - Elevada</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300">Estado</label>
              <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                <option value="novo">Novo</option>
                <option value="em_analise">Em análise</option>
                <option value="em_curso">Em curso</option>
                <option value="em_validacao">Em validação</option>
                <option value="concluido">Concluído</option>
                <option value="rejeitado">Rejeitado</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-slate-300">Data início planeada</label>
                <input type="date" value={editDataInicioPlaneado} onChange={(e) => setEditDataInicioPlaneado(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-300">Data conclusão esperada</label>
                <input type="date" value={editDataEsperada} onChange={(e) => setEditDataEsperada(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-slate-300">Data início</label>
                <input type="date" value={editDataInicio} onChange={(e) => setEditDataInicio(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-300">Data conclusão</label>
                <input type="date" value={editDataConclusao} onChange={(e) => setEditDataConclusao(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={submitUpdate} disabled={isUpdating} className="bg-amber-600 hover:bg-amber-700">{isUpdating ? 'A guardar...' : 'Guardar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Create Task Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>Crie uma tarefa para este ticket.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <label className="text-slate-300">Título *</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300">Descrição</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-slate-300">Responsável *</label>
                <select value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                  <option value="">Selecione...</option>
                  {biUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-300">Urgência (1-3)</label>
                  <select value={newUrgencia} onChange={(e) => setNewUrgencia(Number(e.target.value))} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                    <option value={1}>1 - Baixa</option><option value={2}>2 - Média</option><option value={3}>3 - Elevada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-300">Importância (1-3)</label>
                  <select value={newImportancia} onChange={(e) => setNewImportancia(Number(e.target.value))} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100">
                    <option value={1}>1 - Baixa</option><option value={2}>2 - Média</option><option value={3}>3 - Elevada</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-slate-300">Data início planeada</label>
                <input type="date" value={newDataInicioPlaneado} onChange={(e) => setNewDataInicioPlaneado(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
              </div>
              <div className="space-y-2">
                <label className="text-slate-300">Data conclusão esperada</label>
                <input type="date" value={newDataEsperada} onChange={(e) => setNewDataEsperada(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={submitCreate} disabled={isCreating} className="bg-amber-600 hover:bg-amber-700">{isCreating ? 'A criar...' : 'Criar tarefa'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}






