import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import { canReadTicket, canUploadToTicket } from '@/lib/rbac'
import { z } from 'zod'

const createAttachmentSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size_bytes: z.number().min(0),
  storage_path: z.string().min(1),
})

// GET /api/tickets/[id]/attachments - List attachments for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - return empty array
      console.log('GET /api/tickets/[id]/attachments called - using development mode')
      return NextResponse.json([])
    }

    // Production mode - use Supabase with auth
    const user = await requireAuth()
    const supabase = createServerSupabaseClient()
    
    // First check if user can read the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!canReadTicket(user, ticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get attachments
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select(`
        *,
        uploaded_by_user:users!attachments_uploaded_by_fkey(name, email)
      `)
      .eq('ticket_id', params.id)
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

// POST /api/tickets/[id]/attachments - Create new attachment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = createServerSupabaseClient()
    
    const body = await request.json()
    const validatedData = createAttachmentSchema.parse(body)

    // First check if user can read the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!canUploadToTicket(user, ticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const attachmentData = {
      ...validatedData,
      ticket_id: params.id,
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
      return NextResponse.json({ error: error.message }, { status: 500 })
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

