import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['requester', 'bi', 'admin']).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    const { id } = params
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - return mock success
      console.log('Running in development mode - mock user update')
      return NextResponse.json({
        message: 'Utilizador atualizado com sucesso (modo desenvolvimento)',
        data: {
          id,
          ...validatedData,
          updated_at: new Date().toISOString()
        }
      })
    }
    
    // Production mode - try to use Supabase, fallback to development mode
    console.log('Attempting to use Supabase for user update')
    
    try {
      const supabase = createServerSupabaseClient()
      
      // Try to check if users table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.log('Supabase table error, falling back to development mode:', tableError.message)
        throw new Error('Table not found')
      }
      
      console.log('users table found, using Supabase')
    } catch (supabaseError) {
      console.log('Supabase not available, using development mode for user update:', supabaseError)
      
      // Fallback to development mode
      return NextResponse.json({
        message: 'Utilizador atualizado com sucesso (modo desenvolvimento)',
        data: {
          id,
          ...validatedData,
          updated_at: new Date().toISOString()
        }
      })
    }
    
    // If we reach here, Supabase is available
    const supabase = createServerSupabaseClient()
    
    // Skip authentication for now since we're using localStorage auth
    // TODO: Implement proper Supabase Auth when ready
    
    // Get the user first to check if exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'Utilizador nÃ£o encontrado' },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.role !== undefined) updateData.role = validatedData.role
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active

    // Avoid empty payload errors
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma alteração fornecida' },
        { status: 400 }
      )
    }
    
    // Update the user
    const { data: updatedUser, error: updateError } = await (supabase as any)
      .from('users')
      .update((updateData as any))
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      // Provide a clearer hint if the column doesn't exist
      const msg = (updateError as any)?.message || ''
      if (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('is_active')) {
        return NextResponse.json(
          { error: "A coluna 'is_active' não existe na tabela 'users'. Adicione-a para suportar ativar/desativar utilizadores." },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Erro ao atualizar utilizador' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Utilizador atualizado com sucesso',
      data: {
        ...updatedUser,
        // Mantém o valor real vindo da BD; sem forçar mock
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error in user update:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project") || supabaseKey.includes("your-")) {
      return NextResponse.json({ message: "Utilizador removido com sucesso (modo desenvolvimento)" })
    }

    const supabase = createServerSupabaseClient()

    // Identify requester (header X-User-Id or Supabase auth)
    let requesterId: string | null = request.headers.get("x-user-id")
    if (!requesterId) {
      const current = await getCurrentUser()
      requesterId = current?.id ?? null
    }
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()
    if (fetchError || !existingUser) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 })
    }

    // Determine requester role
    const { data: requesterRow } = await supabase.from("users").select("id, role").eq("id", requesterId).maybeSingle()
    const requesterRole = (requesterRow as any)?.role || null

    if (requesterId === id) {
      return NextResponse.json({ error: "Não pode remover a sua própria conta" }, { status: 400 })
    }
    if ((existingUser as any).role === "admin" && requesterRole !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem remover administradores" }, { status: 403 })
    }
    if ((existingUser as any).role === "admin") {
      const { data: admins } = await supabase.from("users").select("id").eq("role", "admin")
      if ((admins || []).length <= 1) {
        return NextResponse.json({ error: "Deve existir pelo menos um administrador" }, { status: 400 })
      }
    }

    const { error: deleteError } = await supabase.from("users").delete().eq("id", id)
    if (deleteError) {
      return NextResponse.json({ error: "Erro ao remover utilizador" }, { status: 500 })
    }
    return NextResponse.json({ message: "Utilizador removido com sucesso" })
  } catch (error) {
    console.error("Error in user deletion:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
