import express from 'express'

const router = express.Router()

// Atualizar localização do usuário
router.post('/update-location', (req, res) => {
  try {
    const { serviceId, lat, lng, timestamp } = req.body
    
    console.log(`📍 Atualização GPS - Serviço: ${serviceId}, Lat: ${lat}, Lng: ${lng}`)
    
    // Em produção, salvar no banco de dados
    // Por enquanto, apenas log
    
    res.json({ 
      success: true, 
      message: 'Localização atualizada',
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Erro ao atualizar localização:', error)
    res.status(500).json({ error: 'Falha ao atualizar localização' })
  }
})

// Obter localização atual
router.get('/location/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params
    
    // Em produção, buscar do banco
    // Por enquanto, retornar mock
    res.json({
      lat: -23.5505,
      lng: -46.6333,
      timestamp: Date.now(),
      accuracy: 10
    })
  } catch (error) {
    console.error('Erro ao obter localização:', error)
    res.status(500).json({ error: 'Falha ao obter localização' })
  }
})

export default router 