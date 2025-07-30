# 🚀 Venezia Ice Cream - Deployment Guide

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All code committed to Git
- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Security settings reviewed
- [ ] Build tested locally

### Vercel Deployment

#### 1. Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

#### 2. Environment Variables
Set these in Vercel dashboard or CLI:
```bash
vercel env add USE_SUPABASE production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production
vercel env add JWT_SECRET production
vercel env add ENABLE_AUTH production
```

#### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Or preview deployment
vercel
```

### Alternative Deployment Options

#### Render
1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: venezia-backend
    env: node
    buildCommand: npm install
    startCommand: npm run backend:start
    envVars:
      - key: NODE_ENV
        value: production
      - key: USE_SUPABASE
        value: true

  - type: static
    name: venezia-frontend
    buildCommand: npm run build:vite
    staticPublishPath: ./dist
```

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

#### Docker (Self-hosted)
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy application
COPY . .

# Build frontend
RUN npm run build:vite

# Expose port
EXPOSE 5001

# Start server
CMD ["npm", "run", "backend:start"]
```

## 🔒 Security Checklist

### Critical Items
- [ ] `ENABLE_AUTH=true` in production
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Database
- [ ] Supabase RLS policies configured
- [ ] Database backups enabled
- [ ] Connection pooling configured
- [ ] Sensitive data encrypted

## 📊 Post-Deployment

### Monitoring
1. **Application Health**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (Sentry, LogRocket)
   - Enable performance monitoring

2. **Database Monitoring**
   - Monitor query performance
   - Track connection pool usage
   - Set up slow query alerts

3. **Security Monitoring**
   - Enable audit logging
   - Monitor failed login attempts
   - Set up security alerts

### Backup Strategy
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL > backup-$(date +\%Y\%m\%d).sql
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Issues
- Check Supabase project status
- Verify connection string
- Check firewall rules

#### Authentication Issues
- Verify JWT_SECRET matches
- Check token expiration settings
- Verify CORS configuration

### Debug Commands
```bash
# Check environment
node -e "console.log(process.env)"

# Test database connection
node backend/test-connection.js

# Verify build output
ls -la dist/
```

## 📈 Performance Optimization

### Frontend
- Enable Gzip compression
- Configure CDN (Cloudflare, Fastly)
- Optimize images with WebP
- Enable browser caching

### Backend
- Enable response caching
- Use database connection pooling
- Optimize database queries
- Enable HTTP/2

### Monitoring Performance
```javascript
// Add to frontend
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log('Page load time:', pageLoadTime, 'ms');
  });
}
```

## 🔄 Continuous Deployment

### GitHub Actions
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📝 Maintenance

### Regular Tasks
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security alerts
- [ ] Quarterly: Performance audit
- [ ] Yearly: Major version updates

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update safely
npm update

# Update major versions (test thoroughly)
npm install package@latest
```

---

**Need help?** Contact support or check the [troubleshooting guide](#troubleshooting).