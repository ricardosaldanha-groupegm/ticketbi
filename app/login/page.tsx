'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Access request form states
  const [requestEmail, setRequestEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users-fresh')
      const data = await response.json()

      if (!response.ok || !Array.isArray(data?.users)) {
        toast({
          title: 'Erro',
          description: 'Nao foi possivel validar as credenciais.',
          variant: 'destructive',
        })
        return
      }

      const users: Array<{ id: string; email: string; name: string; role: string }> = data.users
      const user = users.find((u) => u.email === email)

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Email nao encontrado. Verifique o email e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      const devPasswords: Record<string, string> = {
        'ricardo.saldanha@groupegm.com': 'adminadmin',
        'ricardosaldanha2005@gmail.com': 'bi123',
        'ricardosaldanha2005+user1@gmail.com': 'user123',
      }

      const expectedPassword = devPasswords[email]
      if (!expectedPassword || password !== expectedPassword) {
        const passwordHint = expectedPassword || 'password nao definido'
        toast({
          title: 'Erro',
          description: 'Password incorreta para ' + email + '. Use: ' + passwordHint,
          variant: 'destructive',
        })
        return
      }

      const roleLabels: Record<string, string> = {
        admin: 'Admin',
        bi: 'BI',
        requester: 'Requester',
      }
      const roleLabel = roleLabels[user.role] || user.role

      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso! (' + roleLabel + ')',
      })

      const userInfo = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }

      localStorage.setItem('dev-user', JSON.stringify(userInfo))

      if (user.role === 'admin') {
        router.push('/admin/access-requests')
      } else {
        router.push('/tickets')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Erro',
        description: 'Erro interno do servidor',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingRequest(true)

    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: requestEmail,
          name: name,
          message: message,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Pedido de acesso enviado com sucesso! Aguarde aprovação do administrador.',
        })
        
        // Reset form
        setRequestEmail('')
        setName('')
        setMessage('')
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao enviar pedido de acesso',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Access request error:', error)
      toast({
        title: 'Erro',
        description: 'Erro interno do servidor',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-100">TicketBI</CardTitle>
          <CardDescription className="text-slate-400">
            Sistema de Gestão de Tickets BI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="request">Pedir Acesso</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ricardo.saldanha@groupegm.com"
                    required
                    className="bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="adminadmin"
                    required
                    className="bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'A entrar...' : 'Entrar'}
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                <p className="text-sm text-amber-200 mb-2">
                  <strong>Credenciais de Desenvolvimento:</strong>
                </p>
                <div className="text-xs space-y-1">
                  <p><strong>Admin:</strong> ricardo.saldanha@groupegm.com / adminadmin</p>
                  <p><strong>BI:</strong> ricardosaldanha2005@gmail.com / bi123</p>
                  <p><strong>Requester:</strong> ricardosaldanha2005+user1@gmail.com / user123</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="request" className="space-y-4">
              <form onSubmit={handleAccessRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request-email" className="text-slate-200">Email</Label>
                  <Input
                    id="request-email"
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="bg-slate-800 border-slate-600 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-200">Mensagem (opcional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explique porque precisa de acesso ao sistema..."
                    className="bg-slate-800 border-slate-600 text-slate-100"
                    rows={3}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isSubmittingRequest}
                >
                  {isSubmittingRequest ? 'A enviar...' : 'Pedir Acesso'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

