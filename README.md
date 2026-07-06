# BiteBolt

A food delivery platform built as a Turborepo monorepo — NestJS API, and two Expo + React Native
apps (customer mobile app and admin app) sharing types and validation logic.

```
apps/api      → NestJS + Drizzle ORM + PostgreSQL + Redis   (port 3001)
apps/admin    → Expo + React Native admin app (17 features — see ADMIN.md)
apps/mobile   → Expo + React Native customer app (iOS & Android)
packages/types     → Shared TypeScript interfaces & enums
packages/utils     → Shared Zod schemas & utilities
```

> `apps/admin` was originally a minimal Next.js page and has since been replaced with a full
> React Native admin app (same stack as `apps/mobile`) — it runs via Expo, not a web port. See
> `ADMIN.md` for its architecture and feature list, `DEMO_SCRIPT.md` for a walkthrough of every
> feature, and `NOT_WORKING.md` for known limitations.

---

## Prerequisites

| Tool       | Version |
| ---------- | ------- |
| Node.js    | >= 20   |
| pnpm       | >= 9    |
| PostgreSQL | >= 15   |
| Redis      | >= 7    |

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

| App    | How it runs                                                                 |
| ------ | ---------------------------------------------------------------------------- |
| API    | http://localhost:3001/api/v1 (or `0.0.0.0:3001`)                             |
| Admin  | Expo dev server — scan the QR with Expo Go, or press `i`/`a` for a simulator |
| Mobile | Expo dev server — same as above                                             |

To run apps individually:

```bash
pnpm dev:api      # API only
pnpm dev:admin    # Admin only (or cd apps/admin && npx expo start)
pnpm dev:mobile   # Mobile only (or cd apps/mobile && npx expo start)
```

### 6. Seed demo data for the admin app (optional)

To get a full demo dataset (an admin account, sample categories/food items, customers with
addresses, orders in every status, payments, and wallet transactions) instead of the minimal
`pnpm db:seed` set:

```bash
cd apps/api
pnpm db:seed:demo
```

This seeds admin phone `9653158855` — see [Onboarding a New Admin](#onboarding-a-new-admin) below
for how OTP login works in development, and `DEMO_SCRIPT.md` for a full feature walkthrough using
this data.

---

## Environment Variables

All variables live in `apps/api/.env`. Copy from `.env.example` and fill in your values.

### Database

| Variable       | Default                                                                   | Description                  |
| -------------- | ------------------------------------------------------------------------- | ---------------------------- |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/bitebolt_db?schema=public` | PostgreSQL connection string |

### Redis

| Variable         | Default     | Description                            |
| ---------------- | ----------- | -------------------------------------- |
| `REDIS_HOST`     | `localhost` | Redis host                             |
| `REDIS_PORT`     | `6379`      | Redis port                             |
| `REDIS_PASSWORD` | _(empty)_   | Redis password (leave empty for local) |
| `REDIS_TTL`      | `3600`      | Default cache TTL in seconds           |

### JWT

| Variable                 | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| `JWT_SECRET`             | Secret for access tokens — minimum 32 characters                               |
| `JWT_EXPIRES_IN`         | Access token expiry (default: `7d`)                                            |
| `JWT_REFRESH_SECRET`     | Secret for refresh tokens — minimum 32 characters, different from `JWT_SECRET` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: `30d`)                                          |

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Twilio (SMS OTP)

Get credentials from [console.twilio.com](https://console.twilio.com).

| Variable              | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`  | Account SID (starts with `AC`)                           |
| `TWILIO_AUTH_TOKEN`   | Auth token                                               |
| `TWILIO_PHONE_NUMBER` | Twilio phone number in E.164 format (e.g. `+1234567890`) |
| `OTP_EXPIRY_MINUTES`  | OTP validity window (default: `10`)                      |

> For local development you can use a Twilio trial account. OTPs will only send to verified numbers unless you upgrade.

### Razorpay (Payments)

Get credentials from [dashboard.razorpay.com](https://dashboard.razorpay.com).

| Variable                  | Description                                  |
| ------------------------- | -------------------------------------------- |
| `RAZORPAY_KEY_ID`         | Key ID (use `rzp_test_...` for dev)          |
| `RAZORPAY_KEY_SECRET`     | Key secret                                   |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signing secret (Settings → Webhooks) |

> For local webhook testing, use [ngrok](https://ngrok.com) to expose your local API and register the ngrok URL in Razorpay's webhook settings.

### AWS S3 (File Uploads)

| Variable                | Default                   | Description                         |
| ----------------------- | ------------------------- | ----------------------------------- |
| `AWS_ACCESS_KEY_ID`     | —                         | IAM access key                      |
| `AWS_SECRET_ACCESS_KEY` | —                         | IAM secret key                      |
| `AWS_REGION`            | `ap-south-1`              | S3 bucket region                    |
| `AWS_S3_BUCKET`         | `bitebolt-media`          | Bucket name                         |
| `AWS_CLOUDFRONT_DOMAIN` | `https://cdn.bitebolt.in` | CloudFront domain for serving media |

> For local development you can use [LocalStack](https://localstack.cloud) or a real S3 bucket. Image uploads will fail if these are not configured, but everything else works.

### App

| Variable        | Default                                        | Description                            |
| --------------- | ---------------------------------------------- | -------------------------------------- |
| `NODE_ENV`      | `development`                                  | Node environment                       |
| `PORT`          | `3001`                                         | API server port                        |
| `API_PREFIX`    | `api/v1`                                       | Global route prefix                    |
| `CORS_ORIGINS`  | `http://localhost:3000,http://localhost:19006` | Allowed CORS origins (comma-separated) |
| `APP_NAME`      | `BiteBolt`                                     | Application name                       |
| `SUPPORT_EMAIL` | `support@bitebolt.in`                          | Support contact email                  |

### Rate Limiting

| Variable         | Default | Description                    |
| ---------------- | ------- | ------------------------------ |
| `THROTTLE_TTL`   | `60`    | Rate limit window in seconds   |
| `THROTTLE_LIMIT` | `100`   | Max requests per window per IP |

### FCM (Future — Push Notifications)

| Variable         | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
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

## Onboarding a New Admin

Admin accounts are **not** self-service — anyone can log into the admin app with a phone number
and OTP, but the backend only lets a request through if that phone's `role` is `ADMIN`
(everyone else gets a 403 "Admin access only"). There is no in-app sign-up or invite flow by
design — promoting someone to admin is an operator action, not something the app exposes. There
are three ways to do it, in order of convenience:

### Option 1 — CLI script (recommended)

From `apps/api`, with `DATABASE_URL` pointing at the target database:

```bash
cd apps/api
pnpm admin:promote <phone>
# e.g. pnpm admin:promote 9876543210
```

This is idempotent and upserts: if the phone number doesn't have an account yet, it creates one
with `role: 'ADMIN'`; if it already exists (e.g. they signed up as a customer first), it promotes
that existing account in place. Run it against whichever `DATABASE_URL` you want to affect —
local, staging, or production — just make sure your `.env` (or shell env) points at the right one
before running it.

### Option 2 — Drizzle Studio (manual)

```bash
pnpm db:studio   # opens http://localhost:4983
```

Open the `users` table, find the row for the phone number, and change its `role` column from
`CUSTOMER` to `ADMIN`. Useful for one-off changes when you don't have shell access to run scripts
but do have a tunnel to the database.

### Option 3 — Seed scripts (for local/demo environments only)

- `pnpm db:seed` creates one hardcoded admin at phone `9999999999`.
- `cd apps/api && pnpm db:seed:demo` creates admin phone `9653158855` plus a full demo dataset
  (customers, orders in every status, payments, wallet transactions) — this is what `DEMO_SCRIPT.md`
  assumes is loaded.

### Logging in as the new admin

1. Open the admin app (`pnpm dev:admin`) and enter the phone number you just promoted.
2. Request an OTP. **In `NODE_ENV=development`, the OTP is not actually texted** — it's printed
   to the API's terminal log as `🔐 DEV OTP for <phone>: XXXXXX`. In production, a real Twilio SMS
   is sent (requires valid `TWILIO_*` env vars).
3. Enter the OTP — you should land on the Dashboard tab. If you instead see "Admin access only",
   the promotion didn't take — double check you ran the script/update against the same database
   the API is actually connected to.

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

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

All routes prefixed with `/api/v1`. Routes marked **🔐 Auth** require a Bearer JWT. Routes marked **🔑 Admin** require a Bearer JWT with role `ADMIN`.

---

### Auth — `/auth`

| Method | Path               | Access  | Description                              |
| ------ | ------------------ | ------- | ---------------------------------------- |
| POST   | `/auth/send-otp`   | Public  | Send OTP to phone number                 |
| POST   | `/auth/verify-otp` | Public  | Verify OTP and get tokens                |
| POST   | `/auth/register`   | 🔐 Auth | Complete profile after first OTP login   |
| POST   | `/auth/refresh`    | Public  | Refresh access token using refresh token |

**Send OTP**

```json
POST /auth/send-otp
{ "phone": "+919876543210" }
```

**Verify OTP**

```json
POST /auth/verify-otp
{ "phone": "+919876543210", "otp": "123456" }

Response: { "accessToken": "...", "refreshToken": "...", "user": { ... } }
```

---

### Foods — `/foods`

| Method | Path                            | Access   | Description                                |
| ------ | ------------------------------- | -------- | ------------------------------------------ |
| GET    | `/foods`                        | Public   | List food items (paginated, filterable)    |
| GET    | `/foods/featured`               | Public   | Get featured / bestseller items            |
| GET    | `/foods/:slug`                  | Public   | Get single food item with combinations     |
| GET    | `/foods/admin/list`             | 🔑 Admin | List all food items (for admin management) |
| PATCH  | `/foods/admin/discount`         | 🔑 Admin | Set discounted prices on multiple items    |
| PATCH  | `/foods/admin/:id/availability` | 🔑 Admin | Toggle a food item on/off                  |
| PUT    | `/foods/admin/:id/combinations` | 🔑 Admin | Set "Goes Well With" items for a food      |
| GET    | `/settings`                     | Public   | Get all app settings (delivery fee, etc.)  |
| PATCH  | `/settings/delivery-fee`        | 🔑 Admin | Update the delivery fee                    |

**GET /foods — query params**

```
page        number   (default: 1)
limit       number   (default: 20)
search      string   name/description search
categoryId  string   filter by category
isVeg       boolean  true | false
```

**PATCH /foods/admin/discount — set discount on multiple items**

```json
{
  "items": [
    { "id": "food-item-uuid", "discountedPrice": 149.0 },
    { "id": "another-uuid", "discountedPrice": null }
  ]
}
```

Pass `null` for `discountedPrice` to remove the discount on that item.

**PATCH /foods/admin/:id/availability — toggle availability**

```json
{ "isAvailable": false }
```

**PUT /foods/admin/:id/combinations — set "Goes Well With" items**

```json
{ "combinationIds": ["uuid-1", "uuid-2", "uuid-3"] }
```

Replaces all existing combinations for that item. Pass an empty array to clear them.

**PATCH /settings/delivery-fee — update delivery fee**

```json
{ "value": 60 }
```

Returns `{ "deliveryFee": 60 }`. The new fee is applied immediately to all subsequent cart and order total calculations. Cached for 1 hour; calling this endpoint also clears the cache.

**GET /settings — public, returns all app config**

```json
{ "delivery_fee": "40" }
```

**GET /foods/admin/list — response shape**

```json
[
  {
    "id": "uuid",
    "name": "Chicken Burger",
    "slug": "chicken-burger",
    "imageUrl": "https://...",
    "price": 199,
    "isVeg": false,
    "isAvailable": true,
    "combinationLinks": [{ "combinationId": "uuid-of-combo" }]
  }
]
```

---

### Categories — `/categories`

| Method | Path          | Access | Description         |
| ------ | ------------- | ------ | ------------------- |
| GET    | `/categories` | Public | List all categories |

---

### Cart — `/cart`

| Method | Path              | Access  | Description             |
| ------ | ----------------- | ------- | ----------------------- |
| GET    | `/cart`           | 🔐 Auth | Get current user's cart |
| POST   | `/cart/items`     | 🔐 Auth | Add item to cart        |
| PATCH  | `/cart/items/:id` | 🔐 Auth | Update item quantity    |
| DELETE | `/cart/items/:id` | 🔐 Auth | Remove item from cart   |
| DELETE | `/cart`           | 🔐 Auth | Clear entire cart       |

**POST /cart/items**

```json
{ "foodItemId": "uuid", "quantity": 2, "specialInstructions": "no onions" }
```

---

### Orders — `/orders`

| Method | Path                       | Access   | Description                            |
| ------ | -------------------------- | -------- | -------------------------------------- |
| POST   | `/orders`                  | 🔐 Auth  | Place a new order                      |
| GET    | `/orders`                  | 🔐 Auth  | Get current user's orders (paginated)  |
| GET    | `/orders/:id`              | 🔐 Auth  | Get single order details               |
| PATCH  | `/orders/:id/cancel`       | 🔐 Auth  | Cancel an order                        |
| GET    | `/orders/admin/all`        | 🔑 Admin | List all orders (filterable by status) |
| PATCH  | `/orders/admin/:id/status` | 🔑 Admin | Update order status                    |

**GET /orders/admin/all — query params**

```
page    number
limit   number
status  PENDING | ACCEPTED | REJECTED | PREPARING | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
```

**PATCH /orders/admin/:id/status**

```json
{
  "status": "ACCEPTED",
  "notes": "Starting preparation",
  "estimatedDeliveryTime": 30,
  "rejectionReason": ""
}
```

---

### Payments — `/payments`

| Method | Path                     | Access  | Description                             |
| ------ | ------------------------ | ------- | --------------------------------------- |
| POST   | `/payments/create-order` | 🔐 Auth | Create Razorpay order for payment       |
| POST   | `/payments/verify`       | 🔐 Auth | Verify Razorpay signature after payment |
| POST   | `/payments/webhook`      | Public  | Razorpay webhook handler                |

**POST /payments/create-order**

```json
{ "orderId": "uuid", "method": "UPI", "walletAmountUsed": 50 }
```

**POST /payments/verify**

```json
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "..."
}
```

---

### Users — `/users`

| Method | Path                      | Access  | Description                               |
| ------ | ------------------------- | ------- | ----------------------------------------- |
| GET    | `/users/me`               | 🔐 Auth | Get current user profile + wallet balance |
| PATCH  | `/users/me`               | 🔐 Auth | Update name and email                     |
| GET    | `/users/me/addresses`     | 🔐 Auth | List delivery addresses                   |
| POST   | `/users/me/addresses`     | 🔐 Auth | Add a new delivery address                |
| PATCH  | `/users/me/addresses/:id` | 🔐 Auth | Update a delivery address                 |
| DELETE | `/users/me/addresses/:id` | 🔐 Auth | Delete a delivery address                 |

**POST /users/me/addresses**

```json
{
  "label": "Home",
  "addressLine1": "12 MG Road",
  "addressLine2": "Flat 4B",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pincode": "560001",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "isDefault": true
}
```

---

### Wallet — `/wallet`

| Method | Path                   | Access  | Description                         |
| ------ | ---------------------- | ------- | ----------------------------------- |
| GET    | `/wallet`              | 🔐 Auth | Get wallet balance                  |
| GET    | `/wallet/transactions` | 🔐 Auth | Get transaction history (paginated) |

---

### Notifications — `/notifications`

| Method | Path                      | Access  | Description                      |
| ------ | ------------------------- | ------- | -------------------------------- |
| GET    | `/notifications`          | 🔐 Auth | List notifications (paginated)   |
| PATCH  | `/notifications/read-all` | 🔐 Auth | Mark all notifications as read   |
| PATCH  | `/notifications/:id/read` | 🔐 Auth | Mark single notification as read |

---

### Upload — `/upload`

| Method | Path             | Access  | Description                         |
| ------ | ---------------- | ------- | ----------------------------------- |
| POST   | `/upload/avatar` | 🔐 Auth | Upload user avatar to S3/CloudFront |

---

### Admin — Quick Reference

All admin routes require `Authorization: Bearer <adminToken>` where the token belongs to a user with role `ADMIN`.

| Method | Path                              | What it does                                        |
| ------ | ---------------------------------- | --------------------------------------------------- |
| GET    | `/analytics/overview`              | Today's orders/revenue, total revenue, pending      |
| GET    | `/analytics/daily-sales?days=7`    | Revenue + order count per day                       |
| GET    | `/analytics/popular-items?limit=`  | Most-ordered food items                             |
| GET    | `/analytics/order-stats`           | Order counts by status and by payment method        |
| GET    | `/foods/admin/list`                | All food items with current combo IDs               |
| GET    | `/foods/admin/:id`                 | Single food item (full record, for edit forms)      |
| POST   | `/foods/admin`                     | Create a food item                                  |
| PATCH  | `/foods/admin/:id`                 | Update a food item                                  |
| DELETE | `/foods/admin/:id`                 | Delete a food item (blocked if in existing orders)  |
| PATCH  | `/foods/admin/discount`            | Set/clear discounted price on multiple items        |
| PATCH  | `/foods/admin/:id/availability`    | Mark a food item available or unavailable           |
| PUT    | `/foods/admin/:id/combinations`    | Set the "Goes Well With" list for a food item       |
| GET    | `/categories/admin`                | All categories, including inactive                  |
| GET    | `/categories/admin/:id`            | Single category (full record, for edit forms)       |
| POST   | `/categories/admin`                | Create a category                                   |
| PATCH  | `/categories/admin/:id`            | Update a category                                   |
| DELETE | `/categories/admin/:id`            | Delete a category (blocked if it has food items)    |
| GET    | `/orders/admin/all`                | All orders, filter by status                        |
| GET    | `/orders/admin/:id`                | Single order, full detail incl. status history      |
| PATCH  | `/orders/admin/:id/status`         | Move order through its lifecycle                    |
| GET    | `/users/admin/customers`           | All customers, with order count + total spent       |
| GET    | `/users/admin/customers/:id`       | Single customer with addresses, orders, wallet       |
| GET    | `/payments/admin`                  | All payments, filter by status/method                |
| GET    | `/wallet/admin/transactions`       | All wallet transactions, filter by user/type          |
| PATCH  | `/settings/delivery-fee`           | Set the delivery fee charged on every order          |

---

## Database

Run migrations after any schema change:

```bash
cd apps/api
pnpm db:push      # dev — push directly (no migration files)
pnpm db:generate  # generate SQL migration from schema
pnpm db:migrate   # apply generated migrations (use in production)
```

After adding the `food_item_combinations` table for the first time, run:

```bash
cd apps/api && pnpm db:push
```

---

## Common Issues

**`Cannot connect to database`** — Make sure PostgreSQL is running and `DATABASE_URL` in `apps/api/.env` matches your local setup.

**`Redis connection refused`** — Make sure Redis is running on the port specified in `REDIS_PORT`.

**`Prisma client not found`** — Run `pnpm db:generate` after cloning or after any schema change.

**`OTP not sending`** — Check your Twilio credentials and that the destination number is verified on your trial account.

**Mobile can't reach API on device** — Replace `localhost` with your machine's local network IP in the mobile API client.

---

## License

MIT — see `LICENSE`.
