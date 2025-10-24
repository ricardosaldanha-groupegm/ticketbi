import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getAccessRequest, updateAccessRequest } from '@/lib/dev-storage'
import { z } from 'zod'

const approveRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = approveRequestSchema.parse(body)
    const { id } = params
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - use in-memory storage
      console.log('Running in development mode - processing access request')
      
      // Find the request
      const accessRequest = getAccessRequest(id)
      if (!accessRequest) {
        return NextResponse.json(
          { error: 'Pedido nÃ£o encontrado' },
          { status: 404 }
        )
      }
      
      if (((accessRequest as any)?.status) !== 'pending') {
        return NextResponse.json(
          { error: 'Este pedido jÃ¡ foi processado' },
          { status: 400 }
        )
      }
      
      const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected'
      
      // Update the request
      const updatedRequest = updateAccessRequest(id, {
        status: newStatus,
        approved_by: 'dev-admin-001',
        approved_at: new Date().toISOString()
      })
      
      return NextResponse.json({
        message: `Pedido ${validatedData.action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
        data: updatedRequest
      })
    }
    
    // Production mode - try to use Supabase, fallback to development mode
    console.log('Attempting to use Supabase for access request approval')
    
    try {
      const supabase = createServerSupabaseClient()
      
      // Try to check if access_requests table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('access_requests')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.log('Supabase table error, falling back to development mode:', tableError.message)
        throw new Error('Table not found')
      }
      
      console.log('access_requests table found, using Supabase')
    } catch (supabaseError) {
      console.log('Supabase not available, using development mode for approval:', supabaseError)
      
      // Fallback to development mode
      const accessRequest = getAccessRequest(id)
      if (!accessRequest) {
        return NextResponse.json(
          { error: 'Pedido nÃ£o encontrado' },
          { status: 404 }
        )
      }
      
      if (((accessRequest as any)?.status) !== 'pending') {
        return NextResponse.json(
          { error: 'Este pedido jÃ¡ foi processado' },
          { status: 400 }
        )
      }
      
      const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected'
      
      // Update the request
      const updatedRequest = updateAccessRequest(id, {
        status: newStatus,
        approved_by: 'dev-admin-001',
        approved_at: new Date().toISOString()
      })
      
      return NextResponse.json({
        message: `Pedido ${validatedData.action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
        data: updatedRequest
      })
    }
    
    // If we reach here, Supabase is available
    const supabase = createServerSupabaseClient()
    
    // Skip authentication for now since we're using localStorage auth
    // TODO: Implement proper Supabase Auth when ready
    
    // Get the access request
    const { data: accessRequest, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !accessRequest) {
      return NextResponse.json(
        { error: 'Pedido nÃ£o encontrado' },
        { status: 404 }
      )
    }
    
    if (((accessRequest as any)?.status) !== 'pending') {
      return NextResponse.json(
        { error: 'Este pedido jÃ¡ foi processado' },
        { status: 400 }
      )
    }
    
    const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected'
    
    // Update the access request (leaving approved_by as null for now since we don't have proper auth)
    const { data: updatedRequest, error: updateError } = await (supabase as any)
      .from('access_requests')
      .update({
        status: newStatus,
        approved_by: null, // Will be null until proper Supabase Auth is implemented
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating access request:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar pedido' },
        { status: 500 }
      )
    }
    
    // If approved, create the user account and send invite email
    if (validatedData.action === 'approve') {
      const email = (accessRequest as any).email as string
      const name = (accessRequest as any).name as string

      // 1) Send Supabase Auth invite email (same flow as /api/admin/users)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!supabaseUrl || !serviceKey) {
        console.warn('Supabase config missing; cannot send invite email')
      } else {
        const admin = createClient(supabaseUrl, serviceKey)
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || undefined
        const redirectTo = origin ? `${origin}/alterar-password` : undefined
        const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { must_change_password: true, name },
          redirectTo,
        })
        if (inviteErr) {
          console.error('Error sending invite email:', inviteErr)
          // Do not fail the whole request because of email; continue to DB upsert
        }
      }

      // 2) Upsert into users table (ensure app mapping exists)
      const { error: upsertErr } = await (supabase as any)
        .from('users')
        .upsert({
          // If the invited user already exists in auth, we might not know their id here; rely on email uniqueness
          email,
          name,
          role: 'requester',
        } as any, { onConflict: 'email' })

      if (upsertErr) {
        console.error('Error upserting user:', upsertErr)
        // Rollback to pending only if it's a hard failure unrelated to unique conflict
        if ((upsertErr as any).code && (upsertErr as any).code !== '23505') {
          await (supabase as any)
            .from('access_requests')
            .update({ status: 'pending' } as any)
            .eq('id', id)
          return NextResponse.json(
            { error: 'Erro ao criar utilizador' },
            { status: 500 }
          )
        }
      }
    }
    
    return NextResponse.json({
      message: `Pedido ${validatedData.action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
      data: updatedRequest
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados invÃ¡lidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error in access request approval:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}







