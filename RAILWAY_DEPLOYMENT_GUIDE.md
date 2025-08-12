# Railway Deployment Guide for Couple Website

This guide explains how to deploy the Couple Website application to Railway using Docker with persistent data storage.

## 🚀 Quick Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   ```
3. **Docker**: Ensure Docker is installed and running

### Environment Variables Required

Before deployment, you need to set these environment variables in Railway:

| Variable | Description | Example |
|----------|-------------|----------|
| `POSTGRES_PASSWORD` | Database password | `your-secure-password` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `RAILWAY_PUBLIC_DOMAIN` | Your Railway domain | `your-app.railway.app` |

### Step-by-Step Deployment

#### 1. Login to Railway
```bash
railway login
```

#### 2. Create a New Project
```bash
railway new
```

#### 3. Set Environment Variables
```bash
railway variables set POSTGRES_PASSWORD=your-secure-password
railway variables set JWT_SECRET=your-super-secret-jwt-key
```

#### 4. Deploy the Application
```bash
railway up
```

## 🐳 Docker Compose Deployment

### Local Testing with Railway Configuration

Before deploying to Railway, you can test the production configuration locally:

#### Windows:
```cmd
set POSTGRES_PASSWORD=your-secure-password
set JWT_SECRET=your-super-secret-jwt-key
deploy-railway.cmd
```

#### Linux/Mac:
```bash
export POSTGRES_PASSWORD=your-secure-password
export JWT_SECRET=your-super-secret-jwt-key
./deploy-railway.sh
```

### Railway Docker Deployment

The application uses a multi-service Docker setup:

1. **PostgreSQL Database** (`db` service)
   - Persistent data storage with named volumes
   - Health checks for reliability
   - Automatic restart policies

2. **Application Server** (`app` service)
   - Combined Spring Boot backend + React frontend
   - Persistent file uploads
   - Health monitoring

## 💾 Data Persistence

### Database Persistence
- **Volume**: `postgres_data`
- **Mount Point**: `/var/lib/postgresql/data`
- **Backup**: Automatic PostgreSQL data persistence

### File Upload Persistence
- **Volume**: `uploads_data`
- **Mount Point**: `/app/uploads`
- **Content**: User uploaded photos and files

### Important Notes

⚠️ **Data Safety**: 
- Named Docker volumes ensure data persists across container restarts
- Database data will **never be lost** during deployments
- Upload files are preserved between updates

## 🔧 Configuration Files

### Key Files for Railway Deployment

1. **`railway.toml`** - Railway configuration
2. **`docker-compose.railway.yml`** - Production Docker Compose
3. **`Dockerfile`** - Multi-stage build for app
4. **`deploy-railway.sh`** - Linux/Mac deployment script
5. **`deploy-railway.cmd`** - Windows deployment script

### Environment Variables in Production

```yaml
# Automatically configured by Railway
SPRING_PROFILES_ACTIVE=production
POSTGRES_DB=couple_website
POSTGRES_USER=couple_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
CORS_ORIGINS=https://${RAILWAY_PUBLIC_DOMAIN}
PORT=8080
UPLOAD_DIR=/app/uploads
```

## 🏥 Health Monitoring

### Application Health Check
- **Endpoint**: `/actuator/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts

### Database Health Check
- **Command**: `pg_isready`
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Retries**: 5 attempts

## 🔄 Deployment Updates

### Zero-Downtime Updates

1. **Code Changes**: Push to your repository
2. **Railway Auto-Deploy**: Railway will automatically rebuild and deploy
3. **Data Preservation**: All data remains intact during updates

### Manual Deployment

```bash
# Update your code
git add .
git commit -m "Update application"
git push

# Deploy to Railway
railway up
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `POSTGRES_PASSWORD` is set correctly
   - Verify database service is healthy

2. **Application Won't Start**
   - Check `JWT_SECRET` is configured
   - Verify all environment variables are set

3. **File Uploads Not Working**
   - Ensure `uploads_data` volume is mounted
   - Check `UPLOAD_DIR` environment variable

### Logs and Debugging

```bash
# View application logs
railway logs

# View specific service logs
docker-compose -f docker-compose.railway.yml logs app
docker-compose -f docker-compose.railway.yml logs db
```

## 📊 Monitoring

### Application Metrics
- Health endpoint: `https://your-app.railway.app/actuator/health`
- Application status: Railway dashboard
- Resource usage: Railway metrics

### Database Monitoring
- Connection status: Health checks
- Data persistence: Volume status
- Performance: Railway database metrics

## 🔐 Security

### Production Security Features

1. **Environment Variables**: Sensitive data stored securely
2. **CORS Configuration**: Restricted to your domain
3. **JWT Authentication**: Secure user sessions
4. **Database Security**: Isolated network access
5. **Non-root User**: Application runs with limited privileges

## 📈 Scaling

### Horizontal Scaling
- Railway supports automatic scaling
- Database connections are pooled
- Stateless application design

### Resource Limits
- Memory: 512MB default (configurable)
- CPU: Shared resources
- Storage: Persistent volumes

---

## 🎉 Success!

Once deployed, your Couple Website will be available at:
- **URL**: `https://your-app.railway.app`
- **Health**: `https://your-app.railway.app/actuator/health`
- **Features**: All features including real-time "days together" counter and Apple-style UI

**Data Guarantee**: Your precious memories and relationship data are safe with persistent Docker volumes! 💕