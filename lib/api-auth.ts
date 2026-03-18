import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAuthUser, type AuthUser } from '@/lib/rbac'
import { getCurrentUser } from '@/lib/auth'

export async function resolveApiUser(request: NextRequest): Promise<AuthUser | null> {
  const sessionUser = await getCurrentUser()
  if (sessionUser) return sessionUser

  const headerUserId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')
  if (!headerUserId) return null

  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', headerUserId)
    .maybeSingle()

  return data ? createAuthUser(data as any) : null
}

export function requireInternalRole(user: AuthUser | null) {
  if (!user || (user.role !== 'bi' && user.role !== 'admin')) {
    throw new Error('Forbidden')
  }
  return user
}
