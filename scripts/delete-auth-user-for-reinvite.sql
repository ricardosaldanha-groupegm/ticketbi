-- Elimina um utilizador do Supabase Auth para permitir novo convite
-- Execute no Supabase SQL Editor
-- Substitua 'email@exemplo.com' pelo email do utilizador

-- 1. Eliminar identidades (obrigatório antes de eliminar de auth.users)
DELETE FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'email@exemplo.com');

-- 2. Eliminar o utilizador
DELETE FROM auth.users 
WHERE email = 'email@exemplo.com';
