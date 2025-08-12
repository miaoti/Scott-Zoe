# Multi-stage build for React + Spring Boot
FROM node:18-slim AS frontend-build

# Build React frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --cache /tmp/.npm
COPY client/ ./

# Set Railway domain if available
RUN if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then \
    export VITE_API_URL="https://$RAILWAY_PUBLIC_DOMAIN"; \
    echo "Setting VITE_API_URL to: $VITE_API_URL"; \
    elif [ -z "$VITE_API_URL" ]; then \
    export VITE_API_URL="http://localhost:8080"; \
    echo "Using fallback VITE_API_URL: $VITE_API_URL"; \
    fi

# Ensure VITE_API_URL is available
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:8080}

RUN npm run build

# Java build stage
FROM eclipse-temurin:17-jdk-jammy AS backend-build

WORKDIR /app

# Copy Maven wrapper and pom.xml first for better caching
COPY spring-backend/mvnw spring-backend/mvnw.cmd ./
COPY spring-backend/.mvn ./.mvn
COPY spring-backend/pom.xml ./

# Fix line endings and make executable
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Download dependencies (for better caching)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY spring-backend/src ./src

# Copy React build from previous stage to the location Maven expects
COPY --from=frontend-build /app/client/dist ./client/dist

# Build Spring Boot application (Maven will copy React files to static resources)
RUN ./mvnw clean package -DskipTests

# Final runtime stage
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the built JAR
COPY --from=backend-build /app/target/*.jar app.jar

# Create uploads directory and database directory with proper permissions
RUN mkdir -p uploads && chmod 755 uploads
RUN mkdir -p /app && chmod 755 /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE $PORT

# Install curl for health checks
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
USER appuser

# Set memory limits and run
ENV JAVA_OPTS="-Xmx512m -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]
