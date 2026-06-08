import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  decimal,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'ADMIN', 'DELIVERY']);
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'CAPTURED',
  'FAILED',
  'REFUNDED',
]);
export const paymentMethodEnum = pgEnum('payment_method', [
  'UPI',
  'CARD',
  'NET_BANKING',
  'WALLET',
  'COD',
]);
export const walletTransactionTypeEnum = pgEnum('wallet_transaction_type', ['CREDIT', 'DEBIT']);
export const walletTransactionReasonEnum = pgEnum('wallet_transaction_reason', [
  'ORDER_PAYMENT',
  'ORDER_REFUND',
  'TOP_UP',
  'CASHBACK',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'ORDER_UPDATE',
  'PAYMENT',
  'PROMOTIONAL',
  'SYSTEM',
]);

// ── Users ──────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phone: text('phone').unique().notNull(),
  name: text('name'),
  email: text('email').unique(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('CUSTOMER').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  fcmToken: text('fcm_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── OTP Verifications ─────────────────────────────────────────────────────────

export const otpVerifications = pgTable(
  'otp_verifications',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    phone: text('phone').notNull(),
    otp: text('otp').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at').notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('otp_phone_idx').on(t.phone), index('otp_expires_at_idx').on(t.expiresAt)],
);

// ── Addresses ─────────────────────────────────────────────────────────────────

export const addresses = pgTable(
  'addresses',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').default('Home').notNull(),
    addressLine1: text('address_line1').notNull(),
    addressLine2: text('address_line2'),
    city: text('city').notNull(),
    state: text('state').notNull(),
    pincode: text('pincode').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('address_user_id_idx').on(t.userId)],
);

// ── Categories ────────────────────────────────────────────────────────────────

export const categories = pgTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text('name').unique().notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('category_is_active_idx').on(t.isActive)],
);

// ── Food Items ────────────────────────────────────────────────────────────────

export const foodItems = pgTable(
  'food_items',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    discountedPrice: decimal('discounted_price', { precision: 10, scale: 2 }),
    imageUrl: text('image_url'),
    images: text('images')
      .array()
      .default(sql`'{}'::text[]`),
    isVeg: boolean('is_veg').default(true).notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    preparationTime: integer('preparation_time').default(30).notNull(),
    rating: doublePrecision('rating').default(0).notNull(),
    totalRatings: integer('total_ratings').default(0).notNull(),
    tags: text('tags')
      .array()
      .default(sql`'{}'::text[]`),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('food_item_category_id_idx').on(t.categoryId),
    index('food_item_is_available_idx').on(t.isAvailable),
    index('food_item_is_veg_idx').on(t.isVeg),
  ],
);

// ── Cart Items ────────────────────────────────────────────────────────────────

export const cartItems = pgTable(
  'cart_items',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodItemId: text('food_item_id')
      .notNull()
      .references(() => foodItems.id),
    quantity: integer('quantity').notNull(),
    specialInstructions: text('special_instructions'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('cart_user_food_unique').on(t.userId, t.foodItemId),
    index('cart_user_id_idx').on(t.userId),
  ],
);

// ── Orders ────────────────────────────────────────────────────────────────────

export const orders = pgTable(
  'orders',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderNumber: text('order_number').unique().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    addressId: text('address_id')
      .notNull()
      .references(() => addresses.id),
    status: orderStatusEnum('status').default('PENDING').notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('40').notNull(),
    taxes: decimal('taxes', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).default('0').notNull(),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    specialInstructions: text('special_instructions'),
    estimatedDeliveryTime: integer('estimated_delivery_time'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('order_user_id_idx').on(t.userId),
    index('order_status_idx').on(t.status),
    index('order_created_at_idx').on(t.createdAt),
  ],
);

// ── Order Items ───────────────────────────────────────────────────────────────

export const orderItems = pgTable(
  'order_items',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    foodItemId: text('food_item_id')
      .notNull()
      .references(() => foodItems.id),
    name: text('name').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    specialInstructions: text('special_instructions'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('order_item_order_id_idx').on(t.orderId)],
);

// ── Order Status History ──────────────────────────────────────────────────────

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    status: orderStatusEnum('status').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('order_status_history_order_id_idx').on(t.orderId)],
);

// ── Payments ──────────────────────────────────────────────────────────────────

export const payments = pgTable(
  'payments',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: text('order_id')
      .unique()
      .notNull()
      .references(() => orders.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    razorpayOrderId: text('razorpay_order_id').unique(),
    razorpayPaymentId: text('razorpay_payment_id').unique(),
    razorpaySignature: text('razorpay_signature'),
    walletAmountUsed: decimal('wallet_amount_used', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    failureReason: text('failure_reason'),
    refundId: text('refund_id'),
    refundedAt: timestamp('refunded_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('payment_user_id_idx').on(t.userId), index('payment_status_idx').on(t.status)],
);

// ── Wallets ───────────────────────────────────────────────────────────────────

export const wallets = pgTable('wallets', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── Wallet Transactions ───────────────────────────────────────────────────────

export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    orderId: text('order_id'),
    type: walletTransactionTypeEnum('type').notNull(),
    reason: walletTransactionReasonEnum('reason').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
    description: text('description').notNull(),
    referenceId: text('reference_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('wallet_tx_wallet_id_idx').on(t.walletId),
    index('wallet_tx_order_id_idx').on(t.orderId),
  ],
);

// ── Notifications ─────────────────────────────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data').default({}),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('notification_user_id_idx').on(t.userId),
    index('notification_is_read_idx').on(t.isRead),
    index('notification_created_at_idx').on(t.createdAt),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  cartItems: many(cartItems),
  orders: many(orders),
  payments: many(payments),
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  notifications: many(notifications),
  otpVerifications: many(otpVerifications),
}));

export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
  user: one(users, { fields: [otpVerifications.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  foodItems: many(foodItems),
}));

export const foodItemsRelations = relations(foodItems, ({ one, many }) => ({
  category: one(categories, { fields: [foodItems.categoryId], references: [categories.id] }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  foodItem: one(foodItems, { fields: [cartItems.foodItemId], references: [foodItems.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  deliveryAddress: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  items: many(orderItems),
  payment: one(payments, { fields: [orders.id], references: [payments.orderId] }),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  foodItem: one(foodItems, { fields: [orderItems.foodItemId], references: [foodItems.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, { fields: [walletTransactions.walletId], references: [wallets.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
