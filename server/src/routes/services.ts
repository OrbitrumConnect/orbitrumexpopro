import express from 'express'

const router = express.Router()

// Tracking de serviços por tipo de usuário
router.get('/tracking/:userType/:userId', (req, res) => {
  try {
    const { userType, userId } = req.params
    
    console.log(`📊 Tracking solicitado - Tipo: ${userType}, ID: ${userId}`)
    
    // Mock de serviços ativos
    const activeServices = [
      {
        id: 1,
        serviceId: 101,
        userId: parseInt(userId),
        userType,
        status: 'active',
        startTime: new Date().toISOString(),
        estimatedDuration: 120, // minutos
        location: {
          lat: -23.5505,
          lng: -46.6333
        }
      }
    ]
    
    res.json(activeServices)
  } catch (error) {
    console.error('Erro ao buscar tracking:', error)
    res.status(500).json({ error: 'Falha ao buscar tracking' })
  }
})

// Histórico de serviços
router.get('/history/:userType/:userId', (req, res) => {
  try {
    const { userType, userId } = req.params
    
    console.log(`📋 Histórico solicitado - Tipo: ${userType}, ID: ${userId}`)
    
    // Mock de histórico
    const serviceHistory = [
      {
        id: 1,
        serviceId: 101,
        userId: parseInt(userId),
        userType,
        status: 'completed',
        startTime: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
        endTime: new Date(Date.now() - 82800000).toISOString(),
        duration: 60,
        rating: 5,
        feedback: 'Excelente serviço!'
      }
    ]
    
    res.json(serviceHistory)
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    res.status(500).json({ error: 'Falha ao buscar histórico' })
  }
})

// Atualizar status do serviço
router.post('/tracking/update', (req, res) => {
  try {
    const { serviceId, status, userId, userType, timestamp, location } = req.body
    
    console.log(`🔄 Atualização de serviço - ID: ${serviceId}, Status: ${status}`)
    
    res.json({ 
      success: true, 
      message: 'Status atualizado',
      completionCode: status === 'completed' ? 'ABC123' : null
    })
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
    res.status(500).json({ error: 'Falha ao atualizar serviço' })
  }
})

export default router 