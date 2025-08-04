import express from 'express'
import { SAMPLE_USERS } from '../../../shared/schema'

const router = express.Router()

// Get current user
router.get('/me', (req, res) => {
  try {
    // In a real app, this would verify JWT token
    // For now, return the first user as mock authenticated user
    const user = SAMPLE_USERS[1] // Pedro Galluf
    res.json(user)
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Unauthorized' })
  }
})

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body
    
    // Mock authentication
    const user = SAMPLE_USERS.find(u => u.email === email)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // In a real app, verify password hash
    if (email === 'passosmir4@gmail.com' && password !== 'm6m7m8M9!horus') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // For non-admin users, use a different password
    if (email !== 'passosmir4@gmail.com' && password !== 'password123') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    return res.json({
      user: user,
      token: 'mock-jwt-token-' + Date.now(),
      message: 'Login successful',
      success: true
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    // In a real app, invalidate JWT token
    return res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Register endpoint
router.post('/register', (req, res) => {
  try {
    const { email, name, userType = 'client' } = req.body
    
    // Check if user already exists
    const existingUser = SAMPLE_USERS.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    // Create new user
    const newUser = {
      id: SAMPLE_USERS.length + 1,
      username: name || email.split('@')[0],
      email,
      emailVerified: false,
      emailVerificationToken: null,
      passwordHash: null,
      supabaseId: null,
      userType,
      phone: null,
      fullName: name,
      profilePhoto: null,
      pixKey: null,
      pixKeyValidated: false,
      termsAccepted: false,
      termsAcceptedAt: null,
      tokens: 20,
      plan: "free",
      planActivatedAt: null,
      planExpiryDate: null,
      credits: 20,
      maxCredits: 20,
      gamesPlayedToday: 0,
      lastGameDate: null,
      highScore: 0,
      tokensPlano: 0,
      tokensGanhos: 0,
      tokensComprados: 0,
      tokensUsados: 0,
      creditosAcumulados: 0,
      creditosSacados: 0,
      dataInicioPlano: null,
      ultimoSaque: null,
      saqueDisponivel: 0,
      notificacaoSaque: true,
      adminLevel: 0,
      adminPermissions: [],
      documentsStatus: "pending",
      documentsSubmittedAt: null,
      documentsApprovedAt: null,
      canMakePurchases: false,
      suspended: false,
      suspendedReason: null,
      suspendedAt: null,
      banned: false,
      bannedReason: null,
      bannedAt: null,
      bannedUntil: null,
      isPromotionalUser: false,
      promotionalCode: null,
      referredBy: null,
      referralCount: 0,
      promotionalPlanExpiry: null,
      promotionalBonusMonths: 0,
      promotionalPhase: "active",
      freePlanMonthlyReset: null,
      freePlanAiSearches: 10,
      freePlanPlanetViews: 2,
      freePlanProfileViews: 1,
      freePlanMessages: 2,
      freePlanLastDailyReset: null,
      freePlanLastPlanetReset: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // In a real app, save to database
    SAMPLE_USERS.push(newUser)
    
    res.status(201).json({
      user: newUser,
      token: 'mock-jwt-token-' + Date.now(),
      message: 'Registration successful'
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Complete professional profile
router.post('/complete-professional', (req, res) => {
  try {
    const { userId, professionalData } = req.body
    
    // Mock professional completion
    const user = SAMPLE_USERS.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update user to professional
    user.userType = 'professional'
    
    res.json({
      success: true,
      message: 'Professional profile completed',
      user
    })
  } catch (error) {
    console.error('Complete professional error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Google OAuth callback
router.get('/google/callback', (req, res) => {
  try {
    const { code } = req.query
    
    // In a real app, exchange code for tokens with Google
    // For now, return mock user
    const user = SAMPLE_USERS[1] // Pedro Galluf
    
    res.json({
      user,
      token: 'mock-google-token-' + Date.now(),
      message: 'Google OAuth successful'
    })
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router 
