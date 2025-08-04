import express from 'express'
import { SAMPLE_USERS, getTotalTokens } from '../../../shared/schema'

const router = express.Router()

// Get current user wallet (without userId parameter)
router.get('/user', (req, res) => {
  try {
    // For demo purposes, use the first user
    const user = SAMPLE_USERS[0]
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const totalTokens = getTotalTokens(user)
    
    const wallet = {
      userId: user.id,
      email: user.email,
      username: user.username,
      tokensComprados: user.tokensComprados || 0,
      tokensPlano: user.tokensPlano || 0,
      tokensGanhos: user.tokensGanhos || 0,
      tokensUsados: user.tokensUsados || 0,
      totalTokens
    }
    
    res.json(wallet)
  } catch (error) {
    console.error('Get wallet error:', error)
    res.status(500).json({ error: 'Failed to get wallet' })
  }
})

// Get user wallet
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const totalTokens = getTotalTokens(user)
    
    const wallet = {
      userId: user.id,
      email: user.email,
      username: user.username,
      tokensComprados: user.tokensComprados || 0,
      tokensPlano: user.tokensPlano || 0,
      tokensGanhos: user.tokensGanhos || 0,
      tokensUsados: user.tokensUsados || 0,
      totalTokens
    }
    
    res.json(wallet)
  } catch (error) {
    console.error('Get wallet error:', error)
    res.status(500).json({ error: 'Failed to get wallet' })
  }
})

// Add tokens to user
router.post('/add-tokens', (req, res) => {
  try {
    const { userId, tokens, type = 'comprados' } = req.body
    
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Add tokens based on type
    switch (type) {
      case 'comprados':
        user.tokensComprados += parseInt(tokens)
        break
      case 'plano':
        user.tokensPlano += parseInt(tokens)
        break
      case 'ganhos':
        user.tokensGanhos += parseInt(tokens)
        break
      default:
        return res.status(400).json({ error: 'Invalid token type' })
    }
    
    const totalTokens = getTotalTokens(user)
    
    res.json({
      success: true,
      message: `Added ${tokens} tokens to user`,
      newBalance: totalTokens,
      wallet: {
        tokensComprados: user.tokensComprados,
        tokensPlano: user.tokensPlano,
        tokensGanhos: user.tokensGanhos,
        tokensUsados: user.tokensUsados,
        totalTokens
      }
    })
  } catch (error) {
    console.error('Add tokens error:', error)
    res.status(500).json({ error: 'Failed to add tokens' })
  }
})

// Use tokens
router.post('/use-tokens', (req, res) => {
  try {
    const { userId, tokens, description } = req.body
    
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const totalTokens = getTotalTokens(user)
    
    if (totalTokens < parseInt(tokens)) {
      return res.status(400).json({ error: 'Insufficient tokens' })
    }
    
    // Use tokens
    user.tokensUsados += parseInt(tokens)
    
    const newTotal = getTotalTokens(user)
    
    res.json({
      success: true,
      message: `Used ${tokens} tokens`,
      description,
      newBalance: newTotal,
      wallet: {
        tokensComprados: user.tokensComprados,
        tokensPlano: user.tokensPlano,
        tokensGanhos: user.tokensGanhos,
        tokensUsados: user.tokensUsados,
        totalTokens: newTotal
      }
    })
  } catch (error) {
    console.error('Use tokens error:', error)
    res.status(500).json({ error: 'Failed to use tokens' })
  }
})

// Get transaction history
router.get('/transactions/:userId', (req, res) => {
  try {
    const { userId } = req.params
    
    // Mock transaction history
    const transactions = [
      {
        id: 1,
        userId: parseInt(userId),
        type: 'purchase',
        amount: 2160,
        description: 'Pacote Básico - PIX',
        createdAt: '2024-01-15T10:30:00Z',
        status: 'completed'
      },
      {
        id: 2,
        userId: parseInt(userId),
        type: 'usage',
        amount: -100,
        description: 'Chat com profissional',
        createdAt: '2024-01-16T14:20:00Z',
        status: 'completed'
      },
      {
        id: 3,
        userId: parseInt(userId),
        type: 'purchase',
        amount: 4320,
        description: 'Pacote Standard - PIX',
        createdAt: '2024-01-20T09:15:00Z',
        status: 'completed'
      }
    ]
    
    res.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ error: 'Failed to get transactions' })
  }
})

// Get token statistics
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const totalTokens = getTotalTokens(user)
    
    const stats = {
      userId: user.id,
      totalTokens,
      tokensComprados: user.tokensComprados,
      tokensPlano: user.tokensPlano,
      tokensGanhos: user.tokensGanhos,
      tokensUsados: user.tokensUsados,
      totalSpent: (user as any).pixPago || 0,
      averageTokensPerReal: (user as any).pixPago ? (user.tokensComprados / (user as any).pixPago) : 0,
      usageRate: user.tokensComprados > 0 ? (user.tokensUsados / user.tokensComprados) * 100 : 0
    }
    
    return res.json(stats)
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Transfer tokens between users
router.post('/transfer', (req, res) => {
  try {
    const { fromUserId, toUserId, tokens, description } = req.body
    
    const fromUser = SAMPLE_USERS.find(u => u.id === parseInt(fromUserId))
    const toUser = SAMPLE_USERS.find(u => u.id === parseInt(toUserId))
    
    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const fromUserTotal = getTotalTokens(fromUser)
    
    if (fromUserTotal < parseInt(tokens)) {
      return res.status(400).json({ error: 'Insufficient tokens' })
    }
    
    // Transfer tokens
    fromUser.tokensUsados += parseInt(tokens)
    toUser.tokensGanhos += parseInt(tokens)
    
    res.json({
      success: true,
      message: `Transferred ${tokens} tokens`,
      description,
      fromUser: {
        id: fromUser.id,
        newBalance: getTotalTokens(fromUser)
      },
      toUser: {
        id: toUser.id,
        newBalance: getTotalTokens(toUser)
      }
    })
  } catch (error) {
    console.error('Transfer tokens error:', error)
    res.status(500).json({ error: 'Failed to transfer tokens' })
  }
})

// Reset user tokens (admin only)
router.post('/reset/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Reset tokens
    user.tokensComprados = 0
    user.tokensPlano = 0
    user.tokensGanhos = 0
    user.tokensUsados = 0
    
    return res.json({
      success: true,
      message: 'User tokens reset successfully',
      wallet: {
        tokensComprados: 0,
        tokensPlano: 0,
        tokensGanhos: 0,
        tokensUsados: 0,
        totalTokens: 0
      }
    })
  } catch (error) {
    console.error('Reset tokens error:', error)
    res.status(500).json({ error: 'Failed to reset tokens' })
  }
})

export default router 
