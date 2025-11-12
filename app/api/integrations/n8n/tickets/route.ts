import { NextRequest, NextResponse } from 'next/server'
import {
  createTicket,
  createTicketSchema,
  deleteTicket,
} from '@/lib/tickets-service'
import { z } from 'zod'

const deletePayloadSchema = z.object({
  ticketId: z.string().min(1, 'ticketId is required'),
})

type ApiKeyCheck =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'invalid' }

const allowedOrigin = process.env.N8N_ALLOWED_ORIGIN || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Max-Age': '86400',
}

function jsonWithCors(body: any, init?: { status?: number }) {
  const response = NextResponse.json(body, init)
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

function emptyWithCors(status = 204) {
  return new NextResponse(null, {
    status,
    headers: corsHeaders,
  })
}

function checkApiKey(request: NextRequest): ApiKeyCheck {
  const configuredKey = process.env.N8N_INTEGRATION_KEY
  if (!configuredKey) {
    return { ok: false, reason: 'missing' }
  }

  const headerKey = request.headers.get('x-api-key')?.trim() ?? ''
  const bearerKey =
    request.headers
      .get('authorization')
      ?.replace(/^Bearer\s+/i, '')
      .trim() ?? ''

  if (headerKey === configuredKey || bearerKey === configuredKey) {
    return { ok: true }
  }

  return { ok: false, reason: 'invalid' }
}

function unauthorizedResponse() {
  return jsonWithCors(
    { error: 'Unauthorized', message: 'Invalid integration API key' },
    { status: 401 },
  )
}

export async function POST(request: NextRequest) {
  try {
    const auth = checkApiKey(request)
    if (!auth.ok) {
      if (auth.reason === 'missing') {
        return jsonWithCors(
          {
            error: 'Server misconfiguration',
            details: 'N8N_INTEGRATION_KEY is not configured',
          },
          { status: 500 },
        )
      }
      return unauthorizedResponse()
    }

    const payload = await request.json()
    const validatedData = createTicketSchema.parse(payload)
    const { ticket, source } = await createTicket(validatedData)

    return jsonWithCors(
      {
        ticket,
        createdVia: source,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithCors(
        { error: 'Invalid data', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error creating ticket via n8n integration:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonWithCors(
      { error: 'Internal server error', details: message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = checkApiKey(request)
    if (!auth.ok) {
      if (auth.reason === 'missing') {
        return jsonWithCors(
          {
            error: 'Server misconfiguration',
            details: 'N8N_INTEGRATION_KEY is not configured',
          },
          { status: 500 },
        )
      }
      return unauthorizedResponse()
    }

    const payload = await request.json()
    const { ticketId } = deletePayloadSchema.parse(payload)
    const result = await deleteTicket(ticketId)

    return jsonWithCors({
      removed: result.removed,
      source: result.source,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonWithCors(
        { error: 'Invalid data', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Error reverting ticket via n8n integration:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonWithCors(
      { error: 'Internal server error', details: message },
      { status: 500 },
    )
  }
}

export function OPTIONS() {
  return emptyWithCors()
}
