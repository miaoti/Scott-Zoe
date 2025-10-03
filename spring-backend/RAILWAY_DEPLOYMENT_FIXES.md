# Railway Deployment Fixes for Spring Boot Application

## Issue
The Spring Boot application was failing to start on Railway with the error:
```
UnsatisfiedDependencyException: Cannot resolve reference to bean 'jpaSharedEM_entityManagerFactory'
```

## Root Cause
The issue was caused by:
1. Railway not properly setting the `production` profile
2. Incorrect parsing of Railway's `DATABASE_URL` format
3. Missing Railway-specific configuration handling

## Fixes Implemented

### 1. Railway Configuration Class (`RailwayConfig.java`)
- Created a custom configuration class that automatically detects Railway environment
- Parses Railway's `DATABASE_URL` format and converts it to proper JDBC format
- Forces `production` profile activation on Railway
- Handles SSL requirements for Railway PostgreSQL

### 2. Spring Factories Configuration
- Added `META-INF/spring.factories` to ensure Railway configuration loads early
- Registers the `RailwayConfig` as an `ApplicationListener`

### 3. Updated Application Configuration
- Modified `application.yml` to handle Railway's embedded credentials in `DATABASE_URL`
- Set empty defaults for username/password since Railway provides them in the URL
- Improved profile activation with environment variable support

### 4. Railway Deployment Configuration
- Created `railway.json` with proper startup command and health checks
- Added `Procfile` for alternative deployment method
- Set memory limits and proper JVM arguments

### 5. JPA Configuration Improvements
- Created dedicated `JpaConfig.java` class for explicit JPA configuration
- Moved JPA annotations from main application class to prevent conflicts
- Ensured proper entity manager factory creation

## Files Modified/Created

### Created:
- `src/main/java/com/couplewebsite/config/RailwayConfig.java`
- `src/main/java/com/couplewebsite/config/JpaConfig.java`
- `src/main/resources/META-INF/spring.factories`
- `railway.json`
- `Procfile`

### Modified:
- `src/main/resources/application.yml`
- `src/main/java/com/couplewebsite/CoupleWebsiteApplication.java`

## Verification
- Application starts successfully locally
- Entity manager factory is properly created
- Database initialization completes successfully
- All JPA repositories are properly configured

## Deployment Instructions
1. Ensure Railway PostgreSQL service is connected
2. Set `DATABASE_URL` environment variable (automatically provided by Railway)
3. Deploy the application - it will automatically detect Railway environment
4. The application will use the `production` profile and connect to PostgreSQL

## Environment Variables Required on Railway
- `DATABASE_URL` (automatically provided by Railway PostgreSQL service)
- `PORT` (automatically provided by Railway)
- Optional: `JWT_SECRET`, `CORS_ORIGINS` for production security