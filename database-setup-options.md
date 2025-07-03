# Database Setup Options for Budget App

## Option 1: Docker PostgreSQL (Local Development)

### Prerequisites:
- Docker Desktop must be running

### Steps:
1. Start Docker Desktop from Start menu
2. Wait for Docker to fully start (Docker icon appears in system tray)
3. Run: `docker-compose up -d`
4. Continue with Prisma setup

### Connection String:
```
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5432/budget_app"
```

## Option 2: Supabase (Free Cloud Database)

### Steps:
1. Go to https://supabase.com
2. Sign up for free account
3. Create new project
4. Get connection string from Settings > Database
5. Update .env.local with your connection string

### Example Connection String:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

## Option 3: Vercel Postgres (Free Tier)

### Steps:
1. Go to https://vercel.com/storage/postgres
2. Sign up and create database
3. Get connection string
4. Update .env.local

## Option 4: Local PostgreSQL Installation

### Steps:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set
4. Use connection string:

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@localhost:5432/budget_app"
```

## Recommended: Supabase (Easiest for beginners)
- No local setup required
- Free tier available
- Web interface for database management
- Perfect for development and small apps 