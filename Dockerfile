# Multi-stage build for React + Spring Boot
FROM node:18-alpine AS frontend-build

# Build React frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# Java build stage
FROM openjdk:17-jdk-alpine AS backend-build

# Install Maven
RUN apk add --no-cache curl tar bash
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY spring-backend/mvnw spring-backend/mvnw.cmd ./
COPY spring-backend/.mvn ./.mvn
COPY spring-backend/pom.xml ./
RUN chmod +x mvnw

# Download dependencies (for better caching)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY spring-backend/src ./src

# Copy React build from previous stage
COPY --from=frontend-build /app/client/dist ./src/main/resources/static

# Build Spring Boot application
RUN ./mvnw clean package -DskipTests

# Final runtime stage
FROM openjdk:17-jre-alpine

WORKDIR /app

# Copy the built JAR
COPY --from=backend-build /app/target/*.jar app.jar

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE $PORT

# Set memory limits and run
ENV JAVA_OPTS="-Xmx512m -XX:+UseContainerSupport"
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]
