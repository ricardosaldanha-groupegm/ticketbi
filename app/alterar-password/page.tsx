"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function AlterarPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
    })
  }, [router])

  const submit = async () => {
    if (!p1 || p1 !== p2) {
      toast({ title: 'Erro', description: 'As passwords não coincidem', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: p1, data: { must_change_password: false } })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Password alterada com sucesso.' })
      router.push('/tickets')
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Falha ao alterar password', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Alterar Password</CardTitle>
          <CardDescription className="text-slate-400">Defina uma nova password para continuar a usar a aplicação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="password" placeholder="Nova password" value={p1} onChange={(e) => setP1(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
          <Input type="password" placeholder="Confirmar password" value={p2} onChange={(e) => setP2(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
          <Button onClick={submit} disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">{loading ? 'A guardar...' : 'Guardar'}</Button>
        </CardContent>
      </Card>
    </div>
  )
}

