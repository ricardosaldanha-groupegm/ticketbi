import { createServerSupabaseClient } from '@/lib/supabase-server'

interface EmailRecipient {
  email: string
  name: string
}

interface TicketNotificationData {
  ticketId: string
  ticketAssunto: string
  ticketUrl: string
  eventType: 'comment' | 'status_change' | 'completion_date_change'
  eventDetails: {
    commentAuthor?: string
    commentBody?: string
    oldStatus?: string
    newStatus?: string
    completionDate?: string
  }
}

/**
 * Get recipients for ticket notifications (pedido_por + interessados)
 */
export async function getTicketNotificationRecipients(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  ticketId: string,
  pedidoPor: string
): Promise<EmailRecipient[]> {
  const recipients: EmailRecipient[] = []

  // Get user by pedido_por (name or email)
  const { data: requester } = await supabase
    .from('users')
    .select('email, name')
    .or(`name.eq.${pedidoPor},email.eq.${pedidoPor}`)
    .maybeSingle()

  if (requester && requester.email) {
    recipients.push({
      email: requester.email,
      name: requester.name || requester.email,
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
 * Send email notification for ticket events
 */
export async function sendTicketNotification(
  recipients: EmailRecipient[],
  data: TicketNotificationData
): Promise<void> {
  // Skip if no recipients
  if (recipients.length === 0) return

  // Skip if email is not configured
  const emailApiKey = process.env.RESEND_API_KEY
  if (!emailApiKey) {
    console.log('[Email] Skipping notification - RESEND_API_KEY not configured')
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketbi.vercel.app'
  const ticketUrl = `${baseUrl}/tickets/${data.ticketId}`

  // Build email subject and body based on event type
  let subject = ''
  let htmlBody = ''

  switch (data.eventType) {
    case 'comment':
      subject = `Novo comentário no ticket: ${data.ticketAssunto}`
      htmlBody = `
        <h2>Novo comentário no ticket</h2>
        <p><strong>Ticket:</strong> ${data.ticketAssunto}</p>
        <p><strong>Comentado por:</strong> ${data.eventDetails.commentAuthor || 'Utilizador'}</p>
        <p><strong>Comentário:</strong></p>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 12px 0;">
          ${(data.eventDetails.commentBody || '').replace(/\n/g, '<br>')}
        </div>
        <p><a href="${ticketUrl}" style="background: #f59e0b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 12px;">Ver ticket</a></p>
      `
      break

    case 'status_change':
      subject = `Status alterado no ticket: ${data.ticketAssunto}`
      htmlBody = `
        <h2>Status do ticket alterado</h2>
        <p><strong>Ticket:</strong> ${data.ticketAssunto}</p>
        <p><strong>Status anterior:</strong> ${data.eventDetails.oldStatus || 'N/A'}</p>
        <p><strong>Novo status:</strong> ${data.eventDetails.newStatus || 'N/A'}</p>
        <p><a href="${ticketUrl}" style="background: #f59e0b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 12px;">Ver ticket</a></p>
      `
      break

    case 'completion_date_change':
      subject = `Data de conclusão atualizada no ticket: ${data.ticketAssunto}`
      const completionDate = data.eventDetails.completionDate
        ? new Date(data.eventDetails.completionDate).toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'N/A'
      htmlBody = `
        <h2>Data prevista de conclusão atualizada</h2>
        <p><strong>Ticket:</strong> ${data.ticketAssunto}</p>
        <p><strong>Data prevista de conclusão:</strong> ${completionDate}</p>
        <p><a href="${ticketUrl}" style="background: #f59e0b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 12px;">Ver ticket</a></p>
      `
      break
  }

  // Send emails using Resend API
  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'TicketBI <noreply@ticketbi.vercel.app>',
        to: recipients.map((r) => r.email),
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                h2 { color: #f59e0b; }
                a { color: #f59e0b; }
              </style>
            </head>
            <body>
              ${htmlBody}
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 12px;">Esta é uma notificação automática do sistema TicketBI.</p>
            </body>
          </html>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.json().catch(() => ({}))
      console.error('[Email] Failed to send notification:', error)
    } else {
      console.log(`[Email] Notification sent to ${recipients.length} recipient(s)`)
    }
  } catch (error) {
    console.error('[Email] Error sending notification:', error)
  }
}
