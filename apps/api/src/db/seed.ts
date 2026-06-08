import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';
import { categories, foodItems, users } from './schema';

// `turbo` runs this script from `apps/api`, while `.env` typically lives at repo root.
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Make sure repo-root `.env` exists and contains DATABASE_URL.',
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Categories ──────────────────────────────────────────────────────────────
  const cats = await db
    .insert(categories)
    .values([
      {
        name: 'Burgers',
        slug: 'burgers',
        description: 'Juicy & delicious burgers',
        imageUrl: 'https://cdn.bitebolt.in/categories/burgers.jpg',
        sortOrder: 1,
      },
      {
        name: 'Pizza',
        slug: 'pizza',
        description: 'Fresh oven-baked pizzas',
        imageUrl: 'https://cdn.bitebolt.in/categories/pizza.jpg',
        sortOrder: 2,
      },
      {
        name: 'Biryani',
        slug: 'biryani',
        description: 'Authentic aromatic biryanis',
        imageUrl: 'https://cdn.bitebolt.in/categories/biryani.jpg',
        sortOrder: 3,
      },
      {
        name: 'Chinese',
        slug: 'chinese',
        description: 'Indo-Chinese favourites',
        imageUrl: 'https://cdn.bitebolt.in/categories/chinese.jpg',
        sortOrder: 4,
      },
      {
        name: 'Desserts',
        slug: 'desserts',
        description: 'Sweet endings',
        imageUrl: 'https://cdn.bitebolt.in/categories/desserts.jpg',
        sortOrder: 5,
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        description: 'Refreshing drinks',
        imageUrl: 'https://cdn.bitebolt.in/categories/beverages.jpg',
        sortOrder: 6,
      },
    ])
    .onConflictDoNothing()
    .returning();

  // Re-fetch all categories (may already exist from a prior seed)
  const allCats = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.sortOrder)],
  });
  const burgerCat = allCats.find((c) => c.slug === 'burgers')!;
  const pizzaCat = allCats.find((c) => c.slug === 'pizza')!;
  const biryaniCat = allCats.find((c) => c.slug === 'biryani')!;

  console.log(`✅ Categories ready (${cats.length} inserted)`);

  // ── Food Items ───────────────────────────────────────────────────────────────
  const foods = await db
    .insert(foodItems)
    .values([
      {
        categoryId: burgerCat.id,
        name: 'Classic Veg Burger',
        slug: 'classic-veg-burger',
        description: 'Crispy veggie patty with fresh lettuce, tomato, and our secret sauce',
        price: '149',
        discountedPrice: '129',
        imageUrl: 'https://cdn.bitebolt.in/foods/classic-veg-burger.jpg',
        isVeg: true,
        preparationTime: 15,
        rating: 4.5,
        totalRatings: 1240,
        tags: ['popular', 'bestseller'],
      },
      {
        categoryId: burgerCat.id,
        name: 'Chicken Zinger Burger',
        slug: 'chicken-zinger-burger',
        description: 'Spicy crispy chicken fillet, coleslaw, and zinger mayo',
        price: '199',
        imageUrl: 'https://cdn.bitebolt.in/foods/chicken-zinger-burger.jpg',
        isVeg: false,
        preparationTime: 20,
        rating: 4.7,
        totalRatings: 2890,
        tags: ['popular', 'spicy'],
      },
      {
        categoryId: pizzaCat.id,
        name: 'Margherita Pizza',
        slug: 'margherita-pizza',
        description: 'Classic tomato base, fresh mozzarella, and basil',
        price: '299',
        discountedPrice: '249',
        imageUrl: 'https://cdn.bitebolt.in/foods/margherita-pizza.jpg',
        isVeg: true,
        preparationTime: 25,
        rating: 4.4,
        totalRatings: 3100,
        tags: ['classic', 'vegetarian'],
      },
      {
        categoryId: biryaniCat.id,
        name: 'Chicken Dum Biryani',
        slug: 'chicken-biryani',
        description: 'Slow-cooked dum biryani with tender chicken and fragrant basmati rice',
        price: '299',
        imageUrl: 'https://cdn.bitebolt.in/foods/chicken-biryani.jpg',
        isVeg: false,
        preparationTime: 35,
        rating: 4.8,
        totalRatings: 5600,
        tags: ['bestseller', 'popular'],
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Food items ready (${foods.length} inserted)`);

  // ── Admin user ───────────────────────────────────────────────────────────────
  await db
    .insert(users)
    .values({
      phone: '9999999999',
      name: 'BiteBolt Admin',
      email: 'admin@bitebolt.in',
      role: 'ADMIN',
    })
    .onConflictDoNothing();

  console.log('✅ Admin user ready (phone: 9999999999)');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => pool.end());
