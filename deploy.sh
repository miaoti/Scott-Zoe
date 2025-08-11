#!/bin/bash

# Deployment script for Railway
# This script can be used as a reference or for manual deployment

echo "🚀 Couple Website Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "spring-backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Project structure verified"

# Build frontend
echo "🔨 Building frontend..."
cd client
npm ci
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend build successful"
cd ..

# Build backend
echo "🔨 Building backend..."
cd spring-backend
chmod +x mvnw
./mvnw clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
echo "✅ Backend build successful"
cd ..

echo "🎉 All builds completed successfully!"
echo ""
echo "📋 Next steps for Railway deployment:"
echo "1. Push these changes to your Git repository"
echo "2. In Railway dashboard, create two services:"
echo "   - Backend service: Set root directory to 'spring-backend'"
echo "   - Frontend service: Set root directory to 'client'"
echo "3. Add PostgreSQL database to your Railway project"
echo "4. Set JWT_SECRET environment variable for backend service"
echo "5. Railway will automatically handle the rest!"
