-- ============================================
-- SISTEMA DE ADMINISTRADORES SEGURO
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. CRIAR TABELA DE ADMINISTRADORES
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT email_lowercase CHECK (email = lower(email))
);

-- Habilitar RLS na tabela admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 2. INSERIR SUPER ADMIN (gordao@gmail.com)
-- ============================================
-- Primeiro, precisamos pegar o user_id do gordao@gmail.com
DO $$
DECLARE
  super_admin_id UUID;
BEGIN
  -- Buscar o user_id do super admin
  SELECT id INTO super_admin_id FROM auth.users WHERE email = 'gordao@gmail.com';
  
  -- Inserir super admin (se não existir)
  INSERT INTO admins (user_id, email, is_super_admin, created_by)
  VALUES (super_admin_id, 'gordao@gmail.com', true, super_admin_id)
  ON CONFLICT (email) DO UPDATE SET is_super_admin = true;
END $$;

-- 3. FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = check_user_id
  );
END;
$$;

-- 4. FUNÇÃO PARA VERIFICAR SE USUÁRIO É SUPER ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = check_user_id AND is_super_admin = true
  );
END;
$$;

-- 5. POLÍTICAS RLS PARA TABELA ADMINS
-- ============================================

-- Apenas admins podem ver a lista de admins
CREATE POLICY "Admins can view admin list" ON admins
  FOR SELECT USING (is_admin());

-- Apenas super admin pode adicionar novos admins
CREATE POLICY "Super admin can insert admins" ON admins
  FOR INSERT WITH CHECK (is_super_admin());

-- Apenas super admin pode remover admins (exceto a si mesmo)
CREATE POLICY "Super admin can delete admins" ON admins
  FOR DELETE USING (
    is_super_admin() AND 
    email != 'gordao@gmail.com' -- Não pode deletar o super admin
  );

-- Apenas super admin pode atualizar admins
CREATE POLICY "Super admin can update admins" ON admins
  FOR UPDATE USING (is_super_admin());

-- 6. ATUALIZAR POLÍTICAS DE ORDERS (mais seguras)
-- ============================================

-- Remover políticas antigas muito permissivas
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;

-- Usuários podem ver apenas seus pedidos OU admins podem ver todos
CREATE POLICY "Users view own or admin view all orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR is_admin()
  );

-- Apenas admins podem atualizar pedidos
CREATE POLICY "Only admins can update orders" ON orders
  FOR UPDATE USING (is_admin());

-- 7. ATUALIZAR POLÍTICAS DE TESTIMONIALS
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated users can delete testimonials" ON testimonials;

CREATE POLICY "Only admins can insert testimonials" ON testimonials
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete testimonials" ON testimonials
  FOR DELETE USING (is_admin());

-- 8. ATUALIZAR POLÍTICAS DE PRODUCTS
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

CREATE POLICY "Only admins can manage products" ON products
  FOR ALL USING (is_admin());

-- 9. ATUALIZAR POLÍTICAS DE VISITORS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view visitors" ON visitors;
DROP POLICY IF EXISTS "admin_view_visitors" ON visitors;

CREATE POLICY "Only admins can view visitors" ON visitors
  FOR SELECT USING (is_admin());

-- 10. FUNÇÃO PARA ADICIONAR ADMIN (usada pelo super admin)
-- ============================================
CREATE OR REPLACE FUNCTION add_admin(admin_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
BEGIN
  -- Verificar se quem está chamando é super admin
  IF NOT is_super_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Apenas o super admin pode adicionar administradores');
  END IF;
  
  -- Buscar user_id do email
  SELECT id INTO target_user_id FROM auth.users WHERE email = lower(admin_email);
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado. O email precisa estar cadastrado no sistema.');
  END IF;
  
  -- Inserir admin
  INSERT INTO admins (user_id, email, is_super_admin, created_by)
  VALUES (target_user_id, lower(admin_email), false, auth.uid())
  ON CONFLICT (email) DO NOTHING;
  
  RETURN json_build_object('success', true, 'message', 'Administrador adicionado com sucesso');
END;
$$;

-- 11. FUNÇÃO PARA REMOVER ADMIN (usada pelo super admin)
-- ============================================
CREATE OR REPLACE FUNCTION remove_admin(admin_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se quem está chamando é super admin
  IF NOT is_super_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Apenas o super admin pode remover administradores');
  END IF;
  
  -- Não pode remover o super admin
  IF lower(admin_email) = 'gordao@gmail.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível remover o super administrador');
  END IF;
  
  -- Remover admin
  DELETE FROM admins WHERE email = lower(admin_email);
  
  RETURN json_build_object('success', true, 'message', 'Administrador removido com sucesso');
END;
$$;

-- 12. FUNÇÃO PARA LISTAR ADMINS
-- ============================================
CREATE OR REPLACE FUNCTION list_admins()
RETURNS TABLE (
  id UUID,
  email TEXT,
  is_super_admin BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se quem está chamando é admin
  IF NOT is_admin() THEN
    RETURN;
  END IF;
  
  RETURN QUERY 
  SELECT a.id, a.email, a.is_super_admin, a.created_at 
  FROM admins a
  ORDER BY a.is_super_admin DESC, a.created_at ASC;
END;
$$;

-- 13. FUNÇÃO PARA VERIFICAR STATUS DE ADMIN DO USUÁRIO ATUAL
-- ============================================
CREATE OR REPLACE FUNCTION get_admin_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT * INTO admin_record FROM admins WHERE user_id = auth.uid();
  
  IF admin_record IS NULL THEN
    RETURN json_build_object(
      'is_admin', false,
      'is_super_admin', false
    );
  END IF;
  
  RETURN json_build_object(
    'is_admin', true,
    'is_super_admin', admin_record.is_super_admin,
    'email', admin_record.email
  );
END;
$$;
