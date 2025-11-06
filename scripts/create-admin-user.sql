-- Script SQL para criar utilizador admin no Supabase
-- Utilizador: ricardo.saldanha@groupegm.com
-- Password: adminadmin
-- Role: admin

-- Inserir utilizador na tabela users
INSERT INTO users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- Gera um UUID único
    'ricardo.saldanha@groupegm.com',
    'Ricardo Saldanha',
    'admin',
    NOW(),
    NOW()
);

-- Verificar se o utilizador foi criado
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email = 'ricardo.saldanha@groupegm.com';

-- Nota: Este script apenas cria o utilizador na tabela users
-- Para autenticação completa no Supabase, é necessário:
-- 1. Criar o utilizador no Auth do Supabase (via dashboard ou API)
-- 2. Ou usar o script create-admin-direct.ts que criamos anteriormente
