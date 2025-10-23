import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html })
  })
  if (!resp.ok) {
    const text = await resp.text().catch(()=>'')
    throw new Error(`Falha a enviar email: ${resp.status} ${text}`)
  }
  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role } = await request.json()
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Campos obrigatÃ³rios em falta' }, { status: 400 })
    }
    const allowed = ['user','bi','admin']
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Role invÃ¡lido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'ConfiguraÃ§Ã£o Supabase em falta' }, { status: 500 })
    }

    // Auth admin client
    const admin = createClient(supabaseUrl, serviceKey)\n    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || undefined\n    const { data: created, error: createErr } = await admin.auth.admin.inviteUserByEmail(email, {\n      data: { must_change_password: true, name },\n      redirectTo: origin ? ${origin}/alterar-password : undefined,\n    })\n    if (createErr) {\n      return NextResponse.json({ error: createErr.message }, { status: 500 })\n    }\n
    const sb = createServerSupabaseClient()
    const dbRole = role === 'user' ? 'requester' : role // map to existing roles
    const { error: upErr } = await sb
      .from('users')
      .upsert({ id: created.user?.id, email, name, role: dbRole }, { onConflict: 'id' })
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Convite enviado. O utilizador irá definir a password.' })\n  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}


