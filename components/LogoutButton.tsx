'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = () => {
    // Remove user from localStorage
    localStorage.removeItem('dev-user')
    
    // Show success message
    toast({
      title: 'Logout realizado',
      description: 'Sessão terminada com sucesso',
    })
    
    // Redirect to login
    router.push('/login')
  }

  return (
    <Button 
      onClick={handleLogout}
      variant="outline"
      className="bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700"
    >
      Logout
    </Button>
  )
}
