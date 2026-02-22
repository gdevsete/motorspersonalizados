/**
 * Constantes da aplicação
 */

// Preços
export const PRICES = {
  BASE: 79,
  PLACA_PERSONALIZADA: 12.99,
  NOME_GRAVADO: 15.99,
  EMBALAGEM_PREMIUM: 18.99,
}

// Opções de frete
export const FRETE_OPTIONS = [
  {
    id: 'correios_gratis',
    nome: 'Correios - Frete Grátis',
    preco: 0,
    prazo: 6,
    descricao: 'Entrega em até 6 dias úteis',
  },
  {
    id: 'sedex',
    nome: 'Sedex 10',
    preco: 21,
    prazo: 2,
    descricao: 'Entrega em até 2 dias úteis',
  },
  {
    id: 'jadlog',
    nome: 'Jadlog PAC',
    preco: 13,
    prazo: 8,
    descricao: 'Entrega em até 8 dias úteis',
  },
]

// Status de pedidos
export const ORDER_STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  EM_PRODUCAO: 'em_producao',
  ENVIADO: 'enviado',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado',
}

// Labels dos status
export const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_producao: 'Em Produção',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

// Cores dos status
export const STATUS_COLORS = {
  pendente: 'bg-yellow-500',
  confirmado: 'bg-blue-500',
  em_producao: 'bg-purple-500',
  enviado: 'bg-orange-500',
  entregue: 'bg-green-500',
  cancelado: 'bg-red-500',
}

// Número WhatsApp
export const WHATSAPP_NUMBER = '5511999999999'

// Links de redes sociais
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/motorspersonalizados',
  facebook: 'https://facebook.com/motorspersonalizados',
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
}

// Meta tags padrão
export const DEFAULT_META = {
  title: 'Motors Personalizados - Miniaturas de Motos Personalizadas',
  description: 'Transforme sua moto em uma miniatura exclusiva! Chaveiros personalizados com design premium e detalhes únicos.',
  ogImage: '/og-image.jpg',
}
