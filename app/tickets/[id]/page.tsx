import TicketDetails from '@/components/tickets/TicketDetails'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <AuthenticatedLayout requireAuth={true}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <TicketDetails ticketId={params.id} />
      </div>
    </AuthenticatedLayout>
  )
}