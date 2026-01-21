import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { createAuthUser, AuthUser } from '@/lib/rbac'
import { z } from 'zod'

const attachmentSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size_bytes: z.number().min(0),
  storage_path: z.string().min(1),
})

const payloadSchema = z.object({
  // exactly one of ticket_id or subticket_id must be provided to create base attachment
  ticket_id: z.string().uuid().optional(),
  subticket_id: z.string().uuid().optional(),
  attachments: z.array(attachmentSchema).min(1),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    let user: AuthUser | null = null
    try {
      user = await requireAuth()
    } catch (_) {
      user = await resolveAuthUser(request, supabase)
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate comment existence
    const { data: comment, error: cErr } = await supabase
      .from('comments')
      .select('*')
      .eq('id', params.id)
      .single()
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

    const body = await request.json()
    const parsed = payloadSchema.parse(body)

    if (!parsed.ticket_id && !parsed.subticket_id) {
      return NextResponse.json({ error: 'ticket_id or subticket_id required' }, { status: 400 })
    }
    if (parsed.ticket_id && parsed.subticket_id) {
      return NextResponse.json({ error: 'Provide only ticket_id or subticket_id' }, { status: 400 })
    }

    // Create attachments rows tied to ticket or subticket
    const rows = parsed.attachments.map(a => ({
      filename: a.filename,
      mimetype: a.mimetype,
      size_bytes: a.size_bytes,
      storage_path: a.storage_path,
      url: supabase.storage.from('attachments').getPublicUrl(a.storage_path).data.publicUrl,
      uploaded_by: user.id,
      ticket_id: parsed.ticket_id ?? null,
      subticket_id: parsed.subticket_id ?? null,
    }))

    const { data: created, error: aErr } = await (supabase as any)
      .from('attachments')
      .insert(rows as any)
      .select('*')
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

    // Link to comment
    const links = (created || []).map((att: any) => ({ comment_id: params.id, attachment_id: att.id }))
    const { error: lErr } = await supabase.from('comment_attachments').insert(links as any)
    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })

    // Update comment body to include attachment links
    const currentBody = (comment as any).body || ''
    const attachmentLinks = (created || []).map((att: any) => `- [${att.filename}](${att.url})`).join('\n')
    const newBody = currentBody + (currentBody.trim() ? '\n\n' : '') + 'Anexos enviados:\n' + attachmentLinks
    const { error: uErr } = await (supabase as any)
      .from('comments')
      .update({ body: newBody })
      .eq('id', params.id)
    if (uErr) {
      // Non-fatal: attachments are linked, just the comment body update failed
      console.warn('Failed to update comment body with attachment links:', uErr)
    }

    return NextResponse.json({ attachments: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function resolveAuthUser(
  request: NextRequest,
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<AuthUser | null> {
  const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
  if (!userId) return null
  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (!dbUser) return null
  return createAuthUser(dbUser as any)
}
