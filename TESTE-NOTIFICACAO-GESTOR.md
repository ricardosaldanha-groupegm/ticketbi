# 🧪 Teste Manual - Notificação de Atribuição de Gestor

## 📋 Objetivo
Verificar que os gestores recebem notificações quando são atribuídos a um ticket.

## 🔧 Pré-requisitos

1. **n8n configurado** com webhook para receber notificações
2. **Variável de ambiente** `N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS` configurada no `.env.local`
3. **Pelo menos 3 utilizadores** no sistema:
   - 1 Requester (cria o ticket)
   - 2 BI Users (para teste de reatribuição)

## 📝 Cenários de Teste

### Cenário 1: Atribuir Gestor a Ticket Novo (sem gestor)

**Passos:**
1. Login como **Admin** ou **BI User**
2. Ir para um ticket que **não tem gestor atribuído**
3. Clicar no botão "Atribuir Gestor"
4. Selecionar um utilizador BI/Admin
5. Clicar em "Atribuir"

**Resultado Esperado:**
- ✅ Notificação enviada para o **novo gestor**
- ✅ Notificação enviada para o **criador do ticket** (pedido_por)
- ✅ Notificação enviada para **utilizadores interessados** (se existirem)
- ✅ **Quem fez a atribuição NÃO recebe** notificação

**Dados no Webhook:**
```json
{
  "event": "manager_assigned",
  "ticket": {
    "id": "uuid-do-ticket",
    "assunto": "Análise de Vendas Q1",
    "pedido_por": "João Silva",
    "pedido_por_email": "joao.silva@empresa.com",
    "estado": "novo",
    "url": "http://localhost:3000/tickets/uuid"
  },
  "recipients": [
    {
      "email": "maria.santos@empresa.com",
      "name": "Maria Santos"
    },
    {
      "email": "joao.silva@empresa.com",
      "name": "João Silva"
    }
  ],
  "eventDetails": {
    "oldManagerName": "Nenhum",
    "newManagerName": "Maria Santos"
  },
  "changedBy": {
    "id": "uuid-admin",
    "name": "Admin User",
    "email": "admin@empresa.com",
    "role": "admin"
  }
}
```

---

### Cenário 2: Reatribuir Gestor (alterar de um gestor para outro)

**Passos:**
1. Login como **Admin**
2. Ir para um ticket que **já tem gestor atribuído**
3. Clicar no botão "Atribuir Gestor"
4. Selecionar um **diferente** utilizador BI/Admin
5. Clicar em "Atribuir"

**Resultado Esperado:**
- ✅ Notificação enviada para o **novo gestor**
- ✅ Notificação enviada para o **criador do ticket**
- ✅ Notificação enviada para **utilizadores interessados**
- ✅ **Gestor anterior NÃO recebe** notificação automaticamente
- ✅ **Quem fez a alteração NÃO recebe** notificação

**Dados no Webhook:**
```json
{
  "event": "manager_assigned",
  "eventDetails": {
    "oldManagerName": "Maria Santos",
    "newManagerName": "Pedro Costa"
  },
  ...
}
```

---

### Cenário 3: Remover Gestor (atribuir null)

**Passos:**
1. Login como **Admin**
2. Ir para um ticket que **tem gestor atribuído**
3. Clicar no botão "Atribuir Gestor"
4. Selecionar "Nenhum" (limpar o gestor)
5. Clicar em "Atribuir"

**Resultado Esperado:**
- ✅ Notificação enviada para o **criador do ticket**
- ✅ Notificação enviada para **utilizadores interessados**
- ✅ **Gestor anterior NÃO recebe** (pois foi removido)
- ✅ **Quem fez a alteração NÃO recebe** notificação

**Dados no Webhook:**
```json
{
  "event": "manager_assigned",
  "eventDetails": {
    "oldManagerName": "Maria Santos",
    "newManagerName": "Nenhum"
  },
  ...
}
```

---

### Cenário 4: Gestor atribui-se a si próprio

**Passos:**
1. Login como **BI User** (Maria Santos)
2. Ir para um ticket **sem gestor**
3. Atribuir a **si própria**

**Resultado Esperado:**
- ✅ Notificação enviada para o **criador do ticket**
- ✅ Notificação enviada para **utilizadores interessados**
- ❌ **Maria Santos NÃO recebe** (pois foi quem fez a atribuição)

---

### Cenário 5: Ticket criado já com gestor

**Passos:**
1. Login como **Requester** ou **Admin**
2. Criar um **novo ticket**
3. Atribuir gestor **durante a criação**
4. Submeter o formulário

**Resultado Esperado:**
- ✅ Evento `created` enviado apenas para o **gestor atribuído**
- ❌ Outros BI/Admin **NÃO recebem** (pois já tem gestor)

**Nota:** Este cenário usa o evento `created`, não `manager_assigned`.

---

## 🔍 Verificação no n8n

### Configurar Webhook no n8n

1. Criar um novo workflow
2. Adicionar um nó **Webhook**:
   - Método: `POST`
   - Path: `ticket-notifications`
   - Response: `Immediately`

3. Adicionar um nó **Switch** após o webhook:
   ```
   Routing: {{ $json.event }}
   Outputs:
   - created
   - manager_assigned
   - status_change
   - completion_date_change
   - comment
   ```

4. Para o output `manager_assigned`, adicionar:
   - **Set Node** para preparar dados do email
   - **Send Email** ou **Slack** node para notificar

### Template de Email para `manager_assigned`

```html
Assunto: [TicketBI] Gestor Atribuído - {{ $json.ticket.assunto }}

Olá {{ $json.recipients[0].name }},

Houve uma alteração no gestor do ticket:

📋 Ticket: {{ $json.ticket.assunto }}
🆔 ID: {{ $json.ticket.id }}
📊 Estado: {{ $json.ticket.estado }}

👤 Gestor Anterior: {{ $json.eventDetails.oldManagerName }}
👤 Novo Gestor: {{ $json.eventDetails.newManagerName }}

✏️ Alterado por: {{ $json.changedBy.name }} ({{ $json.changedBy.email }})

🔗 Ver ticket: {{ $json.ticket.url }}

---
TicketBI - Sistema de Gestão de Tickets
```

---

## 🐛 Troubleshooting

### Não recebo notificações

1. **Verificar variável de ambiente:**
   ```bash
   # No terminal do projeto
   echo $N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS
   ```

2. **Verificar logs do Next.js:**
   ```bash
   npm run dev
   # Procurar por:
   # [Webhook] Notification sent for event: manager_assigned
   # ou
   # [Webhook] Skipping notification - N8N_WEBHOOK_URL_TICKET_NOTIFICATIONS not configured
   ```

3. **Verificar n8n executions:**
   - Ir para n8n Dashboard
   - Ver "Executions"
   - Verificar se o webhook foi recebido

4. **Testar webhook manualmente:**
   ```bash
   curl -X POST http://localhost:3000/api/tickets/SEU_TICKET_ID \
     -H "Content-Type: application/json" \
     -H "x-user-id: SEU_USER_ID" \
     -d '{"gestor_id": "ID_DO_NOVO_GESTOR"}'
   ```

---

## ✅ Checklist de Validação

Após os testes, verificar:

- [ ] Notificação enviada quando gestor é atribuído pela primeira vez
- [ ] Notificação enviada quando gestor é alterado
- [ ] Notificação enviada quando gestor é removido
- [ ] Novo gestor sempre recebe (exceto se for quem fez a atribuição)
- [ ] Criador do ticket sempre recebe (exceto se for quem fez a atribuição)
- [ ] Utilizadores interessados sempre recebem (exceto se forem quem fez a atribuição)
- [ ] Quem fez a alteração NUNCA recebe
- [ ] Email não duplicado na lista de recipients
- [ ] Webhook não é enviado se gestor não mudou (mesmo gestor)
- [ ] Logs aparecem no terminal do Next.js

---

## 📊 Resultados Esperados

| Cenário | Novo Gestor | Criador | Interessados | Autor Alteração |
|---------|-------------|---------|--------------|-----------------|
| Atribuir pela 1ª vez | ✅ | ✅ | ✅ | ❌ |
| Reatribuir | ✅ | ✅ | ✅ | ❌ |
| Remover gestor | ❌ | ✅ | ✅ | ❌ |
| Gestor atribui-se | ❌* | ✅ | ✅ | ❌ |

*Não recebe porque é quem fez a alteração

---

**TicketBI** - Sistema de Gestão de Tickets
