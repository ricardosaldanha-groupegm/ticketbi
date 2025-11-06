'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'requester' | 'bi' | 'admin'
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
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Use the fresh API endpoint to avoid any caching issues
      const timestamp = Date.now()
      console.log('Fetching users with fresh API, timestamp:', timestamp)
      const response = await fetch(`/api/users-fresh?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar utilizadores')
      }

      console.log('Fetched users from fresh API:', data.users) // Debug log
      setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar utilizadores',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setProcessingId(userId)
    
    try {
      console.log('Updating user:', userId, 'with updates:', updates)
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      console.log('Update response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar utilizador')
      }

      toast({
        title: 'Sucesso',
        description: data.message,
      })

      // Force immediate local state update
      console.log('Updating local state immediately')
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === userId 
            ? { ...user, ...updates }
            : user
        )
        console.log('New users state:', updatedUsers)
        return updatedUsers
      })

      // Wait a bit then refresh from server
      setTimeout(() => {
        console.log('Refreshing from server...')
        fetchUsers()
      }, 100)

      setIsEditDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar utilizador',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setProcessingId(userId)
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover utilizador')
      }

      toast({
        title: 'Sucesso',
        description: data.message,
      })

      // Refresh the users list
      fetchUsers()
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover utilizador',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-red-600">Admin</Badge>
      case 'bi':
        return <Badge variant="default" className="bg-blue-600">BI</Badge>
      case 'requester':
        return <Badge variant="secondary">Requester</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-600">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Inativo</Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

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
        <p className="text-slate-400">
          Gerir utilizadores, roles e permissões do sistema TicketBI
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Lista de Utilizadores</CardTitle>
          <CardDescription className="text-slate-400">
            {users.length} utilizador(es) registado(s)
          </CardDescription>
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
                {users.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="font-medium text-slate-100">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.is_active)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user)
                            setIsEditDialogOpen(true)
                          }}
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
                          disabled={processingId === user.id || user.role === 'admin'}
                        >
                          {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="bg-red-700 border-red-600 text-red-100 hover:bg-red-600"
                            disabled={processingId === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Nenhum utilizador encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Editar Utilizador</DialogTitle>
            <DialogDescription className="text-slate-400">
              Alterar informações e permissões do utilizador
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-slate-300">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingUser.email}
                  disabled
                  className="col-span-3 bg-slate-700 border-slate-600 text-slate-100 opacity-50"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right text-slate-300">
                  Role
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: 'requester' | 'bi' | 'admin') => 
                    setEditingUser({ ...editingUser, role: value })
                  }
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
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingUser(null)
              }}
              className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editingUser && handleUpdateUser(editingUser.id, {
                name: editingUser.name,
                role: editingUser.role
              })}
              disabled={!editingUser || processingId === editingUser?.id}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {processingId === editingUser?.id ? 'A guardar...' : 'Guardar'}
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
              <p className="text-slate-300">
                <strong>Nome:</strong> {userToDelete.name}
              </p>
              <p className="text-slate-300">
                <strong>Email:</strong> {userToDelete.email}
              </p>
              <p className="text-slate-300">
                <strong>Role:</strong> {userToDelete.role}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
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
              {processingId === userToDelete?.id ? 'A remover...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
