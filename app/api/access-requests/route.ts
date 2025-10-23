import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { addAccessRequest, getAllAccessRequests } from '@/lib/dev-storage'
import { z } from 'zod'

const accessRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  message: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Ensure proper UTF-8 encoding
    const body = await request.json()
    console.log('Received body:', body)
    const validatedData = accessRequestSchema.parse(body)
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - use in-memory storage
      console.log('Running in development mode - using in-memory storage')
      
      // Check if email already exists
      const existingRequest = getAllAccessRequests().find(req => 
        req.email === validatedData.email && req.status === 'pending'
      )
      
      if (existingRequest) {
        return NextResponse.json(
          { error: 'Já existe um pedido pendente para este email' },
          { status: 400 }
        )
      }
      
      // Create new request
      const newRequest = {
        id: `dev-${Date.now()}`,
        ...validatedData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      addAccessRequest(newRequest)
      
      return NextResponse.json({
        message: 'Pedido de acesso enviado com sucesso. Aguarde aprovação do administrador.',
        data: newRequest
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    }
    
    // Production mode - try to use Supabase, fallback to development mode
    console.log('Attempting to use Supabase for access requests')
    
    try {
      const supabase = createServerSupabaseClient()
      
      // Try to check if access_requests table exists by querying it
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
      console.log('Supabase not available, using development mode:', supabaseError)
      
      // Fallback to development mode
      const existingRequest = getAllAccessRequests().find(req => 
        req.email === validatedData.email && req.status === 'pending'
      )
      
      if (existingRequest) {
        return NextResponse.json(
          { error: 'Já existe um pedido pendente para este email' },
          { status: 400 }
        )
      }
      
      const newRequest = {
        id: `dev-${Date.now()}`,
        ...validatedData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      addAccessRequest(newRequest)
      
      return NextResponse.json({
        message: 'Pedido de acesso enviado com sucesso. Aguarde aprovação do administrador.',
        data: newRequest
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
    }
    
    // If we reach here, Supabase is available
    const supabase = createServerSupabaseClient()
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registado no sistema' },
        { status: 400 }
      )
    }
    
    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id')
      .eq('email', validatedData.email)
      .eq('status', 'pending')
      .single()
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'Já existe um pedido pendente para este email' },
        { status: 400 }
      )
    }
    
    // Create access request
    const { data, error } = await supabase
      .from('access_requests')
      .insert([validatedData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating access request:', error)
      return NextResponse.json(
        { error: 'Erro ao criar pedido de acesso' },
        { status: 500 }
      )
    }
    
        return NextResponse.json({
          message: 'Pedido de acesso enviado com sucesso. Aguarde aprovação do administrador.',
          data
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error in access request:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - return in-memory data
      console.log('Running in development mode - returning in-memory data')
      return NextResponse.json({ requests: getAllAccessRequests() }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
    }
    
    // Try to use Supabase
    console.log('Attempting to use Supabase for access requests list')
    
    try {
      const supabase = createServerSupabaseClient()
      
      // Try to check if access_requests table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('access_requests')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.log('Supabase table error, falling back to development mode:', tableError.message)
        return NextResponse.json({ requests: getAllAccessRequests() }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
      }
      
      console.log('access_requests table found, using Supabase')
    } catch (supabaseError) {
      console.log('Supabase error, falling back to development mode:', supabaseError)
      return NextResponse.json({ requests: getAllAccessRequests() }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
    }
    
    // Production mode - use Supabase (but skip auth for now since we're using localStorage)
    const supabase = createServerSupabaseClient()
    
    // Skip authentication for now since we're using localStorage auth
    // TODO: Implement proper Supabase Auth when ready
    
    // Get all access requests directly
    const { data: requests, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching access requests:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      )
    }
    
        return NextResponse.json({ requests }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        })
    
  } catch (error) {
    console.error('Error in GET access requests:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
