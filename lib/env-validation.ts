/**
 * Environment variable validation for production deployment
 */

export interface EnvConfig {
  // Database
  DATABASE_URL: string
  
  // Authentication
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string
  
  // OAuth Providers (optional)
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  
  // Email (optional)
  SMTP_HOST?: string
  SMTP_PORT?: string
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  
  // Application
  NODE_ENV: string
}

export function validateEnvironment(): EnvConfig {
  const errors: string[] = []
  
  // Required variables
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
  
  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  })
  
  // Validate DATABASE_URL format
  if (requiredVars.DATABASE_URL && !requiredVars.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string')
  }
  
  // Validate NEXTAUTH_SECRET length
  if (requiredVars.NEXTAUTH_SECRET && requiredVars.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long')
  }
  
  // Validate NEXTAUTH_URL format
  if (requiredVars.NEXTAUTH_URL && !requiredVars.NEXTAUTH_URL.startsWith('http')) {
    errors.push('NEXTAUTH_URL must be a valid URL starting with http:// or https://')
  }
  
  // Check OAuth configuration
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET
  
  if (hasGoogleId && !hasGoogleSecret) {
    errors.push('GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set')
  }
  
  if (!hasGoogleId && hasGoogleSecret) {
    errors.push('GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set')
  }
  
  // Check email configuration
  const emailVars = [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASSWORD
  ]
  
  const hasAnyEmailVar = emailVars.some(Boolean)
  const hasAllEmailVars = emailVars.every(Boolean)
  
  if (hasAnyEmailVar && !hasAllEmailVars) {
    errors.push('All SMTP variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD) must be set together')
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
  
  return {
    DATABASE_URL: requiredVars.DATABASE_URL!,
    NEXTAUTH_SECRET: requiredVars.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: requiredVars.NEXTAUTH_URL!,
    NODE_ENV: requiredVars.NODE_ENV!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  }
}

// Validate environment on module load
export const env = validateEnvironment()