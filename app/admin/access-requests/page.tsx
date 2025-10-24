'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { Eye, MessageSquare } from 'lucide-react'

interface AccessRequest {
  id: string
  email: string
  name: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  approved_by?: string
  approved_at?: string
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/access-requests')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar pedidos')
      }

      setRequests(data.requests)
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar pedidos de acesso',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    
    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pedido')
      }

      toast({
        title: 'Sucesso',
        description: `Pedido ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
      })

      await fetchRequests()
    } catch (error) {
      console.error('Error processing request:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao processar pedido',
        variant: 'destructive',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'approved':
        return <Badge variant="default">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewMessage = (request: AccessRequest) => {
    setSelectedRequest(request)
    setIsMessageModalOpen(true)
  }

  const truncateMessage = (message: string | undefined, maxLength: number = 50) => {
    if (!message) return 'Sem mensagem'
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">A carregar...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout requireAuth={true} requireAdmin={true}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Pedidos de Acesso</h1>
        <p className="text-slate-400">
          Gerir pedidos de acesso ao sistema TicketBI
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-slate-100">Lista de Pedidos</CardTitle>
              <CardDescription className="text-slate-400">
                {requests.length} pedido(s) no total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm text-slate-300">Filtrar por status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-700 border border-slate-600 text-slate-100 rounded px-2 py-1"
              >
                <option value="pending">Por aprovar</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum pedido de acesso encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-300">Nome</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Mensagem</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Data</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
                  .filter(r => statusFilter === 'all' ? true : r.status === statusFilter)
                  .map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-slate-100">{request.name}</TableCell>
                    <TableCell className="text-slate-300">{request.email}</TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="max-w-xs truncate">
                          {truncateMessage(request.message)}
                        </span>
                        {request.message && request.message.length > 50 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMessage(request)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(request.created_at).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'approve')}
                            disabled={processingId === request.id}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRequestAction(request.id, 'reject')}
                            disabled={processingId === request.id}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-sm text-slate-400">
                          Processado
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para mostrar mensagem completa */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensagem do Pedido de Acesso
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Mensagem enviada por {selectedRequest?.name} ({selectedRequest?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedRequest?.message ? (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <p className="text-slate-200 whitespace-pre-wrap">
                  {selectedRequest.message}
                </p>
              </div>
            ) : (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <p className="text-slate-400 italic">
                  Nenhuma mensagem foi fornecida com este pedido.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsMessageModalOpen(false)}
              className="border-slate-600 text-slate-100 hover:bg-slate-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
