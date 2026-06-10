import { addresses, cartItems, categories, foodItems, orders, otpVerifications, users, wallets } from '../db/schema';

import type { TestDb } from './db-helper';

export async function seedUser(db: TestDb, overrides: Record<string, unknown> = {}) {
  const [user] = await db
    .insert(users)
    .values({ phone: '9876543210', name: 'Test User', email: 'test@example.com', ...overrides })
    .returning();
  return user;
}

export async function seedWallet(db: TestDb, userId: string, balance = '100.00') {
  const [wallet] = await db.insert(wallets).values({ userId, balance }).returning();
  return wallet;
}

export async function seedCategory(db: TestDb, overrides: Record<string, unknown> = {}) {
  const [category] = await db
    .insert(categories)
    .values({ name: 'Main Course', slug: 'main-course', ...overrides })
    .returning();
  return category;
}

export async function seedFoodItem(db: TestDb, categoryId: string, overrides: Record<string, unknown> = {}) {
  const [food] = await db
    .insert(foodItems)
    .values({
      categoryId,
      name: 'Paneer Butter Masala',
      slug: 'paneer-butter-masala',
      price: '250.00',
      isVeg: true,
      isAvailable: true,
      ...overrides,
    })
    .returning();
  return food;
}

export async function seedAddress(db: TestDb, userId: string, overrides: Record<string, unknown> = {}) {
  const [address] = await db
    .insert(addresses)
    .values({
      userId,
      label: 'Home',
      addressLine1: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      ...overrides,
    })
    .returning();
  return address;
}

export async function seedCartItem(
  db: TestDb,
  userId: string,
  foodItemId: string,
  quantity = 1,
) {
  const [item] = await db
    .insert(cartItems)
    .values({ userId, foodItemId, quantity })
    .returning();
  return item;
}

export async function seedOtp(db: TestDb, phone: string, otp = '123456') {
  const [record] = await db
    .insert(otpVerifications)
    .values({
      phone,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })
    .returning();
  return record;
}

export async function seedOrder(
  db: TestDb,
  userId: string,
  addressId: string,
  overrides: Record<string, unknown> = {},
) {
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: `BB-TEST-${Date.now()}`,
      userId,
      addressId,
      subtotal: '250.00',
      deliveryFee: '40.00',
      taxes: '13.00',
      total: '303.00',
      ...overrides,
    })
    .returning();
  return order;
}
