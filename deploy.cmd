@echo off
REM Deployment script for Railway (Windows)
REM This script can be used as a reference or for manual deployment

echo 🚀 Couple Website Deployment Script
echo ==================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)
if not exist "client" (
    echo ❌ Error: client directory not found
    exit /b 1
)
if not exist "spring-backend" (
    echo ❌ Error: spring-backend directory not found
    exit /b 1
)

echo 📁 Project structure verified

REM Build frontend
echo 🔨 Building frontend...
cd client
call npm ci
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend build successful
cd ..

REM Build backend
echo 🔨 Building backend...
cd spring-backend
call mvnw.cmd clean package -DskipTests
if errorlevel 1 (
    echo ❌ Backend build failed
    exit /b 1
)
echo ✅ Backend build successful
cd ..

echo 🎉 All builds completed successfully!
echo.
echo 📋 Next steps for Railway deployment:
echo 1. Push these changes to your Git repository
echo 2. In Railway dashboard, create two services:
echo    - Backend service: Set root directory to 'spring-backend'
echo    - Frontend service: Set root directory to 'client'
echo 3. Add PostgreSQL database to your Railway project
echo 4. Set JWT_SECRET environment variable for backend service
echo 5. Railway will automatically handle the rest!
