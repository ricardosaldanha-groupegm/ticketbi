3# Tutorial para Utilizadores - TicketBI

## 📋 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Criar um Novo Ticket](#criar-um-novo-ticket)
4. [Preencher os Campos do Ticket](#preencher-os-campos-do-ticket)
5. [Visualizar e Acompanhar os Seus Tickets](#visualizar-e-acompanhar-os-seus-tickets)
6. [Adicionar Comentários](#adicionar-comentários)
7. [Anexar Ficheiros](#anexar-ficheiros)
8. [Estados dos Tickets](#estados-dos-tickets)
9. [Notificações e Comunicação](#notificações-e-comunicação)
10. [Permissões e Limitações](#permissões-e-limitações)
11. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## Introdução

O **TicketBI** é uma plataforma que permite aos utilizadores solicitar serviços e suporte ao Departamento de Sistemas e Inteligência (DSI). Através deste sistema, pode criar tickets para pedidos de BI, PHC, Salesforce, Automação, Suporte, Dados/Análises e outros serviços internos.

Este tutorial irá guiá-lo através das funcionalidades principais do sistema, desde a criação de um ticket até ao acompanhamento do seu progresso.

---

## Acesso ao Sistema

### Primeiro Acesso - Pedir Acesso

Se ainda não tem uma conta no sistema, precisa de solicitar acesso primeiro:

1. Aceda ao endereço do TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Na página de login, clique no tab **"Pedir Acesso"**
3. Preencha o formulário de pedido de acesso:
   - **Nome:** O seu nome completo
   - **Email:** O seu email profissional (apenas emails profissionais são aceites)
   - **Mensagem:** (Opcional) Pode adicionar uma mensagem explicando o motivo do pedido
4. Clique em **"Enviar Pedido"** ou **"Submeter"**

> **Importante:** 
> - Apenas emails profissionais são aceites (ex: @groupegm.com)
> - O seu pedido será analisado por um administrador
> - Receberá uma notificação por email quando o seu pedido for aprovado ou rejeitado
> - Após aprovação, poderá fazer login no sistema

### Emails de Autenticação

Quando o seu pedido de acesso for aprovado, receberá um email de autenticação do sistema:

- **Remetente:** `Supabase Auth <noreply@mail.app.supabase.io>`
- **Assunto:** `O Pedido de acesso ao TicketBI foi aprovado`

> **⚠️ Atenção - Verificar Pasta de Spam:**
> 
> - Os emails de autenticação podem ser classificados como **spam** pelo seu cliente de email
> - **Verifique sempre a pasta de Spam/Lixo Eletrónico** se não receber o email na sua caixa de entrada
> - **Recomendação:** Marque o email como **"Não é Spam"** ou adicione o remetente `noreply@mail.app.supabase.io` à sua lista de contactos seguros
> - Isto garante que receberá todos os emails futuros do sistema na sua caixa de entrada

### Como Fazer Login

Após ter o seu pedido de acesso aprovado:

1. Aceda ao endereço do TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Clique no tab **"Login"** ou **"Entrar"**
3. Introduza o seu **email profissional** e **palavra-passe**
4. Clique em **"Iniciar Sessão"**

> **Nota:** Se não recebeu o email de criação de conta, verifique a pasta de Spam e procure por emails com o assunto **"O Pedido de acesso ao TicketBI foi aprovado"** ou do remetente `noreply@mail.app.supabase.io`

### Primeira Vez no Sistema

Após o primeiro login, será redirecionado para a página principal onde pode:
- Ver os seus tickets existentes
- Criar um novo ticket
- Aceder ao menu de navegação

---

## Criar um Novo Ticket

### Passo 1: Aceder ao Formulário

1. No menu superior, clique em **"Novo Ticket"** ou **"Criar Ticket"**
2. Será redirecionado para o formulário de criação de ticket

### Passo 2: Preencher os Dados Obrigatórios

Todos os campos marcados com **asterisco (*)** são obrigatórios e devem ser preenchidos antes de submeter o ticket.

### Passo 3: Submeter o Ticket

1. Revise todos os dados preenchidos
2. Clique no botão **"Criar Ticket"** ou **"Submeter"**
3. Será redirecionado para a página de detalhes do ticket criado

---

## Preencher os Campos do Ticket

### Campos Obrigatórios

#### **Pedido por**
- Este campo é **preenchido automaticamente** com o seu nome quando cria um ticket
- **Não pode ser alterado** por utilizadores comuns (apenas Admin e BI podem alterar)
- O campo aparece desabilitado e bloqueado com o seu nome

#### **Assunto**
- Título breve e descritivo do seu pedido
- Exemplo: "Criação de relatório de vendas mensal"

#### **Descrição**
- Descrição detalhada do que precisa
- Inclua contexto, requisitos específicos e qualquer informação relevante
- Quanto mais detalhado, melhor será o atendimento

#### **Objetivo do Pedido**
- Explique o objetivo final do pedido
- Para que será utilizado o resultado
- Qual o problema que pretende resolver

### Campos Opcionais

#### **Urgência**
- **1 - Baixa:** Pode aguardar alguns dias
- **2 - Média:** Necessário nas próximas semanas
- **3 - Alta:** Necessário com urgência

#### **Importância**
- **1 - Baixa:** Não crítico para as operações
- **2 - Média:** Importante mas não urgente
- **3 - Alta:** Crítico para as operações

> **Nota:** A prioridade do ticket é calculada automaticamente multiplicando Urgência × Importância (máximo 9).

#### **Data Esperada**
- Data limite desejada para conclusão do pedido
- Formato: DD/MM/AAAA
- Deixe em branco se não tiver uma data específica

#### **Tipo de Entrega**
- **BI:** Business Intelligence
- **PHC:** Sistema PHC
- **Salesforce:** Plataforma Salesforce
- **Automação:** Processos automatizados
- **Suporte:** Suporte técnico
- **Dados/Análises:** Análise de dados
- **Interno:** Outros serviços internos

#### **Natureza**
- **Novo:** Novo pedido/projeto
- **Correção:** Correção de erro
- **Retrabalho:** Refazer trabalho anterior
- **Esclarecimento:** Pedido de esclarecimento
- **Ajuste:** Ajuste de funcionalidade existente
- **Suporte:** Pedido de suporte
- **Reunião/Discussão:** Agendamento de reunião
- **Interno:** Outros

---

## Visualizar e Acompanhar os Seus Tickets

### Página de Lista de Tickets

Na página **"Tickets"**, pode ver:
- Todos os tickets que criou
- Tickets onde está marcado como "Pedido por"
- Tickets onde é um utilizador interessado

### Filtros Disponíveis

- **Responsável:** Filtrar por gestor do ticket
- **Estado:** Filtrar por estado (Novo, Em Curso, Concluído, etc.)
- **Texto:** Pesquisar por título/assunto

### Informações Visuais

- **Bola Amarela:** Ticket com menos de 5 dias para conclusão
- **Bola Vermelha:** Ticket com prazo ultrapassado (dias negativos)
- **Ordenação:** Tickets ordenados por prazo (mais urgentes primeiro)

### Página de Detalhes do Ticket

Ao clicar num ticket, verá:

#### **Aba "Detalhes"**
- Informações completas do ticket
- Campos em modo de leitura (não editáveis para utilizadores comuns)
- Estado atual do ticket
- Gestor atribuído
- Utilizadores interessados

#### **Aba "Tarefas"**
- Subtarefas criadas pelo gestor BI
- Progresso de cada tarefa
- Responsáveis pelas tarefas

#### **Aba "Comentários"**
- Histórico de todas as conversas
- Comentários do gestor BI e outros interessados
- Possibilidade de adicionar novos comentários

#### **Aba "Anexos"**
- Ficheiros anexados ao ticket
- Possibilidade de fazer download
- Adicionar novos anexos

---

## Adicionar Comentários

### Quando Adicionar Comentários

- Para fornecer informações adicionais
- Para responder a perguntas do gestor BI
- Para atualizar o contexto do pedido
- Para solicitar esclarecimentos

### Como Adicionar um Comentário

1. Aceda à página de detalhes do ticket
2. Clique na aba **"Comentários"**
3. Escreva o seu comentário na caixa de texto
4. (Opcional) Anexe um ficheiro se necessário
5. Clique em **"Enviar Comentário"**

### Boas Práticas

- Seja claro e objetivo
- Forneça contexto quando necessário
- Responda prontamente a perguntas do gestor BI
- Use comentários para manter a comunicação ativa

---

## Anexar Ficheiros

### Quando Anexar Ficheiros

- Documentos de referência
- Exemplos de dados
- Screenshots ou imagens
- Ficheiros de exemplo do formato desejado
- Qualquer material que ajude a esclarecer o pedido

### Como Anexar um Ficheiro

#### **Na Aba "Anexos"**
1. Clique no botão **"Adicionar Anexo"**
2. Selecione o ficheiro do seu computador
3. Aguarde o upload completar
4. O ficheiro aparecerá na lista de anexos

#### **Junto com um Comentário**
1. Na aba "Comentários", escreva o seu comentário
2. Clique em **"Escolher Ficheiro"** ou **"Anexar"**
3. Selecione o ficheiro
4. Clique em **"Enviar Comentário"**
5. O ficheiro será anexado e um link aparecerá no comentário

### Tipos de Ficheiros Suportados

- Documentos: PDF, DOC, DOCX, XLS, XLSX
- Imagens: JPG, PNG, GIF
- Dados: CSV, TXT
- Outros formatos comuns

### Limites

- Tamanho máximo por ficheiro: Verifique com o administrador
- Múltiplos ficheiros podem ser anexados ao mesmo ticket

---

## Estados dos Tickets

### Estados Possíveis

#### **Novo**
- Ticket acabou de ser criado
- Ainda não foi atribuído um gestor
- Aguardando análise inicial

#### **Em Análise**
- Gestor BI está a analisar o pedido
- Podem ser solicitados esclarecimentos
- Verifique os comentários regularmente

#### **Em Curso**
- Trabalho está a ser realizado
- Pode haver atualizações nas tarefas
- Acompanhe o progresso através dos comentários

#### **Em Validação**
- Trabalho concluído, aguardando validação
- Pode ser solicitado feedback
- Verifique se o resultado corresponde ao esperado

#### **Aguardando 3ºs**
- Aguardando informação ou ação de terceiros
- Pode ser necessário aguardar ou fornecer mais informações

#### **Standby**
- Ticket temporariamente pausado
- Aguardando condições para continuar
- Será retomado quando possível

#### **Concluído**
- Trabalho finalizado e validado
- Pode consultar os resultados
- Ticket arquivado

#### **Bloqueado**
- Ticket bloqueado por algum motivo
- Verifique os comentários para mais informações
- Pode ser necessário criar um novo ticket

#### **Rejeitado**
- Pedido não pode ser atendido
- Verifique os comentários para entender o motivo
- Pode criar um novo ticket com informações diferentes

---

## Notificações e Comunicação

### Como Recebe Notificações

Quando ocorrem eventos importantes no seu ticket, receberá notificações por email (se configurado):

- **Novo comentário:** Quando alguém adiciona um comentário
- **Mudança de estado:** Quando o estado do ticket muda
- **Data de conclusão:** Quando uma data prevista de conclusão é definida ou alterada

### Destinatários das Notificações

- **Pedido por:** Você (utilizador que criou o ticket)
- **Interessados:** Utilizadores marcados como interessados no ticket

### Manter-se Informado

- Verifique regularmente a página de tickets
- Leia os comentários quando receber notificações
- Responda prontamente a perguntas do gestor BI

> **💡 Dica:** Se não receber notificações por email, verifique a pasta de Spam. Os emails do sistema podem ser classificados como spam pelo seu cliente de email.

---

## Permissões e Limitações

### O Que Pode Fazer

✅ **Criar tickets** com pedidos ao DSI  
✅ **Ver os seus tickets** e tickets onde é interessado  
✅ **Adicionar comentários** nos seus tickets  
✅ **Anexar ficheiros** aos seus tickets  
✅ **Ver detalhes** completos dos seus tickets  
✅ **Fazer download** de anexos  

### O Que Não Pode Fazer

❌ **Editar campos** do ticket após criação (exceto alguns campos limitados em estados iniciais)  
❌ **Alterar o estado** do ticket  
❌ **Atribuir gestores**  
❌ **Criar tarefas** (subtickets)  
❌ **Eliminar tickets**  
❌ **Ver tickets** de outros utilizadores (exceto onde é interessado)  

### Edições Limitadas

Em estados iniciais (**Novo** ou **Em Análise**), pode editar:
- Assunto
- Descrição
- Data esperada

Após o ticket passar para **Em Curso** ou estados posteriores, não pode mais editar.

---

## Dicas e Boas Práticas

### Ao Criar um Ticket

1. **Seja específico:** Descreva exatamente o que precisa
2. **Forneça contexto:** Explique o contexto e objetivo
3. **Anexe exemplos:** Se possível, anexe ficheiros de exemplo
4. **Defina prioridades:** Seja realista com urgência e importância
5. **Revise antes de submeter:** Verifique se todos os dados estão corretos

### Durante o Acompanhamento

1. **Seja proativo:** Responda rapidamente a perguntas
2. **Mantenha comunicação:** Use comentários para manter o gestor informado
3. **Forneça feedback:** Quando solicitado, dê feedback claro
4. **Seja paciente:** Alguns pedidos podem levar tempo

### Comunicação Eficaz

- **Seja claro e objetivo** nos comentários
- **Forneça exemplos** quando possível
- **Responda a todas as perguntas** do gestor BI
- **Agradeça** quando o trabalho for concluído

### Resolução de Problemas

- **Não pode ver um ticket?** Verifique se foi criado por si ou se é interessado
- **Não pode comentar?** Verifique se tem permissões no ticket
- **Erro ao anexar ficheiro?** Verifique o tamanho e formato do ficheiro
- **Dúvidas?** Contacte o administrador do sistema

---

## Conclusão

O TicketBI foi criado para facilitar a comunicação entre utilizadores e o Departamento de Sistemas de Informação. Ao seguir este tutorial e as boas práticas sugeridas, poderá utilizar o sistema de forma eficiente e obter os melhores resultados dos seus pedidos.

### Precisa de Ajuda?

Se tiver dúvidas ou problemas:
1. Consulte este tutorial novamente
2. Verifique os comentários no ticket para orientações
3. Contacte o administrador do sistema
4. Consulte a página de ajuda (se disponível)

---

**Última atualização:** Janeiro 2026
