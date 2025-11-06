'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // When redirected from email, Supabase sets a session enabling updateUser
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setReady(Boolean(data.session))
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast({ title: 'Validação', description: 'A palavra‑passe deve ter pelo menos 8 caracteres.', variant: 'destructive' })
      return
    }
    if (password !== confirm) {
      toast({ title: 'Validação', description: 'As palavras‑passe não coincidem.', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Palavra‑passe atualizada com sucesso.' })
      router.push('/login')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível atualizar a palavra‑passe.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-100">Definir Nova Palavra‑Passe</CardTitle>
          <CardDescription className="text-slate-400">
            Introduza e confirme a nova palavra‑passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Nova Palavra‑Passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-600 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-slate-200">Confirmar Palavra‑Passe</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-600 text-slate-100"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isSubmitting || !ready}
            >
              {isSubmitting ? 'A atualizar...' : (ready ? 'Atualizar Palavra‑Passe' : 'Aguarde...')}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-4">
                Voltar ao Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

