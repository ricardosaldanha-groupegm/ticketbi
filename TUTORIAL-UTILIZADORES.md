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
12. [Funcionalidades Futuras](#funcionalidades-futuras)

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

- **Remetente:** `Bot GGMPI <botpi@groupegm.com>`
- **Assunto:** `O Pedido de acesso ao TicketBI foi aprovado`

> **⚠️ Atenção - Verificar Pasta de Spam:**
> 
> - Os emails de autenticação podem ser classificados como **spam** pelo seu cliente de email
> - **Verifique sempre a pasta de Spam/Lixo Eletrónico** se não receber o email na sua caixa de entrada
> - **Recomendação:** Marque o email como **"Não é Spam"** ou adicione o remetente `botpi@groupegm.com` à sua lista de contactos seguros
> - Isto garante que receberá todos os emails futuros do sistema na sua caixa de entrada

### Como Fazer Login

Após ter o seu pedido de acesso aprovado:

1. Aceda ao endereço do TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Clique no tab **"Login"** ou **"Entrar"**
3. Introduza o seu **email profissional** e **palavra-passe**
4. Clique em **"Iniciar Sessão"**

> **Nota:** Se não recebeu o email de criação de conta, verifique a pasta de Spam e procure por emails com o assunto **"O Pedido de acesso ao TicketBI foi aprovado"** ou do remetente `botpi@groupegm.com`

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

**Exemplos:**
- *"Preciso de um relatório mensal de vendas por região para apresentar na reunião de gestão e tomar decisões estratégicas sobre alocação de recursos."*
- *"Quero analisar a evolução do número de clientes nos últimos 6 meses para identificar tendências e ajustar a estratégia de marketing."*
- *"Necessito de dados sobre o tempo médio de resposta a pedidos de suporte para avaliar a eficiência da equipa e identificar áreas de melhoria."*
- *"Preciso de uma dashboard com indicadores de performance para monitorizar em tempo real o desempenho das vendas e tomar ações corretivas quando necessário."*

### Campos Opcionais

#### **Urgência**
- **1 - Baixa:** Pode aguardar mais do que um mês
- **2 - Média:** Necessário nas próximas semanas
- **3 - Alta:** Necessário nos próximos dias

#### **Importância**
- **1 - Baixa:** Não crítico para as operações
- **2 - Média:** Importante mas existem outros mais importantes
- **3 - Alta:** Crítico para as operações

> **Nota:** A prioridade do ticket é calculada automaticamente multiplicando Urgência × Importância (máximo 9).

#### **Data Esperada**
- Data limite desejada para conclusão do pedido
- Formato: DD/MM/AAAA
- Deixe em branco se não tiver uma data específica

> **⚠️ Importante sobre Data Esperada:**
> 
> - Este campo é uma **indicação** para o DSI sobre quando gostaria de receber o resultado
> - **Use principalmente** para tickets **importantes e urgentes** que têm prazos críticos
> - **Não abuse** deste campo - evite definir datas para todos os tickets
> - O abuso de datas pode prejudicar o planeamento de trabalho do DSI e a gestão eficiente de recursos
> - Se o seu pedido não tem uma data crítica, deixe este campo em branco para permitir que o DSI organize o trabalho da melhor forma

#### **Tipo de Entrega**
- **BI:** Business Intelligence
- **PHC:** Sistema PHC
- **Salesforce:** Plataforma Salesforce
- **Automação:** Processos automatizados
- **Suporte:** Suporte técnico
- **Dados/Análises:** Análise de dados
- **Interno:** Outros serviços internos (mais usado dentro do  DSI)

#### **Natureza**
- **Novo:** Novo pedido/projeto
- **Correção:** Correção de erro
- **Retrabalho:** Refazer trabalho anterior
- **Esclarecimento:** Pedido de esclarecimento
- **Ajuste:** Ajuste de funcionalidade existente
- **Suporte:** Pedido de suporte e ajuda
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

Quando ocorrem eventos importantes no seu ticket, receberá notificações por email:

- **Novo comentário:** Quando alguém adiciona um comentário
  - A notificação inclui um **resumo da conversa** do ticket, permitindo-lhe entender o contexto sem ter de aceder ao sistema
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

## Funcionalidades Futuras

O TicketBI está em constante evolução. As seguintes funcionalidades estão em desenvolvimento e serão disponibilizadas em breve:

### Criação de Tickets via Email

**Em fase de conclusão** - Em breve poderá criar tickets simplesmente enviando um email.

**Como funcionará:**
- Envie um email para o endereço dedicado do TicketBI (a ser comunicado)
- O sistema irá automaticamente criar um ticket com base no conteúdo do seu email
- O assunto do email será usado como "Assunto" do ticket
- O corpo do email será usado como "Descrição" do ticket
- Anexos do email serão automaticamente adicionados ao ticket

**Vantagens:**
- **Ganho de tempo:** Grande parte dos tickets abertos no DSI advêm de conversas e contexto já escritos por email
- **Facilidade:** Não precisa de preencher manualmente os campos do formulário
- **Contexto preservado:** Todo o histórico da conversa por email fica disponível no ticket
- **Anexos automáticos:** Ficheiros enviados por email são automaticamente anexados ao ticket

**Quando estiver disponível:**
- Receberá instruções sobre o endereço de email a utilizar
- O endereço será único para cada utilizador ou departamento
- Poderá continuar a usar o formulário web normalmente

---

## Anexo: Guiões de Vídeo para Utilizadores

### Vídeo 1 – Pedir Acesso, Login e Navegação Básica

**Objetivo do vídeo**  
Mostrar a um utilizador novo como:
1. Pedir acesso ao TicketBI.  
2. Fazer login depois de aprovado.  
3. Reconhecer a página inicial / lista de tickets.

**Duração alvo:** 3–4 minutos  

#### 1. Abertura – Contexto rápido

- **Narração sugerida**  
  “Neste vídeo vamos ver os primeiros passos no TicketBI: como pedir acesso, fazer login e dar uma volta rápida pela página inicial.”
- **Ação no ecrã**  
  - Mostrar o browser a abrir o endereço do TicketBI.  
  - Página de login visível.
- **Texto curto no ecrã**  
  - `TicketBI – Primeiros passos`  
  - `Pedir acesso, fazer login e navegar na página inicial`

#### 2. Pedir acesso (primeiro acesso)

- **Narração sugerida**  
  “Se ainda não tem conta no TicketBI, o primeiro passo é pedir acesso.”
- **Ação no ecrã**  
  - Realçar o tab/botão **“Pedir Acesso”**.  
  - Clicar em **“Pedir Acesso”** para abrir o formulário.
- **Texto de apoio**  
  - `1. Clique em "Pedir Acesso"`

##### 2.1. Preencher o formulário de pedido de acesso

- **Ação no ecrã**  
  - Campo **Nome**: escrever `Ana Exemplo`.  
  - Campo **Email**: escrever `ana.exemplo@groupegm.com`.  
  - Campo **Mensagem** (se existir):  
    `Preciso de acesso ao TicketBI para pedidos de relatórios de vendas.`
- **Narração sugerida**  
  “Aqui preenche um pequeno formulário com os seus dados profissionais.  
  É importante usar o seu email profissional, por exemplo @groupegm.com.  
  A mensagem é opcional, mas ajuda a explicar para que precisa do acesso.”
- **Texto no ecrã (lista pequena)**  
  - `Nome: o seu nome completo`  
  - `Email: o seu email profissional (@groupegm.com)`  
  - `Mensagem: opcional, mas útil para explicar o motivo`

##### 2.2. Submeter pedido e próximos passos

- **Ação no ecrã**  
  - Clicar em **“Enviar Pedido”** / **“Submeter”**.  
  - Mostrar um texto mockup de confirmação, por exemplo:  
    `Pedido de acesso enviado com sucesso. Vai receber um email quando for aprovado.`
- **Narração sugerida**  
  “Depois de preencher, clique em ‘Enviar Pedido’.  
  O seu pedido será analisado por um administrador e, quando for aprovado, vai receber um email de confirmação.”
- **Texto de aviso no ecrã**  
  - `Verifique também a pasta Spam/Lixo Eletrónico.`

#### 3. Email de aprovação (mock)

- **Ação no ecrã**  
  - Mostrar rapidamente um exemplo de email (screenshot ou mock):  
    - Remetente: `Bot GGMPI <botpi@groupegm.com>`  
    - Assunto: `O Pedido de acesso ao TicketBI foi aprovado`
- **Narração sugerida**  
  “Quando o seu pedido for aprovado, recebe um email com o assunto ‘O Pedido de acesso ao TicketBI foi aprovado’.  
  Esse email contém o link ou as instruções para concluir o acesso.”
- **Texto de apoio**  
  - `Remetente: botpi@groupegm.com`  
  - `Assunto: "O Pedido de acesso ao TicketBI foi aprovado"`

#### 4. Login no TicketBI

- **Transição**  
  - Voltar a mostrar a página principal do TicketBI com o tab **“Login”** selecionado.
- **Narração sugerida**  
  “Depois de ter o acesso aprovado, pode então fazer login normalmente.”
- **Ação no ecrã**  
  - Campo email: `ana.exemplo@groupegm.com`.  
  - Campo palavra‑passe: `********` (não mostrar a palavra‑passe real).  
  - Clicar em **“Iniciar Sessão”** / **“Login”**.
- **Texto curto no ecrã**  
  - `Use o mesmo email profissional com que pediu acesso.`
- **Narração extra (opcional)**  
  “Se tiver algum problema com a palavra‑passe, siga o processo habitual de recuperação definido pela empresa ou contacte o suporte.”

#### 5. Página inicial / Lista de tickets

- **Ação no ecrã**  
  - Mostrar a página de **Tickets** após o login.  
  - Pausar 1–2 segundos para o utilizador ver o ecrã.
- **Narração sugerida**  
  “Depois de entrar, a primeira página que vê é a lista de tickets.  
  É aqui que vai acompanhar os seus pedidos ao BI.”
- **Ação detalhada**  
  - Passar o rato pelas colunas principais: **Assunto**, **Estado**, **Prioridade**, **Data do pedido**.
- **Texto/labels nas colunas**  
  - `Assunto: título do pedido`  
  - `Estado: em que fase está`  
  - `Prioridade`  
  - `Data do pedido`

#### 6. Menu de navegação

- **Ação no ecrã**  
  - Mostrar o menu lateral ou superior.  
  - Passar o rato sobre `Tickets`, `Minhas tarefas` (se existir), `Ajuda` / `Tutorial`.
- **Narração sugerida**  
  “Na área de navegação encontra as principais secções da aplicação.  
  Para si, como utilizador comum, a área mais importante é ‘Tickets’, onde cria novos pedidos e acompanha os existentes.  
  Poderá também ter outras áreas, como ‘Minhas tarefas’ ou ‘Ajuda’, dependendo do seu perfil.”

#### 7. Logout (opcional)

- **Ação no ecrã**  
  - Mostrar o canto onde aparece o nome do utilizador.  
  - Abrir o menu de utilizador e apontar para `Logout`.
- **Narração sugerida**  
  “Quando terminar de usar o TicketBI, pode sair em segurança através do menu de utilizador, escolhendo ‘Logout’.”
- **Texto curto no ecrã**  
  - `Menu do utilizador → Logout`

#### 8. Fecho do vídeo

- **Narração sugerida**  
  “Neste vídeo vimos como pedir acesso, fazer login e reconhecer a página inicial do TicketBI.  
  Nos próximos vídeos vamos mostrar como criar um novo ticket e como acompanhar os seus pedidos em detalhe.”
- **Ação no ecrã**  
  - Voltar a mostrar a lista de tickets em plano geral.  
  - Terminar com um pequeno fade‑out.

### Vídeo 2 – Criar um Novo Ticket

**Objetivo do vídeo**  
Ensinar o utilizador comum a abrir corretamente um novo ticket: onde clicar, que campos preencher e o que acontece depois de submeter.

**Duração alvo:** 3–4 minutos  

#### 1. Abertura – Contexto

- **Narração sugerida**  
  “Neste vídeo vamos ver, passo a passo, como criar um novo ticket no TicketBI.”
- **Ação no ecrã**  
  - Mostrar a lista de tickets (utilizador já autenticado).  
  - Destacar a zona do menu/botão onde se cria um novo ticket.
- **Texto no ecrã**  
  - `Criar um novo ticket`  
  - `Quando e como abrir um pedido`

#### 2. Aceder ao formulário “Novo Ticket”

- **Narração sugerida**  
  “Para criar um novo pedido, comece por clicar em ‘Novo Ticket’.”
- **Ação no ecrã**  
  - Mostrar o cursor a ir ao botão / item de menu **“Novo Ticket”** (ou **“Criar Ticket”**).  
  - Clicar e deixar aparecer o formulário.
- **Texto no ecrã**  
  - `Menu → "Novo Ticket"`

#### 3. Quando criar um ticket

- **Narração sugerida**  
  “Use um ticket sempre que precisar de algo da equipa BI ou DSI: por exemplo, um novo relatório, a correção de um erro, um esclarecimento ou um ajuste num relatório existente.”
- **Ação no ecrã**  
  - Mostrar o formulário completo com um scroll lento de cima a baixo.
- **Texto no ecrã (caixa lateral)**  
  - `Exemplos:`  
    `• Novo relatório`  
    `• Corrigir erro num relatório`  
    `• Esclarecimento sobre dados`  
    `• Ajuste a algo que já existe`

#### 4. Campo “Pedido por”

- **Narração sugerida**  
  “O campo ‘Pedido por’ é preenchido automaticamente com o seu nome e, para utilizadores comuns, normalmente não pode ser alterado.”
- **Ação no ecrã**  
  - Focar o campo `Pedido por`, mostrando que está preenchido e desativado.
- **Texto no ecrã**  
  - `Pedido por: preenchido automaticamente`

#### 5. Campo “Assunto” (obrigatório)

- **Narração sugerida**  
  “No ‘Assunto’, escreva um título curto e claro para o seu pedido.”
- **Ação no ecrã**  
  - Clicar em **Assunto**.  
  - Escrever, por exemplo: `Relatório mensal de vendas por região`.
- **Texto no ecrã**  
  - `Exemplo de assunto: "Relatório mensal de vendas por região"`

#### 6. Campo “Descrição” (obrigatório)

- **Narração sugerida**  
  “Na ‘Descrição’, explique em detalhe o que precisa. Quanto mais contexto der, mais fácil será tratar o pedido.”
- **Ação no ecrã**  
  - Clicar na caixa de `Descrição`.  
  - Escrever um parágrafo de exemplo, por ex.:  
    `Pretendo um relatório mensal com vendas por região, produto e canal, com os últimos 12 meses e filtros por país.`
- **Texto no ecrã (dica)**  
  - `Inclua: o que precisa, para que período e que filtros são importantes.`

#### 7. Campo “Objetivo do Pedido” (obrigatório)

- **Narração sugerida**  
  “No ‘Objetivo do pedido’, explique para que vai usar esta informação ou relatório.”
- **Ação no ecrã**  
  - Clicar em `Objetivo do pedido`.  
  - Escrever, por exemplo:  
    `Usar o relatório nas reuniões de gestão para decidir prioridades comerciais por região.`
- **Texto no ecrã**  
  - `Explique o "para quê", não apenas o "o quê".`

#### 8. Urgência e Importância

- **Narração sugerida**  
  “A ‘Urgência’ e a ‘Importância’ ajudam a calcular a prioridade do ticket. Tente ser realista ao escolher estes valores.”
- **Ação no ecrã**  
  - Abrir o dropdown de **Urgência** e mostrar as opções (1–Baixa, 2–Média, 3–Alta), escolhendo uma delas.  
  - Fazer o mesmo para **Importância**.
- **Texto no ecrã**  
  - `Urgência: quando precisa`  
  - `Importância: quão crítico é para o negócio`  
  - Pequena nota: `Prioridade = Urgência × Importância`

#### 9. Campo “Data Esperada” (opcional)

- **Narração sugerida**  
  “A ‘Data esperada’ é a data em que gostaria de ter o pedido concluído. Use este campo apenas se tiver um prazo realmente relevante.”
- **Ação no ecrã**  
  - Clicar em `Data esperada` (input de data) e escolher uma data de exemplo.  
- **Texto no ecrã (aviso)**  
  - `Use este campo apenas quando existir um prazo claro.`  
  - `Se não houver data crítica, deixe em branco.`

#### 10. “Tipo de Entrega” e “Natureza” (se visíveis)

- **Narração sugerida**  
  “Se tiver disponíveis os campos ‘Tipo de Entrega’ e ‘Natureza’, escolha as opções que melhor descrevem o seu pedido.”
- **Ação no ecrã**  
  - Em **Tipo de Entrega**, mostrar opções (BI, PHC, Salesforce, Automação, Suporte, Dados/Análises, Interno) e escolher, por exemplo, `BI`.  
  - Em **Natureza**, mostrar opções (Novo, Correção, Retrabalho, Esclarecimento, Ajuste, Suporte, Reunião/Discussão, Interno) e escolher, por exemplo, `Novo`.
- **Texto no ecrã**  
  - `Tipo de Entrega: área/sistema principal do pedido.`  
  - `Natureza: se é algo novo, correção, ajuste, etc.`

#### 11. Rever e submeter o ticket

- **Narração sugerida**  
  “Depois de preencher os campos obrigatórios e, se fizer sentido, os opcionais, reveja rapidamente a informação e clique em ‘Criar Ticket’.”
- **Ação no ecrã**  
  - Fazer um scroll curto pelo formulário preenchido.  
  - Clicar no botão **“Criar Ticket”** / **“Submeter”**.
- **Texto no ecrã**  
  - `Verifique se Assunto, Descrição e Objetivo estão claros.`

#### 12. O que acontece a seguir (página de detalhe)

- **Ação no ecrã**  
  - Mostrar a página de detalhe do ticket recém‑criado.  
  - Apontar para Assunto, Estado (Novo), Data do pedido e abas de Detalhes/Tarefas/Comentários/Anexos.
- **Narração sugerida**  
  “Depois de criar o ticket, é redirecionado para a página de detalhes. Aqui pode ver o estado do pedido, a data do pedido e, nas abas, as tarefas internas, comentários e anexos relacionados com o seu ticket.”

#### 13. Fecho do vídeo

- **Narração sugerida**  
  “Neste vídeo vimos como criar um novo ticket de forma completa: onde clicar, que campos preencher e o que acontece depois de submeter. No próximo vídeo vamos focar‑nos em como ver e filtrar os seus tickets já criados.”
- **Ação no ecrã**  
  - Terminar com um plano geral da página de detalhe ou voltar à lista de tickets, com fade‑out suave.

### Vídeo 3 – Ver os Meus Tickets

**Duração alvo:** 2–3 minutos  

- **Abertura**  
  - Já autenticado na lista de tickets.  
  - Mensagem sugerida: “Agora que já sabe criar um novo ticket, vamos ver como encontrar e consultar os seus próprios pedidos no TicketBI.”
- **Identificar os próprios tickets**  
  - Explicar que, por padrão, a lista mostra os pedidos relevantes para o utilizador (criados por si, onde é “Pedido por” ou interessado).  
- **Colunas principais**  
  - Destacar Assunto, Estado, Prioridade e Data do pedido.  
  - Explicar que estas colunas permitem perceber rapidamente o que está em aberto e o que já foi tratado.
- **Ordenar a lista**  
  - Demonstrar clique nos cabeçalhos de Data do pedido e Prioridade para alterar a ordem.  
- **Abrir um ticket específico**  
  - Clicar numa linha para abrir o detalhe.  
  - Dizer que o detalhe completo será aprofundado noutro vídeo (se quiseres ter um vídeo só para o ecrã de detalhe).
- **Voltar à lista**  
  - Mostrar o botão de voltar ou o item “Tickets” no menu.  
- **Fecho**  
  - Mensagem sugerida: “Resumindo: a lista de tickets é o seu ponto de partida para acompanhar tudo o que pediu ao BI. Use as colunas, a ordenação e os filtros para encontrar rapidamente o que precisa.”

---

## Conclusão

O TicketBI foi criado para facilitar a comunicação entre utilizadores e o Departamento de Sistemas de Informação. Ao seguir este tutorial e as boas práticas sugeridas, poderá utilizar o sistema de forma eficiente e obter os melhores resultados dos seus pedidos.

### Precisa de Ajuda?

Se tiver dúvidas ou problemas:
1. Consulte este tutorial novamente
2. Verifique os comentários no ticket para orientações
3. Contacte o administrador do sistema


---

**Última atualização:** Fevereiro 2025
