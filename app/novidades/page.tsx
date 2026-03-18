"use client"

import Image from 'next/image'
import Link from 'next/link'

type Release = {
  version: string
  date: string
  title: string
  highlights: string[]
}

const releases: Release[] = [
  {
    version: "v1.5",
    date: "Março 2026",
    title: "Tickets recorrentes e melhorias no formulário de ticket",
    highlights: [
      "Nova página de Tickets Recorrentes para utilizadores BI e Admin, permitindo criar templates com frequência diária, semanal ou mensal",
      "Geração automática de novos tickets recorrentes por cron, com cópia do ticket base e das subtarefas associadas ao template",
      "Campo \"Por tipo de Entrega\" na criação de ticket deixou de vir preenchido por defeito e passou a obrigar a uma escolha explícita",
      "Destaque visual a amarelo no formulário de edição quando faltam as datas \"Data prevista de conclusão\" e \"Data de primeiro contacto\" em tickets ainda abertos",
      "Preparação da base de dados para rastrear tickets gerados por recorrência e evitar duplicações por template/data",
    ],
  },
  {
    version: "v1.0",
    date: "Setembro 2024",
    title: "Lançamento inicial do TicketBI",
    highlights: [
      "Criação de tickets para pedidos ao DSI (BI, PHC, Salesforce, Automação, Suporte, Dados/Análises)",
      "Página de lista de tickets com estados, prioridades e prazos",
      "Detalhe do ticket com comentários, anexos e tarefas internas",
      "Fluxo de aprovação de pedidos de acesso por administradores",
    ],
  },
  {
    version: "v1.1",
    date: "Fevereiro 2026",
    title: "Melhorias de usabilidade e documentação",
    highlights: [
      "Criação do tutorial detalhado para utilizadores em português e espanhol",
      "Página de ajuda dentro da aplicação com explicação dos primeiros passos",
      "Ajustes visuais e melhorias na experiência de criação e acompanhamento de tickets",
    ],
  },
  {
    version: "v1.2",
    date: "Março 2026",
    title: "Gestão de palavra‑passe e segurança",
    highlights: [
      "Funcionalidade \"Esqueci‑me da password\" com recuperação via email (Supabase Auth)",
      "Página de redefinição de palavra‑passe a partir de link seguro",
      "Página \"Alterar Password\" para utilizadores que precisam de atualizar a credencial ao entrar",
      "Templates de email renovados com visual alinhado com o TicketBI e assinatura do Departamento de Sistemas e Inteligência",
      "Atualização da página de ajuda e dos manuais PT/ES com informação sobre recuperação e alteração de palavra‑passe",
    ],
  },
  {
    version: "v1.3",
    date: "Março 2026",
    title: "Campo objetivo opcional na criação de ticket",
    highlights: [
      "O campo \"Objetivo do Pedido\" passou a ser opcional na criação de ticket",
      "Texto orientador aparece como placeholder (desaparece ao clicar para escrever) a explicar a importância de um objetivo bem descrito e a reduzir trocas de mensagens e retrabalhos",
    ],
  },
  {
    version: "v1.4",
    date: "Março 2026",
    title: "Explicações para Tipo de Entrega e Natureza",
    highlights: [
      "Ícone de ajuda junto aos campos Tipo de Entrega e Natureza com tooltip listando todas as opções e respetivas descrições, uma por linha",
      "Descrição dinâmica abaixo de cada campo que mostra o significado da opção selecionada",
      "Opção \"Interno\" no Tipo de Entrega visível apenas para utilizadores BI e Admin",
      "Descrições atualizadas: reporte de erros em BI, PHC, Salesforce, Automação e Dados/Análises; Suporte no fim com \"outras áreas não descritas nas outras opções\"",
    ],
  },
]

export default function NovidadesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-lg p-6 md:p-8 text-slate-100">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/ticketbi-icon.png"
              alt="TicketBI"
              width={48}
              height={48}
              className="h-12 w-12 flex-shrink-0"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Novidades do TicketBI
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                Acompanhe a evolução da aplicação e as principais melhorias por versão.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Link
              href="/ajuda"
              className="px-3 py-2 rounded-md border border-slate-600 text-slate-100 hover:bg-slate-800 text-xs md:text-sm transition-colors"
            >
              Ver ajuda
            </Link>
            <Link
              href="/tickets"
              className="px-2.5 py-1.5 rounded-md border border-amber-600/70 text-amber-300 hover:bg-amber-600/10 text-xs font-medium transition-colors"
            >
              Ir para os meus tickets
            </Link>
          </div>
        </header>

        <section className="space-y-8">
          {[...releases].slice().reverse().map((release, index) => (
            <article
              key={release.version}
              className="relative pl-6 md:pl-8 border-l border-slate-700/70 pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute -left-1 md:-left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]" />

              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 md:gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-800 border border-slate-600 px-2 py-0.5 text-xs font-mono text-slate-200">
                    {release.version}
                  </span>
                  <h2 className="text-lg font-semibold text-slate-100">
                    {release.title}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-slate-400">
                  {release.date}
                </p>
              </div>

              <ul className="mt-2 list-disc list-inside space-y-1.5 text-sm text-slate-300">
                {release.highlights.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              {index === 0 && null}
            </article>
          ))}
        </section>

        <footer className="mt-10 pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p>Esta página será atualizada sempre que forem lançadas novas funcionalidades relevantes.</p>
          <p>Última atualização: Março 2026.</p>
        </footer>
      </div>
    </div>
  )
}

