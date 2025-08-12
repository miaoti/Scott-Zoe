# GitHub + Railway Deployment Guide

This guide explains how to deploy your couple website application to Railway using GitHub integration for automatic deployments.

## Overview

This setup enables:
- **Automatic deployments** when you push to GitHub
- **Environment variables** committed safely to the repository
- **Zero-downtime deployments** with health checks
- **Persistent data storage** for database and file uploads

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **Railway CLI** (optional): For manual deployments and debugging

## Setup Instructions

### 1. Connect GitHub to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the `railway.toml` configuration

### 2. Configure Environment Variables (Optional)

While the application includes default production values in `.env.production`, you can override them in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add/override any environment variables:
   - `POSTGRES_PASSWORD`: Custom database password
   - `JWT_SECRET`: Custom JWT secret key
   - `CORS_ORIGINS`: Your custom domain (Railway will auto-set this)

### 3. Database Setup

Railway will automatically provision a PostgreSQL database based on your `railway.toml` configuration.

### 4. Domain Configuration

1. Railway will provide a default domain: `https://your-app.railway.app`
2. To use a custom domain:
   - Go to "Settings" → "Domains"
   - Add your custom domain
   - Update DNS records as instructed

## Automatic Deployment

### GitHub Integration

Once connected, Railway will automatically deploy when you:
- Push to the `main` or `master` branch
- Create a pull request (for preview deployments)

### GitHub Actions (Optional)

A GitHub Actions workflow is included at `.github/workflows/railway-deploy.yml` for additional deployment control.

To use GitHub Actions:
1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add these secrets:
   - `RAILWAY_TOKEN`: Get from Railway dashboard → Account Settings → Tokens
   - `RAILWAY_SERVICE_ID`: Get from your Railway service URL

## Environment Variables Included

The following are committed to the repository in `.env.production`:

```env
# Database
POSTGRES_DB=couple_website
POSTGRES_USER=couple_user
POSTGRES_PASSWORD=couple_secure_password_2024

# Security
JWT_SECRET=couple-website-super-secret-jwt-key-for-production-2024-railway

# Application
PORT=8080
UPLOAD_DIR=/app/uploads
SPRING_PROFILES_ACTIVE=production
```

**Note**: These are default production values. For enhanced security, override sensitive values in Railway dashboard.

## Deployment Process

1. **Push to GitHub**: Commit and push your changes
2. **Automatic Build**: Railway detects the push and starts building
3. **Docker Build**: Application is built using the Dockerfile
4. **Database Migration**: Spring Boot handles database schema updates
5. **Health Check**: Railway verifies the application is healthy
6. **Live Deployment**: Traffic is routed to the new version

## Monitoring and Logs

### Railway Dashboard
- **Deployments**: View deployment history and status
- **Logs**: Real-time application and build logs
- **Metrics**: CPU, memory, and network usage
- **Health**: Application health status

### Health Check Endpoint
- URL: `https://your-app.railway.app/actuator/health`
- Returns application and database health status

## Data Persistence

### Database
- **PostgreSQL**: Fully managed by Railway
- **Backups**: Automatic daily backups
- **Scaling**: Can be upgraded as needed

### File Uploads
- **Volume Mount**: `/app/uploads` directory
- **Persistent**: Files survive deployments
- **Backup**: Consider external storage for production

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Railway build logs
   - Verify Dockerfile syntax
   - Ensure all dependencies are included

2. **Database Connection Issues**
   - Verify database environment variables
   - Check database service status in Railway
   - Review application logs for connection errors

3. **Health Check Failures**
   - Ensure `/actuator/health` endpoint is accessible
   - Check application startup logs
   - Verify port configuration (8080)

### Debugging Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# View logs
railway logs

# Connect to database
railway connect

# Run commands in Railway environment
railway run <command>
```

## Security Considerations

1. **Environment Variables**: Sensitive values can be overridden in Railway dashboard
2. **HTTPS**: Railway provides automatic HTTPS certificates
3. **Database**: PostgreSQL is isolated and managed by Railway
4. **CORS**: Configured to allow your Railway domain

## Scaling

### Vertical Scaling
- Upgrade Railway plan for more CPU/memory
- Database can be scaled independently

### Horizontal Scaling
- Railway supports multiple replicas
- Database connections are pooled
- File uploads may need external storage

## Cost Optimization

1. **Development**: Use Railway's free tier for testing
2. **Production**: Monitor usage and upgrade as needed
3. **Database**: Right-size based on actual usage
4. **Logs**: Configure log retention policies

## Next Steps

1. **Custom Domain**: Set up your production domain
2. **Monitoring**: Set up alerts and monitoring
3. **Backups**: Implement additional backup strategies
4. **CDN**: Consider CDN for static assets
5. **External Storage**: Move file uploads to cloud storage

## Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Community support
- **GitHub Issues**: Report application-specific issues

---

**Ready to deploy?** Just push your changes to GitHub and watch Railway automatically deploy your application! 🚀