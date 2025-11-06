import { config } from 'dotenv'

config({ path: '.env.local' })

async function createAdminDirect() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Variáveis de ambiente não configuradas')
    return
  }

  console.log('🔧 Criando utilizador admin diretamente no Supabase...')
  console.log(`URL: ${supabaseUrl}`)

  try {
    // First, let's try to create the user in the auth system
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        email: 'ricardo.saldanha@groupegm.com',
        password: 'adminadmin',
        email_confirm: true,
        user_metadata: {
          name: 'Ricardo Saldanha',
          role: 'admin'
        }
      })
    })

    if (authResponse.ok) {
      const authUser = await authResponse.json()
      console.log('✅ Utilizador criado no Auth:', authUser.id)
      
      // Now create the user in our users table
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: authUser.id,
          email: 'ricardo.saldanha@groupegm.com',
          name: 'Ricardo Saldanha',
          role: 'admin'
        })
      })

      if (userResponse.ok) {
        const user = await userResponse.json()
        console.log('✅ Utilizador criado na tabela users:', user[0])
        console.log('')
        console.log('📝 Credenciais de login:')
        console.log('   Email: ricardo.saldanha@groupegm.com')
        console.log('   Password: adminadmin')
        console.log('   Role: admin')
      } else {
        const error = await userResponse.text()
        console.log('⚠️  Utilizador criado no Auth mas erro na tabela users:', error)
      }
    } else {
      const error = await authResponse.text()
      console.log('❌ Erro ao criar utilizador no Auth:', error)
    }

  } catch (error) {
    console.log('❌ Erro de conexão:', error)
  }
}

createAdminDirect()
