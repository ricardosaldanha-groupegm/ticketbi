import { createServerSupabaseClient } from '../lib/supabase-server'

async function createAdminUser() {
  const supabase = createServerSupabaseClient()
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-')) {
    console.log('⚠️  Supabase não está configurado. Criando admin em modo de desenvolvimento...')
    
    // In development mode, we'll create a mock admin
    const adminUser = {
      id: 'dev-admin-001',
      email: 'admin@ticketbi.com',
      name: 'Administrador',
      role: 'admin',
      created_at: new Date().toISOString()
    }
    
    console.log('✅ Admin criado em modo de desenvolvimento:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Nome: ${adminUser.name}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log('')
    console.log('📝 Para fazer login, use qualquer email/password no formulário de login')
    console.log('   (O sistema está em modo de desenvolvimento)')
    
    return adminUser
  }
  
  try {
    console.log('🔧 Criando utilizador admin...')
    
    // Create admin user in users table
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: 'ricardo.saldanha@groupegm.com',
        name: 'Ricardo Saldanha',
        role: 'admin'
      }])
      .select()
      .single()
    
    if (userError) {
      console.error('❌ Erro ao criar utilizador admin:', userError)
      return null
    }
    
    console.log('✅ Utilizador admin criado com sucesso!')
    console.log(`   ID: ${adminUser.id}`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Nome: ${adminUser.name}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log('')
    console.log('📝 Para fazer login:')
    console.log('   1. Vá para http://localhost:3000/login')
    console.log('   2. Use o email: ricardo.saldanha@groupegm.com')
    console.log('   3. Use a password: adminadmin')
    console.log('   4. Aceda a /admin/access-requests para gerir pedidos')
    
    return adminUser
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    return null
  }
}

// Run the script
createAdminUser()
  .then((admin) => {
    if (admin) {
      console.log('')
      console.log('🎉 Script executado com sucesso!')
    } else {
      console.log('')
      console.log('❌ Falha ao criar admin')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
