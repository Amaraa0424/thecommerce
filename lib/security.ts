/**
 * Security utilities and configurations for production
 */

// Rate limiting configuration
export const RATE_LIMITS = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
  },
  // Order creation
  orders: {
    windowMs: 60 * 1000, // 1 minute
    max: 3, // limit each IP to 3 orders per minute
  },
  // Review creation
  reviews: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 reviews per minute
  }
}

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  productId: /^[a-zA-Z0-9_-]+$/,
  userId: /^[a-zA-Z0-9_-]+$/,
}

// Sanitization functions
export const sanitize = {
  /**
   * Sanitize string input to prevent XSS
   */
  string: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  /**
   * Sanitize email input
   */
  email: (email: string): string => {
    return email.toLowerCase().trim()
  },

  /**
   * Sanitize numeric input
   */
  number: (input: string | number): number => {
    const num = typeof input === 'string' ? parseFloat(input) : input
    return isNaN(num) ? 0 : num
  },

  /**
   * Sanitize boolean input
   */
  boolean: (input: any): boolean => {
    if (typeof input === 'boolean') return input
    if (typeof input === 'string') {
      return input.toLowerCase() === 'true'
    }
    return Boolean(input)
  }
}

// Security headers for API responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate database URL format
  if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  // Validate NextAuth secret length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long')
  }
}

// Logging utility for production
export const logger = {
  error: (message: string, error?: any, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, log to external service (e.g., Sentry, LogRocket)
      console.error(JSON.stringify({
        level: 'error',
        message,
        error: error?.message || error,
        context,
        timestamp: new Date().toISOString(),
      }))
    } else {
      // In development, use regular console.error
      console.error(message, error, context)
    }
  },

  warn: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        context,
        timestamp: new Date().toISOString(),
      }))
    } else {
      console.warn(message, context)
    }
  },

  info: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({
        level: 'info',
        message,
        context,
        timestamp: new Date().toISOString(),
      }))
    } else {
      console.log(message, context)
    }
  }
}

// API response utilities
export const createSecureResponse = (data: any, status: number = 200) => {
  const headers = new Headers()
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value)
  })

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(headers.entries())
    }
  })
}

// Input validation middleware
export const validateInput = (schema: Record<string, any>) => {
  return (data: Record<string, any>) => {
    const errors: string[] = []
    
    Object.entries(schema).forEach(([key, rules]) => {
      const value = data[key]
      
      if (rules.required && (!value || value === '')) {
        errors.push(`${key} is required`)
        return
      }
      
      if (value && rules.type) {
        if (rules.type === 'email' && !VALIDATION_PATTERNS.email.test(value)) {
          errors.push(`${key} must be a valid email`)
        }
        
        if (rules.type === 'number' && isNaN(Number(value))) {
          errors.push(`${key} must be a number`)
        }
        
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${key} must be a string`)
        }
      }
      
      if (value && rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`)
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be no more than ${rules.maxLength} characters`)
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}