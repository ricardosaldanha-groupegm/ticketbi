"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Eye } from "lucide-react"

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
}

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
  2: "bg-green-200 text-green-900",
  3: "bg-lime-200 text-lime-900",
  4: "bg-yellow-100 text-yellow-800",
  5: "bg-yellow-200 text-yellow-900",
  6: "bg-orange-200 text-orange-900",
  7: "bg-orange-300 text-orange-900",
  8: "bg-red-100 text-red-800",
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

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tickets")
      const data: TicketsResponse = await response.json()
      if (!response.ok) {
        throw new Error((data as any)?.error || "Erro ao carregar tickets")
      }
      setTickets(data.tickets || [])
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Erro ao carregar tickets", variant: "destructive" })
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const groupedByEstado = useMemo(() => {
    const groups = new Map<string, Ticket[]>()
    for (const ticket of tickets) {
      const group = groups.get(ticket.estado) ?? []
      group.push(ticket)
      groups.set(ticket.estado, group)
    }
    return Array.from(groups.entries()).map(([estado, items]) => ({ estado, items }))
  }, [tickets])

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
