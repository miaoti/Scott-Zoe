@echo off
REM Railway Deployment Script for Couple Website (Windows)
REM This script deploys the application using Docker Compose

setlocal enabledelayedexpansion

echo 🚀 Starting Railway deployment for Couple Website...

REM Check if required environment variables are set
if "%POSTGRES_PASSWORD%"=="" (
    echo ❌ Error: POSTGRES_PASSWORD environment variable is required
    exit /b 1
)

if "%JWT_SECRET%"=="" (
    echo ❌ Error: JWT_SECRET environment variable is required
    exit /b 1
)

REM Set default values for environment variables
if "%POSTGRES_DB%"=="" set POSTGRES_DB=couple_website
if "%POSTGRES_USER%"=="" set POSTGRES_USER=couple_user
if "%PORT%"=="" set PORT=8080
if "%CORS_ORIGINS%"=="" set CORS_ORIGINS=*

echo 📦 Building and starting services with Docker Compose...

REM Use the Railway-specific docker-compose file
docker-compose -f docker-compose.railway.yml up --build -d
if errorlevel 1 (
    echo ❌ Failed to start services
    exit /b 1
)

echo ⏳ Waiting for services to be healthy...

REM Wait for database to be ready
echo 🔍 Checking database health...
:wait_db
docker-compose -f docker-compose.railway.yml exec -T db pg_isready -U %POSTGRES_USER% -d %POSTGRES_DB% >nul 2>&1
if errorlevel 1 (
    echo Waiting for database...
    timeout /t 2 /nobreak >nul
    goto wait_db
)

echo 🔍 Checking application health...
REM Wait for application to be ready
:wait_app
curl -f http://localhost:%PORT%/actuator/health >nul 2>&1
if errorlevel 1 (
    echo Waiting for application...
    timeout /t 5 /nobreak >nul
    goto wait_app
)

echo ✅ Deployment completed successfully!
echo 🌐 Application is running on port %PORT%
echo 📊 Health check: http://localhost:%PORT%/actuator/health
echo 💾 Database data is persisted in Docker volume 'postgres_data'
echo 📁 Upload files are persisted in Docker volume 'uploads_data'

REM Show running containers
echo.
echo 📋 Running containers:
docker-compose -f docker-compose.railway.yml ps

echo.
echo 🎉 Couple Website is now live on Railway!

pause