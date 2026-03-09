/**
 * API Serverless - Verificar status do pagamento PIX
 * Consulta o status da transação na BlackCat Pagamentos
 */

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { transactionId } = req.query

    if (!transactionId) {
      return res.status(400).json({ 
        error: 'transactionId é obrigatório'
      })
    }

    // Chave API privada
    const API_KEY = process.env.BLACKCAT_SECRET_KEY || 'sk_live_78615fa90151ee748c94803c2ee205e147ead6b33562f20b890f9e1003895c4e'

    // Consultar status na API BlackCat
    const response = await fetch(`https://api.blackcatpagamentos.online/api/sales/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao consultar BlackCat:', data)
      return res.status(response.status).json({ 
        error: 'Erro ao consultar status',
        details: data.message || data.error || 'Erro desconhecido'
      })
    }

    // Mapear status
    const status = data.data?.status?.toLowerCase() || 'pending'
    const isPaid = ['paid', 'approved', 'confirmed', 'completed'].includes(status)

    return res.status(200).json({
      success: true,
      transactionId: data.data?.transactionId,
      status: status,
      isPaid: isPaid,
      amount: data.data?.amount,
      paidAt: data.data?.paidAt || null
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
}
