/**
 * API Serverless - Criar pagamento PIX via BlackCat Pagamentos
 * Esta função roda no servidor para manter a chave API privada segura
 */

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { customer, items, amount, metadata, externalRef } = req.body

    // Validar dados obrigatórios
    if (!customer || !items || !amount) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        details: 'customer, items e amount são obrigatórios'
      })
    }

    // Validar customer
    if (!customer.name || !customer.email || !customer.phone || !customer.document) {
      return res.status(400).json({ 
        error: 'Dados do cliente incompletos',
        details: 'name, email, phone e document são obrigatórios'
      })
    }

    // Chave API privada (configurada nas variáveis de ambiente do Vercel)
    const API_KEY = process.env.BLACKCAT_SECRET_KEY || 'sk_live_78615fa90151ee748c94803c2ee205e147ead6b33562f20b890f9e1003895c4e'

    // Criar payload para a API
    const payload = {
      amount: amount, // Valor em centavos
      currency: 'BRL',
      paymentMethod: 'pix',
      items: items.map(item => ({
        title: item.title,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        tangible: false // Produto digital
      })),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone.replace(/\D/g, ''), // Apenas números
        document: {
          number: customer.document.number.replace(/\D/g, ''), // Apenas números
          type: customer.document.type || 'cpf'
        }
      },
      pix: {
        expiresInDays: 1
      },
      metadata: metadata || '',
      externalRef: externalRef || `ORDER-${Date.now()}`
    }

    // Chamar API BlackCat
    const response = await fetch('https://api.blackcatpagamentos.online/api/sales/create-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro BlackCat:', data)
      return res.status(response.status).json({ 
        error: 'Erro ao processar pagamento',
        details: data.message || data.error || 'Erro desconhecido'
      })
    }

    // Processar QR Code base64 - adicionar prefixo se necessário
    const qrCodeBase64Raw = data.data?.paymentData?.qrCodeBase64 || ''
    const qrCodeBase64 = qrCodeBase64Raw && !qrCodeBase64Raw.startsWith('data:')
      ? `data:image/png;base64,${qrCodeBase64Raw}`
      : qrCodeBase64Raw

    // Calcular expiresAt - usa o valor da API ou gera padrão de 24h
    const expiresAt = data.data?.paymentData?.expiresAt || 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Retornar dados do pagamento
    return res.status(200).json({
      success: true,
      transactionId: data.data?.transactionId,
      status: data.data?.status,
      amount: data.data?.amount,
      qrCode: data.data?.paymentData?.qrCode,
      qrCodeBase64: qrCodeBase64,
      copyPaste: data.data?.paymentData?.copyPaste,
      expiresAt: expiresAt,
      invoiceUrl: data.data?.invoiceUrl
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
}
