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
    const { available, skill, location, search, lat, lng, radius = 35 } = req.query
    
    // TODO: Em produção, buscar profissionais reais do banco
    // const realProfessionals = await db.select().from(professionals).where(eq(professionals.verified, true))
    
    // Por enquanto, usar apenas demos para desenvolvimento
    let professionals = [...SAMPLE_PROFESSIONALS]
    
    // SISTEMA INTELIGENTE: Priorizar profissionais reais
    // Em produção, isso será:
    // 1. Buscar profissionais reais verificados
    // 2. Se não encontrar suficientes, adicionar demos
    // 3. Se encontrar muitos reais, não mostrar demos
    
    // Filter by availability
    if (available === 'true') {
      professionals = professionals.filter(p => p.available)
    }
    
    // Filter by search term (profession/title)
    if (search) {
      const searchTerm = search.toString().toLowerCase()
      professionals = professionals.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.name.toLowerCase().includes(searchTerm) ||
        (p.skills && p.skills.some(s => s.toLowerCase().includes(searchTerm)))
      )
    }
    
    // Filter by skill
    if (skill) {
      professionals = professionals.filter(p => 
        p.skills && p.skills.some(s => s.toLowerCase().includes(skill.toString().toLowerCase()))
      )
    }
    
    // Filter by location (cidade)
    if (location) {
      professionals = professionals.filter(p => 
        p.city?.toLowerCase().includes(location.toString().toLowerCase())
      )
    }
    
    // FILTRO POR PROXIMIDADE GPS (sistema Uber)
    if (lat && lng) {
      const userLat = parseFloat(lat.toString())
      const userLng = parseFloat(lng.toString())
      const maxRadius = parseFloat(radius.toString())
      
      professionals = professionals.filter(p => {
        if (!p.latitude || !p.longitude) return false
        
        const distance = calculateDistance(userLat, userLng, p.latitude, p.longitude)
        const professionalRadius = p.workRadius || 20
        
        // Profissional deve estar dentro do raio do usuário E usuário dentro do raio do profissional
        return distance <= maxRadius && distance <= professionalRadius
      })
      
      // Ordenar por proximidade
      professionals.sort((a, b) => {
        if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0
        const distA = calculateDistance(userLat, userLng, a.latitude, a.longitude)
        const distB = calculateDistance(userLat, userLng, b.latitude, b.longitude)
        return distA - distB
      })
    }
    
    // Limitar a máximo 10 profissionais por busca
    professionals = professionals.slice(0, 10)
    
    console.log(`🔍 Busca retornou ${professionals.length} profissionais`)
    if (lat && lng) {
      console.log(`📍 Filtro GPS: lat=${lat}, lng=${lng}, raio=${radius}km`)
    }
    
    res.json(professionals)
  } catch (error) {
    console.error('Get professionals error:', error)
    res.status(500).json({ error: 'Failed to get professionals' })
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
    
    res.json(professional)
  } catch (error) {
    console.error('Get professional error:', error)
    res.status(500).json({ error: 'Failed to get professional' })
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
    const services = professional.services.map((service, index) => ({
      id: index + 1,
      name: service,
      price: professional.servicesPricing[index] || '2000',
      description: `Serviço de ${service}`,
      duration: '1-2 horas',
      type: 'consultation'
    }))
    
    res.json(services)
  } catch (error) {
    console.error('Get professional services error:', error)
    res.status(500).json({ error: 'Failed to get professional services' })
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
    
    res.status(201).json(newProfessional)
  } catch (error) {
    console.error('Create professional error:', error)
    res.status(500).json({ error: 'Failed to create professional' })
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
    
    res.json(updatedProfessional)
  } catch (error) {
    console.error('Update professional error:', error)
    res.status(500).json({ error: 'Failed to update professional' })
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
    
    res.json({ message: 'Professional deleted successfully' })
  } catch (error) {
    console.error('Delete professional error:', error)
    res.status(500).json({ error: 'Failed to delete professional' })
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
    
    res.json({
      ...professional,
      message: `Professional ${isAvailable ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Toggle availability error:', error)
    res.status(500).json({ error: 'Failed to toggle availability' })
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
    
    res.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({ error: 'Failed to get reviews' })
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
    
    res.json(results)
  } catch (error) {
    console.error('Search professionals error:', error)
    res.status(500).json({ error: 'Failed to search professionals' })
  }
})

export default router 
