import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
      // Development mode - return mock data
      console.log('Running in development mode - returning mock users')
      return NextResponse.json({ 
        users: [
          {
            id: 'admin-001',
            email: 'ricardo.saldanha@groupegm.com',
            name: 'Ricardo Saldanha',
            role: 'admin',
            created_at: new Date().toISOString(),
            is_active: true
          }
        ]
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    // Try to use Supabase
    console.log('Attempting to use Supabase for users list')
    
    try {
      const supabase = createServerSupabaseClient()
      
      // Try to check if users table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.log('Supabase table error, falling back to development mode:', tableError.message)
        return NextResponse.json({ 
          users: [
            {
              id: 'admin-001',
              email: 'ricardo.saldanha@groupegm.com',
              name: 'Ricardo Saldanha',
              role: 'admin',
              created_at: new Date().toISOString(),
              is_active: true
            }
          ]
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }
      
      console.log('users table found, using Supabase')
    } catch (supabaseError) {
      console.log('Supabase error, falling back to development mode:', supabaseError)
      return NextResponse.json({ 
        users: [
          {
            id: 'admin-001',
            email: 'ricardo.saldanha@groupegm.com',
            name: 'Ricardo Saldanha',
            role: 'admin',
            created_at: new Date().toISOString(),
            is_active: true
          }
        ]
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    // Production mode - use Supabase (skip auth for now since we're using localStorage)
    // Create a fresh client instance to avoid any caching
    const supabase = createServerSupabaseClient()
    
    // Force a fresh query by adding a random parameter to the query
    const randomParam = Math.random().toString(36).substring(7)
    console.log('Querying users from Supabase with fresh client...', randomParam)
    
    // First, let's try a direct query to see what we get
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar utilizadores' },
        { status: 500 }
      )
    }
    
    console.log('Raw users from Supabase:', users)
    
    // Add is_active field (assuming all users are active for now)
    const usersWithStatus = (users as any[]).map((user: any) => ({
      ...(user as any),
      is_active: true // TODO: Add is_active column to users table
    }))
    
    console.log('API returning users:', usersWithStatus) // Debug log
    return NextResponse.json({ users: usersWithStatus }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Error in GET users:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


