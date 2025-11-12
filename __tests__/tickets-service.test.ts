import {
  createTicket,
  deleteTicket,
  listTicketsInMemory,
} from '@/lib/tickets-service'

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const resetEnvToMemoryMode = () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
}

const clearMemoryTickets = async () => {
  const current = [...listTicketsInMemory()]
  if (current.length === 0) return
  for (const ticket of current) {
    await deleteTicket(ticket.id)
  }
}

describe('tickets-service (memory mode)', () => {
  beforeEach(async () => {
    resetEnvToMemoryMode()
    await clearMemoryTickets()
  })

  afterAll(() => {
    if (originalSupabaseUrl) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
    }
    if (originalServiceRole) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  })

  it('creates and deletes tickets in memory', async () => {
    const payload = {
      pedido_por: 'Tester',
      assunto: 'Memory mode ticket',
      descricao: 'Ensure ticket is persisted in memory store',
      objetivo: 'Validate create/delete service helpers',
      urgencia: 2,
      importancia: 2,
      data_esperada: undefined,
    }

    const { ticket, source } = await createTicket(payload)
    expect(source).toBe('memory')
    expect(ticket.id).toBeDefined()

    let stored = listTicketsInMemory().find(t => t.id === ticket.id)
    expect(stored).toBeDefined()

    const deletion = await deleteTicket(ticket.id)
    expect(deletion.removed).toBe(true)
    expect(deletion.source).toBe('memory')

    stored = listTicketsInMemory().find(t => t.id === ticket.id)
    expect(stored).toBeUndefined()
  })
})
