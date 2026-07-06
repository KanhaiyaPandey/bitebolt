# BiteBolt — Admin App

> Version 1.0 · MVP Phase · React Native + Expo (same stack as customer app)

---

## Overview

The admin "website" (`apps/admin`, formerly a minimal Next.js app covering only order status updates) has been **replaced** with a full-featured React Native admin app built with the exact same tech stack as the customer app. The admin app covers 5 feature categories totalling 17 features as specified in the product proposal. No features are added beyond these 17.

---

## Table of Contents

1. [Feature Coverage](#1-feature-coverage)
2. [Tech Stack](#2-tech-stack)
3. [Database Structure & ER Diagram](#3-database-structure--er-diagram)
4. [Backend API — New Endpoints](#4-backend-api--new-endpoints)
5. [Admin App Architecture](#5-admin-app-architecture)
6. [Screen Reference](#6-screen-reference)
7. [Design System](#7-design-system)
8. [UI/UX Polish Specs](#8-uiux-polish-specs)
9. [Logging](#9-logging)
10. [Linting & Conventions](#10-linting--conventions)
11. [Running the Admin App](#11-running-the-admin-app)
12. [Verification Checklist](#12-verification-checklist)

---

## 1. Feature Coverage

| # | Category             | Features                                                                                 |
|---|----------------------|------------------------------------------------------------------------------------------|
| 1 | Order Management     | Receive orders in real time, Accept/Reject, Update status through full lifecycle         |
| 2 | Food Management      | Add/Edit/Delete food items, Category management, Price management, Availability toggle   |
| 3 | Analytics Dashboard  | Orders per day, Daily sales reports, Total revenue, Most ordered items, Order statistics |
| 4 | Customer Details     | View customer info, Customer-wise order history, Saved address details                   |
| 5 | Payment Management   | Razorpay payment tracking, Wallet transaction tracking                                   |

---

## 2. Tech Stack

**Identical to `apps/mobile` — zero deviation.**

| Layer         | Technology               | Purpose                             |
|---------------|--------------------------|-------------------------------------|
| Framework     | React Native + Expo 51   | Cross-platform iOS/Android          |
| Navigation    | Expo Router (file-based) | Tab + Stack navigation              |
| Styling       | NativeWind 4             | Tailwind CSS for React Native       |
| State         | Zustand                  | Auth store (persisted)              |
| Server State  | TanStack Query v5        | Async data, 15s polling for orders  |
| Forms         | React Hook Form + Zod    | Type-safe form validation           |
| Animations    | Reanimated 3             | Entrance animations, transitions    |
| Storage       | Expo SecureStore         | Encrypted token storage             |
| HTTP          | Axios                    | API client with interceptors        |
| Fonts         | Urbanist + Inter         | Same as customer app                |
| Image Pick    | expo-image-picker        | Camera/gallery for food images      |
| Bottom Sheet  | @gorhom/bottom-sheet     | Confirm dialogs, reject reason      |
| Gestures      | react-native-gesture-handler | Swipe-to-accept on order cards  |

---

## 3. Database Structure & ER Diagram

**No new DB migrations required.** The existing Drizzle schema (`apps/api/src/db/schema.ts`) covers all 5 admin feature areas. New backend endpoints run aggregation queries against existing tables.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BiteBolt Database                           │
└─────────────────────────────────────────────────────────────────────┘

users (id PK, phone UNIQUE, name, email UNIQUE, role: CUSTOMER|ADMIN|DELIVERY, isActive)
│
├──< addresses (userId FK → users)
│     label, addressLine1, city, state, pincode, latitude, longitude, isDefault
│
├──< orders (userId FK → users, addressId FK → addresses)
│     orderNumber UNIQUE, status: PENDING|ACCEPTED|REJECTED|PREPARING|
│     │                           OUT_FOR_DELIVERY|DELIVERED|CANCELLED
│     subtotal, deliveryFee, taxes, discount, total
│     specialInstructions, estimatedDeliveryTime, rejectionReason
│     │
│     ├──< orderItems (orderId FK → orders, foodItemId FK → foodItems)
│     │     name (snapshot), price (snapshot), quantity, subtotal
│     │
│     ├──< orderStatusHistory (orderId FK → orders)
│     │     status, notes, createdAt
│     │
│     └──── payments (orderId FK UNIQUE → orders, userId FK → users)
│           amount, method: UPI|CARD|NET_BANKING|WALLET|COD
│           status: PENDING|CAPTURED|FAILED|REFUNDED
│           razorpayOrderId UNIQUE, razorpayPaymentId UNIQUE
│           walletAmountUsed, failureReason, refundId, refundedAt
│
└──── wallets (userId FK UNIQUE → users)
      balance
      └──< walletTransactions (walletId FK → wallets)
            orderId (nullable), type: CREDIT|DEBIT
            reason: ORDER_PAYMENT|ORDER_REFUND|TOP_UP|CASHBACK
            amount, balanceAfter, description

categories (id PK, name UNIQUE, slug UNIQUE, isActive, sortOrder)
└──< foodItems (categoryId FK → categories)
      name, slug UNIQUE, description, price, discountedPrice
      imageUrl, images[], isVeg, isAvailable, preparationTime
      rating, totalRatings, tags[], sortOrder
      └──< foodItemCombinations (foodItemId FK, combinationId FK) [M:M self-join]

Table → Admin Feature mapping:
  Order Management     → orders, orderItems, orderStatusHistory, users, addresses
  Food Management      → foodItems, categories, foodItemCombinations
  Analytics Dashboard  → orders, orderItems, payments  (aggregation queries)
  Customer Details     → users, addresses, orders, orderItems
  Payment Management   → payments, wallets, walletTransactions
```

---

## 4. Backend API — New Endpoints

All new admin endpoints: `@Roles(UserRole.ADMIN)` + follow existing response format.

### 4a. Analytics Module (`/analytics`) — NEW MODULE

```
GET /analytics/overview
    Response: { ordersToday, revenueToday, totalRevenue, pendingOrders,
                totalOrdersAllTime, deliveredToday }

GET /analytics/daily-sales?days=7
    Response: [{ date, orderCount, revenue }]

GET /analytics/popular-items?limit=10
    Response: [{ foodItemId, name, imageUrl, orderCount, totalRevenue }]

GET /analytics/order-stats
    Response: { byStatus: { PENDING:N, ... }, byPaymentMethod: { UPI:N, ... } }
```

Files: `apps/api/src/modules/analytics/{analytics.module.ts, analytics.controller.ts, analytics.service.ts}`

### 4b. Foods — Extended Admin CRUD

```
POST   /foods/admin          → Create food item
PATCH  /foods/admin/:id      → Update food item (any subset of fields)
DELETE /foods/admin/:id      → Delete (blocked if in active orders)
```

Existing (unchanged): `GET /foods/admin/list`, `PATCH /foods/admin/:id/availability`,
`PATCH /foods/admin/discount`, `PUT /foods/admin/:id/combinations`

### 4c. Categories — Admin CRUD

```
GET    /categories/admin        → All categories (including inactive)
POST   /categories/admin        → Create category
PATCH  /categories/admin/:id    → Update category
DELETE /categories/admin/:id    → Delete (blocked if has food items)
```

### 4d. Users — Admin Customer Endpoints

```
GET /users/admin/customers?page=1&limit=20&search=
    Response: paginated { id, name, phone, email, isActive, createdAt, orderCount, totalSpent }

GET /users/admin/customers/:id
    Response: { user, addresses[], orders[] (with items), wallet }
```

### 4e. Payments — Admin List

```
GET /payments/admin?page=1&limit=20&status=&method=
    Response: paginated payments with order number + user name

GET /wallet/admin/transactions?page=1&limit=20&userId=&type=
    Response: paginated wallet transactions with user name
```

### 4f. Auth — Admin Role Gate

`apps/api/src/modules/auth/auth.service.ts` — after OTP verify:
- If request header `X-Client: admin` is present AND `user.role !== 'ADMIN'` → 403 Forbidden.
- The admin app Axios client always sends `X-Client: admin` in every request.

---

## 5. Admin App Architecture

```
apps/admin/
├── app/
│   ├── _layout.tsx              # Root: QueryClient + AdminAuthGuard + Fonts
│   ├── index.tsx                # Redirect → /(tabs)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── phone.tsx            # Phone entry (OTP flow)
│   │   └── otp.tsx              # 6-box OTP verification
│   ├── (tabs)/
│   │   ├── _layout.tsx          # 5-tab bottom navigator
│   │   ├── index.tsx            # Analytics Dashboard
│   │   ├── orders.tsx           # Order list (real-time, 15s poll)
│   │   ├── menu.tsx             # Food + Category management
│   │   ├── customers.tsx        # Customer list
│   │   └── payments.tsx         # Payments + Wallet
│   ├── order/[id].tsx           # Order detail + status actions
│   ├── food/new.tsx             # Add food item
│   ├── food/[id]/edit.tsx       # Edit food item
│   ├── category/new.tsx         # Add category
│   ├── category/[id]/edit.tsx   # Edit category
│   └── customer/[id].tsx        # Customer detail
│
├── src/
│   ├── api/
│   │   ├── client.ts            # Axios + auth interceptor + X-Client header + 401 refresh
│   │   └── index.ts             # Typed admin API functions
│   ├── store/
│   │   └── auth.store.ts        # Zustand: adminUser, tokens, initialize(), setAuth(), logout()
│   ├── components/
│   │   ├── analytics/           # MetricCard, SalesChart, PopularItems
│   │   ├── orders/              # OrderCard, StatusBadge, StatusTimeline
│   │   ├── menu/                # FoodItemRow, CategoryRow, ImagePicker
│   │   ├── customers/           # CustomerRow
│   │   ├── payments/            # PaymentRow, WalletTxRow
│   │   └── ui/                  # ScreenHeader, EmptyState, SkeletonCard, SearchBar, ConfirmSheet
│   └── styles/
│       └── global.css
│
├── tailwind.config.js           # Identical to apps/mobile/tailwind.config.js
├── app.json                     # name: "BiteBolt Admin", slug: "bitebolt-admin"
├── package.json
├── tsconfig.json                # @/* → src/* path alias
├── babel.config.js              # NativeWind
├── metro.config.js              # NativeWind
└── .eslintrc.js
```

### Auth Flow

Admin authenticates with their phone number (same OTP flow as customers). Backend checks `user.role === 'ADMIN'` when `X-Client: admin` header is present. Non-admin accounts get 403. Token stored in Expo SecureStore.

### TanStack Query Keys & Refetch Intervals

| Key                                    | Interval    |
|----------------------------------------|-------------|
| `['admin-analytics-overview']`         | 60 000 ms   |
| `['admin-analytics-daily-sales', days]`| 300 000 ms  |
| `['admin-analytics-popular-items']`    | 300 000 ms  |
| `['admin-analytics-order-stats']`      | 60 000 ms   |
| `['admin-orders', { status, page }]`   | 15 000 ms   |
| `['admin-order', id]`                  | 15 000 ms   |
| `['admin-foods', ...]`                 | stale 60s   |
| `['admin-categories']`                 | stale 60s   |
| `['admin-customers', ...]`             | stale 30s   |
| `['admin-payments', ...]`              | stale 30s   |
| `['admin-wallet-transactions', ...]`   | stale 30s   |

---

## 6. Screen Reference

### Tab 1 — Analytics Dashboard

- Orange gradient header strip with "Good morning, [name]" + date chip.
- Horizontal-scroll metric cards: Orders Today, Revenue Today, Total Revenue, Pending Orders.
- 7-day bar chart (daily revenue, react-native-svg).
- Top 5 most ordered items (ranked list with thumbnail + count badge).
- Order stats donut (by status).

### Tab 2 — Orders

- Horizontal filter chips: All | Pending | Accepted | Preparing | Out for Delivery | Delivered.
- OrderCard: order number (bold), customer name, time-ago, item count, total, StatusBadge.
- Auto-refreshes every 15s. Pull-to-refresh. Swipe-right to quick-accept PENDING orders.
- **Detail screen:** Status action bar, customer info, address, items table, bill summary, payment info, StatusTimeline.

### Tab 3 — Menu

- Segmented control: Food Items | Categories.
- **Food Items:** Search, FoodItemRow list (thumbnail, name, category chip, price, availability Switch, edit/delete icons). FAB → Add.
- **Add/Edit Food:** Name, Category picker, Description, Price, Discounted Price, ImagePicker (camera/gallery → S3), isVeg toggle, Prep time, Tags chips, Sort order.
- **Categories:** CategoryRow list (name, item count, isActive toggle). FAB → Add.
- **Add/Edit Category:** Name, Slug (auto from name), Description, ImagePicker, Sort order, isActive.

### Tab 4 — Customers

- Search by name or phone. CustomerRow: avatar initial, name, phone, orderCount badge, totalSpent, join date.
- **Detail screen:** Profile info, Saved Addresses list, Order History list (tappable → order detail).

### Tab 5 — Payments

- Segmented control: Payments | Wallet Transactions.
- **Payments:** Status filter chips. PaymentRow: method icon, amount, order number (tappable), status badge, Razorpay IDs (tap to copy), wallet amount used, date.
- **Wallet Transactions:** Type filter chips. WalletTxRow: credit/debit icon, ±amount, reason badge, description, balance-after, customer name, date.

---

## 7. Design System

`tailwind.config.js` is identical to `apps/mobile/tailwind.config.js`.

### Colors

| Token              | Hex       | Usage                           |
|--------------------|-----------|---------------------------------|
| `brand` / `primary`| `#FA7938` | CTA buttons, active states, FAB |
| `secondary`        | `#414158` | Dark text, secondary buttons    |
| `background`       | `#EEEEF5` | Screen backgrounds              |
| `surface`          | `#FFFFFF` | Cards, inputs                   |
| `text.secondary`   | `#9098B1` | Muted labels                    |
| `success`          | `#10B981` | DELIVERED badge, credit amounts |
| `warning`          | `#F59E0B` | PENDING badge, warning actions  |
| `error`            | `#EF4444` | Reject button, FAILED badge     |
| `info`             | `#3B82F6` | ACCEPTED badge                  |

### Status Badge Colors

| Status           | Background | Text      |
|------------------|------------|-----------|
| PENDING          | `#FEF3C7`  | `#92400E` |
| ACCEPTED         | `#DBEAFE`  | `#1E3A5F` |
| PREPARING        | `#EDE9FE`  | `#4C1D95` |
| OUT_FOR_DELIVERY | `#FFEDD5`  | `#9A3412` |
| DELIVERED        | `#D1FAE5`  | `#065F46` |
| REJECTED         | `#FEE2E2`  | `#7F1D1D` |
| CANCELLED        | `#F3F4F6`  | `#374151` |

### Bottom Tab Bar

| Tab        | Icon (Ionicons)      | Label      |
|------------|----------------------|------------|
| Dashboard  | `bar-chart-outline`  | Dashboard  |
| Orders     | `receipt-outline`    | Orders     |
| Menu       | `restaurant-outline` | Menu       |
| Customers  | `people-outline`     | Customers  |
| Payments   | `card-outline`       | Payments   |

Active: orange pill + filled icon. Inactive: `#9098B1` + outline icon.

---

## 8. UI/UX Polish Specs

### Animations (Reanimated 3)

- **List entry:** `FadeInDown.delay(index * 60).duration(350).springify()` on each FlatList item.
- **Tab pill:** `withSpring` sliding indicator between tabs.
- **FAB press:** `withSpring(1.15)` scale on pressIn, `withSpring(1.0)` on pressOut.
- **Status badge update:** `withTiming` crossfade to new color after mutation.
- **Skeleton pulse:** `withRepeat(withSequence(withTiming(0.4, 700ms), withTiming(1, 700ms)), -1)`.

### Haptics (expo-haptics)

- Primary button: `ImpactFeedbackStyle.Medium`
- Destructive (delete/reject): `NotificationFeedbackType.Warning`
- Success (accept/save): `NotificationFeedbackType.Success`
- Toggle switch: `selectionAsync()`

### Visual Details

- **Dashboard header:** Full-width `#FA7938` strip with gradient, white text, date chip.
- **Metric cards:** White card + left `border-l-4 border-[#FA7938]` accent + icon in color-tinted 40×40 circle.
- **Section headers:** `Urbanist-SemiBold 16px` + `border-l-3 border-[#FA7938] pl-3` left rule.
- **Forms:** Focused inputs get orange border glow (`shadowColor: '#FA7938', shadowOpacity: 0.15`).
- **Image picker:** Dashed orange border when empty, inline preview when set.
- **Pull-to-refresh:** `tintColor="#FA7938"` on all list screens.

### Bottom Sheets (`@gorhom/bottom-sheet`)

- Reject order reason input
- Delete confirmation (item name + red destructive + cancel)
- Image source picker (Camera / Photo Library)

Handle bar: 4×32 `#D3D6DE` pill. Background: white.

### Swipe Gestures

Order cards (PENDING only): swipe-right reveals green accept background → full swipe triggers accept mutation + haptic success. Implemented with `react-native-gesture-handler` `Swipeable`.

### Segmented Control

Custom pill switcher (not native `SegmentedControl`): `bg-[#EEEEF5]` container, `bg-[#FA7938]` active pill with `withSpring` layout animation. Matches mobile filter chips.

---

## 9. Logging

All logs prefixed by module. Use `console.debug` in development.

```typescript
// API client
console.debug('[AdminAPI] GET /analytics/overview');
console.debug('[AdminAPI] Response 200', data);
console.error('[AdminAPI] Error 401', error.message);

// Per feature
console.debug('[AdminOrders] Fetching', { status, page });
console.debug('[AdminOrders] Status update', { orderId, newStatus });
console.error('[AdminOrders] Update failed', error);

console.debug('[AdminMenu] Creating food item', { name, categoryId });
console.debug('[AdminMenu] Image upload started', { mimeType });
console.debug('[AdminMenu] Image uploaded', { url });
console.error('[AdminMenu] Delete blocked — item in active orders', { id });

console.debug('[AdminAuth] Initializing session');
console.debug('[AdminAuth] OTP verified, role check', { role });
console.error('[AdminAuth] Access denied: not an admin', { role });
console.debug('[AdminAuth] Token refreshed');
```

---

## 10. Linting & Conventions

### ESLint (`apps/admin/.eslintrc.js`)

```javascript
module.exports = {
  extends: ['@bitebolt/eslint-config', 'plugin:react-native/all'],
  rules: { 'react-native/no-color-literals': 'off' },
};
```

### Code Conventions (same as `apps/mobile`)

- PascalCase for components, camelCase for stores/utils.
- Absolute imports via `@/*` (maps to `src/`).
- TypeScript strict mode, no `any`. Types from `@bitebolt/types`.
- Zod schemas for all form validation.
- React Query `onSuccess` invalidates queries; `onError` shows toast.
- No comments unless the WHY is non-obvious.

---

## 11. Running the Admin App

```bash
# Prerequisites: API + DB running
pnpm dev:api

# Start admin app
pnpm dev:admin
# or
cd apps/admin && npx expo start

# First-time: create an admin user in the DB (via seed or Drizzle Studio)
pnpm db:studio
# Update a user's role to 'ADMIN'
```

---

## 12. Verification Checklist

### Backend

```bash
# Analytics
curl -H "Authorization: Bearer $ADMIN_TOKEN" -H "X-Client: admin" \
  http://localhost:3001/api/v1/analytics/overview

# Food CRUD
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","categoryId":"...","price":"100","isVeg":true,"preparationTime":15}' \
  http://localhost:3001/api/v1/foods/admin

# Customers
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/v1/users/admin/customers
```

### Admin App

- [ ] Auth: non-admin phone → "Admin access only" error
- [ ] Auth: admin phone → OTP → lands on Dashboard tab
- [ ] Orders: new customer order appears within 15s
- [ ] Orders: Accept → Preparing → Out for Delivery → Delivered lifecycle
- [ ] Orders: Reject with reason → `rejectionReason` stored
- [ ] Orders: Swipe-right to quick-accept works
- [ ] Menu: Add food with camera photo → appears in customer app
- [ ] Menu: Toggle availability off → disappears from customer app
- [ ] Menu: Edit price → customer app shows updated price
- [ ] Menu: Delete food blocked if in active order
- [ ] Menu: Add / edit / delete category
- [ ] Analytics: Today's order count matches DB
- [ ] Analytics: Daily chart shows 7 days of revenue
- [ ] Analytics: Popular items matches most-ordered in DB
- [ ] Customers: Search by phone works
- [ ] Customers: Detail shows addresses + order history
- [ ] Payments: Razorpay payment shows with CAPTURED status + IDs
- [ ] Payments: Wallet transaction appears after wallet payment

### Lint & Types

```bash
pnpm lint        # 0 errors across all apps
pnpm type-check  # 0 errors
```
