import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAuthUser, AuthUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'

export async function getCurrentUser(): Promise<AuthUser | null> {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
    // Development mode - return null (will be handled by client-side auth)
    console.log('Running in development mode - auth handled client-side')
    return null
  }
  
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return createAuthUser(profile)
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (user) return user

  // In development, allow a fallback dev user to avoid redirects in API routes
  if (process.env.NODE_ENV !== 'production') {
    return {
      id: 'dev-user',
      name: 'Dev User',
      email: 'dev@example.com',
      role: 'admin',
    }
  }

  redirect('/login')
}

export async function requireRole(requiredRole: 'admin' | 'bi' | 'requester'): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.role !== requiredRole && user.role !== 'admin') {
    redirect('/unauthorized')
  }
  
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole('admin')
}

export async function requireBIOrAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.role !== 'bi' && user.role !== 'admin') {
    redirect('/unauthorized')
  }
  
  return user
}
