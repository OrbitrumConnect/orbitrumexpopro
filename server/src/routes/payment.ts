import express from 'express'
import QRCode from 'qrcode'
import { SAMPLE_USERS } from '../../../shared/schema'

const router = express.Router()

// Create PIX payment
router.post('/create-pix-tokens', async (req, res) => {
  try {
    const { packageId, amount, tokens, userId } = req.body
    
    // Validate input
    if (!packageId || !amount || !tokens) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // Generate PIX code (mock implementation)
    const pixKey = process.env.PIX_KEY || '03669282106'
    const merchantName = 'PEDRO GALLUF'
    const merchantCity = 'SAO PAULO'
    
    // Create PIX payload
    const pixPayload = {
      pixKey,
      merchantName,
      merchantCity,
      amount: amount.toFixed(2),
      transactionId: `ORB${Date.now()}`,
      description: `Orbitrum Connect - ${tokens} tokens`
    }
    
    // Generate PIX code string (EMV QR Code format)
    const pixCode = generatePixCode(pixPayload)
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Create transaction record
    const transaction = {
      id: Date.now(),
      userId: userId || 1,
      amount: parseFloat(amount),
      pixKey,
      status: 'pending',
      tokens: parseInt(tokens),
      createdAt: new Date().toISOString(),
      pixCode,
      qrCode: qrCodeDataURL
    }
    
    // In a real app, save transaction to database
    console.log('PIX Transaction created:', transaction)
    
    res.json({
      success: true,
      transaction,
      pixCode,
      qrCode: qrCodeDataURL,
      message: 'PIX payment created successfully'
    })
    
  } catch (error) {
    console.error('PIX creation error:', error)
    res.status(500).json({ error: 'Failed to create PIX payment' })
  }
})

// Check PIX status
router.get('/pix-status/:transactionId', (req, res) => {
  try {
    const { transactionId } = req.params
    
    // Mock status check
    // In a real app, this would check with Mercado Pago or bank API
    const status = Math.random() > 0.7 ? 'completed' : 'pending'
    
    res.json({
      transactionId,
      status,
      checkedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('PIX status check error:', error)
    res.status(500).json({ error: 'Failed to check PIX status' })
  }
})

// Mercado Pago webhook
router.post('/webhook/mercadopago', (req, res) => {
  try {
    const { data } = req.body
    
    console.log('Mercado Pago webhook received:', data)
    
    // Process webhook data
    if (data && data.id) {
      // In a real app, verify webhook signature and process payment
      console.log('Processing payment:', data.id)
      
      // Update user tokens
      // Credit tokens to user account
    }
    
    res.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Manual PIX processing (admin only)
router.post('/process-pix-manual', (req, res) => {
  try {
    const { transactionId, userId, amount, tokens } = req.body
    
    // Find user and credit tokens
    const user = SAMPLE_USERS.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update user tokens
    user.tokensComprados += tokens
    
    console.log(`Credited ${tokens} tokens to user ${user.email}`)
    
    res.json({
      success: true,
      message: `Credited ${tokens} tokens to ${user.email}`,
      newBalance: user.tokensComprados
    })
    
  } catch (error) {
    console.error('Manual PIX processing error:', error)
    res.status(500).json({ error: 'Failed to process PIX manually' })
  }
})

// Get payment history
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params
    
    // Mock payment history
    const history = [
      {
        id: 1,
        amount: 3.00,
        tokens: 2160,
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        method: 'PIX'
      },
      {
        id: 2,
        amount: 6.00,
        tokens: 4320,
        status: 'completed',
        createdAt: '2024-01-20T14:15:00Z',
        method: 'PIX'
      }
    ]
    
    res.json(history)
    
  } catch (error) {
    console.error('Payment history error:', error)
    res.status(500).json({ error: 'Failed to get payment history' })
  }
})

// Helper function to generate PIX code
function generatePixCode(payload: any): string {
  // Simplified PIX code generation
  // In a real app, use proper EMV QR Code format
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    transactionId,
    description
  } = payload
  
  // Basic PIX code format
  return `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${amount}5802BR5913${merchantName}6008${merchantCity}62070503***6304${calculateCRC16(`00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${amount}5802BR5913${merchantName}6008${merchantCity}62070503***`)}`
}

// CRC16 calculation for PIX
function calculateCRC16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

export default router 
