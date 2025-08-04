import express from 'express'
import { SAMPLE_PROFESSIONALS } from '../../../shared/schema'

const router = express.Router()

// Função para calcular distância entre coordenadas (fórmula Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get all professionals
router.get('/', (req, res) => {
  try {
    return res.json(SAMPLE_PROFESSIONALS)
  } catch (error) {
    console.error('Get professionals error:', error)
    return res.status(500).json({ error: 'Failed to get professionals' })
  }
})

// Get professional by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const professional = SAMPLE_PROFESSIONALS.find(p => p.id === parseInt(id))
    
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' })
    }
    
    return res.json(professional)
  } catch (error) {
    console.error('Get professional error:', error)
    return res.status(500).json({ error: 'Failed to get professional' })
  }
})

// Get professional services
router.get('/:id/services', (req, res) => {
  try {
    const { id } = req.params
    const professional = SAMPLE_PROFESSIONALS.find(p => p.id === parseInt(id))
    
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' })
    }
    
    // Mock services based on professional skills
    const services = (professional.services || professional.skills || []).map((service, index) => ({
      id: index + 1,
      serviceName: service,
      serviceType: `servico_${service.toLowerCase().replace(/\s+/g, '_')}`,
      tokenPrice: professional.servicesPricing?.[index] || 2000,
      description: `Serviço especializado em ${service}`,
      estimatedDuration: '1-2 horas',
      type: 'consultation'
    }))
    
    return res.json(services)
  } catch (error) {
    console.error('Get professional services error:', error)
    return res.status(500).json({ error: 'Failed to get professional services' })
  }
})

// Create new professional
router.post('/', (req, res) => {
  try {
    const {
      name,
      title,
      rating = 5.0,
      reviewCount = 0,
      hourlyRate,
      skills,
      location,
      experience,
      description
    } = req.body
    
    // Validate required fields
    if (!name || !title) {
      return res.status(400).json({ error: 'Name and title are required' })
    }
    
    // Create new professional
    const newProfessional = {
      id: SAMPLE_PROFESSIONALS.length + 1,
      name,
      title,
      rating: parseFloat(rating),
      reviewCount: parseInt(reviewCount),
      hourlyRate: hourlyRate ? parseInt(hourlyRate) : undefined,
      skills: Array.isArray(skills) ? skills : [],
      orbitPosition: SAMPLE_PROFESSIONALS.length + 1,
      isAvailable: true,
      location,
      experience: experience ? parseInt(experience) : undefined,
      description
    }
    
    // In a real app, save to database
    // SAMPLE_PROFESSIONALS.push(newProfessional)
    
    return res.status(201).json(newProfessional)
  } catch (error) {
    console.error('Create professional error:', error)
    return res.status(500).json({ error: 'Failed to create professional' })
  }
})

// Update professional
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const professional = SAMPLE_PROFESSIONALS.find(p => p.id === parseInt(id))
    
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' })
    }
    
    // Update fields
    const updatedProfessional = {
      ...professional,
      ...req.body,
      id: parseInt(id) // Ensure ID doesn't change
    }
    
    // In a real app, update in database
    // const index = SAMPLE_PROFESSIONALS.findIndex(p => p.id === parseInt(id))
    // SAMPLE_PROFESSIONALS[index] = updatedProfessional
    
    return res.json(updatedProfessional)
  } catch (error) {
    console.error('Update professional error:', error)
    return res.status(500).json({ error: 'Failed to update professional' })
  }
})

// Delete professional
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const professional = SAMPLE_PROFESSIONALS.find(p => p.id === parseInt(id))
    
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' })
    }
    
    // In a real app, delete from database
    // SAMPLE_PROFESSIONALS = SAMPLE_PROFESSIONALS.filter(p => p.id !== parseInt(id))
    
    return res.json({ message: 'Professional deleted successfully' })
  } catch (error) {
    console.error('Delete professional error:', error)
    return res.status(500).json({ error: 'Failed to delete professional' })
  }
})

// Toggle professional availability
router.patch('/:id/availability', (req, res) => {
  try {
    const { id } = req.params
    const { isAvailable } = req.body
    
    const professional = SAMPLE_PROFESSIONALS.find(p => p.id === parseInt(id))
    
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' })
    }
    
    professional.available = isAvailable
    
    return res.json({
      ...professional,
      message: `Professional ${isAvailable ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Toggle availability error:', error)
    return res.status(500).json({ error: 'Failed to toggle availability' })
  }
})

// Get professional reviews
router.get('/:id/reviews', (req, res) => {
  try {
    const { id } = req.params
    
    // Mock reviews data
    const reviews = [
      {
        id: 1,
        professionalId: parseInt(id),
        userId: 1,
        rating: 5,
        comment: 'Excelente profissional, muito competente!',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        professionalId: parseInt(id),
        userId: 2,
        rating: 4,
        comment: 'Bom trabalho, recomendo.',
        createdAt: '2024-01-20T14:15:00Z'
      }
    ]
    
    return res.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    return res.status(500).json({ error: 'Failed to get reviews' })
  }
})

// Search professionals
router.get('/search', (req, res) => {
  try {
    const { q } = req.query
    
    if (!q) {
      return res.json(SAMPLE_PROFESSIONALS)
    }
    
    const query = q.toString().toLowerCase()
    const results = SAMPLE_PROFESSIONALS.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.title.toLowerCase().includes(query) ||
      (p.skills && p.skills.some(s => s.toLowerCase().includes(query))) ||
      p.city?.toLowerCase().includes(query)
    )
    
    return res.json(results)
  } catch (error) {
    console.error('Search professionals error:', error)
    return res.status(500).json({ error: 'Failed to search professionals' })
  }
})

export default router 
