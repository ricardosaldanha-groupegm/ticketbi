import TicketDetails from '@/components/tickets/TicketDetails'

export default function TicketPage({ params }: { params: { id: string } }) {
  return <TicketDetails ticketId={params.id} />
}
