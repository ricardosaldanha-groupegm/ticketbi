// In-memory storage for development mode (will persist during server session)
let accessRequests: any[] = []
let tickets: any[] = []

// Simple in-memory storage functions

export function addAccessRequest(request: any) {
  accessRequests.push(request)
  console.log('Access request added:', request)
}

export function updateAccessRequest(id: string, updates: any) {
  const index = accessRequests.findIndex(req => req.id === id)
  if (index !== -1) {
    accessRequests[index] = { ...accessRequests[index], ...updates }
    return accessRequests[index]
  }
  return null
}

export function getAccessRequest(id: string) {
  return accessRequests.find(req => req.id === id)
}

export function getAllAccessRequests() {
  return accessRequests
}

// Ticket functions
export function addTicket(ticket: any) {
  tickets.push(ticket)
  console.log('Ticket added:', ticket)
}

export function getTicket(id: string) {
  return tickets.find(ticket => ticket.id === id)
}

export function getAllTickets() {
  return tickets
}

export function updateTicket(id: string, updates: any) {
  const index = tickets.findIndex(ticket => ticket.id === id)
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...updates }
    return tickets[index]
  }
  return null
}
