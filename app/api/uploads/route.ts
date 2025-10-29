import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Ficheiro em falta' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ext = file.name.split('.').pop() || 'bin'
    const now = new Date()
    const stamp = now.toISOString().replace(/[:.]/g, '-')
    const path = `${stamp}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('attachments')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    return NextResponse.json({
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      path: uploadData.path,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao carregar ficheiro' }, { status: 500 })
  }
}
