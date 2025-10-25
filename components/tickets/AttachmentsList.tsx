'use client'

import { useState, useEffect } from 'react'
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
  url: string
  created_at: string
  uploaded_by_user: { name: string; email: string }
}

export default function AttachmentsList({ ticketId }: { ticketId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchAttachments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}/attachments`)
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
  }, [ticketId])

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

  const handleDownload = (attachment: Attachment) => {
    // In a real implementation, you would handle file download
    // For now, we'll just open the URL in a new tab
    window.open(attachment.url, '_blank')
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
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Anexo
          </Button>
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

