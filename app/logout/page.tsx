'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export default function LogoutPage() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Remove user from localStorage
    localStorage.removeItem('dev-user')
    
    // Show success message
    toast({
      title: 'Logout realizado',
      description: 'Sessão terminada com sucesso',
    })
    
    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  }, [router, toast])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
        <p className="text-slate-300">A terminar sessão...</p>
      </div>
    </div>
  )
}
