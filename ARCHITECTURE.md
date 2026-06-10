# BiteBolt — Architecture & Developer Guide

> Version 1.0 · MVP Phase · Built with Turborepo + NestJS + Expo + Next.js

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Database Design](#4-database-design)
5. [Backend API Reference](#5-backend-api-reference)
6. [Authentication Flow](#6-authentication-flow)
7. [Payment Flow](#7-payment-flow)
8. [Mobile App Architecture](#8-mobile-app-architecture)
9. [Admin Dashboard](#9-admin-dashboard)
10. [AWS Deployment Guide](#10-aws-deployment-guide)
11. [Environment Variables](#11-environment-variables)
12. [Development Workflow](#12-development-workflow)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. System Overview

BiteBolt is a food delivery platform consisting of three applications sharing a common backend:

```
┌─────────────────────────────────────────────────────────────┐
│                       BiteBolt Platform                      │
├───────────────┬───────────────────┬─────────────────────────┤
│  Customer App │    Admin Panel    │      Backend API          │
│  (React Native│   (Next.js 14)   │   (NestJS + Prisma)      │
│   + Expo)     │                   │                          │
├───────────────┴───────────────────┴─────────────────────────┤
│                    Shared Packages                           │
│         @bitebolt/types · @bitebolt/utils                   │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL · Redis · AWS S3 · Twilio · Razorpay            │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

- **Monorepo First** — All code lives in a single Turborepo with shared packages, ensuring type safety across the full stack.
- **API-First** — The NestJS backend exposes clean REST APIs consumed by both the mobile app and admin dashboard.
- **Shared Types** — `@bitebolt/types` ensures TypeScript types are identical between frontend and backend.
- **Shared Validation** — `@bitebolt/utils` exports Zod schemas used in both backend DTOs and mobile form validation.
- **Scalable by Design** — Each module is independently extractable into a microservice if needed.

---

## 2. Monorepo Structure

```
bitebolt/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Complete DB schema
│   │   │   └── seed.ts         # Initial data
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── config/         # Configuration factory
│   │       ├── common/
│   │       │   ├── decorators/ # @CurrentUser, @Public, @Roles
│   │       │   ├── filters/    # Global HTTP exception filter
│   │       │   ├── guards/     # JWT + Roles guards
│   │       │   └── interceptors/ # Response transform
│   │       ├── modules/
│   │       │   ├── auth/       # OTP + JWT auth
│   │       │   ├── users/      # Profile + addresses
│   │       │   ├── foods/      # Food items
│   │       │   ├── categories/ # Food categories
│   │       │   ├── cart/       # Shopping cart
│   │       │   ├── orders/     # Order lifecycle
│   │       │   ├── payments/   # Razorpay integration
│   │       │   ├── wallet/     # Wallet system
│   │       │   ├── notifications/ # In-app notifications
│   │       │   └── upload/     # AWS S3 file upload
│   │       └── prisma/         # Prisma service + module
│   │
│   ├── mobile/                 # Expo + React Native
│   │   ├── app/
│   │   │   ├── _layout.tsx     # Root layout + auth guard
│   │   │   ├── (auth)/         # Phone, OTP, Register screens
│   │   │   ├── (tabs)/         # Home, Search, Cart, Orders, Profile
│   │   │   ├── food/[slug].tsx  # Food detail
│   │   │   ├── order/[id].tsx  # Order detail + tracking
│   │   │   └── checkout.tsx    # Checkout flow
│   │   └── src/
│   │       ├── api/            # API client + typed endpoints
│   │       ├── components/     # Reusable UI components
│   │       ├── store/          # Zustand stores (auth, cart)
│   │       └── styles/         # Global CSS (NativeWind)
│   │
│   └── admin/                  # Next.js admin dashboard
│       └── src/
│           ├── app/
│           │   ├── layout.tsx  # Sidebar + providers
│           │   └── orders/     # Order management page
│           ├── components/     # OrderCard, etc.
│           └── lib/            # Admin API client
│
├── packages/
│   ├── types/                  # Shared TypeScript interfaces & enums
│   ├── utils/                  # Shared utilities + Zod schemas
│   ├── eslint-config/          # Shared ESLint rules
│   └── config/                 # Shared Tailwind/config
│
├── turbo.json                  # Turborepo pipeline
├── pnpm-workspace.yaml         # pnpm workspaces
├── package.json                # Root scripts
└── .env.example                # Environment variable template
```

---

## 3. Technology Stack

### Backend (apps/api)

| Layer         | Technology             | Purpose                                 |
| ------------- | ---------------------- | --------------------------------------- |
| Framework     | NestJS 10              | Modular, scalable Node.js framework     |
| ORM           | Prisma 5               | Type-safe DB access with migrations     |
| Database      | PostgreSQL 16          | Primary data store                      |
| Cache         | Redis + ioredis        | Session caching, OTP store, API caching |
| Auth          | JWT (access + refresh) | Stateless authentication                |
| OTP           | Twilio                 | SMS-based phone verification            |
| Payments      | Razorpay               | UPI, cards, net banking, wallets        |
| Storage       | AWS S3 + CloudFront    | Image storage and CDN delivery          |
| Validation    | class-validator + Zod  | Request validation                      |
| Rate Limiting | @nestjs/throttler      | DDoS protection                         |
| Security      | Helmet + CORS          | HTTP security headers                   |

### Mobile App (apps/mobile)

| Layer        | Technology               | Purpose                       |
| ------------ | ------------------------ | ----------------------------- |
| Framework    | React Native + Expo 51   | Cross-platform iOS/Android    |
| Navigation   | Expo Router (file-based) | Tab + Stack navigation        |
| Styling      | NativeWind 4             | Tailwind CSS for React Native |
| State        | Zustand                  | Lightweight global state      |
| Server State | TanStack Query v5        | Async data fetching + caching |
| Forms        | React Hook Form + Zod    | Type-safe form validation     |
| Animations   | Reanimated 3             | Smooth 60fps animations       |
| Storage      | Expo SecureStore         | Encrypted token storage       |
| HTTP         | Axios                    | API client with interceptors  |

### Admin (apps/admin)

| Layer         | Technology              | Purpose                        |
| ------------- | ----------------------- | ------------------------------ |
| Framework     | Next.js 14 (App Router) | React server/client components |
| Styling       | Tailwind CSS            | Utility-first CSS              |
| State         | TanStack Query          | Auto-refreshing order data     |
| Notifications | Sonner                  | Toast notifications            |

---

## 4. Database Design

### Entity Relationship Overview

```
User ──< Address
User ──< CartItem >── FoodItem >── Category
User ──< Order ──< OrderItem >── FoodItem
Order ──< OrderStatusHistory
Order ──  Payment
User ──── Wallet ──< WalletTransaction
User ──< Notification
User ──< OtpVerification
```

### Key Design Decisions

**Order item snapshots** — When an order is placed, `OrderItem` stores a snapshot of the food item's name and price at the time of order. This ensures order history remains accurate even if food prices are updated later.

**Wallet transactions with balance-after** — Every wallet transaction stores the `balanceAfter` value, providing a complete audit trail and making it easy to detect inconsistencies.

**Order status history** — Every status change is recorded in `OrderStatusHistory` with a timestamp and optional notes, providing full auditability and the timeline for the order tracking UI.

**OTP verification table** — OTPs are stored in the database (not Redis) for durability and auditing. They have a `isUsed` flag and `expiresAt` timestamp. Cleanup of expired OTPs should be handled by a cron job.

**Soft-delete pattern** — Users are not hard-deleted; instead `isActive = false` is used to preserve order history and foreign key integrity.

### Indexes

All foreign keys are indexed. Additional indexes are placed on:

- `orders.status` — for admin filtering
- `orders.createdAt` — for chronological listing
- `food_items.isAvailable` — for catalog filtering
- `notifications.isRead` — for unread count
- `otp_verifications.phone` + `otp_verifications.expiresAt` — for OTP lookup

---

## 5. Backend API Reference

All endpoints are prefixed with `/api/v1`.

Authentication: Bearer token in `Authorization` header.
Public endpoints (no auth required): marked with 🔓

### Auth

| Method | Endpoint           | Auth | Description                                 |
| ------ | ------------------ | ---- | ------------------------------------------- |
| POST   | `/auth/send-otp`   | 🔓   | Send OTP to phone number                    |
| POST   | `/auth/verify-otp` | 🔓   | Verify OTP, returns tokens + user           |
| POST   | `/auth/register`   | 🔒   | Complete registration (name, email)         |
| POST   | `/auth/refresh`    | 🔓   | Exchange refresh token for new access token |

### Users

| Method | Endpoint                  | Auth | Description              |
| ------ | ------------------------- | ---- | ------------------------ |
| GET    | `/users/me`               | 🔒   | Get current user profile |
| PATCH  | `/users/me`               | 🔒   | Update profile           |
| GET    | `/users/me/addresses`     | 🔒   | List saved addresses     |
| POST   | `/users/me/addresses`     | 🔒   | Add address              |
| PATCH  | `/users/me/addresses/:id` | 🔒   | Update address           |
| DELETE | `/users/me/addresses/:id` | 🔒   | Delete address           |

### Categories & Foods

| Method | Endpoint          | Auth | Description                                                       |
| ------ | ----------------- | ---- | ----------------------------------------------------------------- |
| GET    | `/categories`     | 🔓   | List all active categories                                        |
| GET    | `/foods`          | 🔓   | List foods (supports ?search, ?categoryId, ?isVeg, ?page, ?limit) |
| GET    | `/foods/featured` | 🔓   | Get featured/bestseller foods                                     |
| GET    | `/foods/:slug`    | 🔓   | Get food item by slug                                             |

### Cart

| Method | Endpoint          | Auth | Description           |
| ------ | ----------------- | ---- | --------------------- |
| GET    | `/cart`           | 🔒   | Get cart with totals  |
| POST   | `/cart/items`     | 🔒   | Add item to cart      |
| PATCH  | `/cart/items/:id` | 🔒   | Update item quantity  |
| DELETE | `/cart/items/:id` | 🔒   | Remove item from cart |
| DELETE | `/cart`           | 🔒   | Clear entire cart     |

### Orders

| Method | Endpoint                   | Auth     | Description                 |
| ------ | -------------------------- | -------- | --------------------------- |
| POST   | `/orders`                  | 🔒       | Place order (clears cart)   |
| GET    | `/orders`                  | 🔒       | Get my orders (paginated)   |
| GET    | `/orders/:id`              | 🔒       | Get order details + history |
| PATCH  | `/orders/:id/cancel`       | 🔒       | Cancel order                |
| GET    | `/orders/admin/all`        | 🔒 Admin | All orders (filterable)     |
| PATCH  | `/orders/admin/:id/status` | 🔒 Admin | Update order status         |

### Payments

| Method | Endpoint                 | Auth | Description              |
| ------ | ------------------------ | ---- | ------------------------ |
| POST   | `/payments/create-order` | 🔒   | Create Razorpay order    |
| POST   | `/payments/verify`       | 🔒   | Verify payment signature |
| POST   | `/payments/webhook`      | 🔓   | Razorpay webhook handler |

### Wallet

| Method | Endpoint               | Auth | Description                          |
| ------ | ---------------------- | ---- | ------------------------------------ |
| GET    | `/wallet`              | 🔒   | Get wallet + recent transactions     |
| GET    | `/wallet/transactions` | 🔒   | Full transaction history (paginated) |

### Notifications

| Method | Endpoint                  | Auth | Description                   |
| ------ | ------------------------- | ---- | ----------------------------- |
| GET    | `/notifications`          | 🔒   | Get notifications (paginated) |
| PATCH  | `/notifications/:id/read` | 🔒   | Mark notification as read     |
| PATCH  | `/notifications/read-all` | 🔒   | Mark all as read              |

### Standard Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Error response:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "path": "/api/v1/auth/send-otp",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 6. Authentication Flow

### New User Flow

```
Mobile App          Backend (NestJS)        Twilio       Database
──────────          ────────────────        ──────       ────────
POST /send-otp  ──► Rate limit check
                    Generate 6-digit OTP
                    Save to DB (10min TTL)
                    ───────────────────►   SMS OTP
                ◄── 200 OK + expiresIn

POST /verify-otp ──► Find valid OTP
                     Mark OTP as used
                     Find/Create User
                     Create Wallet (if new)
                     Generate JWT pair
                 ◄── tokens + user + isNewUser

if (isNewUser) ──► POST /register (name, email)
                ◄── Updated user profile

Navigate to Home ◄── Done
```

### Token Strategy

- **Access Token**: 7-day expiry, stored in Expo SecureStore
- **Refresh Token**: 30-day expiry, stored in Expo SecureStore
- **Auto-refresh**: Axios interceptor detects 401, automatically uses refresh token, retries original request
- **JWT Payload**: `{ sub: userId, phone, role }`
- **Global Guard**: `JwtAuthGuard` is applied globally; routes opt-out using `@Public()` decorator

---

## 7. Payment Flow

### Standard Payment (UPI/Card/Net Banking)

```
Mobile App                    Backend                  Razorpay
──────────                    ───────                  ────────
Place Order ──────────────► POST /orders
                            ◄── orderId + total

POST /payments/create-order ► Create Razorpay Order
                               Save Payment (PENDING)
                            ◄── razorpayOrderId + keyId

Open Razorpay SDK ──────────────────────────────────► Payment UI
User completes payment ◄──────────────────────────── Success

POST /payments/verify ──────► Verify HMAC signature
                               Update Payment (CAPTURED)
                               Update Order (ACCEPTED)
                            ◄── success

Navigate to Order Detail ◄── Done
```

### Wallet Payment Flow

1. Fetch wallet balance before checkout
2. User selects wallet payment + amount to use
3. On place order, backend deducts wallet balance atomically (DB transaction)
4. If partial payment needed, create Razorpay order for remaining amount
5. On success, log wallet debit transaction

### Webhook Handler

The `/payments/webhook` endpoint receives Razorpay webhooks for:

- `payment.failed` → Mark payment as FAILED in DB

Webhook signature is verified using HMAC-SHA256 before processing.

---

## 8. Mobile App Architecture

### Screen Structure (Expo Router)

```
app/
├── _layout.tsx          # Root: QueryClient + AuthGuard + Fonts
├── (auth)/
│   ├── phone.tsx        # Phone number entry
│   ├── otp.tsx          # OTP verification (6-box input)
│   └── register.tsx     # Name/email collection
├── (tabs)/
│   ├── _layout.tsx      # Bottom tab bar with cart badge
│   ├── index.tsx        # Home: categories, promo, featured foods
│   ├── search.tsx       # Search + filter by category/veg
│   ├── cart.tsx         # Cart items + bill summary
│   ├── orders.tsx       # Order history list
│   └── profile.tsx      # Profile, addresses, wallet
├── food/[slug].tsx      # Food detail + add to cart
├── order/[id].tsx       # Order detail + status timeline
└── checkout.tsx         # Address select + payment method
```

### State Management Strategy

| State Type          | Where               | Why                 |
| ------------------- | ------------------- | ------------------- |
| Auth (user, tokens) | Zustand `authStore` | Persisted, global   |
| Cart summary        | Zustand `cartStore` | Synced from server  |
| Server data         | TanStack Query      | Cached, refetchable |
| Form state          | React Hook Form     | Local, uncontrolled |
| Navigation state    | Expo Router         | File-based          |

### TanStack Query Keys Convention

```
['categories']
['foods', 'featured']
['foods', { search, categoryId, isVeg }]
['food', slug]
['cart']
['orders']
['order', id]
['wallet']
['notifications']
```

### Design System (NativeWind)

Colors defined in `tailwind.config.js`:

- `brand` / `primary` — `#FF5722` (orange-red, brand color)
- `surface-card` — `#F8F9FA` (light mode card background)
- `text-primary` — `#1A1A1A` (dark text)
- `text-secondary` — `#6B7280` (muted text)
- `success` — `#10B981` / `error` — `#EF4444`

Typography: Inter font family (Regular, Medium, SemiBold, Bold)

---

## 9. Admin Dashboard

### Architecture

Next.js App Router with server components for layout and client components for interactive order management.

Auto-refreshes order list every 15 seconds using TanStack Query's `refetchInterval`.

### Order Status Machine

```
PENDING
  ├──► ACCEPTED ──► PREPARING ──► OUT_FOR_DELIVERY ──► DELIVERED
  └──► REJECTED

Any status ──► CANCELLED (customer-initiated)
```

Admin actions available per status:

- **PENDING**: Accept or Reject
- **ACCEPTED**: Mark as Preparing
- **PREPARING**: Mark as Out for Delivery
- **OUT_FOR_DELIVERY**: Mark as Delivered

---

## 10. AWS Deployment Guide

### Recommended Architecture

```
Internet
    │
    ▼
Route 53 (DNS)
    │
    ▼
CloudFront (CDN)
    ├── API: api.bitebolt.in → ALB → ECS Tasks (NestJS)
    ├── Admin: admin.bitebolt.in → CloudFront → S3/Next.js
    └── Media: cdn.bitebolt.in → S3 (food images, avatars)
    │
    ▼
VPC (Private Subnets)
├── RDS PostgreSQL (Multi-AZ for production)
└── ElastiCache Redis (single node for MVP)
```

### Services Used

| Service           | Purpose                   | Tier                      |
| ----------------- | ------------------------- | ------------------------- |
| ECS Fargate       | Run NestJS API containers | Compute                   |
| RDS PostgreSQL 16 | Primary database          | db.t3.micro → db.t3.small |
| ElastiCache Redis | Caching, OTP storage      | cache.t3.micro            |
| S3                | Food images, user avatars | Standard                  |
| CloudFront        | CDN for S3 + API          | Standard                  |
| ALB               | Load balancer for API     | Standard                  |
| ECR               | Docker image registry     | Standard                  |
| Route 53          | DNS management            | Standard                  |
| ACM               | SSL/TLS certificates      | Free                      |
| Secrets Manager   | Store env secrets         | Standard                  |

### Docker Setup (apps/api)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main"]
```

### CI/CD Pipeline (GitHub Actions)

1. Push to `main` branch
2. Run tests + lint
3. Build Docker image, push to ECR
4. Run `prisma migrate deploy` against prod DB
5. Deploy new task definition to ECS

---

## 11. Environment Variables

See `.env.example` for full reference. Key variables:

| Variable                                      | Description                                |
| --------------------------------------------- | ------------------------------------------ |
| `DATABASE_URL`                                | PostgreSQL connection string               |
| `REDIS_HOST` / `REDIS_PORT`                   | Redis connection                           |
| `JWT_SECRET`                                  | Min 32 chars, never expose                 |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`    | Twilio credentials                         |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`     | Razorpay credentials                       |
| `RAZORPAY_WEBHOOK_SECRET`                     | For webhook signature verification         |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 access                                  |
| `AWS_S3_BUCKET`                               | S3 bucket name                             |
| `AWS_CLOUDFRONT_DOMAIN`                       | CDN domain (e.g., https://cdn.bitebolt.in) |

In production, use **AWS Secrets Manager** or **Parameter Store** instead of `.env` files.

---

## 12. Development Workflow

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (local or Docker)
- Redis (local or Docker)

### Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/bitebolt.git
cd bitebolt
pnpm install

# Copy env file
cp .env.example apps/api/.env
# Fill in your local values

# Setup database
pnpm db:generate       # Generate Prisma client
pnpm db:migrate        # Run migrations
pnpm db:seed           # Seed categories + sample food items

# Start all apps
pnpm dev               # Starts api + mobile + admin concurrently

# Or start individually
pnpm dev:api           # http://localhost:3001/api/v1
pnpm dev:admin         # http://localhost:3000

# Start mobile
cd apps/mobile
npx expo start         # Scan QR with Expo Go app
```

### Database Commands

```bash
pnpm db:studio         # Open Prisma Studio (visual DB browser)
pnpm db:migrate        # Create + run new migration
pnpm db:seed           # Re-seed database
pnpm db:reset          # Reset DB + reseed (dev only!)
```

### Docker Compose (Local Services)

```yaml
# docker-compose.yml (place at project root)
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bitebolt_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

```bash
docker-compose up -d   # Start PostgreSQL + Redis
```

---

## 13. Future Roadmap

The current MVP architecture is designed to support these future features without major rewrites:

### Phase 2 (Post-MVP)

- **Live Delivery Tracking** — Add delivery partner app, integrate GPS via WebSocket (Socket.io already compatible with NestJS)
- **Push Notifications** — FCM token already stored on User model; `NotificationsService` can be extended to send push via FCM
- **Coupons & Offers** — Add `Coupon` model, validate on order placement
- **Ratings & Reviews** — Add `Review` model linked to Order + FoodItem

### Phase 3

- **Multi-vendor Restaurants** — Add `Restaurant` model, associate FoodItems with restaurants
- **Delivery Partner App** — Separate Expo app, use `DELIVERY` role already defined in `UserRole` enum
- **Subscription Plans** — Add `Subscription` model, gate features via middleware

### Phase 4

- **Advanced Analytics** — Add analytics service, emit events to a message queue (SQS/RabbitMQ)
- **Microservices Migration** — Each NestJS module is already isolated; extract into separate services with shared types
- **Kubernetes** — ECS can be migrated to EKS; infrastructure-agnostic by design

---

_Built with ❤️ by the BiteBolt team._
