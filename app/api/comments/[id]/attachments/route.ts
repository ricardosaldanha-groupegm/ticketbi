import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
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
    const user = await requireAuth()
    const supabase = createServerSupabaseClient()

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

    return NextResponse.json({ attachments: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
