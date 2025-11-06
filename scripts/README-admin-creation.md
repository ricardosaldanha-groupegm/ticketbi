# Scripts para Criar Utilizador Admin

Este diretório contém vários scripts para criar o utilizador admin no Supabase.

## 📁 Ficheiros Disponíveis:

### 1. `create-admin-user.sql`
- **Descrição:** Script SQL simples para inserir utilizador na tabela `users`
- **Uso:** Executar no Supabase SQL Editor
- **Funcionalidade:** Apenas cria o registo na tabela users

### 2. `create-admin-simple.sql` ⭐ **RECOMENDADO**
- **Descrição:** Script SQL simples sem políticas RLS
- **Uso:** Executar no Supabase SQL Editor
- **Funcionalidade:** Cria utilizador sem problemas de sintaxe

### 3. `create-admin-safe.sql`
- **Descrição:** Script SQL com verificações de segurança
- **Uso:** Executar no Supabase SQL Editor
- **Funcionalidade:** Verifica se tabela existe antes de inserir

### 4. `create-admin-complete.sql`
- **Descrição:** Script SQL completo com políticas RLS
- **Uso:** Executar no Supabase SQL Editor
- **Funcionalidade:** Cria utilizador + políticas de segurança
- **⚠️ Nota:** Pode ter problemas de sintaxe com `IF NOT EXISTS`

### 3. `create-admin-via-api.ts`
- **Descrição:** Script TypeScript para criar via API do Supabase
- **Uso:** `npx tsx scripts/create-admin-via-api.ts`
- **Funcionalidade:** Cria utilizador no Auth + tabela users

## 🚀 Como Executar:

### Opção 1: Via Supabase SQL Editor
1. Acede ao Supabase Dashboard
2. Vai para SQL Editor
3. Copia e cola o conteúdo de `create-admin-complete.sql`
4. Executa o script

### Opção 2: Via API (Recomendado)
```bash
npx tsx scripts/create-admin-via-api.ts
```

### Opção 3: Via Supabase CLI
```bash
supabase db reset
supabase db push
```

## 📝 Credenciais do Admin:
- **Email:** ricardo.saldanha@groupegm.com
- **Password:** adminadmin
- **Role:** admin

## ⚠️ Notas Importantes:
- Certifica-te que as variáveis de ambiente estão configuradas no `.env.local`
- O script via API é mais completo pois cria o utilizador no sistema de autenticação
- Se houver erros, verifica se as chaves do Supabase estão corretas

## 🔧 Troubleshooting:
- Se o script falhar, verifica as chaves do Supabase
- Certifica-te que a tabela `users` existe
- Verifica se as políticas RLS estão configuradas corretamente
