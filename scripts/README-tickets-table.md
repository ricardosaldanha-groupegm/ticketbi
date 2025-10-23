# Criação da Tabela de Tickets no Supabase

## Problema
A tabela `tickets` no Supabase já existe mas não tem o campo `objetivo` que foi adicionado ao formulário.

## Solução
Execute o script SQL `add-objetivo-simple.sql` no Supabase para adicionar o campo `objetivo` à tabela existente.

## Passos

### 1. Aceder ao Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o seu projeto

### 2. Executar o Script SQL
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `add-objetivo-simple.sql`
4. Clique em **Run** para executar o script

### 3. Verificar a Tabela
1. No menu lateral, clique em **Table Editor**
2. Verifique se a tabela `tickets` foi criada
3. Confirme que tem os campos:
   - `id` (UUID, Primary Key)
   - `pedido_por` (VARCHAR)
   - `assunto` (VARCHAR)
   - `descricao` (TEXT)
   - `objetivo` (TEXT) ← **NOVO CAMPO**
   - `urgencia` (INTEGER)
   - `importancia` (INTEGER)
   - `data_esperada` (DATE)
   - `estado` (VARCHAR)
   - `gestor_id` (UUID, Foreign Key para users)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### 4. Testar a Aplicação
1. Após executar o script, os tickets criados na aplicação serão guardados no Supabase
2. Os tickets aparecerão na lista de tickets
3. O campo `objetivo` será incluído nos novos tickets

## Campos da Tabela

### Campos Obrigatórios
- `pedido_por`: Nome da pessoa que fez o pedido
- `assunto`: Resumo do pedido
- `descricao`: Descrição detalhada do pedido
- `objetivo`: Objetivo final do pedido
- `urgencia`: Nível de urgência (1-5)
- `importancia`: Nível de importância (1-5)
- `estado`: Estado do ticket (pendente, em_analise, etc.)

### Campos Opcionais
- `data_esperada`: Data esperada para conclusão
- `gestor_id`: ID do gestor responsável

### Campos Automáticos
- `id`: ID único gerado automaticamente
- `created_at`: Data de criação
- `updated_at`: Data de última atualização (atualizada automaticamente)

## Estados Possíveis
- `pendente`: Ticket criado, aguardando análise
- `em_analise`: Ticket em análise pela equipa BI
- `em_curso`: Ticket em desenvolvimento
- `em_validacao`: Ticket concluído, aguardando validação
- `concluido`: Ticket concluído e validado
- `rejeitado`: Ticket rejeitado
- `bloqueado`: Ticket bloqueado

## Índices Criados
- `idx_tickets_estado`: Para consultas por estado
- `idx_tickets_gestor_id`: Para consultas por gestor
- `idx_tickets_created_at`: Para ordenação por data

## Triggers
- `trigger_update_tickets_updated_at`: Atualiza automaticamente o campo `updated_at` quando o ticket é modificado
