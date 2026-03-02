# 📧 Sistema de Notificações - TicketBI

## 📋 Visão Geral

O TicketBI possui um sistema completo de notificações que informa automaticamente os utilizadores sobre eventos importantes relacionados com os tickets. As notificações são enviadas através de webhooks para integração com n8n.

## 🔔 Tipos de Eventos

O sistema envia notificações para os seguintes eventos:

### 1. **Ticket Criado** (`created`)
Enviado quando um novo ticket é criado no sistema.

**Destinatários:**
- Se o ticket já tem um gestor atribuído: apenas o gestor
- Se o ticket não tem gestor: todos os utilizadores com role `bi` ou `admin`

**Dados incluídos:**
- Informações do ticket (assunto, estado, prioridade)
- Criador do ticket
- URL do ticket

---

### 2. **Gestor Atribuído/Alterado** (`manager_assigned`)
Enviado quando o campo `gestor_id` de um ticket é alterado (atribuição ou reatribuição).

**Destinatários:**
- O novo gestor atribuído (se existir e não for quem fez a alteração)
- O criador do ticket (`pedido_por`)
- Utilizadores interessados (watchers)
- **Nota:** Exclui o utilizador que fez a alteração

**Dados incluídos:**
- Nome do gestor anterior (ou "Nenhum")
- Nome do novo gestor (ou "Nenhum")
- Informações do ticket
- Utilizador que fez a alteração

**Exemplo de uso:**
```typescript
{
  event: 'manager_assigned',
  ticket: {
    id: 'uuid',
    assunto: 'Análise de Vendas',
    pedido_por: 'João Silva',
    estado: 'novo',
    url: 'https://app.com/tickets/uuid'
  },
  recipients: [
    { email: 'maria.santos@empresa.com', name: 'Maria Santos' },
    { email: 'joao.silva@empresa.com', name: 'João Silva' }
  ],
  eventDetails: {
    oldManagerName: 'Nenhum',
    newManagerName: 'Maria Santos'
  },
  changedBy: {
    id: 'admin-uuid',
    name: 'Admin',
    email: 'admin@empresa.com',
    role: 'admin'
  }
}
```

---

### 3. **Mudança de Estado** (`status_change`)
Enviado quando o estado do ticket é alterado.

**Destinatários:**
- Criador do ticket (`pedido_por`)
- Gestor do ticket (se existir)
- Utilizadores interessados (watchers)
- **Nota:** Exclui o utilizador que fez a alteração

**Dados incluídos:**
- Estado anterior
- Novo estado
- Informações do ticket

---

### 4. **Data Prevista de Conclusão** (`completion_date_change`)
Enviado quando a data prevista de conclusão é definida ou alterada.

**Destinatários:**
- Criador do ticket (`pedido_por`)
- Gestor do ticket (se existir)
- Utilizadores interessados (watchers)
- **Nota:** Exclui o utilizador que fez a alteração

**Dados incluídos:**
- Nova data prevista de conclusão
- Informações do ticket

---

### 5. **Novo Comentário** (`comment`)
Enviado quando um comentário é adicionado ao ticket.

**Destinatários:**
- **Comentários públicos:** Criador do ticket + Gestor + Interessados
- **Notas internas:** Apenas utilizadores BI/Admin (Gestor + Interessados BI/Admin)
- **Nota:** Exclui o autor do comentário

**Dados incluídos:**
- Autor do comentário
- Conteúdo do comentário
- Informações do ticket

---

## 🔧 Configuração

### Variáveis de Ambiente

Para ativar as notificações, configure a seguinte variável no ficheiro `.env.local`:

```env
N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS=https://seu-n8n.com/webhook/ticket-notifications
```

**Nota:** Se esta variável não estiver configurada, as notificações serão ignoradas silenciosamente (não causam erros).

---

## 📤 Estrutura do Webhook

Todas as notificações são enviadas como POST requests com o seguinte formato JSON:

```typescript
{
  event: string,              // Tipo de evento
  ticket: {
    id: string,               // ID do ticket
    assunto: string,          // Assunto do ticket
    pedido_por: string,       // Nome do criador
    pedido_por_email?: string,// Email do criador
    estado?: string,          // Estado atual
    data_prevista_conclusao?: string | null,
    url: string               // URL completo do ticket
  },
  recipients: Array<{
    email: string,            // Email do destinatário
    name: string              // Nome do destinatário
  }>,
  eventDetails: {
    // Campos específicos de cada evento:
    commentAuthor?: string,
    commentBody?: string,
    oldStatus?: string,
    newStatus?: string,
    completionDate?: string,
    oldManagerName?: string,
    newManagerName?: string
  },
  changedBy: {
    id: string,               // ID do utilizador que fez a alteração
    name: string,             // Nome do utilizador
    email: string,            // Email do utilizador
    role: string              // Role (requester, bi, admin)
  }
}
```

---

## 🎯 Destinatários das Notificações

### Quem recebe notificações?

1. **Criador do Ticket (`pedido_por`)**
   - Recebe notificações sobre mudanças de estado, comentários, atribuição de gestor, etc.

2. **Gestor do Ticket**
   - Recebe notificações sobre todos os eventos do ticket que gere
   - Recebe notificação quando é atribuído como gestor

3. **Utilizadores Interessados (Watchers)**
   - Utilizadores que marcaram "interesse" no ticket
   - Recebem as mesmas notificações que o criador

4. **Utilizadores BI/Admin (apenas para tickets sem gestor)**
   - Quando um ticket é criado sem gestor, todos os BI/Admin são notificados

### Regras de Exclusão

- **O autor da alteração nunca recebe notificação** sobre a sua própria ação
- Para notas internas, apenas utilizadores com role `bi` ou `admin` recebem notificações
- Evita duplicados: cada email aparece apenas uma vez na lista de destinatários

---

## 🔍 Exemplo de Integração com n8n

### Workflow n8n Básico

1. **Webhook Trigger**: Recebe o POST do TicketBI
2. **Switch Node**: Separa por tipo de evento
3. **Email/Slack/etc**: Envia notificação ao destinatário

### Exemplo de Template de Email (Atribuição de Gestor)

```html
Olá {{$json.recipients[0].name}},

Foi atribuído um novo gestor ao ticket #{{$json.ticket.id}}:

📋 Ticket: {{$json.ticket.assunto}}
👤 Gestor Anterior: {{$json.eventDetails.oldManagerName}}
👤 Novo Gestor: {{$json.eventDetails.newManagerName}}
📊 Estado: {{$json.ticket.estado}}
✏️ Alterado por: {{$json.changedBy.name}}

Ver ticket: {{$json.ticket.url}}
```

---

## 🛠️ Desenvolvimento

### Adicionar um Novo Evento

1. **Atualizar o tipo `TicketWebhookData`** em `lib/webhook.ts`:
   ```typescript
   event: '...' | 'novo_evento'
   ```

2. **Adicionar campos ao `eventDetails`** (se necessário):
   ```typescript
   eventDetails: {
     // ... campos existentes
     novoDetalhe?: string
   }
   ```

3. **Enviar a notificação** na API route apropriada:
   ```typescript
   await sendTicketWebhook({
     event: 'novo_evento',
     ticket: ticketData,
     recipients: [...],
     eventDetails: {
       novoDetalhe: 'valor'
     },
     changedBy: user
   })
   ```

---

## 🐛 Troubleshooting

### As notificações não estão a ser enviadas

1. **Verificar variável de ambiente:**
   ```bash
   echo $N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS
   ```

2. **Verificar logs do servidor:**
   ```
   [Webhook] Notification sent for event: manager_assigned
   [Webhook] Failed to send notification: 404
   ```

3. **Testar o webhook manualmente:**
   ```bash
   curl -X POST https://seu-n8n.com/webhook/ticket-notifications \
     -H "Content-Type: application/json" \
     -d '{"event":"test","ticket":{},"recipients":[]}'
   ```

### Destinatários não recebem emails

- Verificar se o email está correto na tabela `users`
- Verificar se o utilizador não é o autor da alteração (será excluído)
- Verificar configuração do n8n (nós de email, credenciais SMTP, etc.)

---

## ✅ Checklist de Eventos

Quando um utilizador:

- ✅ **Cria um ticket** → Gestor atribuído ou todos BI/Admin são notificados
- ✅ **Atribui/altera um gestor** → Novo gestor + criador + interessados são notificados
- ✅ **Muda o estado** → Criador + gestor + interessados são notificados
- ✅ **Define/altera data prevista** → Criador + gestor + interessados são notificados
- ✅ **Adiciona comentário público** → Criador + gestor + interessados são notificados
- ✅ **Adiciona nota interna** → Apenas gestor + interessados BI/Admin são notificados

---

## 📊 Estatísticas e Monitorização

Para monitorizar as notificações, pode:

1. **Verificar logs do Next.js** para confirmar envios
2. **Usar n8n executions** para ver webhooks recebidos
3. **Implementar retry logic** no n8n para notificações falhadas

---

**TicketBI** - Sistema completo de notificações para gestão de tickets
