# BMO — Budget Money Online 🏦

A YNAB-inspired collaborative personal finance app with real-time multi-user sync.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI |
| Backend | Next.js API Routes, NextAuth.js v4 (JWT) |
| Database | PostgreSQL 15 via Prisma ORM |
| Real-time | Socket.io server (separate Express process on port 3001) |
| State | Zustand, React Hook Form, Zod |
| Email | Nodemailer (auto-falls back to Ethereal test emails in dev) |

---

## Prerequisites

Install these before anything else:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 24.x | https://nodejs.org |
| **npm** | comes with Node.js | — |
| **Docker Desktop** | latest | https://www.docker.com/products/docker-desktop |
| **Git** | any | https://git-scm.com |

> **Windows users:** Use PowerShell or Windows Terminal.  
> **Mac/Linux users:** Use your default terminal.  
> After installing Docker Desktop, make sure to **launch it** and wait until it shows "Docker is running" in the system tray before continuing.

---

## Step-by-Step Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/Mastermoh0/bmo-budget-app.git
cd bmo-budget-app
```

---

### Step 2 — Install dependencies

This project has two separate servers — install both:

```bash
# Main app (Next.js)
npm install

# Real-time socket server
cd socket-server
npm install
cd ..
```

---

### Step 3 — Create environment files

You need **two** `.env` files. Create them in the project root (`bmo-budget-app/`):

#### File 1: `.env.local` (for the Next.js app)

Create a file named `.env.local` and paste this content:

```env
# Database
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5432/budget_app"

# NextAuth — authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-please-change-in-production"

# Socket server
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Email (optional — leave blank to use fake test emails in development)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
```

#### File 2: `.env` (for Prisma CLI tools)

Create a file named `.env` and paste this content:

```env
DATABASE_URL="postgresql://budget_user:budget_password@localhost:5432/budget_app"
```

> **Why two files?** Next.js reads `.env.local`. Prisma's CLI tools (`db:migrate`, `db:seed`, `db:studio`) only read `.env`. Both must exist.

---

### Step 4 — Start the database

Make sure Docker Desktop is open and running, then:

```bash
docker-compose up -d
```

Expected output:
```
✔ Network bmo-budget-app_default         Created
✔ Volume "bmo-budget-app_postgres_data"  Created
✔ Container budget-app-postgres          Started
```

To verify the database is healthy:
```bash
docker ps
```
You should see `budget-app-postgres` with status `Up`.

---

### Step 5 — Set up the database schema

Run migrations to create all tables:

```bash
npm run db:migrate
```

When asked for a migration name, type anything (e.g. `init`) and press Enter.

> Already have migrations? It will apply them automatically without asking.

Optionally seed with sample data:
```bash
npm run db:seed
```

---

### Step 6 — Start the app

**Start both servers at once (recommended):**
```bash
npm run dev:all
```

**Or start them separately in two terminals:**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:socket
```

---

### Step 7 — Open the app

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

You'll see the BMO sign-in page. Click **"Create one now"** to register your first account and complete onboarding.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run dev:socket` | Start Socket.io server (port 3001) |
| `npm run dev:all` | Start both servers together |
| `npm run build` | Build for production |
| `npm run typecheck` | Check TypeScript without building |
| `npm run lint` | Check source files with ESLint |
| `npm run start` | Start production server |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed with sample data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

The development and production build commands use Next.js's supported `--webpack` option. The default Turbopack builder failed during local Windows verification; revisit this choice when it can pass the same checks. Existing React lint findings remain tracked in [the modernization plan](bmo-modernization-plan.md#30-framework-upgrade-implementation-record).

---

## Stopping the App

```bash
# Stop the dev servers
Ctrl + C   (in the terminal running npm run dev:all)

# Stop the database
docker-compose down

# Stop database AND delete all data (fresh start)
docker-compose down -v
```

---

## Folder Structure

```
bmo-budget-app/
├── app/                  # Next.js App Router
│   ├── api/             # Backend API routes
│   ├── auth/            # Sign-in, sign-up, password reset
│   ├── accounts/        # Account management
│   ├── transactions/    # Transaction management
│   ├── reports/         # Financial reports
│   └── teams/           # Budget group collaboration
├── components/           # Reusable React components
├── lib/                  # Auth, DB client, email, socket helpers
├── prisma/               # Schema & migrations
│   ├── schema.prisma    # Database model definitions
│   └── seed.ts          # Sample data script
├── socket-server/        # Standalone Socket.io Express server
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── docker-compose.yml    # Local PostgreSQL setup
├── .env                  # Prisma CLI env vars (DATABASE_URL)
└── .env.local            # Next.js app env vars (all variables)
```

---

## Common Issues & Fixes

### ❌ `docker-compose up` fails — "cannot connect" or "pipe not found"
Docker Desktop is not running. Open Docker Desktop from your Start Menu / Applications and wait until the icon in the system tray shows "Docker is running", then retry.

### ❌ `npm run db:migrate` — "Environment variable not found: DATABASE_URL"
Your `.env` file is missing or in the wrong location. Make sure a file named exactly `.env` (not `.env.local`) exists in the project root with `DATABASE_URL` inside it.

### ❌ `[next-auth] No secret configured`
Ensure `.env.local` exists and contains `NEXTAUTH_SECRET=...`.

### ❌ Port 3000 or 3001 already in use

**Windows (PowerShell):**
```powershell
npx kill-port 3000 3001
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### ❌ Real-time features not working (live sync, chat)
The socket server must be running. Use `npm run dev:all` instead of just `npm run dev`.

### ❌ Email not sending / no email received
In development, emails are routed to **Ethereal** (a fake inbox). After triggering a password reset or invitation, look at your terminal for a line like:
```
Preview URL: https://ethereal.email/message/...
```
Click that link to view the email. No SMTP setup is required in development.

### ❌ `PrismaClientInitializationError`
Regenerate the client: `npm run db:generate`, then retry.

---

## Production Checklist

When deploying to a real server, update these values:

- `DATABASE_URL` → your managed PostgreSQL URL (Supabase, Neon, Railway, etc.)
- `NEXTAUTH_SECRET` → run `openssl rand -base64 32` for a secure value
- `NEXTAUTH_URL` → your actual domain (e.g. `https://yourdomain.com`)
- `NEXT_PUBLIC_SOCKET_URL` → your deployed socket server URL
- `SMTP_*` → your real transactional email provider credentials

Build for production:
```bash
npm run build
npm run start
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
