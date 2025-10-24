'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

interface UserInfo {
  id: string
  email: string
  name: string
  role: string
}

export default function Header() {
  const [user, setUser] = useState<UserInfo | null>(null)

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

  if (!user) {
    return null
  }

  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold text-amber-400">
              TicketBI
            </Link>
            
            <nav className="hidden md:flex space-x-4">
              {user.role === 'admin' && (
                <>
                  <Link 
                    href="/minhas-tarefas" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Minhas Tarefas
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                    title="Pedidos de Acesso e Utilizadores"
                  >
                    Administração
                  </Link>
                  <Link 
                    href="/tickets" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Tickets
                  </Link>
                </>
              )}
              
              {user.role !== 'admin' && (
                <>
                  <Link 
                    href="/minhas-tarefas" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Minhas Tarefas
                  </Link>
                  <Link 
                    href="/tickets" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Tickets
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-300">
              <span className="text-amber-400">{user.name}</span>
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
