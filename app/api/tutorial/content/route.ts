import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'TUTORIAL-UTILIZADORES.md')
    const content = readFileSync(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading tutorial file:', error)
    return NextResponse.json({ error: 'Failed to load tutorial content' }, { status: 500 })
  }
}
