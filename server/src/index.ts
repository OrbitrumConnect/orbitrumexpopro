import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth'
import adminRoutes from './routes/admin'
import paymentRoutes from './routes/payment'
import professionalRoutes from './routes/professionals'
import walletRoutes from './routes/wallet'
import trackingRoutes from './routes/tracking'

// Import database
import { db } from './db'

// Import types
import { SAMPLE_USERS, SAMPLE_PROFESSIONALS } from '../../shared/schema'

dotenv.config()

const app = express()
const server = createServer(app)
const port = process.env.PORT || 5001

// WebSocket server
const wss = new WebSocketServer({ server })

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/professionals', professionalRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/tracking', trackingRoutes)

// Rotas faltantes
app.get('/api/free-plan/limits', (req, res) => {
  res.json({
    aiSearches: 10,
    planetViews: 2,
    profileViews: 1,
    messages: 2
  })
})

app.get('/api/notifications', (req, res) => {
  res.json([])
})

app.post('/api/notifications/:id/read', (req, res) => {
  res.json({ success: true })
})

// Mock data endpoints for development
app.get('/api/users', (req, res) => {
  res.json(SAMPLE_USERS)
})

app.get('/api/professionals', (req, res) => {
  res.json(SAMPLE_PROFESSIONALS)
})

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection')

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received:', data)
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          break
        case 'subscribe':
          // Handle subscription to real-time updates
          ws.send(JSON.stringify({ 
            type: 'subscribed', 
            channel: data.channel 
          }))
          break
        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type' 
          }))
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }))
    }
  })

  ws.on('close', () => {
    console.log('WebSocket connection closed')
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Orbitrum Connect WebSocket',
    timestamp: Date.now()
  }))
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
server.listen(port, () => {
  console.log(`🚀 Orbitrum Connect Server running on port ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/api/health`)
  console.log(`🔗 WebSocket: ws://localhost:${port}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app 
