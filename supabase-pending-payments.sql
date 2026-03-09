-- ============================================
-- Motors Personalizados - Tabela de Pagamentos Pendentes
-- Execute este script no Supabase SQL Editor
-- ============================================

-- TABELA: pending_payments (Pagamentos Pendentes)
-- Armazena PIX gerados mas ainda não pagos
CREATE TABLE IF NOT EXISTS pending_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da transação
  transaction_id TEXT NOT NULL UNIQUE,
  order_id TEXT,
  
  -- Dados do PIX
  qr_code TEXT,
  qr_code_base64 TEXT,
  copy_paste TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Dados do pedido
  modelo TEXT,
  valor NUMERIC(10, 2) NOT NULL,
  imagem_url TEXT,
  
  -- Dados do cliente
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pending_payments_user_id ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_transaction_id ON pending_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status);
CREATE INDEX IF NOT EXISTS idx_pending_payments_expires_at ON pending_payments(expires_at);

-- Habilitar RLS
ALTER TABLE pending_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Usuários podem ver seus próprios pagamentos pendentes
CREATE POLICY "Users can view own pending payments" ON pending_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios pagamentos pendentes
CREATE POLICY "Users can insert own pending payments" ON pending_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios pagamentos pendentes
CREATE POLICY "Users can update own pending payments" ON pending_payments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios pagamentos pendentes
CREATE POLICY "Users can delete own pending payments" ON pending_payments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pending_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_pending_payments_updated_at ON pending_payments;
CREATE TRIGGER trigger_pending_payments_updated_at
  BEFORE UPDATE ON pending_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_payments_updated_at();

-- Função para limpar pagamentos expirados (pode ser chamada via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_pending_payments()
RETURNS void AS $$
BEGIN
  UPDATE pending_payments 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
