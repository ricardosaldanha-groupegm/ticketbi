'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from './Header'
import { supabase } from '@/lib/supabase'

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
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!requireAuth) {
        setIsLoading(false)
        return
      }

      // 1) Real Supabase auth first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 2) Dev fallback only if no Supabase session
        const devUserRaw = typeof window !== 'undefined' ? localStorage.getItem('dev-user') : null
        if (devUserRaw) {
          const dev = JSON.parse(devUserRaw)
          setRole(dev.role || null)
          setIsLoading(false)
          if (requireAdmin && dev.role !== 'admin') router.push('/unauthorized')
          return
        }
        router.push('/login')
        return
      }

      // Force change password flow
      const mustChange = (user.user_metadata as any)?.must_change_password
      if (mustChange && pathname !== '/alterar-password') {
        router.push('/alterar-password')
        return
      }

      // Clear any dev-user shadow when real session exists
      if (typeof window !== 'undefined') localStorage.removeItem('dev-user')

      // Fetch role from users table
      const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      const r = (data as any)?.role || null
      setRole(r)
      if (requireAdmin && r !== 'admin') {
        router.push('/unauthorized')
        return
      }

      if (!cancelled) setIsLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [requireAuth, requireAdmin, router, pathname])

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
