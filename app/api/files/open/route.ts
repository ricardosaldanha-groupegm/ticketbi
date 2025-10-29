import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'

// GET /api/files/open?attachmentId=...
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('attachmentId')
    const expires = Math.max(60, Math.min(3600, Number(searchParams.get('expires') || 600)))
    if (!id) return NextResponse.json({ error: 'attachmentId required' }, { status: 400 })

    const supabase = createServerSupabaseClient()
    const { data: att, error } = await supabase
      .from('attachments')
      .select('id, storage_path')
      .eq('id', id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!att?.storage_path) return NextResponse.json({ error: 'Attachment not found or missing path' }, { status: 404 })

    const { data: signed, error: sErr } = await supabase.storage
      .from('attachments')
      .createSignedUrl(att.storage_path as string, expires)
    if (sErr || !signed?.signedUrl) return NextResponse.json({ error: sErr?.message || 'Failed to sign url' }, { status: 500 })

    return NextResponse.redirect(signed.signedUrl, { status: 307 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

