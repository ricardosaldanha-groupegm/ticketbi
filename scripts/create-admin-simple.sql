-- Script SQL simples para criar utilizador admin
-- Este script evita problemas de sintaxe com políticas RLS

-- 1. Inserir utilizador na tabela users
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

-- 2. Verificar se o utilizador foi criado
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email = 'ricardo.saldanha@groupegm.com';

-- 3. Mostrar mensagem de sucesso
SELECT 
    'Utilizador admin criado com sucesso!' as status,
    'ricardo.saldanha@groupegm.com' as email,
    'admin' as role;
