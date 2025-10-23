'use client'

import TicketsList from '@/components/tickets/TicketsList'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'

export default function TicketsPage() {
  return (
    <AuthenticatedLayout requireAuth={true}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Tickets</h1>
            <p className="text-slate-400">
              Gerir pedidos ao departamento de BI
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/tickets/new">
              <button className="bg-amber-600 text-white hover:bg-amber-700 px-4 py-2 rounded-md">
                Novo Ticket
              </button>
            </a>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <TicketsList />
      </div>
    </AuthenticatedLayout>
  )
}