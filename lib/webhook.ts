import { createServerSupabaseClient } from '@/lib/supabase-server'

interface WebhookRecipient {
  email: string
  name: string
}

interface TicketWebhookData {
  event: 'comment' | 'status_change' | 'completion_date_change' | 'created'
  ticket: {
    id: string
    assunto: string
    pedido_por: string
    pedido_por_email?: string
    estado?: string
    data_prevista_conclusao?: string | null
    url: string
  }
  recipients: WebhookRecipient[]
  eventDetails: {
    commentAuthor?: string
    commentBody?: string
    oldStatus?: string
    newStatus?: string
    completionDate?: string
  }
  changedBy: {
    id: string
    name: string
    email: string
    role: string
  }
}

/**
 * Get email for pedido_por user
 */
export async function getPedidoPorEmail(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  pedidoPor: string
): Promise<string | null> {
  if (!pedidoPor) return null

  const { data: requester } = await supabase
    .from('users')
    .select('email, name')
    .or(`name.eq.${pedidoPor},email.eq.${pedidoPor}`)
    .maybeSingle()

  const req = requester as { email: string; name: string } | null
  return req?.email || null
}

/**
 * Get ticket URL based on environment
 */
export function getTicketUrl(ticketId: string, baseUrl?: string): string {
  // Try to get base URL from environment variable, request origin, or default
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://ticketbi.vercel.app'
  
  // Ensure URL has protocol
  const url = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  
  // Remove trailing slash if present
  const cleanUrl = url.replace(/\/$/, '')
  
  return `${cleanUrl}/tickets/${ticketId}`
}

/**
 * Get recipients for ticket notifications (pedido_por + interessados)
 */
export async function getTicketNotificationRecipients(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  ticketId: string,
  pedidoPor: string
): Promise<WebhookRecipient[]> {
  const recipients: WebhookRecipient[] = []

  // Get user by pedido_por (name or email)
  const { data: requester } = await supabase
    .from('users')
    .select('email, name')
    .or(`name.eq.${pedidoPor},email.eq.${pedidoPor}`)
    .maybeSingle()

  const req = requester as { email: string; name: string } | null
  if (req && req.email) {
    recipients.push({
      email: req.email,
      name: req.name || req.email,
    })
  }

  // Get ticket manager (gestor)
  const { data: ticketWithManager } = await supabase
    .from('tickets')
    .select('gestor:users!tickets_gestor_id_fkey(email, name)')
    .eq('id', ticketId)
    .maybeSingle()

  const gestorUser = (ticketWithManager as any)?.gestor as { email: string; name: string } | null
  if (gestorUser && gestorUser.email) {
    if (!recipients.find((r) => r.email === gestorUser.email)) {
      recipients.push({
        email: gestorUser.email,
        name: gestorUser.name || gestorUser.email,
      })
    }
  }

  // Get watchers/interessados
  const { data: watchers } = await supabase
    .from('ticket_watchers')
    .select('user_id, users!ticket_watchers_user_id_fkey(email, name)')
    .eq('ticket_id', ticketId)

  if (watchers) {
    for (const w of watchers) {
      const user = (w as any).users
      if (user && user.email) {
        // Avoid duplicates
        if (!recipients.find((r) => r.email === user.email)) {
          recipients.push({
            email: user.email,
            name: user.name || user.email,
          })
        }
      }
    }
  }

  return recipients
}

/**
 * Get recipients for internal notes notifications (only BI/Admin users from ticket context)
 */
export async function getInternalNotesRecipients(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  ticketId: string
): Promise<WebhookRecipient[]> {
  const recipients: WebhookRecipient[] = []

  // Get ticket manager (gestor) if they are BI or Admin
  const { data: ticketWithManager } = await supabase
    .from('tickets')
    .select('gestor:users!tickets_gestor_id_fkey(email, name, role)')
    .eq('id', ticketId)
    .maybeSingle()

  const gestorUser = (ticketWithManager as any)?.gestor as { email: string; name: string; role: string } | null
  if (gestorUser && gestorUser.email && (gestorUser.role === 'bi' || gestorUser.role === 'admin')) {
    recipients.push({
      email: gestorUser.email,
      name: gestorUser.name || gestorUser.email,
    })
  }

  // Get watchers/interessados who are BI or Admin
  const { data: watchers } = await supabase
    .from('ticket_watchers')
    .select('user_id, users!ticket_watchers_user_id_fkey(email, name, role)')
    .eq('ticket_id', ticketId)

  if (watchers) {
    for (const w of watchers) {
      const user = (w as any).users as { email: string; name: string; role: string } | null
      if (user && user.email && (user.role === 'bi' || user.role === 'admin')) {
        // Avoid duplicates
        if (!recipients.find((r) => r.email === user.email)) {
          recipients.push({
            email: user.email,
            name: user.name || user.email,
          })
        }
      }
    }
  }

  return recipients
}

/**
 * Send webhook to n8n for ticket events
 */
export async function sendTicketWebhook(data: TicketWebhookData): Promise<void> {
  // Skip if no recipients
  if (data.recipients.length === 0) return

  // Skip if webhook URL is not configured
  const webhookUrl = process.env.N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS
  if (!webhookUrl) {
    console.log('[Webhook] Skipping notification - N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS not configured')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[Webhook] Failed to send notification:', response.status, errorText)
    } else {
      console.log(`[Webhook] Notification sent for event: ${data.event}`)
    }
  } catch (error) {
    console.error('[Webhook] Error sending notification:', error)
  }
}
