# TicketBI - Sistema de Gestão de Tickets

Sistema completo de gestão de tickets para o departamento de BI com subtíquetes, controlo de permissões RBAC e sincronização de estados.

## 🚀 Funcionalidades

- **Gestão de Tickets**: Criação, edição e acompanhamento de tickets
- **Subtíquetes**: Divisão de tickets em tarefas menores atribuídas a membros da equipa BI
- **Controlo de Permissões RBAC**: Sistema robusto de permissões baseado em roles
- **Estados Sincronizados**: Regras automáticas de sincronização entre tickets e subtíquetes
- **Notificações Automáticas**: Sistema completo de notificações via webhooks (n8n)
- **Comentários e Anexos**: Comunicação e partilha de ficheiros
- **Interface Moderna**: UI responsiva com Tailwind CSS e shadcn/ui

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Base de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth
- **Validação**: Zod + React Hook Form

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd ticket-bi
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o Supabase**
   - Crie um novo projeto no [Supabase](https://supabase.com)
   - Execute as migrations na base de dados:
     ```bash
     # No Supabase Dashboard, vá a SQL Editor e execute:
     # 1. supabase/migrations/001_initial_schema.sql
     # 2. supabase/migrations/002_state_sync_triggers.sql
     ```

4. **Configure as variáveis de ambiente**
   ```bash
   cp env.example .env.local
   ```
   
   Edite `.env.local` com as suas credenciais Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   N8N_INTEGRATION_KEY=your_n8n_api_key
   N8N_ALLOWED_ORIGIN=https://app.n8n.cloud
   N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS=https://your-n8n.com/webhook/ticket-notifications
   ```

5. **Execute o seed da base de dados**
   ```bash
   npm run db:seed
   ```

6. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

7. **Aceda à aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu browser.

## 👥 Utilizadores de Teste

Após executar o seed, terá os seguintes utilizadores disponíveis:

| Email | Password | Role | Descrição |
|-------|----------|------|-----------|
| joao.silva@empresa.com | password123 | Requester | Utilizador que cria tickets |
| maria.santos@empresa.com | password123 | BI | Membro da equipa BI |
| pedro.costa@empresa.com | password123 | Admin | Administrador do sistema |

## 🏗️ Arquitetura

### Base de Dados

O sistema utiliza as seguintes tabelas principais:

- **users**: Utilizadores do sistema (requester, bi, admin)
- **tickets**: Tickets principais
- **subtickets**: Subtíquetes atribuídos a membros BI
- **comments**: Comentários em tickets e subtíquetes
- **attachments**: Anexos de ficheiros
- **audit_logs**: Log de auditoria (opcional)

### RBAC (Role-Based Access Control)

O sistema implementa três níveis de permissões:

#### Requester
- Cria tickets
- Vê apenas os seus tickets
- Edita tickets próprios (campos limitados, até estado "em_curso")
- Comenta e anexa nos seus tickets

#### BI User
- Vê todos os tickets
- Gere tickets atribuídos como gestor
- Cria e edita subtíquetes atribuídos
- Comenta e anexa em tickets que gere

#### Admin
- Acesso total ao sistema
- Pode atribuir gestores e reatribuir subtíquetes
- Gerir utilizadores
- Ver e editar notas internas

### Regras de Estado

O sistema implementa regras automáticas de sincronização:

1. **Ticket não fecha** se existir subtíquetes não concluídos
2. **Auto-validação**: Quando todos subtíquetes ficam concluídos, ticket vai para "em_validacao"
3. **Bloqueio em cascata**: Se ticket fica bloqueado, todos subtíquetes ficam bloqueados
4. **Upgrade automático**: Se subtíquete fica "em_curso", ticket fica pelo menos "em_curso"

## 📁 Estrutura do Projeto

```
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   ├── tickets/           # Páginas de tickets
│   └── login/             # Página de login
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── tickets/          # Componentes específicos
├── lib/                  # Utilitários e configurações
│   ├── auth.ts          # Autenticação
│   ├── rbac.ts          # Lógica de permissões
│   └── supabase.ts      # Configuração Supabase
├── supabase/            # Migrations SQL
├── __tests__/           # Testes unitários
└── scripts/            # Scripts de seed
```

## 🧪 Testes

Execute os testes unitários:

```bash
npm test
```

Os testes cobrem todas as funções RBAC e validam as regras de permissões.

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 📚 API Endpoints

### Tickets
- `GET /api/tickets` - Listar tickets (com filtros)
- `POST /api/tickets` - Criar ticket
- `GET /api/tickets/[id]` - Obter ticket
- `PATCH /api/tickets/[id]` - Atualizar ticket
- `DELETE /api/tickets/[id]` - Eliminar ticket

### Subtíquetes
- `GET /api/tickets/[id]/subtickets` - Listar subtíquetes
- `POST /api/tickets/[id]/subtickets` - Criar subtíquete
- `GET /api/subtickets/[id]` - Obter subtíquete
- `PATCH /api/subtickets/[id]` - Atualizar subtíquete
- `DELETE /api/subtickets/[id]` - Eliminar subtíquete

### Comentários
- `GET /api/tickets/[id]/comments` - Listar comentários
- `POST /api/tickets/[id]/comments` - Criar comentário
- `GET /api/subtickets/[id]/comments` - Listar comentários de subtíquete
- `POST /api/subtickets/[id]/comments` - Criar comentário em subtíquete

### Anexos
- `GET /api/tickets/[id]/attachments` - Listar anexos
- `POST /api/tickets/[id]/attachments` - Upload anexo
- `GET /api/subtickets/[id]/attachments` - Listar anexos de subtíquete
- `POST /api/subtickets/[id]/attachments` - Upload anexo em subtíquete

### Integração com n8n
- `POST /api/integrations/n8n/tickets` - Criar ticket via workflow n8n (enviar header `x-api-key` ou `Authorization: Bearer` com a chave configurada)
- `DELETE /api/integrations/n8n/tickets` - Reverter ticket criado pelo n8n (body JSON `{ "ticketId": "<id>" }`)
- Defina `N8N_ALLOWED_ORIGIN` se quiser limitar os pedidos ao domínio do seu n8n; por omissão, os pedidos de qualquer origem são aceites.

## 📧 Sistema de Notificações

O TicketBI possui um sistema completo de notificações via webhooks. Consulte [NOTIFICACOES.md](./NOTIFICACOES.md) para detalhes completos.

**Eventos suportados:**
- ✅ Ticket criado
- ✅ Gestor atribuído/alterado
- ✅ Mudança de estado
- ✅ Data prevista de conclusão alterada
- ✅ Novo comentário (público ou nota interna)

**Configuração:**
```env
N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS=https://seu-n8n.com/webhook/ticket-notifications
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para a sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit as suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o ficheiro `LICENSE` para mais detalhes.

## 🆘 Suporte

Para questões e suporte:
- Abra uma issue no GitHub
- Contacte a equipa de desenvolvimento

---

**TicketBI** - Sistema de Gestão de Tickets para BI
