'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function EsqueciPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error

      toast({
        title: 'Email enviado',
        description: 'Se o email existir no sistema, irá receber instruções para definir uma nova password.',
      })
      router.push('/login')
    } catch (e: any) {
      console.error('Erro ao pedir reset de password:', e)
      // Mensagem genérica para não revelar se o email existe ou não
      toast({
        title: 'Pedido registado',
        description: 'Se o email existir no sistema, irá receber instruções para definir uma nova password.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-100">Recuperar Password</CardTitle>
          <CardDescription className="text-slate-400">
            Introduza o seu email para receber um link de recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Introduza o seu email"
                required
                className="bg-slate-800 border-slate-600 text-slate-100"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={loading}
            >
              {loading ? 'A enviar...' : 'Enviar link de recuperação'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 mt-2"
              onClick={() => router.push('/login')}
            >
              Voltar ao login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

