import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from '../../shared/schema'

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws

// Create connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
})

// Create Drizzle instance
export const db = drizzle(pool, { schema })

// Test database connection
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Close database connection
export const closeConnection = async () => {
  await pool.end()
  console.log('Database connection closed')
} 
