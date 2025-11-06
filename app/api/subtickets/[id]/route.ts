import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { canEditSubticket, canDeleteSubticket } from '@/lib/rbac'
import { z } from 'zod'

const updateSubticketSchema = z.object({
  titulo: z.string().min(1).optional(),
  descricao: z.string().optional(),
  urgencia: z.number().min(1).max(3).optional(),
  importancia: z.number().min(1).max(3).optional(),
  data_inicio: z.string().optional(),
  data_inicio_planeado: z.string().optional(),
  data_esperada: z.string().optional(),
  data_conclusao: z.string().optional(),
  estado: z.enum(['novo', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado']).optional(),
  assignee_bi_id: z.string().optional(),
})

// GET /api/subtickets/[id] - Get single subticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      return NextResponse.json({
        id: params.id,
        titulo: 'Tarefa de desenvolvimento',
        descricao: 'Esta é uma tarefa simulada porque o Supabase não está configurado.',
        estado: 'novo',
        prioridade: 1,
        urgencia: 1,
        importancia: 1,
        data_inicio: null,
        data_inicio_planeado: null,
        data_esperada: null,
        data_conclusao: null,
        created_at: new Date().toISOString(),
        assignee: {
          name: 'Utilizador',
          email: 'dev@example.com',
        },
        ticket: null,
      })
    }

    const user = await getCurrentUser()
    const isAuthenticated = Boolean(user)
    void isAuthenticated
    const supabase = createServerSupabaseClient()
    
    const { data: subticket, error } = await supabase
      .from('subtickets')
      .select(`
        *,
        assignee:users!subtickets_assignee_bi_id_fkey(name, email),
        ticket:tickets!subtickets_ticket_id_fkey(
          *,
          created_by_user:users!tickets_created_by_fkey(name, email),
          gestor:users!tickets_gestor_id_fkey(name, email)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subticket) {
      return NextResponse.json({ error: 'Subticket not found' }, { status: 404 })
    }

    return NextResponse.json(subticket)
  } catch (error) {
    console.error('Error fetching subticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/subtickets/[id] - Update subticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      const body = await request.json()
      const validatedData = updateSubticketSchema.parse(body)
      return NextResponse.json({
        id: params.id,
        ...validatedData,
        data_inicio: validatedData.data_inicio ?? null,
        data_inicio_planeado: validatedData.data_inicio_planeado ?? null,
        data_esperada: validatedData.data_esperada ?? null,
        data_conclusao: validatedData.data_conclusao ?? null,
        assignee: validatedData.assignee_bi_id
          ? { name: 'Responsável', email: 'dev@example.com', id: validatedData.assignee_bi_id }
          : null,
      })
    }

    const user = await getCurrentUser()
    const supabase = createServerSupabaseClient()
    const skipPermissions = !user
    
    const body = await request.json()
    const validatedData = updateSubticketSchema.parse(body)

    // Get current subticket
    const { data: currentSubticket, error: fetchError } = await supabase
      .from('subtickets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!currentSubticket) {
      return NextResponse.json({ error: 'Subticket not found' }, { status: 404 })
    }

    // Check permissions
    if (!skipPermissions && !canEditSubticket(user!, currentSubticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If changing assignee, verify they are a BI user
  if (validatedData.assignee_bi_id) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('users')
        .select('role')
        .eq('id', validatedData.assignee_bi_id)
        .single()

      if (assigneeError || !assignee) {
        return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 })
      }

      if (!skipPermissions && assignee.role !== 'bi' && assignee.role !== 'admin') {
        return NextResponse.json({ error: 'Assignee must be a BI user' }, { status: 400 })
      }
    }

    const normalized = {
      ...validatedData,
      data_inicio:
        validatedData.data_inicio && validatedData.data_inicio.trim() !== '' ? validatedData.data_inicio : null,
      data_inicio_planeado:
        validatedData.data_inicio_planeado && validatedData.data_inicio_planeado.trim() !== ''
          ? validatedData.data_inicio_planeado
          : null,
      data_esperada:
        validatedData.data_esperada && validatedData.data_esperada.trim() !== '' ? validatedData.data_esperada : null,
      data_conclusao:
        validatedData.data_conclusao && validatedData.data_conclusao.trim() !== ''
          ? validatedData.data_conclusao
          : null,
    }

    // Update subticket
    const { data: subticket, error } = await supabase
      .from('subtickets')
      .update({
        ...normalized,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        assignee:users!subtickets_assignee_bi_id_fkey(name, email)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(subticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    
    console.error('Error updating subticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/subtickets/[id] - Delete subticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = createServerSupabaseClient()
    
    // Get current subticket with ticket info
    const { data: subticket, error: fetchError } = await supabase
      .from('subtickets')
      .select(`
        *,
        ticket:tickets!subtickets_ticket_id_fkey(*)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!subticket) {
      return NextResponse.json({ error: 'Subticket not found' }, { status: 404 })
    }

    if (!subticket.ticket) {
      return NextResponse.json({ error: 'Parent ticket not found' }, { status: 404 })
    }

    if (!canDeleteSubticket(user, subticket, subticket.ticket)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('subtickets')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subticket deleted successfully' })
  } catch (error) {
    console.error('Error deleting subticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
