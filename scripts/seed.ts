import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log('🌱 Starting database seed...')

  try {
    // Create users
    console.log('Creating users...')
    
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'João Silva',
        email: 'joao.silva@empresa.com',
        role: 'requester' as const,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        role: 'bi' as const,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Pedro Costa',
        email: 'pedro.costa@empresa.com',
        role: 'admin' as const,
      },
    ]

    for (const user of users) {
      const { error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error creating user ${user.name}:`, error)
      } else {
        console.log(`✅ Created user: ${user.name}`)
      }
    }

    // Create tickets
    console.log('Creating tickets...')
    
    const tickets = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        created_by: '11111111-1111-1111-1111-111111111111',
        gestor_id: '22222222-2222-2222-2222-222222222222',
        estado: 'em_analise' as const,
        pedido_por: 'Ana Ferreira',
        assunto: 'Relatório de Vendas Mensal',
        descricao: 'Necessito de um relatório detalhado das vendas do mês passado com análise por produto e região.',
        urgencia: 3,
        importancia: 4,
        data_esperada: '2024-02-15',
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        created_by: '11111111-1111-1111-1111-111111111111',
        gestor_id: '22222222-2222-2222-2222-222222222222',
        estado: 'em_curso' as const,
        pedido_por: 'Carlos Mendes',
        assunto: 'Dashboard de Performance',
        descricao: 'Criação de um dashboard interativo para monitorizar KPIs de performance da equipa.',
        urgencia: 4,
        importancia: 5,
        data_esperada: '2024-02-28',
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        created_by: '11111111-1111-1111-1111-111111111111',
        gestor_id: null,
        estado: 'novo' as const,
        pedido_por: 'Sofia Almeida',
        assunto: 'Análise de Clientes',
        descricao: 'Análise de segmentação de clientes para campanhas de marketing.',
        urgencia: 2,
        importancia: 3,
        data_esperada: '2024-03-10',
      },
    ]

    for (const ticket of tickets) {
      const { error } = await supabase
        .from('tickets')
        .upsert(ticket, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error creating ticket ${ticket.assunto}:`, error)
      } else {
        console.log(`✅ Created ticket: ${ticket.assunto}`)
      }
    }

    // Create subtickets
    console.log('Creating subtickets...')
    
    const subtickets = [
      {
        id: '77777777-7777-7777-7777-777777777777',
        ticket_id: '44444444-4444-4444-4444-444444444444',
        assignee_bi_id: '22222222-2222-2222-2222-222222222222',
        titulo: 'Extração de Dados de Vendas',
        descricao: 'Extrair dados de vendas da base de dados para o período especificado.',
        estado: 'em_curso' as const,
        urgencia: 3,
        importancia: 4,
        data_esperada: '2024-02-10',
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        ticket_id: '44444444-4444-4444-4444-444444444444',
        assignee_bi_id: '22222222-2222-2222-2222-222222222222',
        titulo: 'Análise e Visualização',
        descricao: 'Criar visualizações e análises dos dados extraídos.',
        estado: 'novo' as const,
        urgencia: 3,
        importancia: 4,
        data_esperada: '2024-02-12',
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        ticket_id: '55555555-5555-5555-5555-555555555555',
        assignee_bi_id: '22222222-2222-2222-2222-222222222222',
        titulo: 'Configuração do Dashboard',
        descricao: 'Configurar estrutura base do dashboard com componentes principais.',
        estado: 'em_curso' as const,
        urgencia: 4,
        importancia: 5,
        data_esperada: '2024-02-25',
      },
    ]

    for (const subticket of subtickets) {
      const { error } = await supabase
        .from('subtickets')
        .upsert(subticket, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error creating subticket ${subticket.titulo}:`, error)
      } else {
        console.log(`✅ Created subticket: ${subticket.titulo}`)
      }
    }

    // Create comments
    console.log('Creating comments...')
    
    const comments = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        ticket_id: '44444444-4444-4444-4444-444444444444',
        author_id: '11111111-1111-1111-1111-111111111111',
        body: 'Olá, preciso deste relatório com urgência para a reunião de segunda-feira.',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        ticket_id: '44444444-4444-4444-4444-444444444444',
        author_id: '22222222-2222-2222-2222-222222222222',
        body: 'Entendido. Vou começar a trabalhar no relatório hoje mesmo.',
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        ticket_id: '55555555-5555-5555-5555-555555555555',
        author_id: '11111111-1111-1111-1111-111111111111',
        body: 'Este dashboard é prioritário para a apresentação do trimestre.',
      },
    ]

    for (const comment of comments) {
      const { error } = await supabase
        .from('comments')
        .upsert(comment, { onConflict: 'id' })
      
      if (error) {
        console.error(`Error creating comment:`, error)
      } else {
        console.log(`✅ Created comment`)
      }
    }

    console.log('🎉 Database seed completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`- ${users.length} users created`)
    console.log(`- ${tickets.length} tickets created`)
    console.log(`- ${subtickets.length} subtickets created`)
    console.log(`- ${comments.length} comments created`)
    
    console.log('\n🔑 Test Accounts:')
    console.log('Requester: joao.silva@empresa.com')
    console.log('BI User: maria.santos@empresa.com')
    console.log('Admin: pedro.costa@empresa.com')
    console.log('(Password for all: password123)')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
