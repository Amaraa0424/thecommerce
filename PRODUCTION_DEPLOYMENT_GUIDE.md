# Production Deployment Guide

This guide provides comprehensive instructions for deploying your e-commerce application to production with security best practices.

## 🚀 Quick Start

1. **Run the production cleanup script:**
   ```bash
   npx tsx scripts/production-cleanup.ts
   ```

2. **Set environment variables** (see Environment Variables section)

3. **Build and deploy:**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# Application
NODE_ENV="production"
```

### Optional Variables

```bash
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## 🔒 Security Features Implemented

### 1. Authentication & Authorization
- ✅ NextAuth.js with secure session management
- ✅ Role-based access control (ADMIN/CUSTOMER)
- ✅ Protected routes with middleware
- ✅ Session validation on every request

### 2. Input Validation & Sanitization
- ✅ Server-side validation for all API endpoints
- ✅ Input sanitization to prevent XSS
- ✅ SQL injection protection via Prisma ORM
- ✅ Type-safe API with TypeScript

### 3. Rate Limiting
- ✅ API endpoint rate limiting
- ✅ Authentication attempt limiting
- ✅ Order creation rate limiting
- ✅ Review submission rate limiting

### 4. Security Headers
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### 5. Data Protection
- ✅ Encrypted passwords with bcrypt
- ✅ Secure session tokens
- ✅ Environment variable validation
- ✅ Database connection security

## 🗄️ Database Setup

### 1. Production Database
```bash
# Create production database
createdb your_production_db

# Set DATABASE_URL
export DATABASE_URL="postgresql://username:password@host:port/your_production_db"
```

### 2. Run Migrations
```bash
# Deploy migrations to production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 3. Seed Data (Optional)
```bash
# Seed initial data
npx prisma db seed
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard**

### Option 2: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t ecommerce-app .
   docker run -p 3000:3000 ecommerce-app
   ```

### Option 3: Traditional Server

1. **Install dependencies:**
   ```bash
   npm ci --only=production
   ```

2. **Build application:**
   ```bash
   npm run build
   ```

3. **Start with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "ecommerce" -- start
   ```

## 🔍 Monitoring & Logging

### 1. Error Tracking
Integrate with error tracking services:
- Sentry
- LogRocket
- Bugsnag

### 2. Performance Monitoring
- New Relic
- DataDog
- Vercel Analytics

### 3. Uptime Monitoring
- Pingdom
- UptimeRobot
- StatusCake

## 🛡️ Security Checklist

### Pre-Deployment
- [ ] All test files removed
- [ ] Debug routes blocked in production
- [ ] Environment variables validated
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation in place

### Post-Deployment
- [ ] SSL certificate installed
- [ ] Security headers verified
- [ ] Authentication flows tested
- [ ] Admin access verified
- [ ] Rate limiting tested
- [ ] Error tracking configured

## 🔧 Performance Optimization

### 1. Build Optimization
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### 2. Image Optimization
- Use Next.js Image component
- Configure image domains in next.config.js
- Implement lazy loading

### 3. Caching Strategy
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60'
          }
        ]
      }
    ]
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check database server accessibility
   - Ensure connection pooling configured

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches domain
   - Ensure OAuth credentials are correct

3. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Ensure environment variables set

4. **Performance Issues**
   - Enable compression
   - Configure CDN
   - Optimize database queries
   - Implement caching

## 📊 Health Checks

### API Health Check
Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
```

### Database Health Check
```typescript
// Check database connectivity
import { prisma } from '@/lib/db/client'

export async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy' }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

## 🔄 Backup Strategy

### 1. Database Backups
```bash
# Daily database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
```

### 2. File Backups
- User uploaded files
- Configuration files
- SSL certificates

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Session store (Redis)
- Database read replicas
- CDN for static assets

### Vertical Scaling
- CPU and memory optimization
- Database connection pooling
- Query optimization
- Caching layers

## 🔐 Security Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security logs weekly
- [ ] Rotate secrets quarterly
- [ ] Security audit annually

### Security Updates
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## 📞 Support & Maintenance

### Monitoring Alerts
Set up alerts for:
- High error rates
- Slow response times
- Database connection issues
- High memory usage
- SSL certificate expiration

### Maintenance Windows
- Schedule regular maintenance
- Communicate downtime to users
- Have rollback plan ready
- Test in staging first

## 🎯 Success Metrics

### Performance Metrics
- Page load time < 3 seconds
- API response time < 500ms
- 99.9% uptime
- Error rate < 0.1%

### Security Metrics
- Zero security incidents
- All dependencies up to date
- Regular security scans
- Compliance with best practices

---

## 🚀 Ready for Production!

Your e-commerce application is now production-ready with:

✅ **Security**: Authentication, authorization, input validation, rate limiting  
✅ **Performance**: Optimized build, caching, monitoring  
✅ **Reliability**: Error handling, logging, health checks  
✅ **Scalability**: Database optimization, horizontal scaling ready  
✅ **Maintainability**: Clean code, documentation, monitoring  

Follow this guide for a successful production deployment!