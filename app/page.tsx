export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-100 mb-4">TicketBI</h1>
        <p className="text-xl text-slate-400 mb-8">Sistema de Gestão de Tickets</p>
        <div className="space-y-4">
          <a 
            href="/login" 
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Fazer Login
          </a>
          <div className="text-sm text-slate-400">
            <p>Para testar a aplicação:</p>
            <p>1. Configure as variáveis de ambiente do Supabase</p>
            <p>2. Execute as migrations SQL</p>
            <p>3. Execute o seed: npm run db:seed</p>
          </div>
        </div>
      </div>
    </div>
  )
}
