# Couple's Love Story Website

A beautiful, private website for couples to share photos, memories, and track their relationship journey together.

## Features

- 🔐 **Password Protection**: Secure access with password `mmqqforever`
- 📸 **Photo Gallery**: Upload, view, and add notes to photos
- 💕 **Memory Timeline**: Track special moments, anniversaries, and milestones
- ⏰ **Relationship Counter**: See how many days you've been together
- 🎨 **Beautiful UI**: Romantic design with glass effects and gradients
- 📱 **Responsive**: Works perfectly on desktop and mobile

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- Sequelize ORM
- SQLite (development) / MySQL (production)
- JWT authentication
- Multer for file uploads
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MySQL server (for production) or SQLite (for development)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   cd client && npm install
   ```

2. **Environment Configuration**:
   - Copy `.env.example` to `.env` (if exists) or create `.env` file
   - Configure your database settings:
   
   ```env
   # Database Configuration (for MySQL)
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=couple_website
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

3. **Database Setup**:
   
   **For MySQL (Production)**:
   ```sql
   CREATE DATABASE couple_website;
   ```
   
   **For SQLite (Development)**:
   - No setup needed, database file will be created automatically

4. **Start the application**:
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   npm run server:dev  # Backend on http://localhost:3001
   npm run client:dev  # Frontend on http://localhost:5173
   ```

5. **Access the application**:
   - Open http://localhost:5173
   - Login with password: `mmqqforever`

## Database Schema

The application automatically creates the following tables:

- **users**: User accounts (ana, zoe)
- **photos**: Uploaded photos with metadata
- **notes**: Notes attached to photos
- **memories**: Special moments and anniversaries

## Default Users

The application creates two default users:
- **ana**: Default user account
- **zoe**: Default user account

Both users share the same login password: `mmqqforever`

## File Structure

```
├── api/                    # Backend code
│   ├── config/            # Database configuration
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   └── server.ts          # Express server
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── main.tsx       # App entry point
│   └── index.html
├── uploads/               # Uploaded photos storage
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with password
- `GET /auth/relationship-info` - Get relationship duration

### Photos
- `GET /photos` - Get all photos
- `GET /photos/:id` - Get photo details with notes
- `POST /photos/upload` - Upload new photo
- `POST /photos/:id/notes` - Add note to photo

### Memories
- `GET /memories` - Get all memories
- `GET /memories/upcoming` - Get upcoming anniversaries
- `POST /memories` - Create new memory
- `PUT /memories/:id` - Update memory
- `DELETE /memories/:id` - Delete memory

## Deployment

### Production Setup

1. **Set environment variables**:
   ```env
   NODE_ENV=production
   DB_HOST=your_mysql_host
   DB_NAME=couple_website
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=your-production-jwt-secret
   ```

2. **Build the frontend**:
   ```bash
   npm run build
   ```

3. **Start the production server**:
   ```bash
   npm start
   ```

### Vercel Deployment

The project includes Vercel configuration. Simply connect your repository to Vercel and it will deploy automatically.

## Security Notes

- Change the default password in production
- Use a strong JWT secret
- Configure proper MySQL user permissions
- Enable HTTPS in production
- Consider adding rate limiting for API endpoints

## Customization

- **Colors**: Modify the romantic gradient and color scheme in `client/src/index.css`
- **Password**: Update the hardcoded password in `api/routes/auth.ts`
- **Users**: Modify default users in `api/models/index.ts`
- **Relationship Start Date**: Update in the User model

## Support

This is a personal project for couples. Feel free to customize it for your own use!

---

*Made with ❤️ for Ana & Zoe*