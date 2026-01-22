import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { canReadTicket, createAuthUser, AuthUser } from '@/lib/rbac'

// GET /api/files/open?attachmentId=...
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    let user: AuthUser | null = null
    try {
      user = await requireAuth()
    } catch (_) {
      user = await resolveAuthUser(request, supabase)
    }
    // Allow access without auth if attachment exists and is linked to a ticket/subticket
    // (for direct links from comments)
    const allowUnauthenticated = !user
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('attachmentId')
    const expires = Math.max(60, Math.min(3600, Number(searchParams.get('expires') || 600)))
    if (!id) return NextResponse.json({ error: 'attachmentId required' }, { status: 400 })

    const { data: att, error } = await supabase
      .from('attachments')
      .select('id, storage_path, ticket_id, subticket_id')
      .eq('id', id)
      .maybeSingle<any>()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!att?.storage_path) return NextResponse.json({ error: 'Attachment not found or missing path' }, { status: 404 })

    // Check if attachment is linked to a comment (allows unauthenticated access for comment links)
    const { data: commentLink } = await supabase
      .from('comment_attachments')
      .select('comment_id')
      .eq('attachment_id', id)
      .maybeSingle()

    let allowed = false
    if (allowUnauthenticated && commentLink) {
      // Allow access if attachment is linked to a comment (for direct links from comments)
      allowed = true
    } else if (user) {
      // Normal permission check for authenticated users
      if (att.ticket_id) {
        const { data: ticket } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', att.ticket_id)
          .maybeSingle()
        if (ticket) {
          allowed = canReadTicket(user, ticket as any)
          if (!allowed) {
            const { data: w } = await supabase
              .from('ticket_watchers')
              .select('user_id')
              .eq('ticket_id', att.ticket_id)
              .eq('user_id', user.id)
            if (w && w.length > 0) allowed = true
          }
        }
      } else if (att.subticket_id) {
        const { data: subticket } = await supabase
          .from('subtickets')
          .select('id, ticket_id, assignee_bi_id')
          .eq('id', att.subticket_id)
          .maybeSingle()
        if (subticket) {
          const st: any = subticket as any
          if (user.role === 'admin' || user.role === 'bi' || st.assignee_bi_id === user.id) {
            allowed = true
          } else if (st.ticket_id) {
            const { data: ticket } = await supabase
              .from('tickets')
              .select('*')
              .eq('id', st.ticket_id)
              .maybeSingle()
            if (ticket) {
              allowed = canReadTicket(user, ticket as any)
              if (!allowed) {
                const { data: w } = await supabase
                  .from('ticket_watchers')
                  .select('user_id')
                  .eq('ticket_id', st.ticket_id)
                  .eq('user_id', user.id)
                if (w && w.length > 0) allowed = true
              }
            }
          }
        }
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: signed, error: sErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(att.storage_path as string, expires)
    if (sErr || !signed?.signedUrl) return NextResponse.json({ error: sErr?.message || 'Failed to sign url' }, { status: 500 })

    const wantsJson = request.headers.get('x-return-json') === '1'
    if (wantsJson) {
      return NextResponse.json({ url: signed.signedUrl })
    }

    return NextResponse.redirect(signed.signedUrl, { status: 307 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

async function resolveAuthUser(
  request: NextRequest,
  supabase?: ReturnType<typeof createServerSupabaseClient>
): Promise<AuthUser | null> {
  const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
  if (!userId) return null
  const client = supabase || createServerSupabaseClient()
  const { data: dbUser } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (!dbUser) return null
  return createAuthUser(dbUser as any)
}
