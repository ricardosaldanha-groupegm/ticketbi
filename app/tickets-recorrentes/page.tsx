"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AuthenticatedLayout from "@/components/AuthenticatedLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { getEntregaTipoOptions, entregaTipoDescriptions, naturezaDescriptions } from "@/lib/field-labels"

interface UserInfo {
  id: string
  role: string
  name: string
  email: string
}

interface UserOption {
  id: string
  name: string
  email: string
  role?: string
}

interface TemplateSubtask {
  id?: string
  assignee_bi_id: string
  titulo: string
  descricao: string
  urgencia: number
  importancia: number
  estado: string
  data_inicio: string
  data_inicio_planeado: string
  data_esperada: string
  data_conclusao: string
  retrabalhos: number
  assignee?: UserOption | null
}

interface RecurringTemplate {
  id: string
  active: boolean
  pedido_por: string
  assunto: string
  descricao: string | null
  objetivo: string | null
  urgencia: number
  importancia: number
  entrega_tipo: string
  natureza: string
  gestor_id: string | null
  data_esperada: string | null
  data_prevista_conclusao: string | null
  frequency: "daily" | "weekly" | "monthly"
  start_date: string
  next_run_date: string
  end_date: string | null
  last_run_at: string | null
  last_created_ticket_id: string | null
  last_error: string | null
  gestor?: UserOption | null
  subtasks: TemplateSubtask[]
}

const naturezaValues = [
  "Novo",
  "Correção",
  "Retrabalho",
  "Esclarecimento",
  "Ajuste",
  "Suporte",
  "Reunião/Discussão",
  "Interno",
] as const

const emptySubtask = (): TemplateSubtask => ({
  assignee_bi_id: "",
  titulo: "",
  descricao: "",
  urgencia: 1,
  importancia: 1,
  estado: "novo",
  data_inicio: "",
  data_inicio_planeado: "",
  data_esperada: "",
  data_conclusao: "",
  retrabalhos: 0,
})

const emptyForm = () => ({
  active: true,
  pedido_por: "",
  assunto: "",
  descricao: "",
  objetivo: "",
  urgencia: 1,
  importancia: 1,
  entrega_tipo: "",
  natureza: "Novo",
  gestor_id: "",
  data_esperada: "",
  data_prevista_conclusao: "",
  frequency: "monthly" as "daily" | "weekly" | "monthly",
  start_date: "",
  end_date: "",
  subtasks: [] as TemplateSubtask[],
})

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString("pt-PT")
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("pt-PT")
}

export default function TicketsRecorrentesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [allUsers, setAllUsers] = useState<UserOption[]>([])
  const [biUsers, setBiUsers] = useState<UserOption[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const headers = currentUser
    ? {
        "X-User-Id": currentUser.id,
        "X-User-Role": currentUser.role,
      }
    : undefined

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        let profile: any = null
        {
          const { data } = await supabase.from("users").select("id, name, email, role").eq("id", user.id).maybeSingle()
          profile = data as any
        }
        if (!profile && user.email) {
          const { data } = await supabase.from("users").select("id, name, email, role").eq("email", user.email).maybeSingle()
          profile = data as any
        }
        const role = profile?.role ?? "requester"
        const resolvedUser = {
          id: profile?.id ?? user.id,
          name: profile?.name ?? user.user_metadata?.name ?? user.email ?? "",
          email: profile?.email ?? user.email ?? "",
          role,
        }
        setCurrentUser(resolvedUser)
        if (role !== "bi" && role !== "admin") router.push("/unauthorized")
        return
      }

      const devRaw = typeof window !== "undefined" ? localStorage.getItem("dev-user") : null
      if (devRaw) {
        const parsed = JSON.parse(devRaw)
        setCurrentUser(parsed)
        if (parsed?.role !== "bi" && parsed?.role !== "admin") router.push("/unauthorized")
        return
      }

      router.push("/login")
    } catch {
      router.push("/login")
    }
  }

  const loadTemplates = async (user: UserInfo) => {
    const response = await fetch("/api/recurring-tickets", {
      headers: {
        "X-User-Id": user.id,
        "X-User-Role": user.role,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar tickets recorrentes")
    }
    setTemplates(data.templates || [])
  }

  const loadUsers = async (user: UserInfo) => {
    const [allResp, biResp] = await Promise.all([
      fetch("/api/users-fresh"),
      fetch("/api/users/bi", {
        headers: {
          "X-User-Id": user.id,
          "X-User-Role": user.role,
        },
      }),
    ])

    const allData = await allResp.json()
    const biData = await biResp.json()

    if (allResp.ok) {
      setAllUsers(allData.users || [])
    }
    if (biResp.ok) {
      setBiUsers(Array.isArray(biData) ? biData : [])
    }
  }

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        await Promise.all([loadTemplates(currentUser), loadUsers(currentUser)])
      } catch (error: any) {
        if (!cancelled) {
          toast({ title: "Erro", description: error?.message || "Erro ao carregar tickets recorrentes", variant: "destructive" })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentUser, toast])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const startEdit = (template: RecurringTemplate) => {
    setEditingId(template.id)
    setForm({
      active: template.active,
      pedido_por: template.pedido_por,
      assunto: template.assunto,
      descricao: template.descricao ?? "",
      objetivo: template.objetivo ?? "",
      urgencia: template.urgencia,
      importancia: template.importancia,
      entrega_tipo: template.entrega_tipo,
      natureza: template.natureza,
      gestor_id: template.gestor_id ?? "",
      data_esperada: template.data_esperada ?? "",
      data_prevista_conclusao: template.data_prevista_conclusao ?? "",
      frequency: template.frequency,
      start_date: template.start_date,
      end_date: template.end_date ?? "",
      subtasks: (template.subtasks || []).map((subtask) => ({
        id: subtask.id,
        assignee_bi_id: subtask.assignee_bi_id,
        titulo: subtask.titulo,
        descricao: subtask.descricao ?? "",
        urgencia: subtask.urgencia,
        importancia: subtask.importancia,
        estado: subtask.estado,
        data_inicio: subtask.data_inicio ?? "",
        data_inicio_planeado: subtask.data_inicio_planeado ?? "",
        data_esperada: subtask.data_esperada ?? "",
        data_conclusao: subtask.data_conclusao ?? "",
        retrabalhos: subtask.retrabalhos ?? 0,
      })),
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const submitForm = async () => {
    if (!headers) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        gestor_id: form.gestor_id || null,
        data_esperada: form.data_esperada || undefined,
        data_prevista_conclusao: form.data_prevista_conclusao || undefined,
        end_date: form.end_date || undefined,
        subtasks: form.subtasks.map((subtask) => ({
          ...subtask,
          descricao: subtask.descricao || undefined,
          data_inicio: subtask.data_inicio || undefined,
          data_inicio_planeado: subtask.data_inicio_planeado || undefined,
          data_esperada: subtask.data_esperada || undefined,
          data_conclusao: subtask.data_conclusao || undefined,
        })),
      }

      const response = await fetch(editingId ? `/api/recurring-tickets/${editingId}` : "/api/recurring-tickets", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao guardar ticket recorrente")
      }

      toast({ title: "Sucesso", description: editingId ? "Ticket recorrente atualizado." : "Ticket recorrente criado." })
      await loadTemplates(currentUser!)
      resetForm()
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao guardar ticket recorrente", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (template: RecurringTemplate) => {
    if (!headers) return
    try {
      const response = await fetch(`/api/recurring-tickets/${template.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ active: !template.active }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar estado do ticket recorrente")
      }
      await loadTemplates(currentUser!)
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao atualizar estado", variant: "destructive" })
    }
  }

  const updateSubtask = (index: number, key: keyof TemplateSubtask, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, subtaskIndex) =>
        subtaskIndex === index ? { ...subtask, [key]: value } : subtask
      ),
    }))
  }

  if (loading && !currentUser) {
    return (
      <AuthenticatedLayout requireAuth>
        <div className="text-slate-300">A carregar...</div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout requireAuth>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-slate-100">Tickets Recorrentes</h1>
          <p className="text-slate-400">
            Templates para criar tickets automaticamente por frequência e data.
          </p>
        </div>
        <Button type="button" variant="outline" className="border-slate-600 text-slate-200" onClick={resetForm}>
          Novo template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle>{editingId ? "Editar ticket recorrente" : "Novo ticket recorrente"}</CardTitle>
            <CardDescription>
              Define o ticket base, a frequência e as subtarefas que devem ser criadas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Pedido por</Label>
                <Select value={form.pedido_por} onValueChange={(value) => setForm((prev) => ({ ...prev, pedido_por: value }))}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                    <SelectValue placeholder="Selecionar utilizador" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.name}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Gestor</Label>
                <Select value={form.gestor_id || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, gestor_id: value === "__none__" ? "" : value }))}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                    <SelectValue placeholder="Sem gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem gestor</SelectItem>
                    {biUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Assunto</Label>
                <Input value={form.assunto} onChange={(e) => setForm((prev) => ({ ...prev, assunto: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" rows={4} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Objetivo</Label>
                <Textarea value={form.objetivo} onChange={(e) => setForm((prev) => ({ ...prev, objetivo: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tipo de Entrega</Label>
                <Select value={form.entrega_tipo || "__empty__"} onValueChange={(value) => setForm((prev) => ({ ...prev, entrega_tipo: value === "__empty__" ? "" : value }))}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                    <SelectValue placeholder="Selecionar tipo de entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Selecionar tipo de entrega</SelectItem>
                    {getEntregaTipoOptions(true).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.entrega_tipo && entregaTipoDescriptions[form.entrega_tipo] && (
                  <p className="text-xs text-slate-400">{entregaTipoDescriptions[form.entrega_tipo]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Natureza</Label>
                <Select value={form.natureza} onValueChange={(value) => setForm((prev) => ({ ...prev, natureza: value }))}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {naturezaValues.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {naturezaDescriptions[form.natureza] && (
                  <p className="text-xs text-slate-400">{naturezaDescriptions[form.natureza]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Urgência</Label>
                <Input type="number" min={1} max={3} value={form.urgencia} onChange={(e) => setForm((prev) => ({ ...prev, urgencia: Number(e.target.value || 1) }))} className="border-slate-600 bg-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Importância</Label>
                <Input type="number" min={1} max={3} value={form.importancia} onChange={(e) => setForm((prev) => ({ ...prev, importancia: Number(e.target.value || 1) }))} className="border-slate-600 bg-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Data esperada</Label>
                <Input type="date" value={form.data_esperada} onChange={(e) => setForm((prev) => ({ ...prev, data_esperada: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Data prevista de conclusão</Label>
                <Input type="date" value={form.data_prevista_conclusao} onChange={(e) => setForm((prev) => ({ ...prev, data_prevista_conclusao: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 p-4">
              <h3 className="mb-4 text-sm font-semibold text-slate-100">Recorrência</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Frequência</Label>
                  <Select value={form.frequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setForm((prev) => ({ ...prev, frequency: value }))}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Data de início</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Data final</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))} className="border-slate-600 bg-slate-700 text-slate-100" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                    Ativo
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Subtarefas do template</h3>
                <Button type="button" variant="outline" className="border-slate-600 text-slate-200" onClick={() => setForm((prev) => ({ ...prev, subtasks: [...prev.subtasks, emptySubtask()] }))}>
                  Adicionar subtarefa
                </Button>
              </div>
              {form.subtasks.length === 0 && (
                <p className="text-sm text-slate-400">Sem subtarefas definidas. O ticket será criado sem tarefas.</p>
              )}
              {form.subtasks.map((subtask, index) => (
                <div key={`${subtask.id ?? "new"}-${index}`} className="grid gap-4 rounded-md border border-slate-700 bg-slate-900/40 p-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Título</Label>
                      <Button type="button" variant="ghost" className="h-auto px-2 py-1 text-rose-300 hover:text-rose-200" onClick={() => setForm((prev) => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }))}>
                        Remover
                      </Button>
                    </div>
                    <Input value={subtask.titulo} onChange={(e) => updateSubtask(index, "titulo", e.target.value)} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Descrição</Label>
                    <Textarea value={subtask.descricao} onChange={(e) => updateSubtask(index, "descricao", e.target.value)} className="border-slate-600 bg-slate-700 text-slate-100" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Responsável</Label>
                    <Select value={subtask.assignee_bi_id || "__empty__"} onValueChange={(value) => updateSubtask(index, "assignee_bi_id", value === "__empty__" ? "" : value)}>
                      <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                        <SelectValue placeholder="Selecionar responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__empty__">Selecionar responsável</SelectItem>
                        {biUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Estado</Label>
                    <Select value={subtask.estado} onValueChange={(value) => updateSubtask(index, "estado", value)}>
                      <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_analise">Em análise</SelectItem>
                        <SelectItem value="em_curso">Em curso</SelectItem>
                        <SelectItem value="em_validacao">Em validação</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Urgência</Label>
                    <Input type="number" min={1} max={3} value={subtask.urgencia} onChange={(e) => updateSubtask(index, "urgencia", Number(e.target.value || 1))} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Importância</Label>
                    <Input type="number" min={1} max={3} value={subtask.importancia} onChange={(e) => updateSubtask(index, "importancia", Number(e.target.value || 1))} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Início</Label>
                    <Input type="date" value={subtask.data_inicio} onChange={(e) => updateSubtask(index, "data_inicio", e.target.value)} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Início planeado</Label>
                    <Input type="date" value={subtask.data_inicio_planeado} onChange={(e) => updateSubtask(index, "data_inicio_planeado", e.target.value)} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Conclusão esperada</Label>
                    <Input type="date" value={subtask.data_esperada} onChange={(e) => updateSubtask(index, "data_esperada", e.target.value)} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Conclusão</Label>
                    <Input type="date" value={subtask.data_conclusao} onChange={(e) => updateSubtask(index, "data_conclusao", e.target.value)} className="border-slate-600 bg-slate-700 text-slate-100" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button type="button" className="bg-amber-600 text-white hover:bg-amber-700" onClick={submitForm} disabled={saving}>
                {saving ? "A guardar..." : editingId ? "Guardar alterações" : "Criar template"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" className="border-slate-600 text-slate-200" onClick={resetForm}>
                  Cancelar edição
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle>Templates existentes</CardTitle>
            <CardDescription>
              Ativar, desativar e acompanhar a última execução de cada recorrência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-slate-400">A carregar templates...</p>
            ) : templates.length === 0 ? (
              <p className="text-slate-400">Ainda não existem tickets recorrentes configurados.</p>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-100">{template.assunto}</h3>
                      <p className="text-sm text-slate-400">
                        {template.frequency === "daily" ? "Diária" : template.frequency === "weekly" ? "Semanal" : "Mensal"} • próxima execução {formatDate(template.next_run_date)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${template.active ? "bg-emerald-600/20 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>
                      {template.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p><span className="text-slate-400">Pedido por:</span> {template.pedido_por}</p>
                    <p><span className="text-slate-400">Gestor:</span> {template.gestor?.name ?? "-"}</p>
                    <p><span className="text-slate-400">Período:</span> {formatDate(template.start_date)} até {formatDate(template.end_date)}</p>
                    <p><span className="text-slate-400">Última execução:</span> {formatDateTime(template.last_run_at)}</p>
                    <p><span className="text-slate-400">Último ticket:</span> {template.last_created_ticket_id ? (
                      <a className="text-amber-300 hover:underline" href={`/tickets/${template.last_created_ticket_id}`}>{template.last_created_ticket_id}</a>
                    ) : "-"}</p>
                    <p><span className="text-slate-400">Subtarefas:</span> {template.subtasks?.length ?? 0}</p>
                    {template.last_error && (
                      <p className="rounded-md bg-rose-500/10 px-2 py-1 text-rose-300">
                        Último erro: {template.last_error}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button type="button" variant="outline" className="border-slate-600 text-slate-200" onClick={() => startEdit(template)}>
                      Editar
                    </Button>
                    <Button type="button" variant="outline" className="border-slate-600 text-slate-200" onClick={() => toggleActive(template)}>
                      {template.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
