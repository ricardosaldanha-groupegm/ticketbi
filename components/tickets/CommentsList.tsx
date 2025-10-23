'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Send } from 'lucide-react'

interface Comment {
  id: string
  body: string
  created_at: string
  author: { name: string; email: string }
}

const commentSchema = z.object({
  body: z.string().min(1, 'Comentario nao pode estar vazio'),
})

type CommentForm = z.infer<typeof commentSchema>

export default function CommentsList({ ticketId, subticketId, hideForm = false }: { ticketId?: string; subticketId?: string; hideForm?: boolean }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role?: string } | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const { toast } = useToast()

  // Files to attach to the comment (uploaded before submit)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)




  const [tasks, setTasks] = useState<Array<{ id: string; titulo: string }>>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [filterTarget, setFilterTarget] = useState<string>('all') // 'all' | 'ticket' | subticketId
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
  })

    useEffect(() => {
    if (typeof window === 'undefined') return

    const storedUser = localStorage.getItem('dev-user')
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser))
      } catch (error) {
        console.warn('Failed to parse stored user from localStorage.', error)
      }
    }

    setAuthReady(true)
  }, [])

  useEffect(() => {
    if (!ticketId) return
    const load = async () => {
      try {
        setTasksLoading(true)
        const resp = await fetch(`/api/tickets/${ticketId}/subtickets`)
        const data = await resp.json()
        if (resp.ok && Array.isArray(data)) {
          setTasks(data.map((t: any) => ({ id: t.id, titulo: t.titulo })))
        }
      } catch {
      } finally {
        setTasksLoading(false)
      }
    }
    load()
  }, [ticketId])

const fetchComments = useCallback(async () => {
    if (!currentUser) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch((ticketId ? `/api/tickets/${ticketId}/comments` : `/api/subtickets/${subticketId}/comments`), {
        headers: {
          'X-User-Id': currentUser.id,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar comentarios')
      }

      setComments(Array.isArray(data) ? data : data?.comments ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar comentarios'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [currentUser, ticketId, toast])

  const onSubmit = async (data: CommentForm) => {
    let body = data.body
    try {
      setUploading(true)
      for (const f of files) {
        const fd = new FormData()
        fd.append("file", f)
        const resp = await fetch("/api/uploads", { method: "POST", body: fd })
        const uploaded = await resp.json()
        if (resp.ok && uploaded?.url) {
          const isImage = (f.type || "").startsWith("image/")
          body += "\n" + (isImage ? `![${f.name}](${uploaded.url})` : `[${f.name}](${uploaded.url})`)
        }
      }
    } finally {
      setUploading(false)
    }
    if (!currentUser) {
      toast({
        title: 'Sessao invalida',
        description: 'Inicie sessao novamente antes de enviar um comentario.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch((ticketId ? `/api/tickets/${ticketId}/comments` : `/api/subtickets/${subticketId}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({ body }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar comentario')
      }

      toast({
        title: 'Sucesso',
        description: 'Comentario adicionado com sucesso!',
      })

      reset()
      fetchComments()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar comentario'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!authReady) return
    fetchComments()
  }, [authReady, fetchComments])

  useEffect(() => {
    if (authReady && !currentUser) {
      setLoading(false)
    }
  }, [authReady, currentUser])

    const filteredComments = useMemo(() => {
    let items = comments as any[]
    if (!subticketId) {
      if (filterTarget === 'ticket') {
        items = items.filter((c) => !c.subticket_id)
      } else if (filterTarget !== 'all') {
        items = items.filter((c) => c.subticket_id === filterTarget)
      }
    }
    const q = appliedSearch.trim().toLowerCase()
    if (q) {
      items = items.filter((c) => (c.body || '').toLowerCase().includes(q))
    }
    return items
  }, [comments, filterTarget, appliedSearch, subticketId])
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-PT')
  }
  if (authReady && !currentUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-muted-foreground">
            Autenticacao necessaria para consultar os comentarios.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">A carregar comentarios...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comentarios ({comments.length})</CardTitle>
        <CardDescription>
          Discussao sobre este ticket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterTarget} onValueChange={setFilterTarget} disabled={!!subticketId}>
            <SelectTrigger className="w-56" aria-label="Filtro">
              <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ticket">Do ticket</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Procurar texto..."
            className="w-64"
          />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => setAppliedSearch(searchText)}>Pesquisar</Button>
        </div>
      </div>
        { !hideForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <Textarea
              {...register('body')}
              placeholder="Escreva um comentario..."
              rows={3}
            />
            {errors.body && (
              <p className="text-sm text-red-500 mt-1">{errors.body.message}</p>
            )}
          </div>
          <Button type="submit" disabled={submitting || uploading}>
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'A enviar...' : 'Enviar Comentario'}
          </Button>
        </form>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum comentario encontrado
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{comment.author.name}</h4>
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                      {formatDate(comment.created_at)}
                    {comment.subticket_id ? (
                      <button
                        type="button"
                        className="mt-1 inline-flex items-center rounded-full ml-2 px-2.5 py-0.5 text-xs font-semibold bg-amber-500 text-slate-900 hover:bg-amber-600 transition"
                        onClick={() => window.dispatchEvent(new CustomEvent("open-subticket", { detail: comment.subticket_id }))}
                        title="Abrir tarefa"
                      >
                        {tasks.find((t) => t.id === comment.subticket_id)?.titulo ?? (comment as any).subticket?.titulo ?? 'Tarefa'}
                      </button>
                    ) : null}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}













