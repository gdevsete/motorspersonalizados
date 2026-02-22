-- ============================================
-- Motors Personalizados - Schema do Banco de Dados
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: orders (Pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados do cliente
  nome_cliente TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  
  -- Dados da miniatura
  modelo_moto TEXT NOT NULL,
  placa_personalizada TEXT,
  nome_gravado TEXT,
  embalagem_premium BOOLEAN DEFAULT false,
  foto_moto_url TEXT,
  observacoes TEXT,
  
  -- Endereço de entrega
  endereco_cep VARCHAR(10),
  endereco_logradouro VARCHAR(200),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado VARCHAR(2),
  
  -- Frete
  frete_tipo VARCHAR(50),
  frete_valor NUMERIC(10, 2) DEFAULT 0,
  frete_prazo INTEGER,
  
  -- Status e valores
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'em_producao', 'enviado', 'entregue', 'cancelado')),
  valor_total NUMERIC(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- TABELA: testimonials (Depoimentos)
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  comentario TEXT NOT NULL,
  nota INTEGER DEFAULT 5 CHECK (nota >= 1 AND nota <= 5),
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);

-- ============================================
-- TABELA: products (Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  preco_base NUMERIC(10, 2) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para products
CREATE INDEX IF NOT EXISTS idx_products_ativo ON products(ativo);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
-- Usuários podem ver seus próprios pedidos
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar pedidos
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos os pedidos (adicionar lógica de admin conforme necessário)
-- Por enquanto, qualquer usuário autenticado pode ver todos (ajuste em produção)
CREATE POLICY "Authenticated users can view all orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins podem atualizar pedidos
CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para testimonials
-- Todos podem ver depoimentos
CREATE POLICY "Anyone can view testimonials" ON testimonials
  FOR SELECT USING (true);

-- Apenas admins podem gerenciar depoimentos
CREATE POLICY "Authenticated users can insert testimonials" ON testimonials
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete testimonials" ON testimonials
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para products
-- Todos podem ver produtos ativos
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (ativo = true);

-- Admins podem gerenciar produtos
CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Criar bucket para imagens de motos (execute na seção Storage do Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('moto-images', 'moto-images', true);

-- Política para upload de imagens
-- CREATE POLICY "Users can upload moto images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'moto-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Anyone can view moto images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'moto-images');

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Inserir produto padrão
INSERT INTO products (nome, preco_base, descricao, ativo) VALUES 
  ('Chaveiro Miniatura Personalizado', 79.00, 'Miniatura exclusiva da sua moto em forma de chaveiro', true),
  ('Chaveiro Premium', 99.00, 'Chaveiro com acabamento especial e embalagem premium', true);

-- Inserir depoimentos de exemplo
INSERT INTO testimonials (nome, cidade, comentario, nota) VALUES 
  ('Carlos M.', 'São Paulo, SP', 'Ficou incrível! A miniatura ficou igualzinha à minha moto. Recomendo demais!', 5),
  ('Ana Paula', 'Rio de Janeiro, RJ', 'Presente perfeito pro meu marido. Ele amou! Qualidade impecável.', 5),
  ('Ricardo S.', 'Curitiba, PR', 'Atendimento nota 10 e produto de altíssima qualidade. Já encomendei o segundo!', 5);

-- ============================================
-- TABELA: visitors (Visitantes Online)
-- ============================================
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  current_page TEXT DEFAULT '/',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  is_authenticated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para visitors
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Políticas para visitors
-- Qualquer um pode inserir/atualizar sua presença
CREATE POLICY "Anyone can insert visitor" ON visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own visitor" ON visitors
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete own visitor" ON visitors
  FOR DELETE USING (true);

-- Apenas admins podem ver todos os visitantes
CREATE POLICY "Authenticated can view visitors" ON visitors
  FOR SELECT USING (auth.role() = 'authenticated');

-- Índices para visitors
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_user_id ON visitors(user_id);

-- ============================================
-- FUNÇÕES PARA ADMIN (Gerenciamento de Usuários)
-- ============================================

-- Função para buscar todos os usuários (admin)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  email_confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at,
    u.raw_user_meta_data,
    u.email_confirmed_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Função para buscar detalhes de um usuário
CREATE OR REPLACE FUNCTION get_user_details(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  email_confirmed_at TIMESTAMPTZ,
  total_orders BIGINT,
  total_spent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at,
    u.raw_user_meta_data,
    u.email_confirmed_at,
    COALESCE(COUNT(o.id), 0)::BIGINT as total_orders,
    COALESCE(SUM(o.valor_total), 0)::NUMERIC as total_spent
  FROM auth.users u
  LEFT JOIN orders o ON o.user_id = u.id
  WHERE u.id = user_id
  GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.raw_user_meta_data, u.email_confirmed_at;
END;
$$;

-- Função para deletar usuário (admin)
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Deletar pedidos do usuário primeiro
  DELETE FROM orders WHERE orders.user_id = delete_user.user_id;
  
  -- Deletar o usuário da auth.users
  DELETE FROM auth.users WHERE auth.users.id = delete_user.user_id;
  
  RETURN TRUE;
END;
$$;

-- Função para contar usuários
CREATE OR REPLACE FUNCTION get_users_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count BIGINT;
BEGIN
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
END;
$$;

-- ============================================
-- TABELAS DE CHAT DE SUPORTE
-- ============================================

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  guest_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_from_user BOOLEAN DEFAULT true,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_guest_id ON chat_conversations(guest_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS para chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias conversas
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (
    auth.uid() = user_id 
    OR guest_id IS NOT NULL
    OR EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND email = 'gordao@gmail.com')
  );

-- Usuários podem criar conversas
CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (true);

-- Admin pode atualizar qualquer conversa
CREATE POLICY "Admin can update conversations" ON chat_conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND email = 'gordao@gmail.com')
    OR auth.uid() = user_id
  );

-- RLS para chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver mensagens de conversas que pode acessar
CREATE POLICY "Users can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c 
      WHERE c.id = conversation_id 
      AND (c.user_id = auth.uid() OR c.guest_id IS NOT NULL 
           OR EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND email = 'gordao@gmail.com'))
    )
  );

-- Qualquer um pode inserir mensagens
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Habilitar realtime para chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================
-- FIM DO SCRIPT DE CRIAÇÃO
-- ============================================

-- ============================================
-- SCRIPT DE MIGRAÇÃO (caso a tabela já exista)
-- Use este script se você já criou a tabela antes
-- e precisa apenas adicionar os novos campos
-- ============================================

/*
-- Adicionar campo email
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT;

-- Adicionar campo observações  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Adicionar campos de endereço
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_logradouro VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2);

-- Adicionar campos de frete
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_tipo VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_valor NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_prazo INTEGER;

-- Remover campos antigos de cor (se existirem e não forem mais usados)
-- ALTER TABLE orders DROP COLUMN IF EXISTS cor_principal;
-- ALTER TABLE orders DROP COLUMN IF EXISTS cor_roda;
*/
