# Railway Deployment Guide

## Overview
This project is configured for deployment on Railway as a monorepo with separate React frontend and Spring Boot backend services.

## Project Structure
```
├── client/                 # React frontend (Vite)
│   ├── railway.toml       # Frontend Railway config
│   ├── package.json       # Frontend dependencies
│   └── src/               # React source code
├── spring-backend/        # Spring Boot backend
│   ├── railway.toml       # Backend Railway config
│   ├── pom.xml           # Maven configuration
│   ├── mvnw              # Maven wrapper (Unix)
│   ├── mvnw.cmd          # Maven wrapper (Windows)
│   └── src/              # Java source code
├── package.json          # Root package.json (development only)
├── railway.toml          # Root config (not for deployment)
└── .railwayignore        # Files to ignore during deployment
```

## Fixed Issues
- ✅ Added Maven wrapper (`mvnw`) to eliminate "mvn: not found" errors
- ✅ Configured proper monorepo structure for Railway
- ✅ Updated build commands to use Maven wrapper
- ✅ Added memory optimization for Java application
- ✅ Fixed CORS configuration with proper HTTPS URLs

## Deployment Steps

1. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway will auto-detect the monorepo structure and create separate services

2. **Backend Service (spring-backend/)**
   - Railway automatically detects Java/Maven project
   - Uses Maven wrapper for building: `./mvnw clean package -DskipTests`
   - Starts with: `java -Xmx512m -Dserver.port=$PORT -jar target/*.jar`
   - Add PostgreSQL database addon
   - Set environment variables:
     - `JWT_SECRET`: Your JWT secret key (generate a secure random string)

3. **Frontend Service (client/)**
   - Railway automatically detects Node.js/Vite project
   - Builds with: `npm ci && npm run build`
   - Starts with: `npm run preview`
   - Environment variables are auto-configured:
     - `VITE_API_URL`: Points to backend service URL

4. **Database Setup**
   - Add PostgreSQL addon to your Railway project
   - Connection URL is automatically injected as `DATABASE_URL`
   - Spring Boot will auto-create tables on first run

## Environment Variables

### Backend Service (spring-backend)
- `SPRING_PROFILES_ACTIVE=production` (auto-set)
- `SERVER_PORT=$PORT` (auto-set by Railway)
- `DATABASE_URL` (auto-set by PostgreSQL addon)
- `JWT_SECRET` (set manually - use a secure random string)
- `CORS_ORIGINS` (auto-set to frontend domain)
- `JAVA_OPTS="-Xmx512m -XX:+UseContainerSupport"` (auto-set for memory optimization)

### Frontend Service (client)
- `VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}` (auto-set)
- `NODE_ENV=production` (auto-set)

## Troubleshooting

### "mvn: not found" Error
- ✅ **Fixed**: Now uses Maven wrapper (`./mvnw`) instead of system Maven
- The Maven wrapper is included in the repository and downloads Maven automatically

### Memory Issues
- ✅ **Fixed**: Java application now runs with `-Xmx512m` memory limit
- Uses container-aware JVM settings for Railway's environment

### CORS Issues
- ✅ **Fixed**: Frontend URL now uses `https://` prefix for proper CORS configuration
- Backend automatically allows requests from the frontend domain

## IMPORTANT: Manual Deployment Required

Railway is detecting the root directory instead of individual services. Follow these steps:

### Step 1: Create Backend Service
1. In Railway dashboard, click "**New Service**"
2. Select "**Deploy from GitHub repo**"
3. Choose your repository
4. **IMPORTANT**: Set "**Root Directory**" to `spring-backend`
5. Click "Deploy"
6. Railway will use the `spring-backend/railway.toml` configuration

### Step 2: Create Frontend Service
1. In the same Railway project, click "**New Service**" again
2. Select "**Deploy from GitHub repo**"
3. Choose the same repository
4. **IMPORTANT**: Set "**Root Directory**" to `client`
5. Click "Deploy"
6. Railway will use the `client/railway.toml` configuration

### Step 3: Add Database
1. Click "**New Service**" → "**Database**" → "**PostgreSQL**"
2. Railway will automatically inject `DATABASE_URL` into backend service

### Step 4: Set Environment Variables
1. Go to backend service → "**Variables**" tab
2. Add: `JWT_SECRET` = `your-secure-random-string-here`
3. Frontend variables are automatically configured

## Features
- ✅ Monorepo deployment with separate services
- ✅ Maven wrapper for reliable Java builds
- ✅ Memory-optimized Java runtime
- ✅ Auto-scaling
- ✅ Built-in PostgreSQL
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Environment variable management
- ✅ Automatic deployments from Git
- ✅ Health checks for both services

## Free Tier Limits
- $5/month in usage credits
- Suitable for development and small projects
- Automatic sleep after inactivity
- Both services will sleep together to save resources

## Support
For issues, check Railway documentation or contact support through their platform.