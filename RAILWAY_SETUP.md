# 🚀 Quick Railway Setup Guide

## The Problem
Railway is trying to deploy the root directory instead of detecting individual services.

## The Solution
Manually create two separate services in Railway, each pointing to a different directory.

## Step-by-Step Instructions

### 1. Create Backend Service
```
1. Go to Railway dashboard
2. Click "New Service"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. ⚠️  IMPORTANT: Set "Root Directory" to: spring-backend
6. Click "Deploy"
```

### 2. Create Frontend Service
```
1. In the SAME Railway project, click "New Service" again
2. Select "Deploy from GitHub repo" 
3. Choose the SAME repository
4. ⚠️  IMPORTANT: Set "Root Directory" to: client
5. Click "Deploy"
```

### 3. Add Database
```
1. Click "New Service" → "Database" → "PostgreSQL"
2. Railway automatically connects it to your backend
```

### 4. Set Environment Variables
```
Backend service only:
- JWT_SECRET = "your-secure-random-string-here"

Frontend variables are automatic!
```

### 5. Wait for Deployment
```
- Backend will build with: ./mvnw clean package -DskipTests
- Frontend will build with: npm ci && npm run build
- Both should deploy successfully!
```

## Expected Result
- ✅ Backend service running on: `https://your-backend.railway.app`
- ✅ Frontend service running on: `https://your-frontend.railway.app`
- ✅ Database connected automatically
- ✅ CORS configured automatically between services

## If You Get Errors
1. Check the build logs in each service
2. Make sure "Root Directory" is set correctly
3. Verify JWT_SECRET is set for backend service
4. Both services should be in the same Railway project

## Test Your Deployment
1. Visit your frontend URL
2. Try logging in
3. Upload a photo
4. Check if everything works!

---
**Need help?** Check the full deployment guide in `RAILWAY_DEPLOYMENT.md`
