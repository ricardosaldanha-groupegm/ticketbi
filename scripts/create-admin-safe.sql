-- Script SQL seguro para criar utilizador admin
-- Verifica se a tabela existe e cria se necessário

-- 1. Verificar se a tabela users existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Tabela users não existe. Execute primeiro as migrations.';
    END IF;
END $$;

-- 2. Inserir utilizador na tabela users
INSERT INTO users (
    id,
    email,
    name,
    role,
    created_at
) VALUES (
    gen_random_uuid(),
    'ricardo.saldanha@groupegm.com',
    'Ricardo Saldanha',
    'admin',
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- 3. Verificar se o utilizador foi criado
SELECT 
    'SUCCESS' as status,
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email = 'ricardo.saldanha@groupegm.com';

-- 4. Contar total de utilizadores
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users
FROM users;
