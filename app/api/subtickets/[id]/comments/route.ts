import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { canCommentOnSubticket, createAuthUser, type AuthUser } from '@/lib/rbac'
import type { Database } from '@/lib/supabase'
import { z } from 'zod'

const createCommentSchema = z.object({
  body: z.string().min(1),
})

async function resolveAuthUser(
  request: NextRequest,
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<AuthUser | null> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return createAuthUser(data)
}

// GET /api/subtickets/[id]/comments - List comments for a subticket
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await resolveAuthUser(request, supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!canCommentOnSubticket(user, subticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`*, author:users!comments_author_id_fkey(name, email)`) 
      .eq('subticket_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/subtickets/[id]/comments - Create new comment
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await resolveAuthUser(request, supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

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

    if (!canCommentOnSubticket(user, subticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const commentData = {
      ...validatedData,
      subticket_id: params.id,
      author_id: user.id,
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select(`*, author:users!comments_author_id_fkey(name, email)`) 
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
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



