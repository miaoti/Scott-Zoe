#!/bin/bash

# Railway Deployment Script for Couple Website
# This script deploys the application using Docker Compose

set -e

echo "🚀 Starting Railway deployment for Couple Website..."

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Error: POSTGRES_PASSWORD environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is required"
    exit 1
fi

# Set default values for environment variables
export POSTGRES_DB=${POSTGRES_DB:-couple_website}
export POSTGRES_USER=${POSTGRES_USER:-couple_user}
export PORT=${PORT:-8080}
export CORS_ORIGINS=${CORS_ORIGINS:-*}

echo "📦 Building and starting services with Docker Compose..."

# Use the Railway-specific docker-compose file
docker-compose -f docker-compose.railway.yml up --build -d

echo "⏳ Waiting for services to be healthy..."

# Wait for database to be ready
echo "🔍 Checking database health..."
until docker-compose -f docker-compose.railway.yml exec -T db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    echo "Waiting for database..."
    sleep 2
done

echo "🔍 Checking application health..."
# Wait for application to be ready
until curl -f http://localhost:$PORT/actuator/health > /dev/null 2>&1; do
    echo "Waiting for application..."
    sleep 5
done

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running on port $PORT"
echo "📊 Health check: http://localhost:$PORT/actuator/health"
echo "💾 Database data is persisted in Docker volume 'postgres_data'"
echo "📁 Upload files are persisted in Docker volume 'uploads_data'"

# Show running containers
echo "\n📋 Running containers:"
docker-compose -f docker-compose.railway.yml ps

echo "\n🎉 Couple Website is now live on Railway!"