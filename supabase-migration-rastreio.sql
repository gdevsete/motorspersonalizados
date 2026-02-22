-- ============================================
-- Motors Personalizados - Migração: Campos de Rastreio
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar campo de código de rastreio
ALTER TABLE orders ADD COLUMN IF NOT EXISTS codigo_rastreio VARCHAR(50);

-- Adicionar campo de transportadora
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transportadora VARCHAR(20);

-- Adicionar campo para atualizações do rastreio (JSON array)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rastreio_atualizacoes JSONB DEFAULT '[]'::jsonb;

-- Criar índice para busca por código de rastreio
CREATE INDEX IF NOT EXISTS idx_orders_codigo_rastreio ON orders(codigo_rastreio);

-- Comentários
COMMENT ON COLUMN orders.codigo_rastreio IS 'Código de rastreio do envio';
COMMENT ON COLUMN orders.transportadora IS 'Transportadora: correios ou jadlog';
COMMENT ON COLUMN orders.rastreio_atualizacoes IS 'Array JSON com atualizações do rastreio [{status, descricao, local, data}]';
