import { NextRequest, NextResponse } from 'next/server'
import { resolveApiUser, requireInternalRole } from '@/lib/api-auth'
import { recurringTemplateUpdateSchema, updateRecurringTemplate } from '@/lib/recurring-tickets'
import { z } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = requireInternalRole(await resolveApiUser(request))
    const body = await request.json()
    const payload = recurringTemplateUpdateSchema.parse(body)
    const template = await updateRecurringTemplate(user, params.id, payload)
    return NextResponse.json({ template })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    const message = error?.message || 'Erro ao atualizar ticket recorrente'
    const status = message === 'Forbidden' ? 403 : message.includes('não encontrado') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
