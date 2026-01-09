# 📚 FuelFlow Installation & Setup Guide

Complete step-by-step guide to set up and run FuelFlow locally or deploy to production.

---

## 🎯 Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/fuelflow.git
cd fuelflow
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env  # Configure MongoDB URI and SMTP
npm run seed          # Load 6 months of demo data
npm run dev           # Start server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev           # Start frontend on http://localhost:5173
```

### 4. Login
```
Email: admin@fuelflow.com
Password: password123
```

---

## 📋 System Requirements

### Development Environment
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **RAM**: 4GB minimum
- **Disk Space**: 2GB
- **OS**: Windows, macOS, or Linux

### Production Environment
- Same as development
- Plus MongoDB Atlas account
- Plus Vercel account (for frontend)
- Plus Heroku account (for backend)

---

## 🔧 Detailed Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/fuelflow.git
cd fuelflow
```

### Step 2: Backend Configuration

**2.1 Install Dependencies**
```bash
cd server
npm install
```

**2.2 Create Environment File**
```bash
cp .env.example .env
```

**2.3 Edit .env with Your Credentials**
```env
# Server
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# MongoDB (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fuelflow

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# API Configuration
API_BASE_URL=http://localhost:5000
APP_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM=FuelFlow <your_email@gmail.com>

# CORS
CORS_ORIGIN=http://localhost:3000
```

**2.4 Create MongoDB Database**

Option A: **MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account
3. Create cluster (M0 Free Tier for development)
4. Create database user with strong password
5. Whitelist your IP (0.0.0.0/0 for development)
6. Copy connection string
7. Replace username:password in .env

Option B: **Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use local URI: `mongodb://localhost:27017/fuelflow`

**2.5 Get Gmail App Password**
1. Enable 2-Factor Authentication on Gmail
2. Go to [Security Settings](https://myaccount.google.com/apppasswords)
3. Select Mail & Windows Device
4. Copy generated password
5. Paste in `SMTP_PASS` in .env

**2.6 Load Demo Data**
```bash
npm run seed
```

Output should show:
```
✅ MongoDB Connected
🗑️  Clearing database...
🌱 Seeding database...
✅ Created 360+ sales
✅ Created 180+ refill orders
✅ Created 600+ attendance records
✅ Created 30 payroll records
✅ Created 500+ shifts
```

**2.7 Start Backend**
```bash
npm run dev
```

Expected output:
```
✅ MongoDB Connected
✅ Server running on port 5000
✅ API available at http://localhost:5000
```

### Step 3: Frontend Configuration

**3.1 Install Dependencies**
```bash
cd ../client
npm install
```

**3.2 Create Environment File (Optional)**
```bash
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=FuelFlow
VITE_APP_VERSION=1.0.0
EOF
```

**3.3 Start Development Server**
```bash
npm run dev
```

Expected output:
```
  VITE v7.2.4  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### Step 4: Access Application

1. Open browser: `http://localhost:5173`
2. Login with admin credentials:
   - Email: `admin@fuelflow.com`
   - Password: `password123`

---

## 🧪 Testing Features

### Admin Dashboard
1. Login as admin
2. View all pumps
3. Check analytics
4. Manage employees

### Manager Portal
1. Login as: john.manager@fuelflow.com / password123
2. View assigned pump
3. Check sales data
4. Review payroll

### Cashier POS
1. Login as: alice.cashier@fuelflow.com / password123
2. Create sample sale
3. View receipt

### Employee Portal
1. Login as: david.employee@fuelflow.com / password123
2. View own attendance
3. Check payroll
4. See schedule

---

## 🚀 Building for Production

### Frontend Build
```bash
cd client
npm run build      # Creates optimized dist folder
npm run preview    # Preview production build locally
```

### Backend Production Ready
```bash
cd server
npm run start      # Runs with npm start (for Heroku)
```

---

## 🔍 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:**
1. Verify MongoDB URI in .env
2. Check MongoDB is running
3. Whitelist your IP in MongoDB Atlas
4. Test with: `mongo "mongodb+srv://..."`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Find process on port 5000
lsof -i :5000        # macOS/Linux
netstat -ano | grep 5000  # Windows

# Kill process
kill -9 <PID>        # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=5001 npm run dev
```

### Email Not Sending
**Solution:**
1. Enable 2FA on Gmail
2. Generate app-specific password
3. Use correct SMTP credentials
4. Check "Less secure app access" setting

### Demo Data Not Loading
```bash
# Clear database and reseed
npm run seed

# Or manually
node scripts/seed.js
```

### Frontend API Errors
**Solution:**
1. Verify backend is running on port 5000
2. Check `VITE_API_URL` environment variable
3. Verify CORS settings in backend
4. Check browser console for errors

### Git Issues
```bash
# Update remotes
git remote -v

# Set origin
git remote set-url origin https://github.com/yourusername/fuelflow.git

# Push to GitHub
git push -u origin main
```

---

## 📦 Dependencies Reference

### Backend Stack
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email service
- **Zod**: Validation
- **CORS**: Cross-origin support

### Frontend Stack
- **React**: UI library
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **Framer Motion**: Animations
- **Recharts**: Charts
- **React Router**: Navigation
- **Axios**: HTTP client

---

## 🔐 Security Setup

### Generate Secure Secrets
```bash
# Generate 32-character random hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Change Default Credentials
```bash
# After first login, change admin password
1. Login to admin account
2. Go to Settings
3. Change Password
4. Create new admin user
5. Disable demo account
```

### Enable HTTPS
- For local: Use `http` (default)
- For production: Use `https` (Vercel & Heroku provide)

---

## 📊 Verify Installation

Run health checks:

```bash
# Test backend
curl http://localhost:5000/health

# Test API
curl http://localhost:5000/api/prices/current

# Test frontend
curl http://localhost:5173

# Test database
npm run seed
```

---

## 🔄 Updating

### Update Dependencies
```bash
# Backend
cd server
npm update
npm audit fix

# Frontend
cd ../client
npm update
npm audit fix
```

### Pull Latest Changes
```bash
git pull origin main
npm install
npm run seed  # Reseed if schema changes
```

---

## 🐳 Docker Setup (Optional)

### Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5000 3000
CMD ["npm", "start"]
```

### Build & Run
```bash
docker build -t fuelflow .
docker run -p 5000:5000 -p 3000:3000 \
  -e MONGODB_URI=... \
  fuelflow
```

---

## 📞 Support

### Resources
- [Official Documentation](../README.md)
- [API Reference](../docs/API.md)
- [GitHub Issues](https://github.com/yourusername/fuelflow/issues)

### Common Issues
1. Check MongoDB connection
2. Verify all environment variables
3. Clear node_modules and reinstall
4. Check browser console for errors
5. Review server logs

---

## ✅ Checklist

- [ ] Node.js v18+ installed
- [ ] MongoDB account created
- [ ] Repository cloned
- [ ] .env files created
- [ ] Dependencies installed
- [ ] Demo data seeded
- [ ] Backend running on 5000
- [ ] Frontend running on 5173
- [ ] Can login with test credentials
- [ ] Admin dashboard loads
- [ ] Sales data visible
- [ ] Payroll showing
- [ ] Reports working

---

## Next Steps

After successful setup:

1. **Explore Features**
   - Test each role (Admin, Manager, Cashier)
   - Create sample data
   - Test email notifications

2. **Customize**
   - Change company name
   - Update colors/branding
   - Add more users

3. **Deploy**
   - Follow [DEPLOYMENT.md](../DEPLOYMENT.md)
   - Set up GitHub Actions
   - Deploy to Vercel & Heroku

4. **Monitor**
   - Set up logging
   - Monitor database
   - Check performance

---

Last Updated: January 2024
