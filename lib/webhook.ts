import { createServerSupabaseClient } from '@/lib/supabase-server'

interface WebhookRecipient {
  email: string
  name: string
}

interface TicketWebhookData {
  event: 'comment' | 'status_change' | 'completion_date_change'
  ticket: {
    id: string
    assunto: string
    pedido_por: string
    estado?: string
    data_prevista_conclusao?: string | null
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
 * Send webhook to n8n for ticket events
 */
export async function sendTicketWebhook(data: TicketWebhookData): Promise<void> {
  // Skip if no recipients
  if (data.recipients.length === 0) return

  // Skip if webhook URL is not configured
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    console.log('[Webhook] Skipping notification - N8N_WEBHOOK_URL not configured')
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
