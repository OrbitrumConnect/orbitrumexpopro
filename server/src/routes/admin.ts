import express from 'express'
import { SAMPLE_USERS, SAMPLE_PROFESSIONALS, getTotalTokens } from '../../../shared/schema'

const router = express.Router()

// Get admin statistics
router.get('/stats', (req, res) => {
  try {
    // Calculate total revenue
    const totalRevenue = SAMPLE_USERS.reduce((sum, user) => {
      return sum + (user.pixPago || 0) + (user.galaxyVault || 0)
    }, 0)
    
    // Calculate total tokens
    const totalTokens = SAMPLE_USERS.reduce((sum, user) => {
      return sum + getTotalTokens(user)
    }, 0)
    
    // Count users by type
    const userCounts = SAMPLE_USERS.reduce((counts, user) => {
      counts[user.userType] = (counts[user.userType] || 0) + 1
      return counts
    }, {} as Record<string, number>)
    
    const stats = {
      totalRevenue: totalRevenue * 100, // Convert to cents for display
      totalUsers: SAMPLE_USERS.length,
      activeUsers: SAMPLE_USERS.length,
      offlineUsers: 0,
      pendingWithdrawals: 0,
      totalWithdrawn: 0,
      nextWindow: '3 AGO',
      totalTokens,
      professionals: SAMPLE_PROFESSIONALS.length,
      conversionRate: 100, // 100% since all users have paid
      averageTicket: totalRevenue > 0 ? totalRevenue / SAMPLE_USERS.filter(u => u.pixPago || u.galaxyVault).length : 0,
      monthlyStats: {
        newUsers: SAMPLE_USERS.length,
        revenue: totalRevenue * 100,
        withdrawals: 0
      },
      withdrawalPool: {
        totalAccumulated: totalRevenue * 100, // Convert to cents
        monthlyLimit: 50000, // R$ 500,00
        currentMonthUsed: 15000, // R$ 150,00
        remainingThisMonth: 35000, // R$ 350,00
        utilizationRate: 30, // 30%
        averageUserBalance: totalRevenue / SAMPLE_USERS.length,
        totalActiveUsers: SAMPLE_USERS.length
      }
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ error: 'Failed to get admin stats' })
  }
})

// Get all users
router.get('/users', (req, res) => {
  try {
    const users = SAMPLE_USERS.map(user => ({
      ...user,
      totalTokens: getTotalTokens(user),
      totalSpent: (user.pixPago || 0) + (user.galaxyVault || 0)
    }))
    
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Get user details
router.get('/users/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const userDetails = {
      ...user,
      totalTokens: getTotalTokens(user),
      totalSpent: (user.pixPago || 0) + (user.galaxyVault || 0),
      transactions: [
        {
          id: 1,
          type: 'purchase',
          amount: (user as any).pixPago || 0,
          tokens: (user as any).tokensComprados || 0,
          date: (user as any).createdAt || new Date(),
          status: 'completed'
        }
      ]
    }
    
    return res.json(userDetails)
  } catch (error) {
    console.error('Get user details error:', error)
    return res.status(500).json({ error: 'Failed to get user details' })
  }
})

// Update user
router.put('/users/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update user fields
    const updatedUser = {
      ...user,
      ...req.body,
      id: parseInt(userId) // Ensure ID doesn't change
    }
    
    // In a real app, update in database
    // const index = SAMPLE_USERS.findIndex(u => u.id === parseInt(userId))
    // SAMPLE_USERS[index] = updatedUser
    
    return res.json(updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user
router.delete('/users/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const user = SAMPLE_USERS.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // In a real app, delete from database
    // SAMPLE_USERS = SAMPLE_USERS.filter(u => u.id !== parseInt(userId))
    
    return res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Get financial data
router.get('/financial', (req, res) => {
  try {
    const totalRevenue = SAMPLE_USERS.reduce((sum, user) => {
      return sum + ((user as any).pixPago || 0) + ((user as any).galaxyVault || 0)
    }, 0)
    
    const financialData = {
      totalRevenue: totalRevenue * 100, // Convert to cents
      transactions: SAMPLE_USERS.filter(u => (u as any).pixPago || (u as any).galaxyVault).map(user => ({
        id: user.id,
        email: user.email,
        name: (user as any).name || user.username,
        amount: ((user as any).pixPago || 0) + ((user as any).galaxyVault || 0),
        tokens: (user as any).tokensComprados || 0,
        date: (user as any).createdAt || new Date(),
        method: 'PIX'
      })),
      metrics: {
        averageTicket: totalRevenue > 0 ? totalRevenue / SAMPLE_USERS.filter(u => (u as any).pixPago || (u as any).galaxyVault).length : 0,
        ltv: totalRevenue / SAMPLE_USERS.length,
        cac: 0, // Customer acquisition cost
        roi: totalRevenue > 0 ? '∞' : 0
      },
      pixData: {
        key: '03669282106',
        holder: 'PEDRO GALLUF',
        bank: 'Nubank'
      }
    }
    
    res.json(financialData)
  } catch (error) {
    console.error('Get financial data error:', error)
    res.status(500).json({ error: 'Failed to get financial data' })
  }
})

// Get analytics data
router.get('/analytics', (req, res) => {
  try {
    const totalRevenue = SAMPLE_USERS.reduce((sum, user) => {
      return sum + (user.pixPago || 0) + (user.galaxyVault || 0)
    }, 0)
    
    const analytics = {
      conversion: 100, // 100% since all users have paid
      distribution: {
        clients: SAMPLE_USERS.filter(u => u.userType === 'client').length,
        professionals: SAMPLE_USERS.filter(u => (u as any).userType === 'professional').length,
        admins: SAMPLE_USERS.filter(u => u.userType === 'admin').length
      },
      revenueBySegment: {
        basic: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago <= 6).reduce((sum, u) => sum + ((u as any).pixPago || 0), 0),
        galaxy: SAMPLE_USERS.filter(u => (u as any).galaxyVault).reduce((sum, u) => sum + ((u as any).galaxyVault || 0), 0)
      },
      projections: {
        august: 100,
        q3: 500,
        annual: 2000
      }
    }
    
    res.json(analytics)
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

// Get withdrawal data
router.get('/withdrawals', (req, res) => {
  try {
    const withdrawalData = {
      nextWindow: '3 AGO',
      currentPool: 0,
      systemRate: 8.7,
      breakdown: {
        basic: 0.61,
        standard: 1.22,
        pro: 1.83,
        max: 2.61
      },
      pendingRequests: []
    }
    
    res.json(withdrawalData)
  } catch (error) {
    console.error('Get withdrawals error:', error)
    res.status(500).json({ error: 'Failed to get withdrawals' })
  }
})

// Process withdrawal
router.post('/withdrawals/process', (req, res) => {
  try {
    const { userId, amount } = req.body
    
    res.json({
      success: true,
      message: `Withdrawal of R$ ${amount} processed successfully`,
      transactionId: `WD${Date.now()}`
    })
  } catch (error) {
    console.error('Process withdrawal error:', error)
    res.status(500).json({ error: 'Failed to process withdrawal' })
  }
})

// Get moderation data
router.get('/moderation', (req, res) => {
  try {
    const moderationData = {
      verified: SAMPLE_USERS.length,
      pending: 0,
      blocked: 0,
      reports: 0,
      tools: [
        'Document verification',
        'PIX validation',
        'Anti-fraud system'
      ],
      security: {
        legitimateTransactions: 100,
        lgpdCompliant: true
      }
    }
    
    res.json(moderationData)
  } catch (error) {
    console.error('Get moderation error:', error)
    res.status(500).json({ error: 'Failed to get moderation data' })
  }
})

// Generate report
router.post('/reports/generate', (req, res) => {
  try {
    const { type, period } = req.body
    
    const report = {
      id: `RPT${Date.now()}`,
      type,
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue: 41.00,
        totalUsers: SAMPLE_USERS.length,
        conversionRate: 100,
        highlights: [
          '100% user conversion rate',
          'R$ 41,00 total revenue',
          '29.520 tokens distributed'
        ]
      },
      breakdown: SAMPLE_USERS.map(user => ({
        email: user.email,
        name: (user as any).name || user.username,
        amount: ((user as any).pixPago || 0) + ((user as any).galaxyVault || 0),
        tokens: user.tokensComprados
      }))
    }
    
    res.json(report)
  } catch (error) {
    console.error('Generate report error:', error)
    res.status(500).json({ error: 'Failed to generate report' })
  }
})

// Get admin wallet data
router.get('/wallet', (req, res) => {
  try {
    const walletData = {
      totalBalance: 50000,
      availableBalance: 45000,
      pendingBalance: 5000,
      transactions: [
        {
          id: 1,
          type: 'deposit',
          amount: 10000,
          date: new Date().toISOString(),
          status: 'completed'
        },
        {
          id: 2,
          type: 'withdrawal',
          amount: 5000,
          date: new Date().toISOString(),
          status: 'pending'
        }
      ]
    }
    
    res.json(walletData)
  } catch (error) {
    console.error('Get admin wallet error:', error)
    res.status(500).json({ error: 'Failed to get admin wallet' })
  }
})

// Get admin purchases
router.get('/purchases', (req, res) => {
  try {
    const purchases = [
      {
        id: 1,
        userId: 1,
        userEmail: 'passosmir4@gmail.com',
        amount: 10000,
        tokens: 1000,
        date: new Date().toISOString(),
        status: 'completed',
        paymentMethod: 'PIX'
      },
      {
        id: 2,
        userId: 2,
        userEmail: 'cliente1@test.com',
        amount: 5000,
        tokens: 500,
        date: new Date().toISOString(),
        status: 'completed',
        paymentMethod: 'PIX'
      }
    ]
    
    res.json(purchases)
  } catch (error) {
    console.error('Get admin purchases error:', error)
    res.status(500).json({ error: 'Failed to get admin purchases' })
  }
})

// Get plan distribution
router.get('/plan-distribution', (req, res) => {
  try {
    const planDistribution = {
      basic: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago <= 6).length,
      standard: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago > 6 && (u as any).pixPago <= 18).length,
      pro: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago > 18 && (u as any).pixPago <= 32).length,
      galaxy: SAMPLE_USERS.filter(u => (u as any).galaxyVault).length,
      total: SAMPLE_USERS.length,
      revenue: {
        basic: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago <= 6).reduce((sum, u) => sum + ((u as any).pixPago || 0), 0),
        standard: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago > 6 && (u as any).pixPago <= 18).reduce((sum, u) => sum + ((u as any).pixPago || 0), 0),
        pro: SAMPLE_USERS.filter(u => (u as any).pixPago && (u as any).pixPago > 18 && (u as any).pixPago <= 32).reduce((sum, u) => sum + ((u as any).pixPago || 0), 0),
        galaxy: SAMPLE_USERS.filter(u => (u as any).galaxyVault).reduce((sum, u) => sum + ((u as any).galaxyVault || 0), 0)
      }
    }
    
    res.json(planDistribution)
  } catch (error) {
    console.error('Get plan distribution error:', error)
    res.status(500).json({ error: 'Failed to get plan distribution' })
  }
})

// Get suspicious users
router.get('/suspicious-users', (req, res) => {
  try {
    const suspiciousUsers = SAMPLE_USERS.filter(user => {
      // Simular usuários suspeitos baseado em critérios
      const hasMultipleAccounts = user.email.includes('test') || user.email.includes('fake')
      const hasUnusualActivity = (user as any).lastLogin === null
      return hasMultipleAccounts || hasUnusualActivity
    }).map(user => ({
      id: user.id,
      email: user.email,
      name: (user as any).name || user.username,
      reason: 'Atividade suspeita detectada',
      riskLevel: 'medium',
      lastActivity: (user as any).lastLogin || new Date().toISOString()
    }))
    
    res.json(suspiciousUsers)
  } catch (error) {
    console.error('Get suspicious users error:', error)
    res.status(500).json({ error: 'Failed to get suspicious users' })
  }
})

// Get pending documents
router.get('/pending-documents', (req, res) => {
  try {
    const pendingDocuments = SAMPLE_USERS.filter(user => {
      // Simular documentos pendentes
      return !(user as any).documentVerified
    }).map(user => ({
      id: user.id,
      email: user.email,
      name: (user as any).name || user.username,
      documentType: 'CPF',
      submittedAt: (user as any).createdAt || new Date().toISOString(),
      status: 'pending',
      priority: 'normal'
    }))
    
    res.json(pendingDocuments)
  } catch (error) {
    console.error('Get pending documents error:', error)
    res.status(500).json({ error: 'Failed to get pending documents' })
  }
})

export default router 
