# Docker Setup Guide

This guide explains how to run the Scott-Zoe couple website using Docker with all services (frontend, backend, and database).

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- At least 4GB of available RAM

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Scott-Zoe
   ```

2. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432 (PostgreSQL)

## Services Overview

### 🗄️ Database (PostgreSQL)
- **Container**: `couple-website-db`
- **Port**: 5432
- **Database**: `couple_website`
- **User**: `couple_user`
- **Password**: `couple_password`
- **Data Volume**: `postgres_data` (persistent storage)

### 🚀 Backend (Spring Boot)
- **Container**: `couple-website-backend`
- **Port**: 8080
- **Health Check**: http://localhost:8080/actuator/health
- **Upload Volume**: `uploads_data` (persistent file storage)

### 🌐 Frontend (React + Nginx)
- **Container**: `couple-website-frontend`
- **Port**: 3000
- **Serves**: React application and proxies API calls

## Docker Commands

### Start Services
```bash
# Start all services in background
docker-compose up -d

# Start with build (recommended for first run or after changes)
docker-compose up --build

# Start specific service
docker-compose up backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data)
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f
```

### Check Service Status
```bash
# View running containers
docker-compose ps

# Check health status
docker-compose exec backend curl http://localhost:8080/actuator/health
```

## Development Workflow

### Making Code Changes

1. **Frontend Changes**:
   ```bash
   # Rebuild only frontend
   docker-compose build frontend
   docker-compose up -d frontend
   ```

2. **Backend Changes**:
   ```bash
   # Rebuild only backend
   docker-compose build backend
   docker-compose up -d backend
   ```

3. **Full Rebuild**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Database Management

1. **Connect to Database**:
   ```bash
   docker-compose exec db psql -U couple_user -d couple_website
   ```

2. **Backup Database**:
   ```bash
   docker-compose exec db pg_dump -U couple_user couple_website > backup.sql
   ```

3. **Restore Database**:
   ```bash
   docker-compose exec -T db psql -U couple_user couple_website < backup.sql
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**:
   ```bash
   # Check database health
   docker-compose logs db
   # Restart database
   docker-compose restart db
   ```

3. **Build Failures**:
   ```bash
   # Clean build cache
   docker system prune -a
   # Rebuild from scratch
   docker-compose build --no-cache
   ```

4. **Permission Issues** (Linux/Mac):
   ```bash
   # Fix upload directory permissions
   sudo chown -R $USER:$USER uploads
   ```

### Health Checks

- **Backend Health**: http://localhost:8080/actuator/health
- **Database Health**: `docker-compose exec db pg_isready -U couple_user`
- **Frontend Health**: http://localhost:3000 (should load React app)

## Environment Variables

Key environment variables in `docker-compose.yml`:

- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGINS`: Allowed CORS origins

## Production Considerations

⚠️ **Important**: This setup is for development. For production:

1. Change default passwords
2. Use environment files for secrets
3. Configure proper SSL/TLS
4. Set up proper backup strategies
5. Configure monitoring and logging
6. Use production-grade database settings

## Data Persistence

- **Database Data**: Stored in `postgres_data` volume
- **Uploaded Files**: Stored in `uploads_data` volume
- **Volumes persist** between container restarts
- **To reset data**: `docker-compose down -v`

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify all services are healthy: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Full reset: `docker-compose down -v && docker-compose up --build`