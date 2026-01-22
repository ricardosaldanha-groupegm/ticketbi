'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import LogoutButton from './LogoutButton'

interface UserInfo {
  id: string
  email: string
  name: string
  role: string
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      // 1) Try Supabase session
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try fetch by id
        let profile: any = null
        {
          const { data } = await supabase.from('users').select('name, email, role').eq('id', user.id).maybeSingle()
          profile = data as any
        }
        // Fallback by email if not found
        if (!profile && user.email) {
          const { data } = await supabase.from('users').select('name, email, role').eq('email', user.email).maybeSingle()
          profile = data as any
        }
        // Final fallback: env-configured admin emails
        let role = profile?.role as string | undefined
        if (!role && user.email) {
          const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          if (admins.includes(user.email.toLowerCase())) role = 'admin'
        }
        if (!role) role = 'requester'

        if (!cancelled) setUser({
          id: user.id,
          email: profile?.email || user.email || '',
          name: profile?.name || user.user_metadata?.name || user.email || '',
          role,
        })
        // Ensure dev-user doesn't mask real session
        if (typeof window !== 'undefined') localStorage.removeItem('dev-user')
        return
      }
      // 2) Fallback to dev-user in localStorage
      const devUser = typeof window !== 'undefined' ? localStorage.getItem('dev-user') : null
      if (devUser && !cancelled) setUser(JSON.parse(devUser))
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Fetch pending access requests count for admins
  useEffect(() => {
    if (user?.role !== 'admin') {
      setPendingCount(0)
      return
    }

    let cancelled = false
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/access-requests/pending-count')
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled) {
          setPendingCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching pending count:', error)
      }
    }

    fetchPendingCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user?.role])

  if (!user) {
    return null
  }

  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/tickets" className="text-xl font-bold text-amber-400">
              TicketBI
            </Link>
            
            <nav className="hidden md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {(user.role === 'admin') && (
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Administração</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[220px] gap-2">
                          <li>
                            <Link href="/admin/access-requests" className={navigationMenuTriggerStyle()}>
                              Pedidos de Acesso
                            </Link>
                          </li>
                          <li>
                            <Link href="/admin/users" className={navigationMenuTriggerStyle()}>
                              Utilizadores
                            </Link>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  )}

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Minhas</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[220px] gap-2">
                        <li>
                          <Link href="/tickets" className={navigationMenuTriggerStyle()}>
                            Tickets
                          </Link>
                        </li>
                        <li>
                          <Link href="/minhas-tarefas" className={navigationMenuTriggerStyle()}>
                            Tarefas
                          </Link>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-300 flex items-center gap-2">
              <span className="text-amber-400">{user.name}</span>
              {user.role === 'admin' && pendingCount > 0 && (
                <Link href="/admin/access-requests" className="relative">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                </Link>
              )}
              <span className="mx-2">|</span>
              <span>{user.role === 'requester' ? 'Utilizador' : user.role === 'bi' ? 'BI' : user.role === 'admin' ? 'Admin' : user.role}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
