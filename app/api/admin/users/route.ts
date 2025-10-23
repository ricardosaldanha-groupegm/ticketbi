import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, role } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
    }

    const allowed = ['user', 'bi', 'admin']
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Configuração Supabase em falta' }, { status: 500 })
    }

    // Auth admin client (server‑side)
    const admin = createClient(supabaseUrl, serviceKey)

    // Redirect URL para a página de troca de password
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || undefined
    const redirectTo = origin ? `${origin}/alterar-password` : undefined

    const { data: created, error: createErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { must_change_password: true, name },
      redirectTo,
    })

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    // Registar/atualizar na tabela users com o mapeamento (user -> requester)
    const sb = createServerSupabaseClient()
    const dbRole = role === 'user' ? 'requester' : role
    const userId = created?.user?.id || undefined

    const { error: upErr } = await sb
      .from('users')
      .upsert({ id: userId, email, name, role: dbRole }, { onConflict: 'id' })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Convite enviado. O utilizador irá definir a password.' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}

