'use client'

import { useEffect, useState } from 'react'
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
    // Get user from localStorage
    const devUser = localStorage.getItem('dev-user')
    if (devUser) {
      setUser(JSON.parse(devUser))
    }
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
                    href="/admin/access-requests" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Pedidos de Acesso
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Utilizadores
                  </Link>
                  <Link 
                    href="/tickets" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Tickets
                  </Link>
                  <Link 
                    href="/tickets/new" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Novo Ticket
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
                    Meus Tickets
                  </Link>
                  <Link 
                    href="/tickets/new" 
                    className="text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    Novo Ticket
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-300">
              <span className="text-amber-400">{user.name}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{user.role}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
