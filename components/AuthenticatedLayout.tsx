'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from './Header'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
}

export default function AuthenticatedLayout({ 
  children, 
  requireAuth = true, 
  requireAdmin = false 
}: AuthenticatedLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (!requireAuth) {
      setIsLoading(false)
      return
    }

    // Check authentication
    const devUser = localStorage.getItem('dev-user')
    if (!devUser) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }

    const userInfo = JSON.parse(devUser)
    setUser(userInfo)

    // Check admin requirement
    if (requireAdmin && userInfo.role !== 'admin') {
      console.log('User is not admin, redirecting to unauthorized')
      router.push('/unauthorized')
      return
    }

    setIsLoading(false)
  }, [requireAuth, requireAdmin, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-slate-300">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
