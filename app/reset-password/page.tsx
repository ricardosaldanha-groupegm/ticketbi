'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!cancelled) {
          setHasSession(!!user)
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async () => {
    if (!p1 || p1 !== p2) {
      toast({ title: 'Erro', description: 'As passwords não coincidem', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: p1 })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Password redefinida com sucesso. Já pode iniciar sessão.' })
      router.push('/login')
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao redefinir password', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        A validar link de recuperação...
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Link inválido ou expirado</CardTitle>
            <CardDescription className="text-slate-400">
              O link de recuperação já não é válido. Peça um novo link de recuperação de password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={() => router.push('/esqueci-password')}
            >
              Pedir novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Definir nova password</CardTitle>
          <CardDescription className="text-slate-400">
            Introduza a nova password para a sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Nova password"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-100"
          />
          <Input
            type="password"
            placeholder="Confirmar password"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            className="bg-slate-700 border-slate-600 text-slate-100"
          />
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            {loading ? 'A guardar...' : 'Guardar nova password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

