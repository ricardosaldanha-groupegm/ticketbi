-- Script para verificar a estrutura da tabela users
-- Execute este script primeiro para confirmar as colunas disponíveis

-- 1. Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'Tabela users existe' 
        ELSE 'Tabela users NÃO existe' 
    END as table_status;

-- 3. Verificar dados existentes na tabela users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users
FROM users;
