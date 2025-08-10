# Couple Website - Spring Boot Backend

This is the Java Spring Boot conversion of the original Node.js/Express backend for the couple website application.

## 🚀 Features

- **Authentication**: JWT-based authentication with Spring Security
- **Photo Management**: File upload, storage, and management with categories
- **Memory Management**: CRUD operations for memories and anniversary calculations
- **Category System**: Organize photos with custom categories
- **Settings Management**: Application settings and configuration
- **Database Support**: SQLite (development) and MySQL (production)
- **File Storage**: Local file storage with proper cleanup
- **Error Handling**: Global exception handling and validation
- **CORS Support**: Configurable CORS for frontend integration

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- SQLite (for development)
- MySQL 8.0+ (for production)

## 🛠️ Installation

1. **Clone and navigate to the Spring Boot backend:**
   ```bash
   cd spring-backend
   ```

2. **Install dependencies:**
   ```bash
   mvn clean install
   ```

3. **Create uploads directory:**
   ```bash
   mkdir uploads
   ```

## ⚙️ Configuration

### Development (SQLite)
The application uses SQLite by default for development. No additional setup required.

### Production (MySQL)
Set the following environment variables:
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=couple_website
export DB_USER=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your-super-secret-jwt-key
export UPLOAD_DIR=uploads
export CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🚀 Running the Application

### Development Mode
```bash
mvn spring-boot:run
```

### Production Mode
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=production
```

### Using JAR
```bash
# Build JAR
mvn clean package

# Run JAR
java -jar target/couple-website-backend-1.0.0.jar
```

The server will start on `http://localhost:3001`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/validate` - Validate JWT token

### Photos
- `GET /api/photos` - Get all photos (paginated)
- `GET /api/photos/{id}` - Get photo by ID
- `POST /api/photos/upload` - Upload multiple photos
- `POST /api/photos/upload-single` - Upload single photo
- `PUT /api/photos/{id}/caption` - Update photo caption
- `DELETE /api/photos/{id}` - Delete photo

### Memories
- `GET /api/memories` - Get all memories
- `GET /api/memories/{id}` - Get memory by ID
- `POST /api/memories` - Create new memory
- `PUT /api/memories/{id}` - Update memory
- `DELETE /api/memories/{id}` - Delete memory
- `GET /api/memories/anniversary` - Get anniversary information
- `GET /api/memories/upcoming` - Get upcoming anniversaries

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/{key}` - Get setting by key
- `POST /api/settings` - Create/update setting
- `PUT /api/settings/{key}` - Update setting
- `DELETE /api/settings/{key}` - Delete setting
- `GET /api/settings/relationship-start-date` - Get relationship start date
- `POST /api/settings/relationship-start-date` - Set relationship start date

### File Serving
- `GET /uploads/{filename}` - Serve uploaded files

### Health Check
- `GET /health` - Health check endpoint

## 🗄️ Database Schema

The application automatically creates the following tables:
- `users` - User accounts
- `photos` - Photo metadata
- `memories` - Memory entries
- `notes` - Photo notes/comments
- `categories` - Photo categories
- `photo_categories` - Many-to-many relationship between photos and categories
- `settings` - Application settings

## 🔐 Default Users

The application creates two default users on startup:
- Username: `scott`, Password: `mmqqforever`
- Username: `zoe`, Password: `mmqqforever`

## 📁 Project Structure

```
spring-backend/
├── src/main/java/com/couplewebsite/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── dto/            # Data Transfer Objects
│   ├── entity/         # JPA entities
│   ├── exception/      # Exception handling
│   ├── repository/     # Data repositories
│   ├── security/       # Security configuration
│   └── service/        # Business logic
├── src/main/resources/
│   └── application.yml # Application configuration
├── uploads/            # File storage directory
├── pom.xml            # Maven dependencies
└── README.md          # This file
```

## 🔧 Development

### Adding New Endpoints
1. Create/update entity in `entity/` package
2. Create repository interface in `repository/` package
3. Implement business logic in `service/` package
4. Create REST controller in `controller/` package

### Database Migrations
The application uses Hibernate's `ddl-auto: update` for automatic schema updates in development.
For production, consider using Flyway or Liquibase for proper database migrations.

## 🚨 Memory Optimization

The Spring Boot version includes several memory optimizations:
- Efficient file handling with disk storage
- Proper connection pooling
- Request pagination limits
- Automatic resource cleanup

## 🔄 Migration from Node.js

This Spring Boot backend provides complete feature parity with the original Node.js version:

✅ **Completed Features:**
- JWT Authentication
- Photo upload and management
- Memory CRUD operations
- Category management
- Settings management
- File serving
- Database operations
- Error handling
- CORS configuration

## 🧪 Testing

Run tests with:
```bash
mvn test
```

## 📝 Logging

Logs are configured in `application.yml`. Key loggers:
- `com.couplewebsite` - Application logs
- `org.springframework.security` - Security logs
- `org.hibernate.SQL` - Database queries (development only)

## 🤝 Contributing

1. Follow Java coding conventions
2. Add proper validation and error handling
3. Include unit tests for new features
4. Update documentation as needed

## 📄 License

This project is part of the couple website application.
