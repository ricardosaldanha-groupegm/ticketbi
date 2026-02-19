import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TicketBI - Sistema de Gestão de Tickets',
  description: 'Sistema de gestão de tickets para o DSI',
  icons: {
    icon: '/ticketbi-icon.png',
    shortcut: '/ticketbi-icon.png',
    apple: '/ticketbi-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
