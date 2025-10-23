# Configuração do Supabase para TicketBI

## 📋 **Passos para Configurar o Supabase**

### 1. **Criar a Tabela `access_requests`**

Execute o seguinte script no **Supabase SQL Editor**:

```sql
-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_access_requests_updated_at ON access_requests;
CREATE TRIGGER trigger_update_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_access_requests_updated_at();
```

### 2. **Configurar Variáveis de Ambiente**

Crie um ficheiro `.env.local` na raiz do projeto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Database URL (opcional)
DATABASE_URL=postgresql://username:password@localhost:5432/ticketbi
```

### 3. **Executar Migrações Existentes**

Execute todas as migrações na pasta `supabase/migrations/`:

1. `001_initial_schema.sql` - Cria tabelas principais
2. `002_state_sync_triggers.sql` - Cria triggers de sincronização
3. `003_access_requests.sql` - Cria tabela de pedidos de acesso

### 4. **Criar Utilizador Admin**

Execute o script `scripts/create-admin-simple.sql` no Supabase SQL Editor.

## 🔄 **Modo de Funcionamento**

### **Desenvolvimento (Fallback)**
- Se a tabela `access_requests` não existir no Supabase
- Os pedidos são armazenados em memória (temporário)
- Funciona para testes locais

### **Produção (Supabase)**
- Quando a tabela `access_requests` existe
- Os pedidos são armazenados no Supabase
- Persistência permanente dos dados

## ✅ **Verificação**

Para verificar se está tudo configurado:

1. **Teste o pedido de acesso** na página de login
2. **Verifique os logs** do servidor para confirmar se usa Supabase ou fallback
3. **Acesse a página de admin** para ver os pedidos

## 📧 **Notificações (Futuro)**

Para implementar notificações por email:

1. Configurar Supabase Edge Functions
2. Integrar com serviço de email (SendGrid, etc.)
3. Trigger automático quando pedido é criado

## 🚨 **Resolução de Problemas**

### Erro: "Table not found"
- Execute o script de criação da tabela `access_requests`
- Verifique se as migrações foram executadas

### Erro: "Unauthorized"
- Verifique as chaves do Supabase no `.env.local`
- Confirme que o utilizador admin foi criado

### Fallback Mode
- Se vir "Running in development mode" nos logs
- Significa que está a usar armazenamento em memória
- Execute a configuração do Supabase para resolver

