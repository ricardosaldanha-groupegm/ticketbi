"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthenticatedLayout from "@/components/AuthenticatedLayout"
import { Edit, Trash2, UserCheck, UserX } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  name: string
  role: "requester" | "bi" | "admin"
  created_at: string
  is_active: boolean
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<"requester" | "bi" | "admin" | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  // Carrega o utilizador autenticado e o seu role (para controlar permissões de UI)
  useEffect(() => {
    const loadMe = async () => {
      // Prefer dev-user in localStorage for UI parity with Header
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("dev-user")
        if (raw) {
          try {
            const dev = JSON.parse(raw)
            setCurrentUserId(dev?.id ?? null)
            setCurrentUserRole(dev?.role ?? null)
            return
          } catch {}
        }
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
        setCurrentUserRole((data as any)?.role ?? null)
      }
    }
    loadMe()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users-fresh?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro ao buscar utilizadores")
      setUsers(data.users)
    } catch (e) {
      console.error(e)
      toast({ title: "Erro", description: "Erro ao carregar utilizadores", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setProcessingId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify(updates),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro ao atualizar utilizador")

      toast({ title: "Sucesso", description: data.message })

      // Atualização otimista
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)))

      setIsEditDialogOpen(false)
      setEditingUser(null)

      // Refrescar do servidor pouco depois
      setTimeout(fetchUsers, 100)
    } catch (e: any) {
      console.error(e)
      toast({ title: "Erro", description: e?.message || "Erro ao atualizar utilizador", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro ao remover utilizador")
      toast({ title: "Sucesso", description: data.message })
      fetchUsers()
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (e: any) {
      console.error(e)
      toast({ title: "Erro", description: e?.message || "Erro ao remover utilizador", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return <Badge variant="default" className="bg-red-600">Admin</Badge>
      case "bi":
        return <Badge variant="default" className="bg-blue-600">BI</Badge>
      case "requester":
        return <Badge variant="secondary">Requester</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => (
    isActive ? (
      <Badge variant="default" className="bg-green-600">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Inativo</Badge>
    )
  )

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("pt-PT")

  if (isLoading) {
    return (
      <AuthenticatedLayout requireAuth={true} requireAdmin={true}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Gestão de Utilizadores</h1>
          <p className="text-slate-400">A carregar...</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout requireAuth={true} requireAdmin={true}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Gestão de Utilizadores</h1>
        <p className="text-slate-400">Gerir utilizadores, roles e permissões do sistema TicketBI</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="text-slate-100">Lista de Utilizadores</CardTitle>
            <CardDescription className="text-slate-400">{users.length} utilizador(es) registado(s)</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">Novo Utilizador</Button>
            </DialogTrigger>
            <CreateUserDialog onCreated={fetchUsers} />
          </Dialog>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Nome</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Data Criação</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isTargetAdmin = user.role === "admin"
                  const isSelf = currentUserId === user.id
                  const iAmAdmin = currentUserRole === "admin"

                  // Regras: não permitir apagar a si próprio; apenas admin pode apagar admins
                  const canDelete = isTargetAdmin ? (iAmAdmin && !isSelf) : !isSelf

                  return (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="font-medium text-slate-100">{user.name}</TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                      <TableCell className="text-slate-300">{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingUser(user); setIsEditDialogOpen(true) }}
                            className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                            disabled={processingId === user.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                            className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
                            disabled={processingId === user.id || user.role === "admin"}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>

                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setUserToDelete(user); setIsDeleteDialogOpen(true) }}
                              className="bg-red-700 border-red-600 text-red-100 hover:bg-red-600"
                              disabled={processingId === user.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">Nenhum utilizador encontrado</div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Editar Utilizador</DialogTitle>
            <DialogDescription className="text-slate-400">Alterar informações e permissões do utilizador</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-slate-300">Nome</Label>
                <Input
                  id="name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-slate-300">Email</Label>
                <Input
                  id="email"
                  value={editingUser.email}
                  disabled
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100 opacity-50"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right text-slate-300">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: User["role"]) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requester">Requester</SelectItem>
                    <SelectItem value="bi">BI</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsEditDialogOpen(false); setEditingUser(null) }}
              className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editingUser && handleUpdateUser(editingUser.id, { name: editingUser.name, role: editingUser.role })}
              disabled={!editingUser || processingId === editingUser?.id}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {processingId === editingUser?.id ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Remover Utilizador</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem a certeza que pretende remover este utilizador? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <p className="text-slate-300"><strong>Nome:</strong> {userToDelete.name}</p>
              <p className="text-slate-300"><strong>Email:</strong> {userToDelete.email}</p>
              <p className="text-slate-300"><strong>Role:</strong> {userToDelete.role}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDeleteDialogOpen(false); setUserToDelete(null) }}
              className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
              disabled={!userToDelete || processingId === userToDelete?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId === userToDelete?.id ? "A remover..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"requester" | "bi" | "admin">("requester")
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name || !email) {
      toast({ title: "Dados em falta", description: "Preencha nome e email", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const resp = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || "Erro ao criar utilizador")
      toast({ title: "Sucesso", description: "Convite enviado para o email do utilizador." })
      setName("")
      setEmail("")
      setRole("requester")
      onCreated()
      ;(document.activeElement as HTMLElement | null)?.blur()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Erro ao criar utilizador", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent className="bg-slate-800 border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-slate-100">Novo Utilizador</DialogTitle>
        <DialogDescription className="text-slate-400">
          Preencha os dados do utilizador. O utilizador receberá um email para definir a palavra‑passe.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="new-name" className="text-right text-slate-300">Nome</Label>
          <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 bg-slate-700 border-slate-600 text-slate-100" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="new-email" className="text-right text-slate-300">Email</Label>
          <Input id="new-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="col-span-3 bg-slate-700 border-slate-600 text-slate-100" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right text-slate-300">Role</Label>
          <Select value={role} onValueChange={(v: "requester" | "bi" | "admin") => setRole(v)}>
            <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="requester">Requester</SelectItem>
              <SelectItem value="bi">BI</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
          {submitting ? "A criar..." : "Criar utilizador"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}


