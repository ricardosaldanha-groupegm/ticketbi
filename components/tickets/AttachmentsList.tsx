'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Download, File } from 'lucide-react'

interface Attachment {
  id: string
  filename: string
  mimetype: string
  size_bytes: number
  url?: string
  storage_path?: string
  created_at: string
  uploaded_by_user: { name: string; email: string }
}

export default function AttachmentsList({ ticketId }: { ticketId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchAttachments = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {}
      if (currentUserId) (headers as any)['X-User-Id'] = currentUserId
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, { headers })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar anexos')
      }

      setAttachments(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar anexos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttachments()
  }, [ticketId, currentUserId])

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // resolve app users.id by id or email
          let appUserId: string | null = null
          const { data: byId } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
          appUserId = (byId as any)?.id ?? null
          if (!appUserId && user.email) {
            const { data: byEmail } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle()
            appUserId = (byEmail as any)?.id ?? null
          }
          if (appUserId) setCurrentUserId(appUserId)
          return
        }
      } catch {}
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('dev-user') : null
        if (raw) {
          const u = JSON.parse(raw)
          if (u?.id) setCurrentUserId(u.id)
        }
      } catch {}
    })()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDownload = async (attachment: Attachment) => {
    if (attachment.storage_path) {
      const resp = await fetch(`/api/files/open?attachmentId=${attachment.id}`)
      if (!resp.ok) return
      // redireciona pelo 307
      return
    }
    if (attachment.url) window.open(attachment.url, '_blank')
  }

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const resp = await fetch('/api/uploads', { method: 'POST', body: fd })
      const uploaded = await resp.json()
      if (!resp.ok) throw new Error(uploaded?.error || 'Erro no upload')
      const meta = {
        filename: uploaded.filename || file.name,
        mimetype: uploaded.mimetype || file.type,
        size_bytes: uploaded.size ?? file.size,
        storage_path: uploaded.path,
      }
      const create = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(currentUserId ? { 'X-User-Id': currentUserId } : {}) },
        body: JSON.stringify(meta),
      })
      const created = await create.json()
      if (!create.ok) throw new Error(created?.error || 'Erro ao registar anexo')
      toast({ title: 'Sucesso', description: 'Anexo adicionado.' })
      fetchAttachments()
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message || 'Falha ao adicionar anexo', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-slate-200">
          <div className="text-center">A carregar anexos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-100">Anexos ({attachments.length})</CardTitle>
            <CardDescription className="text-slate-400">
              Ficheiros associados a este ticket
            </CardDescription>
          </div>
          <div>
            <label className="inline-flex items-center px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
              <Plus className="h-4 w-4 mr-2" /> {uploading ? 'A carregar...' : 'Adicionar Anexo'}
              <input type="file" className="hidden" onChange={handleAdd} disabled={uploading} />
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-slate-200">
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Nenhum anexo encontrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>AÃ§Ãµes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachments.map((attachment) => (
                <TableRow key={attachment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      {attachment.filename}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-400">
                      {attachment.mimetype}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-400">
                      {formatFileSize(attachment.size_bytes)}
                    </span>
                  </TableCell>
                  <TableCell>{attachment.uploaded_by_user.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-400">
                      {formatDate(attachment.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

