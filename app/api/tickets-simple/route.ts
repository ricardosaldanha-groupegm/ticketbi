import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage
let tickets: any[] = []

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tickets-simple called')
    return NextResponse.json({ 
      tickets: tickets, 
      total: tickets.length, 
      page: 1, 
      limit: 20,
      pagination: {
        pages: Math.ceil(tickets.length / 20)
      }
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/tickets-simple called')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const ticket = {
      id: `ticket-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    tickets.push(ticket)
    console.log('Ticket added:', ticket)
    
    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
