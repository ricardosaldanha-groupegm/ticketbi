import { addTicket, getAllTickets, addAccessRequest, getAllAccessRequests } from '../lib/dev-storage'

async function testStorage() {
  console.log('Testing storage system...')
  
  try {
    // Test adding a ticket
    console.log('Adding test ticket...')
    const testTicket = {
      id: 'test-ticket-001',
      assunto: 'Teste de Ticket',
      pedido_por: 'João Silva',
      descricao: 'Este é um ticket de teste',
      urgencia: 3,
      importancia: 2,
      estado: 'pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    addTicket(testTicket)
    console.log('✅ Ticket added successfully')
    
    // Test retrieving tickets
    console.log('Retrieving tickets...')
    const tickets = getAllTickets()
    console.log('✅ Tickets retrieved:', tickets.length)
    console.log('Tickets:', tickets)
    
    // Test adding access request
    console.log('Adding test access request...')
    const testRequest = {
      id: 'test-request-001',
      email: 'teste@exemplo.com',
      name: 'Utilizador Teste',
      message: 'Pedido de acesso de teste',
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    addAccessRequest(testRequest)
    console.log('✅ Access request added successfully')
    
    // Test retrieving access requests
    console.log('Retrieving access requests...')
    const requests = getAllAccessRequests()
    console.log('✅ Access requests retrieved:', requests.length)
    console.log('Requests:', requests)
    
    console.log('🎉 All storage tests passed!')
    
  } catch (error) {
    console.error('❌ Storage test failed:', error)
  }
}

testStorage()
