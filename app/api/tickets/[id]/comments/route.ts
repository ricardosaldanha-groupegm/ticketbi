import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { canReadTicket, canCommentOnTicket, createAuthUser, AuthUser } from '@/lib/rbac'
import type { Database } from '@/lib/supabase'
import { z } from 'zod'

const createCommentSchema = z.object({
  body: z.string().min(1),
})

// GET /api/tickets/[id]/comments - List comments for a ticket
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
      console.log('GET /api/tickets/[id]/comments called - using development mode')
      return NextResponse.json([])
    }

    // Production mode - use Supabase with auth
    const supabase = createServerSupabaseClient()
    const user = await resolveAuthUser(request, supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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
    const { data: w } = await supabase.from('ticket_watchers').select('user_id').eq('ticket_id', params.id).eq('user_id', user.id)
    if (!w || w.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    }

    // Get comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(name, email)
      `)
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

        // Also include comments made on subtickets of this ticket
    const { data: subtickets, error: subticketsError } = await supabase
      .from('subtickets')
      .select('id')
      .eq('ticket_id', params.id)

    if (subticketsError) {
      return NextResponse.json({ error: subticketsError.message }, { status: 500 })
    }

    const subticketIds = (subtickets || []).map((s: any) => s.id)

        let subticketComments: any[] = []
    if (subticketIds.length) {
      const { data: subComments, error: subError } = await supabase
        .from('comments').select(`
          *,
          author:users!comments_author_id_fkey(name, email),
          subticket:subtickets!comments_subticket_id_fkey(id, titulo)
        `).in('subticket_id', subticketIds)

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 500 })
      }
      subticketComments = subComments || []
    }

    const merged = [...(comments || []), ...subticketComments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return NextResponse.json(merged)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tickets/[id]/comments - Create new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    const isDevMode =
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl.includes('your-project') ||
      supabaseKey.includes('your-')

    if (isDevMode) {
      console.log('POST /api/tickets/[id]/comments called - using development mode')
      const mockComment = {
        id: `dev-${Date.now()}`,
        body: validatedData.body,
        created_at: new Date().toISOString(),
        author: {
          name: 'Utilizador Demo',
          email: 'demo@example.com',
        },
      }
      return NextResponse.json(mockComment, { status: 201 })
    }

    const supabase = createServerSupabaseClient()
    const user = await resolveAuthUser(request, supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!canCommentOnTicket(user, ticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const commentData = {
      ...validatedData,
      ticket_id: params.id,
      author_id: user.id,
    }

    const { data: comment, error } = await (supabase as any)
      .from('comments')
      .insert(commentData as any)
      .select(`
        *,
        author:users!comments_author_id_fkey(name, email)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (
      !(ticket as any).data_primeiro_contacto &&
      (user.role === 'bi' || user.role === 'admin')
    ) {
      await (supabase as any)
        .from('tickets')
        .update({ data_primeiro_contacto: new Date().toISOString() })
        .eq('id', params.id)
        .is('data_primeiro_contacto', null)
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function resolveAuthUser(
  request: NextRequest,
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<AuthUser | null> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return null
  }

  const { data: dbUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !dbUser) {
    return null
  }

  return createAuthUser(dbUser)
}












