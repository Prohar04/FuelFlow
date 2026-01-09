# 🚀 GitHub Setup & Push Guide

Complete step-by-step guide to push FuelFlow to GitHub and enable CI/CD.

---

## Step 1: Create GitHub Repository

### 1.1 Create Repository
1. Go to [github.com/new](https://github.com/new)
2. Fill in details:
   - **Repository name**: `fuelflow`
   - **Description**: Petrol pump management system with RBAC, payroll, and inventory
   - **Visibility**: Public (for portfolio/collaboration)
   - **Initialize with**: None (we already have commits)

3. Click "Create repository"

### 1.2 Note Your Repository URL
- Example: `https://github.com/yourusername/fuelflow.git`
- Or SSH: `git@github.com:yourusername/fuelflow.git`

---

## Step 2: Configure Local Repository

### 2.1 Add Remote Origin
```powershell
cd d:\FuelFlow

# Add remote (HTTPS - easier setup)
git remote add origin https://github.com/yourusername/fuelflow.git

# OR for SSH (recommended if you have SSH key)
git remote add origin git@github.com:yourusername/fuelflow.git

# Verify remote
git remote -v
```

**Expected output:**
```
origin  https://github.com/yourusername/fuelflow.git (fetch)
origin  https://github.com/yourusername/fuelflow.git (push)
```

### 2.2 Set Main Branch (if needed)
```powershell
git branch -M main
```

---

## Step 3: Push to GitHub

### 3.1 Initial Push
```powershell
cd d:\FuelFlow
git push -u origin main
```

**Expected output:**
```
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
Delta compression using up to 12 threads
Compressing objects: 100% (32/32), done.
Writing objects: 100% (45/45), 2.50 MiB, done.
Total 45 (delta 15), reused 0 (delta 0), received 0
...
To github.com:yourusername/fuelflow.git
 * [new branch]      main -> main
Branch 'main' set to track remote branch 'main' from 'origin'.
```

---

## Step 4: Verify on GitHub

### 4.1 Check Repository
1. Go to `https://github.com/yourusername/fuelflow`
2. Verify you see:
   - ✅ All files (seed.js, App.css, etc.)
   - ✅ 4 documentation files (README, DEPLOYMENT, INSTALLATION, etc.)
   - ✅ Commit history (4 commits with clear messages)
   - ✅ package.json files in both client/ and server/

### 4.2 Add Repository Description
1. Go to repository settings
2. Add description: "Production-ready petrol pump management system with RBAC, payroll, inventory, and 6-month demo data"
3. Add topics: `nodejs` `react` `mongodb` `express` `fullstack` `saas` `vite`

---

## Step 5: Setup GitHub Actions Secrets

For CI/CD to work, add these secrets:

### 5.1 Access Secrets Settings
1. Go to repository Settings
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret"

### 5.2 Add Required Secrets

**For Vercel Frontend Deployment:**

```
VERCEL_TOKEN
Value: Get from https://vercel.com/account/tokens
```

```
VERCEL_ORG_ID
Value: Get from Vercel Project Settings
```

```
VERCEL_PROJECT_ID
Value: Get from Vercel Project Settings
```

**For Heroku Backend Deployment:**

```
HEROKU_API_KEY
Value: Get from https://dashboard.heroku.com/account/applications/authorizations
```

```
HEROKU_APP_NAME
Value: fuelflow-api (or your chosen name)
```

**For Email Notifications (Optional):**

```
NOTIFY_EMAIL
Value: your-email@gmail.com
```

---

## Step 6: Enable GitHub Pages (Optional)

For deployment status and documentation site:

1. Go to repository Settings
2. Scroll to "Pages"
3. Set source to "main branch" → "root"
4. Save

Your site will be available at: `https://yourusername.github.io/fuelflow`

---

## Step 7: Add README Badges

Update the README with GitHub badges at the top:

```markdown
# FuelFlow - Petrol Pump Management System

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/fuelflow)](https://github.com/yourusername/fuelflow)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.3.1-61dafb)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/mongodb-8.0+-13aa52)](https://www.mongodb.com)
[![Vercel](https://img.shields.io/badge/vercel-live-success)](https://fuelflow.vercel.app)
[![Heroku](https://img.shields.io/badge/heroku-live-success)](https://fuelflow-api.herokuapp.com)
```

---

## Step 8: Create Deployment URLs

### 8.1 Deploy Frontend to Vercel

```powershell
# Install Vercel CLI (if not already installed)
npm install -g vercel

# From client directory
cd d:\FuelFlow\client
vercel --prod

# Follow prompts:
# - Link to existing project? No (new project)
# - Project name: fuelflow
# - Framework: Vite
# - Root directory: ./
# - Build command: npm run build
# - Output directory: dist

# Note the URL: https://fuelflow.vercel.app (or similar)
```

### 8.2 Deploy Backend to Heroku

```powershell
# Install Heroku CLI (if not already installed)
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create Heroku app
cd d:\FuelFlow
heroku create fuelflow-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fuelflow
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set BCRYPT_ROUNDS=10
heroku config:set CORS_ORIGIN=https://fuelflow.vercel.app

# Push to Heroku
git push heroku main

# Load demo data
heroku run npm run seed

# Check logs
heroku logs --tail

# Note the URL: https://fuelflow-api.herokuapp.com
```

---

## Step 9: Update Environment Files

### 9.1 Update Frontend Env
Create/update `.env.production` in `client/`:

```
VITE_API_URL=https://fuelflow-api.herokuapp.com/api
VITE_APP_NAME=FuelFlow
VITE_APP_VERSION=1.0.0
```

### 9.2 Rebuild and Redeploy
```powershell
cd d:\FuelFlow\client
npm run build
vercel --prod
```

---

## Step 10: Verify Everything Works

### 10.1 Test Frontend
```
1. Open https://fuelflow.vercel.app
2. Should load without errors
3. Try login with:
   - Email: admin@fuelflow.com
   - Password: Admin@123
```

### 10.2 Test Backend
```powershell
# Test API
curl https://fuelflow-api.herokuapp.com/api/health

# Should return:
# {"message":"Server is running","timestamp":"2024-01-15T10:30:00Z"}
```

### 10.3 Check CI/CD
1. Make a small change (edit README)
2. Commit and push to GitHub
3. Go to GitHub → Actions tab
4. Watch workflow run automatically
5. Verify Vercel and Heroku both deploy

---

## Step 11: Share Your Project

### 11.1 Update README Links
In [README.md](README.md), update URLs:

```markdown
## 🚀 Live Demo
- **Frontend**: https://fuelflow.vercel.app
- **API Docs**: https://fuelflow-api.herokuapp.com/api/docs
- **GitHub**: https://github.com/yourusername/fuelflow

## 🧪 Test Credentials
Default test user (runs from seed.js):
- Email: `admin@fuelflow.com`
- Password: `Admin@123`
```

### 11.2 Create GitHub Release
1. Go to Releases → "Create new release"
2. Tag: `v1.0.0`
3. Title: "FuelFlow v1.0.0 - Production Release"
4. Description:
   ```
   ## Release Notes
   - ✅ 6-month demo data with 1000+ records
   - ✅ 15+ smooth animations
   - ✅ Complete RBAC (Admin/Manager/Cashier/Employee)
   - ✅ Automated CI/CD with GitHub Actions
   - ✅ Production deployment guides
   - ✅ Professional documentation
   
   ## Deploy
   Frontend: https://fuelflow.vercel.app
   API: https://fuelflow-api.herokuapp.com
   ```

### 11.3 Share on Social/Portfolio
- LinkedIn: Share GitHub link with accomplishments
- Twitter: Tweet about your project
- Portfolio: Link to live demo and GitHub repo

---

## Troubleshooting

### Problem: "fatal: origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/yourusername/fuelflow.git
```

### Problem: "Please use a personal access token"
On Windows with HTTPS:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Use token as password when prompted

### Problem: "Vercel deployment fails"
Check logs: `vercel logs --raw`
Common issues:
- VITE_API_URL not set
- Missing environment variables
- Node version mismatch

### Problem: "Heroku deployment fails"
```powershell
# Check logs
heroku logs --tail

# Common issues:
# - MongoDB URI not set
# - Port 5000 not listening
# - Dependencies missing from package.json
```

---

## Next Steps

1. ✅ Push to GitHub
2. ✅ Setup GitHub Actions secrets
3. ✅ Deploy to Vercel and Heroku
4. ✅ Test live deployment
5. ✅ Create GitHub release
6. ✅ Share on portfolio/social
7. 📝 Monitor logs and metrics
8. 🔄 Continue development with auto-deployment

---

## Links

- 📦 GitHub: `https://github.com/yourusername/fuelflow`
- 🌐 Frontend: `https://fuelflow.vercel.app`
- 🔌 Backend: `https://fuelflow-api.herokuapp.com`
- 📚 Docs: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🛠️ Setup: [INSTALLATION.md](INSTALLATION.md)

---

**Your project is now production-ready and deployed to GitHub! 🎉**
