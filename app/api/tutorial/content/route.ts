import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang') || 'pt'
    
    const fileName = lang === 'es' ? 'TUTORIAL-UTILIZADORES-ES.md' : 'TUTORIAL-UTILIZADORES.md'
    const filePath = join(process.cwd(), fileName)
    const content = readFileSync(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading tutorial file:', error)
    return NextResponse.json({ error: 'Failed to load tutorial content' }, { status: 500 })
  }
}
