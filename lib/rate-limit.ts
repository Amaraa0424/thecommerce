/**
 * Rate limiting utilities for API endpoints
 */

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function createRateLimit(config: RateLimitConfig) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now()
    const key = identifier
    
    // Initialize or reset if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }
    
    // Increment count
    store[key].count++
    
    const remaining = Math.max(0, config.max - store[key].count)
    const allowed = store[key].count <= config.max
    
    return {
      allowed,
      remaining,
      resetTime: store[key].resetTime
    }
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // General API endpoints
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later'
  }),
  
  // Authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later'
  }),
  
  // Order creation
  orders: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 orders per minute
    message: 'Too many orders, please wait before placing another order'
  }),
  
  // Review creation
  reviews: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 reviews per minute
    message: 'Too many reviews, please wait before submitting another review'
  }),
  
  // Password reset
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later'
  })
}

export function getRateLimitHeaders(result: { remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  }
}