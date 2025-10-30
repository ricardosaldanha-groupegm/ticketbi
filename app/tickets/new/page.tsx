"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescriçãon, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import AuthenticatedLayout from "@/components/AuthenticatedLayout"

interface User {
  id: string
  email: string
  name: string
  role: "requester" | "bi" | "admin"
}

const createTicketSchema = z.object({
  pedido_por: z.string().min(1, "Campo obrigatório"),
  assunto: z.string().min(1, "Campo obrigatório"),
  Descrição: z.string().min(1, "Campo obrigatório"),
  objetivo: z.string().min(1, "Campo obrigatório"),
  urgencia: z.number().min(1).max(3),
  importância: z.number().min(1).max(3),
  data_esperada: z.string().optional(),
})

type CreateTicketForm = z.infer<typeof createTicketSchema>

export default function NewTicketPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      pedido_por: "",
      assunto: "",
      Descrição: "",
      objetivo: "",
      urgencia: 1,
      importância: 1,
      data_esperada: "",
    },
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const devUser = typeof window !== "undefined" ? localStorage.getItem("dev-user") : null
        if (devUser) {
          const userInfo: User = JSON.parse(devUser)
          setCurrentUser(userInfo)
          if (userInfo.role === "requester") {
            setValue("pedido_por", userInfo.name)
          }
        }
        const response = await fetch("/api/users-fresh")
        const data = await response.json()
        if (response.ok && Array.isArray(data.users)) {
          setUsers(data.users)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        toast({ title: "Erro", Descriçãon: "Erro ao carregar dados dos utilizadores", variant: "destructive" })
      } finally {
        setIsLoadingUsers(false)
      }
    }
    loadUserData()
  }, [setValue, toast])

  const onSubmit = async (data: CreateTicketForm) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        toast({ title: "Sucesso", Descriçãon: "Ticket criado com sucesso!" })
        router.push("/tickets")
      } else {
        const error = await response.json()
        toast({ title: "Erro", Descriçãon: error.message || "Erro ao criar ticket", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast({ title: "Erro", Descriçãon: "Erro interno do servidor", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthenticatedLayout requireAuth>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Criar Novo Ticket</h1>
        <p className="text-slate-400">Preencha os dados do novo ticket para o departamento de BI</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Dados do Ticket</CardTitle>
          <CardDescriçãon className="text-slate-400">Preencha todos os campos obrigatórios</CardDescriçãon>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pedido_por" className="text-slate-300">Pedido por *</Label>
                {isLoadingUsers ? (
                  <div className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-400">A carregar utilizadores...</div>
                ) : currentUser?.role === "requester" ? (
                  <Input id="pedido_por" value={currentUser.name} disabled className="bg-slate-600 border-slate-500 text-slate-300 cursor-not-allowed" />
                ) : (
                  <Select value={watch("pedido_por")} onValueChange={(value) => setValue("pedido_por", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Selecionar utilizador" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.pedido_por && (<p className="text-sm text-red-400">{errors.pedido_por.message}</p>)}
                {currentUser?.role === "requester" ? (
                  <p className="text-xs text-slate-400">Este campo estÃƒÆ’Ã‚Â¡ travado com o seu nome (perfil: utilizador)</p>
                ) : (
                  <p className="text-xs text-slate-400">Selecione o utilizador que fez o pedido</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assunto" className="text-slate-300">Assunto *</Label>
                <Input id="assunto" {...register("assunto")} placeholder="Resumo do pedido" className="bg-slate-700 border-slate-600 text-slate-100" />
                {errors.assunto && (<p className="text-sm text-red-400">{errors.assunto.message}</p>)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Descrição" className="text-slate-300">Descrição *</Label>
              <Textarea id="Descrição" {...register("Descrição")} placeholder="Descrição detalhada do pedido" rows={4} className="bg-slate-700 border-slate-600 text-slate-100" />
              {errors.Descrição && (<p className="text-sm text-red-400">{errors.Descrição.message}</p>)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivo" className="text-slate-300">Objetivo do Pedido *</Label>
              <Textarea id="objetivo" {...register("objetivo")} placeholder="Qual é o objetivo final que pretende alcançar com este pedido? Como vai utilizar a informação solicitada?" rows={3} className="bg-slate-700 border-slate-600 text-slate-100" />
              {errors.objetivo && (<p className="text-sm text-red-400">{errors.objetivo.message}</p>)}
              <p className="text-xs text-slate-400">Expliquão objetivo final para ajudar o departamento de BI a escolher a melhor forma de responder ao seu pedido.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Label htmlFor="urgencia" className="text-slate-300">urgência *</Label><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-slate-200 text-xs cursor-help" title="urgência: quão rapidamente isto precisa de ser feito." aria-label="Ajuda sobre urgência">i</span></div>
                <Select value={watch("urgencia") ? watch("urgencia").toString() : "1"} onValueChange={(value) => setValue("urgencia", parseInt(value))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Selecionar urgÃƒÆ’Ã‚Âªncia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Baixa</SelectItem>
                    <SelectItem value="2">2 - Média</SelectItem>
                    <SelectItem value="3">3 - Elevada</SelectItem>
                  </SelectContent>
                </Select>
                {errors.urgencia && (<p className="text-sm text-red-400">{errors.urgencia.message}</p>)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2"><Label htmlFor="importância" className="text-slate-300">importância *</Label><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-slate-200 text-xs cursor-help" title="importância: impacto do resultado no negócio." aria-label="Ajuda sobre importância">i</span></div>
                <Select value={watch("importância") ? watch("importância").toString() : "1"} onValueChange={(value) => setValue("importância", parseInt(value))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Selecionar importância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Baixa</SelectItem>
                    <SelectItem value="2">2 - Média</SelectItem>
                    <SelectItem value="3">3 - Elevada</SelectItem>
                  </SelectContent>
                </Select>
                {errors.importância && (<p className="text-sm text-red-400">{errors.importância.message}</p>)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_esperada" className="text-slate-300">Data Esperada</Label>
                <Input id="data_esperada" type="date" {...register("data_esperada")} className="bg-slate-700 border-slate-600 text-slate-100" />
                {errors.data_esperada && (<p className="text-sm text-red-400">{errors.data_esperada.message}</p>)}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">{isLoading ? "A criar..." : "Criar Ticket"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600">Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}

