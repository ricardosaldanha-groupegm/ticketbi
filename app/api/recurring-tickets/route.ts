import { NextRequest, NextResponse } from 'next/server'
import { resolveApiUser, requireInternalRole } from '@/lib/api-auth'
import { createRecurringTemplate, listRecurringTemplates, recurringTemplateSchema } from '@/lib/recurring-tickets'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = requireInternalRole(await resolveApiUser(request))
    const templates = await listRecurringTemplates(user)
    return NextResponse.json({ templates })
  } catch (error: any) {
    const message = error?.message || 'Erro ao listar tickets recorrentes'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireInternalRole(await resolveApiUser(request))
    const body = await request.json()
    const payload = recurringTemplateSchema.parse(body)
    const template = await createRecurringTemplate(user, payload)
    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    const message = error?.message || 'Erro ao criar ticket recorrente'
    const status = message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
