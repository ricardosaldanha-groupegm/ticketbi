import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { canUploadToSubticket } from '@/lib/rbac'
import { z } from 'zod'

const createAttachmentSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size_bytes: z.number().min(0),
  storage_path: z.string().min(1),
})

// GET /api/subtickets/[id]/attachments - List attachments for a subticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    let user: any = null
    try {
      user = await requireAuth()
    } catch (_) {
      const hdrId = request.headers.get('x-user-id')
      if (hdrId) {
        const { data: dbUser } = await supabase.from('users').select('*').eq('id', hdrId).maybeSingle()
        if (dbUser) user = { id: (dbUser as any).id, role: (dbUser as any).role, email: (dbUser as any).email }
      }
      if (!user) return NextResponse.json([])
    }
    
    // First check if user can read the subticket
    const { data: subticket, error: subticketError } = await supabase
      .from('subtickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (subticketError) {
      return NextResponse.json({ error: subticketError.message }, { status: 500 })
    }

    if (!subticket) {
      return NextResponse.json({ error: 'Subticket not found' }, { status: 404 })
    }

    // Get attachments
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select(`
        *,
        uploaded_by_user:users!attachments_uploaded_by_fkey(name, email)
      `)
      .eq('subticket_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(attachments || [])
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/subtickets/[id]/attachments - Create new attachment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    let user: any = null
    try {
      user = await requireAuth()
    } catch (_) {
      const hdrId = request.headers.get('x-user-id')
      if (hdrId) {
        const { data: dbUser } = await supabase.from('users').select('*').eq('id', hdrId).maybeSingle()
        if (dbUser) user = { id: (dbUser as any).id, role: (dbUser as any).role, email: (dbUser as any).email }
      }
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = createAttachmentSchema.parse(body)

    // First check if user can read the subticket
    const { data: subticket, error: subticketError } = await supabase
      .from('subtickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (subticketError) {
      return NextResponse.json({ error: subticketError.message }, { status: 500 })
    }

    if (!subticket) {
      return NextResponse.json({ error: 'Subticket not found' }, { status: 404 })
    }

    if (!canUploadToSubticket(user, subticket)) {
      return NextResponse.json({ error: 'Sem permissão para anexar nesta tarefa' }, { status: 403 })
    }

    const attachmentData = {
      ...validatedData,
      subticket_id: params.id,
      uploaded_by: user.id,
    }

    const { data: attachment, error } = await (supabase as any)
      .from('attachments')
      .insert(attachmentData as any)
      .select(`
        *,
        uploaded_by_user:users!attachments_uploaded_by_fkey(name, email)
      `)
      .single()

    if (error) {
      console.error('Error inserting attachment (subticket):', error)
      return NextResponse.json({ error: error.message || 'Erro ao criar anexo' }, { status: 500 })
    }

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error creating attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

