# NurseHire Platform

A secure, user-friendly website that connects mothers in Kuwait with qualified, vetted nurses for newborn care.

## Features

- **For Mothers**: Browse and search verified nurse profiles, chat with nurses, book services, and leave reviews
- **For Nurses**: Create profiles, manage availability, receive booking requests, and build reputation
- **For Administrators**: Approve nurse registrations, manage platform content, and moderate reviews

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Deployment**: Render

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nurse-hire-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Update `.env.local` with your database URL and JWT secret:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nursehire"
JWT_SECRET="your-super-secret-jwt-key-here"
```

5. Set up the database:
```bash
npm run db:generate
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Render Deployment Setup

### 1. Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account
3. Connect your GitHub repository

### 2. Set Up PostgreSQL Database

1. In your Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Choose a name (e.g., "nursehire-db")
4. Select the free tier
5. Click "Create Database"
6. Wait for the database to be created
7. Copy the "External Database URL" - you'll need this for your web service

### 3. Deploy the Web Service

1. In your Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `nursehire-platform` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: `18` (or latest)

### 4. Set Environment Variables

In your web service settings, add these environment variables:

```
DATABASE_URL=<your-postgresql-external-url>
JWT_SECRET=<generate-a-strong-random-string>
NODE_ENV=production
BASE_URL=<your-public-domain>
DAILY_API_KEY=<daily-api-key>
DAILY_DOMAIN=https://your-team.daily.co
```

**Important**: 
- Replace `<your-postgresql-external-url>` with the database URL from step 2
- Generate a strong JWT secret (you can use an online generator)
- The `NODE_ENV` should be set to `production`

### 5. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. The deployment process may take 5-10 minutes
4. Once deployed, you'll get a URL like `https://nursehire-platform.onrender.com`

### 6. Set Up the Database Schema

After your first deployment, you need to set up the database schema:

1. Go to your web service dashboard
2. Click on "Shell" tab
3. Run these commands:
```bash
npx prisma generate
npx prisma db push
```

### 7. Create Admin User

To create an admin user, you can either:

**Option A: Use the registration form**
1. Go to your deployed URL
2. Click "Get Started" or "Sign Up"
3. Select "Administrator" as your role
4. Complete the registration

**Option B: Create via database (if needed)**
1. Access your PostgreSQL database
2. Insert an admin user record manually

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | `your-super-secret-key` |
| `NODE_ENV` | Environment mode | Yes | `production` |
| `BASE_URL` | Public site URL (used for callbacks) | Yes | `https://enfas.co` |
| `DAILY_API_KEY` | Daily API key for video calls | Yes | `your-daily-api-key` |
| `DAILY_DOMAIN` | Daily team domain | Yes | `https://your-team.daily.co` |
| `UPLOAD_DIR` | File upload directory | No | `./uploads` |
| `MAX_FILE_SIZE` | Maximum file size in bytes | No | `5242880` |

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── auth/              # Authentication pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── Header.tsx         # Navigation header
│   └── Footer.tsx         # Site footer
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   └── prisma.ts         # Database client
prisma/
└── schema.prisma         # Database schema
```

## Key Features Implementation

### Authentication System
- JWT-based authentication with HTTP-only cookies
- Role-based access control (Mother, Nurse, Admin)
- Secure password hashing with bcrypt

### Database Schema
- User management with role-based profiles
- Nurse profiles with approval workflow
- Booking system with status tracking
- Review and rating system
- Private messaging system

### Security Features
- Password hashing and validation
- JWT token expiration
- Role-based route protection
- Input validation and sanitization

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio

# Linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Ensure your PostgreSQL database is running
   - Check if the database exists

2. **Build Failures on Render**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

3. **Authentication Issues**
   - Verify `JWT_SECRET` is set correctly
   - Check cookie settings for production
   - Ensure HTTPS is enabled in production

### Getting Help

If you encounter issues:
1. Check the Render deployment logs
2. Verify all environment variables are set
3. Test locally first before deploying
4. Check the database connection

## Next Steps

After successful deployment:
1. Create your admin account
2. Test the registration flow for nurses
3. Set up file upload for CVs (if needed)
4. Configure email notifications (optional)
5. Set up monitoring and analytics

## Support

For technical support or questions about the platform setup, please refer to the deployment logs or contact the development team.