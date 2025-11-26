export default function AjudaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-lg p-6 md:p-8 text-slate-100">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Ajuda ao Utilizador</h1>
          <p className="text-slate-400">
            Aqui encontra respostas às perguntas mais frequentes sobre o TicketBI.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              O que é o TicketBI?
            </h2>
            <p className="text-slate-300 text-sm">
              O TicketBI é o sistema de gestão de pedidos ao departamento de Business Intelligence
              (BI) do Groupe GM. Através desta aplicação pode registar, acompanhar e priorizar
              pedidos relacionados com dados, relatórios, automatizações e suporte BI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Quem pode utilizar o sistema?
            </h2>
            <p className="text-slate-300 text-sm">
              O acesso é destinado a colaboradores autorizados do Groupe GM. Se ainda não tem conta,
              utilize o separador &quot;Pedir Acesso&quot; na página de login para solicitar
              credenciais ao administrador.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Esqueci-me da password. O que faço?
            </h2>
            <p className="text-slate-300 text-sm">
              Caso tenha sido criado através do sistema de autenticação, utilize o fluxo habitual
              de recuperação de password (quando disponível). Em alternativa, contacte o
              administrador de BI ou TI responsável para apoio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Que tipo de pedidos devo criar no TicketBI?
            </h2>
            <p className="text-slate-300 text-sm">
              Deve criar tickets para pedidos de novos relatórios ou dashboards, correções a
              informação existente, dúvidas relacionadas com dados, automatizações de processos e
              outras necessidades de suporte BI. Utilize sempre o campo &quot;Objetivo do Pedido&quot;
              para explicar como vai utilizar a informação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Como devo preencher um novo ticket?
            </h2>
            <p className="text-slate-300 text-sm">
              Preencha todos os campos obrigatórios com a maior clareza possível: assunto,
              descrição detalhada, objetivo do pedido, urgência, importância e, se aplicável,
              data esperada. Quanto mais contexto fornecer, mais fácil será para o departamento de
              BI priorizar e responder ao pedido.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Como acompanho o estado dos meus tickets?
            </h2>
            <p className="text-slate-300 text-sm">
              Após iniciar sessão, aceda ao menu &quot;Tickets&quot;. Aí pode consultar a lista de
              pedidos, o estado de cada um e, quando disponível, comentários ou atualizações
              efetuadas pela equipa de BI.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              Com quem posso falar em caso de dúvida?
            </h2>
            <p className="text-slate-300 text-sm">
              Em caso de dúvidas adicionais sobre o funcionamento do TicketBI ou sobre um pedido
              específico, contacte o responsável do departamento de BI ou o administrador do
              sistema.
            </p>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => window.location.assign('/login')}
            className="px-4 py-2 rounded-md border border-slate-600 text-slate-100 hover:bg-slate-800 text-sm"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  )
}


