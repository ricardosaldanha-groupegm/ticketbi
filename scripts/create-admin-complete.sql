-- Script SQL completo para criar utilizador admin no Supabase
-- Este script deve ser executado no Supabase SQL Editor

-- 1. Criar utilizador na tabela auth.users (se necessário)
-- Nota: Normalmente isto é feito via Supabase Auth API, mas podemos tentar inserir diretamente

-- 2. Inserir utilizador na tabela users (nossa tabela personalizada)
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
    id,
    email,
    name,
    role,
    created_at
FROM users 
WHERE email = 'ricardo.saldanha@groupegm.com';

-- 4. Criar políticas RLS (Row Level Security) se necessário
-- Permitir que o admin veja todos os dados
-- Nota: Remover políticas existentes primeiro se necessário
DROP POLICY IF EXISTS "Admin can view all data" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;

CREATE POLICY "Admin can view all data" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can insert users" ON users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can update users" ON users
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';

-- 6. Informações sobre o utilizador criado
SELECT 
    'Utilizador admin criado com sucesso!' as status,
    id,
    email,
    name,
    role
FROM users 
WHERE email = 'ricardo.saldanha@groupegm.com';
