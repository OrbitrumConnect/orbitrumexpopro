import express from 'express'
import qrcode from 'qrcode'

const router = express.Router()

// Generate PIX QR Code
router.post('/pix/qrcode', (req, res) => {
  try {
    const { amount, description } = req.body
    
    // Generate PIX payload
    const pixPayload = `00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000520400005303986540510.005802BR5913Test Company6008Brasilia62070503***6304E2CA`
    
    // Generate QR code
    qrcode.toDataURL(pixPayload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    }, (err, url) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to generate QR code' })
      }
      
      return res.json({
        qrCode: url,
        pixKey: '123e4567-e12b-12d1-a456-426614174000',
        amount: amount || 10.00,
        description: description || 'Pagamento Orbitrum',
        expiresIn: '30 minutes'
      })
    })
  } catch (error) {
    console.error('Generate QR code error:', error)
    return res.status(500).json({ error: 'Failed to generate QR code' })
  }
})

// Process payment
router.post('/process', (req, res) => {
  try {
    const { amount, method, userId } = req.body
    
    // Mock payment processing
    const paymentId = `PAY${Date.now()}`
    
    return res.json({
      success: true,
      paymentId,
      amount,
      method,
      status: 'completed',
      message: 'Payment processed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Process payment error:', error)
    return res.status(500).json({ error: 'Failed to process payment' })
  }
})

// Get payment status
router.get('/status/:paymentId', (req, res) => {
  try {
    const { paymentId } = req.params
    
    // Mock payment status
    return res.json({
      paymentId,
      status: 'completed',
      amount: 10.00,
      method: 'PIX',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get payment status error:', error)
    return res.status(500).json({ error: 'Failed to get payment status' })
  }
})

export default router 
