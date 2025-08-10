# Railway Deployment Guide

## Overview
This project is configured for unified deployment on Railway with both React frontend and Spring Boot backend.

## Project Structure
```
├── client/                 # React frontend
│   ├── railway.toml       # Frontend Railway config
│   └── ...
├── spring-backend/        # Spring Boot backend
│   ├── railway.toml       # Backend Railway config
│   └── ...
└── package.json          # Root package.json for monorepo
```

## Deployment Steps

1. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway will auto-detect the monorepo structure

2. **Deploy Backend Service**
   - Railway will create a service for `spring-backend/`
   - Add PostgreSQL database addon
   - Set environment variables:
     - `JWT_SECRET`: Your JWT secret key
     - `CORS_ORIGINS`: Will be auto-set to frontend domain

3. **Deploy Frontend Service**
   - Railway will create a service for `client/`
   - Environment variables are auto-configured
   - `VITE_API_URL` points to backend service

4. **Database Setup**
   - PostgreSQL is automatically provisioned
   - Connection URL is injected as `DATABASE_URL`
   - Spring Boot will auto-create tables

## Environment Variables

### Backend (Spring Boot)
- `SPRING_PROFILES_ACTIVE=production`
- `SERVER_PORT=$PORT` (auto-set by Railway)
- `DATABASE_URL` (auto-set by PostgreSQL addon)
- `JWT_SECRET` (set manually)
- `CORS_ORIGINS` (auto-set to frontend domain)

### Frontend (React)
- `VITE_API_URL` (auto-set to backend domain)
- `NODE_ENV=production`

## Features
- ✅ Unified monorepo deployment
- ✅ Auto-scaling
- ✅ Built-in PostgreSQL
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Environment variable management
- ✅ Automatic deployments from Git

## Free Tier Limits
- $5/month in usage credits
- Suitable for development and small projects
- Automatic sleep after inactivity

## Support
For issues, check Railway documentation or contact support through their platform.