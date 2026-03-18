import { NextRequest, NextResponse } from 'next/server'
import { runDueRecurringTemplates } from '@/lib/recurring-tickets'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') || request.headers.get('Authorization') || ''
  return auth === `Bearer ${secret}`
}

async function handleRun(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runDueRecurringTemplates()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao executar tickets recorrentes' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return handleRun(request)
}

export async function POST(request: NextRequest) {
  return handleRun(request)
}
