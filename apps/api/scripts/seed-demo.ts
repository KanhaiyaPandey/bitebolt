import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';

import * as schema from '../src/db/schema';
import {
  addresses,
  foodItems,
  orderItems,
  orders,
  payments,
  users,
  walletTransactions,
  wallets,
} from '../src/db/schema';

loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seedOrders() {
  console.log('🌱 Seeding complete demo data for 9653158855...');

  // 1. Ensure Admin User
  const adminPhone = '9653158855';
  let admin = await db.query.users.findFirst({ where: eq(users.phone, adminPhone) });
  if (!admin) {
    console.log('Creating admin user...');
    const [newUser] = await db.insert(users).values({ phone: adminPhone, name: 'Admin Demo', role: 'ADMIN' }).returning();
    admin = newUser;
  }

  // 2. Ensure Categories
  let categoriesData = await db.query.categories.findMany({ limit: 3 });
  if (categoriesData.length === 0) {
    console.log('Creating categories...');
    categoriesData = await db.insert(schema.categories).values([
      { name: 'Burgers', slug: 'burgers', imageUrl: 'https://cdn.bitebolt.in/burgers.jpg' },
      { name: 'Pizzas', slug: 'pizzas', imageUrl: 'https://cdn.bitebolt.in/pizzas.jpg' },
      { name: 'Drinks', slug: 'drinks', imageUrl: 'https://cdn.bitebolt.in/drinks.jpg' },
    ]).returning();
  }

  // 3. Ensure Food Items
  let foods = await db.query.foodItems.findMany({ limit: 5 });
  if (foods.length === 0) {
    console.log('Creating food items...');
    foods = await db.insert(foodItems).values([
      { categoryId: categoriesData[0].id, name: 'Classic Burger', slug: 'classic-burger', description: 'Juicy beef patty', price: '199', imageUrl: 'https://cdn.bitebolt.in/burger1.jpg' },
      { categoryId: categoriesData[0].id, name: 'Cheese Burger', slug: 'cheese-burger', description: 'Extra cheese', price: '249', imageUrl: 'https://cdn.bitebolt.in/burger2.jpg' },
      { categoryId: categoriesData[1].id, name: 'Margherita', slug: 'margherita', description: 'Classic cheese pizza', price: '299', imageUrl: 'https://cdn.bitebolt.in/pizza1.jpg' },
      { categoryId: categoriesData[1].id, name: 'Pepperoni', slug: 'pepperoni', description: 'Spicy pepperoni', price: '399', imageUrl: 'https://cdn.bitebolt.in/pizza2.jpg' },
      { categoryId: categoriesData[2].id, name: 'Coke', slug: 'coke', description: 'Chilled beverage', price: '60', imageUrl: 'https://cdn.bitebolt.in/coke.jpg' },
    ]).returning();
  }

  // 4. Create Dummy Clients
  const clientPhones = ['9876543210', '9876543211', '9876543212'];
  const clientNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar'];
  const clients = [];
  
  for (let i = 0; i < clientPhones.length; i++) {
    let client = await db.query.users.findFirst({ where: eq(users.phone, clientPhones[i]) });
    if (!client) {
      const [newClient] = await db.insert(users).values({ phone: clientPhones[i], name: clientNames[i], role: 'CUSTOMER' }).returning();
      client = newClient;
      await db.insert(addresses).values({
        userId: client.id,
        addressLine1: `12${i} Dummy St`,
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
      });
    }
    clients.push(client);
  }

  // 5. Create Orders and Payments
  console.log('Creating orders and payments...');
  const today = new Date();
  
  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length];
    const orderDate = new Date(today);
    orderDate.setDate(today.getDate() - (i % 5));
    orderDate.setHours(12 + Math.floor(Math.random() * 8), 30, 0, 0);

    let address = await db.query.addresses.findFirst({ where: eq(addresses.userId, client.id) });

    const totalStr = (150 + Math.random() * 500).toFixed(2);
    const statusOptions: any[] = ['DELIVERED', 'PENDING', 'ACCEPTED', 'PREPARING'];
    const status = i === 0 ? 'PENDING' : statusOptions[Math.floor(Math.random() * statusOptions.length)];

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: `ORD-${Date.now()}-${i}`,
        userId: client.id,
        addressId: address!.id,
        status,
        subtotal: totalStr,
        deliveryFee: '40',
        taxes: '20',
        total: (Number(totalStr) + 40 + 20).toFixed(2),
        createdAt: orderDate,
      })
      .returning();

    // Order Items
    const food = foods[Math.floor(Math.random() * foods.length)];
    await db.insert(orderItems).values({
      orderId: order.id,
      foodItemId: food.id,
      name: food.name,
      price: food.price.toString(),
      quantity: 2,
      subtotal: (Number(food.price) * 2).toString(),
    });
    
    // Payments
    await db.insert(payments).values({
      orderId: order.id,
      userId: client.id,
      amount: (Number(totalStr) + 40 + 20).toFixed(2),
      method: i % 2 === 0 ? 'UPI' : 'CARD',
      status: 'CAPTURED',
      createdAt: orderDate,
    });
  }

  // 6. Wallet + Wallet Transactions (top-up then a spend, per client)
  console.log('Creating wallets and wallet transactions...');
  for (const client of clients) {
    let wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, client.id) });
    if (!wallet) {
      const [newWallet] = await db.insert(wallets).values({ userId: client.id, balance: '150.00' }).returning();
      wallet = newWallet;

      await db.insert(walletTransactions).values([
        {
          walletId: wallet.id,
          type: 'CREDIT',
          reason: 'TOP_UP',
          amount: '200.00',
          balanceAfter: '200.00',
          description: 'Wallet top-up via UPI',
        },
        {
          walletId: wallet.id,
          type: 'DEBIT',
          reason: 'ORDER_PAYMENT',
          amount: '50.00',
          balanceAfter: '150.00',
          description: 'Used towards an order payment',
        },
      ]);
    }
  }

  console.log('✅ Demo data fully seeded successfully.');
}

seedOrders()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => pool.end());
