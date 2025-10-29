import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Simple admin utility: create missing attachment rows for already-uploaded files in Storage
// POST /api/admin/attachments/reconcile
// Body: { ticket_id?: string, subticket_id?: string, uploaded_by: string, items: Array<{ filename: string, mimetype: string, size_bytes: number, storage_path: string }> }

const schema = z.object({
  ticket_id: z.string().uuid().optional(),
  subticket_id: z.string().uuid().optional(),
  uploaded_by: z.string().uuid(),
  items: z.array(z.object({
    filename: z.string().min(1),
    mimetype: z.string().min(1),
    size_bytes: z.number().min(0),
    storage_path: z.string().min(1),
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const parsed = schema.parse(body)

    if (!!parsed.ticket_id === !!parsed.subticket_id) {
      return NextResponse.json({ error: 'Provide exactly one of ticket_id or subticket_id' }, { status: 400 })
    }

    const rows = parsed.items.map(i => ({
      filename: i.filename,
      mimetype: i.mimetype,
      size_bytes: i.size_bytes,
      storage_path: i.storage_path,
      uploaded_by: parsed.uploaded_by,
      ticket_id: parsed.ticket_id ?? null,
      subticket_id: parsed.subticket_id ?? null,
    }))

    const { data, error } = await (supabase as any)
      .from('attachments')
      .insert(rows as any)
      .select('*')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inserted: data?.length ?? 0 })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

