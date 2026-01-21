import { Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Ticket = Database['public']['Tables']['tickets']['Row']
type Subticket = Database['public']['Tables']['subtickets']['Row']

export type UserRole = 'requester' | 'bi' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase()

const isRequestedByUser = (user: AuthUser, ticket: Ticket) => {
  const pedidoPor = normalizeValue((ticket as any).pedido_por)
  if (!pedidoPor) return false
  return pedidoPor === normalizeValue(user.name) || pedidoPor === normalizeValue(user.email)
}

// RBAC Functions
export function canReadTicket(user: AuthUser, ticket: Ticket): boolean {
  if (user.role === 'admin' || user.role === 'bi') return true
  return ticket.created_by === user.id || isRequestedByUser(user, ticket)
}

export function canEditTicket(user: AuthUser, ticket: Ticket, fields?: string[]): boolean {
  if (user.role === 'admin') return true
  
  if (user.role === 'bi' && ticket.gestor_id === user.id) return true
  
  if (
    user.id === ticket.created_by &&
    ['novo', 'em_analise'].includes(ticket.estado) &&
    (!fields || fields.every(f => ['assunto', 'descricao', 'data_esperada'].includes(f)))
  ) return true
  
  return false
}

export function canCreateSubticket(user: AuthUser, ticket: Ticket): boolean {
  return user.role === 'admin' || (user.role === 'bi' && ticket.gestor_id === user.id)
}

export function canEditSubticket(user: AuthUser, subticket: Subticket): boolean {
  return user.role === 'admin' || (user.role === 'bi' && subticket.assignee_bi_id === user.id)
}

export function canDeleteTicket(user: AuthUser, ticket: Ticket): boolean {
  if (user.role === 'admin') return true
  // Gestor do ticket (perfil BI) pode eliminar
  if (user.role === 'bi' && ticket.gestor_id === user.id) return true
  return false
}

export function canDeleteSubticket(user: AuthUser, subticket: Subticket, ticket: Ticket): boolean {
  return user.role === 'admin' || (user.role === 'bi' && ticket.gestor_id === user.id)
}

export function canCommentOnTicket(user: AuthUser, ticket: Ticket): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'bi' && ticket.gestor_id === user.id) return true
  if (user.id === ticket.created_by) return true
  if (isRequestedByUser(user, ticket)) return true
  return false
}

export function canCommentOnSubticket(user: AuthUser, subticket: Subticket): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'bi' && subticket.assignee_bi_id === user.id) return true
  return false
}

export function canUploadToTicket(user: AuthUser, ticket: Ticket): boolean {
  return canCommentOnTicket(user, ticket)
}

export function canUploadToSubticket(user: AuthUser, subticket: Subticket): boolean {
  return canCommentOnSubticket(user, subticket)
}

export function canChangeTicketStatus(user: AuthUser, ticket: Ticket): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'bi' && ticket.gestor_id === user.id) return true
  return false
}

export function canChangeSubticketStatus(user: AuthUser, subticket: Subticket): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'bi' && subticket.assignee_bi_id === user.id) return true
  return false
}

export function canAssignTicketManager(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'bi'
}

export function canAssignSubticketAssignee(user: AuthUser, ticket: Ticket): boolean {
  return user.role === 'admin' || (user.role === 'bi' && ticket.gestor_id === user.id)
}

export function canViewInternalNotes(user: AuthUser, ticket: Ticket): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'bi' && ticket.gestor_id === user.id) return true
  return false
}

export function canEditInternalNotes(user: AuthUser, ticket: Ticket): boolean {
  return canViewInternalNotes(user, ticket)
}

// Helper function to get user role from database user
export function getUserRole(user: User): UserRole {
  return user.role as UserRole
}

// Helper function to create AuthUser from database user
export function createAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: getUserRole(user)
  }
}
