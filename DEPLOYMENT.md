# 🚀 FuelFlow - Deployment Guide

Production-ready deployment instructions for FuelFlow on various platforms.

---

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [GitHub Setup](#github-setup)
- [Vercel (Frontend)](#vercel-frontend)
- [Heroku (Backend)](#heroku-backend)
- [MongoDB Atlas](#mongodb-atlas)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Git (v2.30+)
- Node.js (v18+)
- npm (v8+)
- Vercel CLI (`npm i -g vercel`)
- Heroku CLI (`npm i -g heroku`)
- MongoDB Atlas Account
- GitHub Account
- Gmail Account (for SMTP)

### Credentials Needed
- MongoDB connection string
- JWT secrets (generate strong random values)
- SMTP credentials
- Vercel account token
- Heroku account token

---

## GitHub Setup

### 1. Create GitHub Repository

```bash
# Initialize git (if not already done)
cd fuelflow
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Create initial commit
git commit -m "feat: FuelFlow v1.0 - Production ready"

# Add remote
git remote add origin https://github.com/yourusername/fuelflow.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. GitHub Pages (Optional)
```bash
# Create gh-pages branch for documentation
git checkout --orphan gh-pages
git rm -rf .
git commit --allow-empty -m "Initial commit"
git push origin gh-pages
git checkout main
```

### 3. GitHub Secrets (For CI/CD)

Go to **Settings → Secrets and Variables → Actions** and add:

```
VERCEL_TOKEN=<your_vercel_token>
HEROKU_API_KEY=<your_heroku_api_key>
HEROKU_APP_NAME=fuelflow-api
MONGODB_URI=<your_mongodb_uri>
JWT_ACCESS_SECRET=<strong_random_secret>
JWT_REFRESH_SECRET=<strong_random_secret>
SMTP_USER=<your_email>
SMTP_PASS=<your_app_password>
```

---

## Vercel (Frontend)

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
cd client
vercel link
```

### 2. Configure Build Settings

Create `vercel.json` in root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "status": 200
    }
  ]
}
```

### 3. Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://fuelflow-api.herokuapp.com/api
VITE_APP_NAME=FuelFlow
VITE_APP_VERSION=1.0.0
```

### 4. Deploy Frontend

```bash
cd client
vercel --prod
```

---

## Heroku (Backend)

### 1. Create Heroku App

```bash
# Login to Heroku
heroku login

# Create app
heroku create fuelflow-api
heroku apps:rename fuelflow-api

# Add buildpacks
heroku buildpacks:add heroku/nodejs
```

### 2. Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_ACCESS_SECRET=<strong_secret>
heroku config:set JWT_REFRESH_SECRET=<strong_secret>
heroku config:set APP_BASE_URL=https://fuelflow.vercel.app
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=<your_email>
heroku config:set SMTP_PASS=<your_app_password>
heroku config:set SMTP_FROM="FuelFlow <your_email>"
```

### 3. Create Procfile

In server root:

```
web: npm start
worker: npm run seed
```

### 4. Deploy Backend

```bash
cd server

# Create heroku.yml
cat > heroku.yml << EOF
build:
  languages:
    - nodejs
  buildpacks:
    - heroku/nodejs
run:
  web: npm start
  worker: npm run seed
EOF

# Deploy
git push heroku main
```

---

## MongoDB Atlas

### 1. Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create organization → Create project → Create cluster
3. Choose **M0 Free Tier** for testing, **M2+** for production
4. Create database user with strong password
5. Whitelist all IPs (0.0.0.0/0) for development, specific IPs for production

### 2. Get Connection String

```
mongodb+srv://username:password@cluster.mongodb.net/fuelflow?retryWrites=true&w=majority
```

### 3. Enable Backups

- Settings → Backup & Restore → Configure Backup
- Daily snapshots
- Retention: 30 days

### 4. Enable Monitoring

- Monitoring → Real-time Performance
- Set up alerts

---

## Environment Variables

### Production (.env)

```
# Server
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fuelflow

# JWT
JWT_ACCESS_SECRET=use-a-very-strong-random-string-min-32-chars
JWT_REFRESH_SECRET=another-very-strong-random-string-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API
API_BASE_URL=https://fuelflow-api.herokuapp.com
APP_BASE_URL=https://fuelflow.vercel.app
FRONTEND_URL=https://fuelflow.vercel.app

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM=FuelFlow <your_email@gmail.com>

# CORS
CORS_ORIGIN=https://fuelflow.vercel.app

# Security
SESSION_SECRET=strong-session-secret
```

**Generate Strong Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Test frontend
curl https://fuelflow.vercel.app

# Test backend API
curl https://fuelflow-api.herokuapp.com/health

# Test database connection
curl https://fuelflow-api.herokuapp.com/api/prices/current
```

### 2. Load Demo Data

```bash
# SSH into Heroku
heroku ps:exec -a fuelflow-api

# Run seed script
npm run seed
```

### 3. Test Login

Use credentials from [README](../README.md#test-credentials):
- Email: admin@fuelflow.com
- Password: password123

### 4. Check Performance

- [Vercel Deployment Preview](https://vercel.com/dashboard)
- [Heroku Logs](https://dashboard.heroku.com/apps/fuelflow-api/logs)
- [MongoDB Atlas Metrics](https://cloud.mongodb.com/)

---

## Monitoring

### Heroku Monitoring

```bash
# View logs
heroku logs -a fuelflow-api --tail

# Monitor app status
heroku dyno:type -a fuelflow-api

# Check metrics
heroku metrics -a fuelflow-api
```

### MongoDB Monitoring

- Atlas Dashboard → Monitoring
- Monitor memory usage, operations/sec, network
- Set up alerts for critical metrics

### Vercel Monitoring

- Dashboard → Analytics
- Monitor build times, response times, error rates

---

## Database Backup

### Automated Backups
MongoDB Atlas provides:
- Daily snapshots (retained 30 days)
- Hourly snapshots (retained 7 days)
- Point-in-time restore

### Manual Backup
```bash
# Dump database
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/fuelflow"

# Restore database
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/fuelflow" ./dump
```

---

## Security Checklist

### Pre-Production
- [ ] Change all default credentials
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS everywhere
- [ ] Set up CORS properly
- [ ] Configure rate limiting
- [ ] Enable database backups
- [ ] Set up monitoring & alerts
- [ ] Test error handling
- [ ] Verify email service
- [ ] Test password reset flow

### Production
- [ ] Enable production logging
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets
- [ ] Enable compression
- [ ] Set security headers
- [ ] Monitor database performance
- [ ] Regular security audits
- [ ] Disaster recovery plan

---

## Troubleshooting

### Vercel Deployment Issues

**Build fails:**
```bash
# Check build logs
vercel logs --follow

# Rebuild
vercel --prod --force
```

**API connection issues:**
- Verify API URL in environment variables
- Check CORS settings on backend
- Test API directly with curl

### Heroku Deployment Issues

**App crashes:**
```bash
# Check logs
heroku logs -a fuelflow-api --tail

# Restart app
heroku restart -a fuelflow-api

# Check dyno type
heroku dyno:type -a fuelflow-api
```

**Database issues:**
- Verify MongoDB URI
- Check whitelist IP
- Test connection locally

**Email not sending:**
- Verify SMTP credentials
- Enable "Less secure app access" in Gmail
- Generate app-specific password
- Check email logs in application

### MongoDB Issues

**Connection timeout:**
```bash
# Test connection
mongo "mongodb+srv://user:pass@cluster.mongodb.net/fuelflow"
```

**Slow queries:**
- Check indexes in MongoDB Atlas
- Optimize query patterns
- Monitor slow query log

---

## Scaling

### Increase Heroku Dyno
```bash
heroku dyno:upgrade web=standard-2x -a fuelflow-api
```

### MongoDB Tier Upgrade
1. Atlas Dashboard → Cluster Settings
2. Change tier (M2 → M5 → M10, etc.)
3. Choose backup window

### CDN Configuration
- Set up Cloudflare for frontend
- Cache static assets (images, CSS, JS)
- Enable GZIP compression

---

## Rolling Back

```bash
# Vercel rollback
vercel rollback

# Heroku rollback
heroku releases -a fuelflow-api
heroku releases:rollback v10 -a fuelflow-api
```

---

## Support

For issues:
1. Check Vercel/Heroku logs
2. Check MongoDB Atlas metrics
3. Test locally with same environment
4. Open GitHub issue with error logs

---

## Next Steps

After successful deployment:

1. **Enable SSL/TLS** - Automatic on Vercel & Heroku
2. **Set up analytics** - Vercel provides built-in analytics
3. **Configure monitoring** - Set up alerts for errors
4. **Plan scaling** - Monitor usage and scale accordingly
5. **Schedule backups** - Ensure regular database backups
6. **Document process** - Keep deployment docs updated

---

Last Updated: January 2024
