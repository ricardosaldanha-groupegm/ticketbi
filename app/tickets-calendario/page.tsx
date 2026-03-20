'use client'

import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import TicketsCalendarBars from '@/components/tickets/TicketsCalendarBars'

export default function TicketsCalendarioPage() {
  return (
    <AuthenticatedLayout requireAuth={true}>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-100">Calendário de Planeamento</h1>
        <p className="text-slate-400">
          Distribuição temporal dos tickets por concluir.
        </p>
      </div>
      <TicketsCalendarBars />
    </AuthenticatedLayout>
  )
}
