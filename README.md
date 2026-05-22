# BiteBolt

A food delivery platform built as a Turborepo monorepo — NestJS API, Expo mobile app, and Next.js admin dashboard sharing types and validation logic.

```
apps/api      → NestJS + Prisma + PostgreSQL + Redis   (port 3001)
apps/admin    → Next.js 14 admin dashboard             (port 3000)
apps/mobile   → Expo + React Native (iOS & Android)
packages/types     → Shared TypeScript interfaces & enums
packages/utils     → Shared Zod schemas & utilities
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20 |
| pnpm | >= 9 |
| PostgreSQL | >= 15 |
| Redis | >= 7 |

Install pnpm if you don't have it:

```bash
npm install -g pnpm@9
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/bitebolt.git
cd bitebolt
pnpm install
```

### 2. Start local services (PostgreSQL + Redis)

The fastest way is Docker Compose. Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bitebolt_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

Or use your own local PostgreSQL and Redis instances — just point the env vars at them.

### 3. Configure environment variables

The API is the only app that needs a `.env` file:

```bash
cp .env.example apps/api/.env
```

Open `apps/api/.env` and fill in the required values. See the [Environment Variables](#environment-variables) section below for what each one does.

### 4. Set up the database

```bash
pnpm db:generate   # Generate SQL migration files from the Drizzle schema
pnpm db:migrate    # Apply all pending migrations to the database
pnpm db:seed       # Seed categories + sample food items
```

> **Shortcut for local dev**: `pnpm db:push` pushes the schema directly to the DB without generating migration files — faster for rapid iteration.

### 5. Start development servers

```bash
pnpm dev
```

This starts all three apps in parallel via Turborepo:

| App | URL |
|---|---|
| API | http://localhost:3001/api/v1 |
| Admin | http://localhost:3000 |
| Mobile | Expo dev server (scan QR with Expo Go) |

To run apps individually:

```bash
pnpm dev:api      # API only
pnpm dev:admin    # Admin only
pnpm dev:mobile   # Mobile only (or cd apps/mobile && npx expo start)
```

---

## Environment Variables

All variables live in `apps/api/.env`. Copy from `.env.example` and fill in your values.

### Database

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/bitebolt_db?schema=public` | PostgreSQL connection string |

### Redis

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis password (leave empty for local) |
| `REDIS_TTL` | `3600` | Default cache TTL in seconds |

### JWT

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret for access tokens — minimum 32 characters |
| `JWT_EXPIRES_IN` | Access token expiry (default: `7d`) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens — minimum 32 characters, different from `JWT_SECRET` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: `30d`) |

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Twilio (SMS OTP)

Get credentials from [console.twilio.com](https://console.twilio.com).

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number in E.164 format (e.g. `+1234567890`) |
| `OTP_EXPIRY_MINUTES` | OTP validity window (default: `10`) |

> For local development you can use a Twilio trial account. OTPs will only send to verified numbers unless you upgrade.

### Razorpay (Payments)

Get credentials from [dashboard.razorpay.com](https://dashboard.razorpay.com).

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_ID` | Key ID (use `rzp_test_...` for dev) |
| `RAZORPAY_KEY_SECRET` | Key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signing secret (Settings → Webhooks) |

> For local webhook testing, use [ngrok](https://ngrok.com) to expose your local API and register the ngrok URL in Razorpay's webhook settings.

### AWS S3 (File Uploads)

| Variable | Default | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | — | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | — | IAM secret key |
| `AWS_REGION` | `ap-south-1` | S3 bucket region |
| `AWS_S3_BUCKET` | `bitebolt-media` | Bucket name |
| `AWS_CLOUDFRONT_DOMAIN` | `https://cdn.bitebolt.in` | CloudFront domain for serving media |

> For local development you can use [LocalStack](https://localstack.cloud) or a real S3 bucket. Image uploads will fail if these are not configured, but everything else works.

### App

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Node environment |
| `PORT` | `3001` | API server port |
| `API_PREFIX` | `api/v1` | Global route prefix |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:19006` | Allowed CORS origins (comma-separated) |
| `APP_NAME` | `BiteBolt` | Application name |
| `SUPPORT_EMAIL` | `support@bitebolt.in` | Support contact email |

### Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `THROTTLE_TTL` | `60` | Rate limit window in seconds |
| `THROTTLE_LIMIT` | `100` | Max requests per window per IP |

### FCM (Future — Push Notifications)

| Variable | Description |
|---|---|
| `FCM_SERVER_KEY` | Firebase Cloud Messaging server key (leave empty until needed) |

---

## Mobile App — Connecting to the API

The mobile app reads the API base URL from `apps/mobile/src/api/client.ts` (or similar). By default it points to `http://localhost:3001/api/v1`.

When testing on a **physical device** (not an emulator), `localhost` won't resolve to your machine. Use your local network IP instead:

```bash
# Find your local IP
ipconfig getifaddr en0    # macOS
ip route get 1 | awk '{print $7}' | head -1  # Linux
```

Then update the base URL in the mobile API client to `http://192.168.x.x:3001/api/v1`.

---

## Database Commands

```bash
pnpm db:generate    # Generate SQL migration files from the Drizzle schema
pnpm db:migrate     # Apply pending migrations to the database
pnpm db:push        # Push schema directly to DB (no migration files — fast for local dev)
pnpm db:seed        # Seed categories and sample food items
pnpm db:studio      # Open Drizzle Studio at http://localhost:4983
```

For production:

```bash
cd apps/api && pnpm db:migrate   # drizzle-kit migrate — runs pending migrations safely
```

---

## Other Root Scripts

```bash
pnpm build          # Build all apps and packages
pnpm lint           # Lint all workspaces
pnpm type-check     # Run tsc --noEmit across all workspaces
pnpm format         # Prettier format all files
pnpm clean          # Delete all build outputs and node_modules
```

---

## Project Structure

```
bitebolt/
├── apps/
│   ├── api/         # NestJS backend
│   ├── admin/       # Next.js admin dashboard
│   └── mobile/      # Expo React Native app
├── packages/
│   ├── types/       # Shared TypeScript interfaces & enums
│   ├── utils/       # Shared Zod schemas & utilities
│   └── eslint-config/
├── .env.example     # Template for apps/api/.env
├── turbo.json
└── pnpm-workspace.yaml
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full system design, API reference, auth flow, payment flow, and deployment guide.

---

## Common Issues

**`Cannot connect to database`** — Make sure PostgreSQL is running and `DATABASE_URL` in `apps/api/.env` matches your local setup.

**`Redis connection refused`** — Make sure Redis is running on the port specified in `REDIS_PORT`.

**`Prisma client not found`** — Run `pnpm db:generate` after cloning or after any schema change.

**`OTP not sending`** — Check your Twilio credentials and that the destination number is verified on your trial account.

**Mobile can't reach API on device** — Replace `localhost` with your machine's local network IP in the mobile API client.
