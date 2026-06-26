import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';
import { appConfig, categories, foodItemCombinations, foodItems, users } from './schema';

loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Make sure repo-root `.env` exists and contains DATABASE_URL.',
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&h=400&fit=crop&auto=format&q=80`;

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clear everything ─────────────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await pool.query('TRUNCATE users, categories CASCADE');
  console.log('✅ Database cleared');

  // ── Categories ───────────────────────────────────────────────────────────────
  await db.insert(categories).values([
    {
      name: 'Burgers',
      slug: 'burgers',
      description: 'Juicy & delicious burgers',
      imageUrl: img('1568901346375-b0a94e8cb498'),
      sortOrder: 1,
    },
    {
      name: 'Pizza',
      slug: 'pizza',
      description: 'Fresh oven-baked pizzas',
      imageUrl: img('1565299624946-b28f40a0ae38'),
      sortOrder: 2,
    },
    {
      name: 'Biryani',
      slug: 'biryani',
      description: 'Authentic aromatic biryanis',
      imageUrl: img('1563379926898-05f4575a45d8'),
      sortOrder: 3,
    },
    {
      name: 'Chinese',
      slug: 'chinese',
      description: 'Indo-Chinese favourites',
      imageUrl: img('1512058564366-18510be2db19'),
      sortOrder: 4,
    },
    {
      name: 'Desserts',
      slug: 'desserts',
      description: 'Sweet endings',
      imageUrl: img('1606313564200-e75d5e30476c'),
      sortOrder: 5,
    },
    {
      name: 'Beverages',
      slug: 'beverages',
      description: 'Refreshing drinks',
      imageUrl: img('1568702846914-96b305d2aaeb'),
      sortOrder: 6,
    },
    {
      name: 'South Indian',
      slug: 'south-indian',
      description: 'Authentic South Indian flavours',
      imageUrl: img('1630383249896-424e482df921'),
      sortOrder: 7,
    },
  ]);

  const allCats = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.sortOrder)],
  });

  const cat = (slug: string) => allCats.find((c) => c.slug === slug)!.id;

  console.log(`✅ ${allCats.length} categories ready`);

  // ── Food Items ───────────────────────────────────────────────────────────────
  const inserted = await db
    .insert(foodItems)
    .values([
      // ── Burgers (7) ──────────────────────────────────────────────────────────
      {
        categoryId: cat('burgers'),
        name: 'Classic Veg Burger',
        slug: 'classic-veg-burger',
        description: 'Crispy veggie patty with fresh lettuce, tomato, and our secret sauce',
        price: '149',
        discountedPrice: '129',
        imageUrl: img('1571091718767-18b5b1457add'),
        isVeg: true,
        preparationTime: 15,
        rating: 4.5,
        totalRatings: 1240,
        tags: ['popular', 'bestseller'],
      },
      {
        categoryId: cat('burgers'),
        name: 'Chicken Zinger Burger',
        slug: 'chicken-zinger-burger',
        description: 'Spicy crispy chicken fillet, coleslaw, and zinger mayo',
        price: '199',
        imageUrl: img('1568901346375-b0a94e8cb498'),
        isVeg: false,
        preparationTime: 20,
        rating: 4.7,
        totalRatings: 2890,
        tags: ['popular', 'spicy', 'bestseller'],
      },
      {
        categoryId: cat('burgers'),
        name: 'Double Smash Burger',
        slug: 'double-smash-burger',
        description: 'Two smashed beef patties, American cheese, pickles, and smash sauce',
        price: '279',
        discountedPrice: '249',
        imageUrl: img('1550547660-d9450f859349'),
        isVeg: false,
        preparationTime: 25,
        rating: 4.6,
        totalRatings: 980,
        tags: ['popular', 'new'],
      },
      {
        categoryId: cat('burgers'),
        name: 'BBQ Chicken Burger',
        slug: 'bbq-chicken-burger',
        description: 'Grilled chicken, smoky BBQ sauce, caramelised onions, and crispy bacon',
        price: '219',
        imageUrl: img('1586816001966-79b736744398'),
        isVeg: false,
        preparationTime: 20,
        rating: 4.5,
        totalRatings: 1560,
        tags: ['smoky', 'spicy'],
      },
      {
        categoryId: cat('burgers'),
        name: 'Mushroom Swiss Burger',
        slug: 'mushroom-swiss-burger',
        description: 'Sautéed mushrooms, Swiss cheese, and garlic aioli on a brioche bun',
        price: '179',
        discountedPrice: '159',
        imageUrl: img('1550317138-10000687a72b'),
        isVeg: true,
        preparationTime: 18,
        rating: 4.3,
        totalRatings: 870,
        tags: ['vegetarian'],
      },
      {
        categoryId: cat('burgers'),
        name: 'Paneer Tikka Burger',
        slug: 'paneer-tikka-burger',
        description: 'Tandoori paneer tikka patty with mint chutney and pickled onions',
        price: '169',
        imageUrl: img('1606755456206-b25206cde27e'),
        isVeg: true,
        preparationTime: 18,
        rating: 4.4,
        totalRatings: 1100,
        tags: ['popular', 'vegetarian'],
      },
      {
        categoryId: cat('burgers'),
        name: 'Crispy Fish Burger',
        slug: 'crispy-fish-burger',
        description: 'Beer-battered fish fillet with tartare sauce and fresh coleslaw',
        price: '229',
        imageUrl: img('1562802378-063ec186a863'),
        isVeg: false,
        preparationTime: 22,
        rating: 4.2,
        totalRatings: 650,
        tags: ['seafood'],
      },

      // ── Pizza (6) ────────────────────────────────────────────────────────────
      {
        categoryId: cat('pizza'),
        name: 'Margherita Pizza',
        slug: 'margherita-pizza',
        description: 'Classic tomato base, fresh mozzarella, basil, and extra virgin olive oil',
        price: '299',
        discountedPrice: '249',
        imageUrl: img('1565299624946-b28f40a0ae38'),
        isVeg: true,
        preparationTime: 25,
        rating: 4.4,
        totalRatings: 3100,
        tags: ['classic', 'vegetarian', 'bestseller'],
      },
      {
        categoryId: cat('pizza'),
        name: 'Chicken BBQ Pizza',
        slug: 'chicken-bbq-pizza',
        description: 'Smoky BBQ base, grilled chicken, red onions, and bell peppers',
        price: '349',
        imageUrl: img('1513104890138-7c749659a591'),
        isVeg: false,
        preparationTime: 30,
        rating: 4.6,
        totalRatings: 2200,
        tags: ['popular', 'smoky'],
      },
      {
        categoryId: cat('pizza'),
        name: 'Paneer Tikka Pizza',
        slug: 'paneer-tikka-pizza',
        description: 'Tandoori base, paneer tikka, capsicum, and mozzarella',
        price: '329',
        imageUrl: img('1604382354936-07c5d9983bd3'),
        isVeg: true,
        preparationTime: 28,
        rating: 4.5,
        totalRatings: 1900,
        tags: ['popular', 'vegetarian'],
      },
      {
        categoryId: cat('pizza'),
        name: 'Pepperoni Blast',
        slug: 'pepperoni-blast',
        description: 'Double pepperoni, San Marzano tomato sauce, and smoked mozzarella',
        price: '369',
        discountedPrice: '329',
        imageUrl: img('1628840042765-356cda07504e'),
        isVeg: false,
        preparationTime: 30,
        rating: 4.7,
        totalRatings: 3400,
        tags: ['popular', 'bestseller'],
      },
      {
        categoryId: cat('pizza'),
        name: 'Four Cheese Pizza',
        slug: 'four-cheese-pizza',
        description: 'Mozzarella, cheddar, parmesan, and gorgonzola on a cream sauce base',
        price: '379',
        imageUrl: img('1574071318508-1cdbab80d002'),
        isVeg: true,
        preparationTime: 28,
        rating: 4.6,
        totalRatings: 1800,
        tags: ['vegetarian', 'indulgent'],
      },
      {
        categoryId: cat('pizza'),
        name: 'Veggie Supreme',
        slug: 'veggie-supreme',
        description: 'Mushrooms, olives, capsicum, sweetcorn, and onions on tomato base',
        price: '319',
        discountedPrice: '279',
        imageUrl: img('1571407970349-bc81e71e9774'),
        isVeg: true,
        preparationTime: 25,
        rating: 4.3,
        totalRatings: 1200,
        tags: ['vegetarian'],
      },

      // ── Biryani (6) ──────────────────────────────────────────────────────────
      {
        categoryId: cat('biryani'),
        name: 'Chicken Dum Biryani',
        slug: 'chicken-dum-biryani',
        description: 'Slow-cooked dum biryani with tender chicken and fragrant basmati rice',
        price: '299',
        imageUrl: img('1563379926898-05f4575a45d8'),
        isVeg: false,
        preparationTime: 35,
        rating: 4.8,
        totalRatings: 5600,
        tags: ['popular', 'bestseller'],
      },
      {
        categoryId: cat('biryani'),
        name: 'Mutton Biryani',
        slug: 'mutton-biryani',
        description: 'Succulent mutton pieces slow-cooked with caramelised onions and saffron rice',
        price: '379',
        discountedPrice: '349',
        imageUrl: img('1609501676725-7186f017a4b7'),
        isVeg: false,
        preparationTime: 45,
        rating: 4.7,
        totalRatings: 3200,
        tags: ['premium', 'bestseller'],
      },
      {
        categoryId: cat('biryani'),
        name: 'Veg Biryani',
        slug: 'veg-biryani',
        description: 'Garden vegetables and paneer slow-cooked with aromatic basmati rice',
        price: '249',
        imageUrl: img('1596797038530-2c107229654b'),
        isVeg: true,
        preparationTime: 30,
        rating: 4.4,
        totalRatings: 2100,
        tags: ['vegetarian', 'popular'],
      },
      {
        categoryId: cat('biryani'),
        name: 'Egg Biryani',
        slug: 'egg-biryani',
        description: 'Perfectly boiled eggs dum-cooked with spiced basmati and fried onions',
        price: '269',
        imageUrl: img('1589302168068-964664d93dc0'),
        isVeg: false,
        preparationTime: 30,
        rating: 4.5,
        totalRatings: 2800,
        tags: ['popular'],
      },
      {
        categoryId: cat('biryani'),
        name: 'Hyderabadi Dum Biryani',
        slug: 'hyderabadi-dum-biryani',
        description: 'Authentic Hyderabadi kacchi biryani with marinated chicken and saffron milk',
        price: '329',
        discountedPrice: '299',
        imageUrl: img('1631515243349-e0cb75fb8d3a'),
        isVeg: false,
        preparationTime: 40,
        rating: 4.8,
        totalRatings: 4100,
        tags: ['bestseller', 'spicy', 'authentic'],
      },
      {
        categoryId: cat('biryani'),
        name: 'Paneer Biryani',
        slug: 'paneer-biryani',
        description: 'Soft paneer cubes layered with spiced basmati rice and caramelised onions',
        price: '279',
        imageUrl: img('1588166524941-3bf61a9c41db'),
        isVeg: true,
        preparationTime: 30,
        rating: 4.4,
        totalRatings: 1500,
        tags: ['vegetarian'],
      },

      // ── Chinese (6) ──────────────────────────────────────────────────────────
      {
        categoryId: cat('chinese'),
        name: 'Veg Fried Rice',
        slug: 'veg-fried-rice',
        description: 'Wok-tossed rice with vegetables, eggs, and soy sauce',
        price: '179',
        discountedPrice: '149',
        imageUrl: img('1512058564366-18510be2db19'),
        isVeg: true,
        preparationTime: 20,
        rating: 4.3,
        totalRatings: 1800,
        tags: ['popular', 'vegetarian'],
      },
      {
        categoryId: cat('chinese'),
        name: 'Chicken Fried Rice',
        slug: 'chicken-fried-rice',
        description: 'Wok-tossed jasmine rice with chicken, spring onions, and soy',
        price: '199',
        imageUrl: img('1603133872878-684f208fb84b'),
        isVeg: false,
        preparationTime: 20,
        rating: 4.5,
        totalRatings: 2400,
        tags: ['popular', 'bestseller'],
      },
      {
        categoryId: cat('chinese'),
        name: 'Hakka Noodles',
        slug: 'hakka-noodles',
        description: 'Stir-fried noodles with vegetables, soy sauce, and chilli oil',
        price: '169',
        imageUrl: img('1569718212165-3a8278d5f624'),
        isVeg: true,
        preparationTime: 18,
        rating: 4.2,
        totalRatings: 1600,
        tags: ['vegetarian', 'popular'],
      },
      {
        categoryId: cat('chinese'),
        name: 'Chicken Manchurian',
        slug: 'chicken-manchurian',
        description: 'Crispy chicken balls tossed in a spicy Manchurian gravy',
        price: '229',
        discountedPrice: '199',
        imageUrl: img('1563379091339-03b21ab4a4f8'),
        isVeg: false,
        preparationTime: 25,
        rating: 4.6,
        totalRatings: 2100,
        tags: ['popular', 'spicy', 'bestseller'],
      },
      {
        categoryId: cat('chinese'),
        name: 'Chilli Paneer',
        slug: 'chilli-paneer',
        description: 'Crispy paneer cubes tossed with capsicum, onion, and chilli sauce',
        price: '219',
        imageUrl: img('1604908176997-125f25cc6f3d'),
        isVeg: true,
        preparationTime: 22,
        rating: 4.5,
        totalRatings: 1900,
        tags: ['popular', 'vegetarian', 'spicy'],
      },
      {
        categoryId: cat('chinese'),
        name: 'Veg Spring Rolls',
        slug: 'veg-spring-rolls',
        description: 'Crispy golden rolls filled with cabbage, carrots, and glass noodles',
        price: '149',
        discountedPrice: '129',
        imageUrl: img('1559847844-5315695dadae'),
        isVeg: true,
        preparationTime: 15,
        rating: 4.3,
        totalRatings: 1300,
        tags: ['starter', 'vegetarian'],
      },

      // ── Desserts (6) ─────────────────────────────────────────────────────────
      {
        categoryId: cat('desserts'),
        name: 'Chocolate Brownie',
        slug: 'chocolate-brownie',
        description: 'Fudgy dark chocolate brownie with a crinkle top and walnuts',
        price: '149',
        discountedPrice: '129',
        imageUrl: img('1606313564200-e75d5e30476c'),
        isVeg: true,
        preparationTime: 10,
        rating: 4.5,
        totalRatings: 1700,
        tags: ['popular', 'sweet'],
      },
      {
        categoryId: cat('desserts'),
        name: 'Gulab Jamun',
        slug: 'gulab-jamun',
        description: 'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup',
        price: '99',
        imageUrl: img('1601050690597-df0568f70950'),
        isVeg: true,
        preparationTime: 10,
        rating: 4.6,
        totalRatings: 2200,
        tags: ['classic', 'sweet', 'bestseller'],
      },
      {
        categoryId: cat('desserts'),
        name: 'Chocolate Lava Cake',
        slug: 'chocolate-lava-cake',
        description: 'Warm molten chocolate centre cake served with vanilla ice cream',
        price: '179',
        imageUrl: img('1617305855058-336d24456869'),
        isVeg: true,
        preparationTime: 15,
        rating: 4.7,
        totalRatings: 2900,
        tags: ['popular', 'sweet', 'bestseller'],
      },
      {
        categoryId: cat('desserts'),
        name: 'Mango Cheesecake',
        slug: 'mango-cheesecake',
        description:
          'Creamy baked cheesecake with Alphonso mango compote on a buttery biscuit base',
        price: '199',
        discountedPrice: '169',
        imageUrl: img('1565958011703-44f9829ba187'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.6,
        totalRatings: 1500,
        tags: ['premium', 'sweet'],
      },
      {
        categoryId: cat('desserts'),
        name: 'Vanilla Ice Cream',
        slug: 'vanilla-ice-cream',
        description: 'Three scoops of premium Madagascar vanilla ice cream',
        price: '129',
        imageUrl: img('1551024709-8f23befc548d'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.4,
        totalRatings: 1400,
        tags: ['classic', 'sweet'],
      },
      {
        categoryId: cat('desserts'),
        name: 'Rasmalai',
        slug: 'rasmalai',
        description: 'Soft cottage cheese patties soaked in chilled saffron-cardamom milk',
        price: '149',
        imageUrl: img('1571506165871-ee72a35bc9d4'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.5,
        totalRatings: 1100,
        tags: ['classic', 'sweet'],
      },

      // ── Beverages (5) ────────────────────────────────────────────────────────
      {
        categoryId: cat('beverages'),
        name: 'Mango Lassi',
        slug: 'mango-lassi',
        description: 'Thick Alphonso mango blended with chilled yoghurt and a hint of cardamom',
        price: '99',
        discountedPrice: '89',
        imageUrl: img('1567620905732-2d1ec7ab7445'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.6,
        totalRatings: 2800,
        tags: ['popular', 'refreshing', 'bestseller'],
      },
      {
        categoryId: cat('beverages'),
        name: 'Chocolate Milkshake',
        slug: 'chocolate-milkshake',
        description: 'Thick Belgian chocolate milkshake with whipped cream and chocolate drizzle',
        price: '129',
        imageUrl: img('1568702846914-96b305d2aaeb'),
        isVeg: true,
        preparationTime: 7,
        rating: 4.5,
        totalRatings: 1900,
        tags: ['popular', 'sweet'],
      },
      {
        categoryId: cat('beverages'),
        name: 'Fresh Lime Soda',
        slug: 'fresh-lime-soda',
        description: 'Freshly squeezed lime with sparkling water, black salt, and mint',
        price: '79',
        imageUrl: img('1556679343-c7306c1976bc'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.3,
        totalRatings: 1500,
        tags: ['refreshing'],
      },
      {
        categoryId: cat('beverages'),
        name: 'Cold Coffee',
        slug: 'cold-coffee',
        description: 'Chilled brewed coffee blended with milk, sugar, and ice',
        price: '119',
        discountedPrice: '99',
        imageUrl: img('1461023058943-07fcbe16d735'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.6,
        totalRatings: 3200,
        tags: ['popular', 'refreshing', 'bestseller'],
      },
      {
        categoryId: cat('beverages'),
        name: 'Strawberry Smoothie',
        slug: 'strawberry-smoothie',
        description: 'Fresh strawberries blended with yoghurt, honey, and crushed ice',
        price: '139',
        imageUrl: img('1553530979-fbb9e4aee36f'),
        isVeg: true,
        preparationTime: 5,
        rating: 4.4,
        totalRatings: 1100,
        tags: ['healthy', 'refreshing'],
      },

      // ── South Indian (5) ─────────────────────────────────────────────────────
      {
        categoryId: cat('south-indian'),
        name: 'Masala Dosa',
        slug: 'masala-dosa',
        description:
          'Crispy rice crepe filled with spiced potato masala, served with sambar and chutneys',
        price: '149',
        discountedPrice: '129',
        imageUrl: img('1630383249896-424e482df921'),
        isVeg: true,
        preparationTime: 20,
        rating: 4.7,
        totalRatings: 3500,
        tags: ['popular', 'vegetarian', 'bestseller'],
      },
      {
        categoryId: cat('south-indian'),
        name: 'Idli Sambar',
        slug: 'idli-sambar',
        description:
          'Fluffy steamed rice cakes served with tangy lentil sambar and coconut chutney',
        price: '99',
        imageUrl: img('1589301760014-d929f3979dbc'),
        isVeg: true,
        preparationTime: 15,
        rating: 4.5,
        totalRatings: 2100,
        tags: ['healthy', 'vegetarian', 'classic'],
      },
      {
        categoryId: cat('south-indian'),
        name: 'Medu Vada',
        slug: 'medu-vada',
        description: 'Crispy urad dal doughnuts served with sambar and coconut chutney',
        price: '119',
        imageUrl: img('1567337710282-00832b415979'),
        isVeg: true,
        preparationTime: 15,
        rating: 4.4,
        totalRatings: 1600,
        tags: ['popular', 'vegetarian'],
      },
      {
        categoryId: cat('south-indian'),
        name: 'Rava Uttapam',
        slug: 'rava-uttapam',
        description: 'Thick semolina pancake topped with onions, tomatoes, and green chilli',
        price: '149',
        imageUrl: img('1604908177522-6d8e1d694a59'),
        isVeg: true,
        preparationTime: 18,
        rating: 4.3,
        totalRatings: 900,
        tags: ['vegetarian'],
      },
      {
        categoryId: cat('south-indian'),
        name: 'Chettinad Chicken Curry',
        slug: 'chettinad-chicken-curry',
        description: 'Bold and aromatic Chettinad-spiced chicken curry served with steamed rice',
        price: '279',
        discountedPrice: '249',
        imageUrl: img('1585937421612-70a008356fbe'),
        isVeg: false,
        preparationTime: 30,
        rating: 4.6,
        totalRatings: 1200,
        tags: ['spicy', 'popular', 'authentic'],
      },
    ])
    .returning({ id: foodItems.id, slug: foodItems.slug });

  console.log(`✅ ${inserted.length} food items ready`);

  // ── Combinations ─────────────────────────────────────────────────────────────
  const f = (slug: string) => inserted.find((x) => x.slug === slug)!.id;

  const comboPairs: [string, string[]][] = [
    // Burgers → beverages & starters
    ['classic-veg-burger', ['mango-lassi', 'fresh-lime-soda', 'veg-spring-rolls']],
    ['chicken-zinger-burger', ['cold-coffee', 'chocolate-milkshake', 'veg-spring-rolls']],
    ['double-smash-burger', ['cold-coffee', 'chocolate-milkshake', 'veg-spring-rolls']],
    ['bbq-chicken-burger', ['fresh-lime-soda', 'cold-coffee']],
    ['mushroom-swiss-burger', ['mango-lassi', 'fresh-lime-soda']],
    ['paneer-tikka-burger', ['mango-lassi', 'cold-coffee']],
    ['crispy-fish-burger', ['fresh-lime-soda', 'cold-coffee']],

    // Pizza → beverages & desserts
    ['margherita-pizza', ['cold-coffee', 'fresh-lime-soda', 'chocolate-brownie']],
    ['chicken-bbq-pizza', ['cold-coffee', 'chocolate-milkshake']],
    ['paneer-tikka-pizza', ['mango-lassi', 'cold-coffee']],
    ['pepperoni-blast', ['cold-coffee', 'chocolate-milkshake', 'vanilla-ice-cream']],
    ['four-cheese-pizza', ['cold-coffee', 'fresh-lime-soda', 'chocolate-brownie']],
    ['veggie-supreme', ['mango-lassi', 'fresh-lime-soda']],

    // Biryani → lassi & desserts
    ['chicken-dum-biryani', ['mango-lassi', 'gulab-jamun', 'rasmalai']],
    ['mutton-biryani', ['mango-lassi', 'rasmalai', 'gulab-jamun']],
    ['veg-biryani', ['mango-lassi', 'gulab-jamun']],
    ['egg-biryani', ['mango-lassi', 'fresh-lime-soda']],
    ['hyderabadi-dum-biryani', ['mango-lassi', 'gulab-jamun', 'rasmalai']],
    ['paneer-biryani', ['mango-lassi', 'fresh-lime-soda']],

    // Chinese → combos with each other
    ['veg-fried-rice', ['chilli-paneer', 'veg-spring-rolls']],
    ['chicken-fried-rice', ['chicken-manchurian', 'veg-spring-rolls']],
    ['hakka-noodles', ['veg-spring-rolls', 'chilli-paneer']],
    ['chicken-manchurian', ['chicken-fried-rice', 'veg-spring-rolls']],
    ['chilli-paneer', ['veg-fried-rice', 'hakka-noodles']],
    ['veg-spring-rolls', ['chilli-paneer', 'fresh-lime-soda']],

    // Desserts → ice cream & drinks
    ['chocolate-brownie', ['vanilla-ice-cream', 'cold-coffee']],
    ['gulab-jamun', ['vanilla-ice-cream', 'rasmalai']],
    ['chocolate-lava-cake', ['vanilla-ice-cream', 'strawberry-smoothie']],
    ['mango-cheesecake', ['mango-lassi', 'strawberry-smoothie']],
    ['vanilla-ice-cream', ['chocolate-brownie', 'chocolate-lava-cake']],
    ['rasmalai', ['gulab-jamun', 'mango-lassi']],

    // Beverages → food pairings
    ['mango-lassi', ['masala-dosa', 'idli-sambar', 'chicken-dum-biryani']],
    ['chocolate-milkshake', ['chocolate-brownie', 'chocolate-lava-cake']],
    ['fresh-lime-soda', ['masala-dosa', 'medu-vada']],
    ['cold-coffee', ['chocolate-brownie', 'chocolate-lava-cake']],
    ['strawberry-smoothie', ['mango-cheesecake', 'vanilla-ice-cream']],

    // South Indian → each other & beverages
    ['masala-dosa', ['idli-sambar', 'mango-lassi', 'medu-vada']],
    ['idli-sambar', ['masala-dosa', 'mango-lassi', 'medu-vada']],
    ['medu-vada', ['idli-sambar', 'mango-lassi']],
    ['rava-uttapam', ['mango-lassi', 'fresh-lime-soda']],
    ['chettinad-chicken-curry', ['mango-lassi', 'rasmalai']],
  ];

  const comboRows = comboPairs.flatMap(([main, combos]) =>
    combos.map((combo) => ({ foodItemId: f(main), combinationId: f(combo) })),
  );

  await db.insert(foodItemCombinations).values(comboRows);
  console.log(`✅ ${comboRows.length} combination links ready`);

  // ── Admin user ───────────────────────────────────────────────────────────────
  await db.insert(users).values({
    phone: '9999999999',
    name: 'BiteBolt Admin',
    email: 'admin@bitebolt.in',
    role: 'ADMIN',
  });
  console.log('✅ Admin user ready (phone: 9999999999)');

  // ── App config defaults ──────────────────────────────────────────────────────
  await db.insert(appConfig).values({ key: 'delivery_fee', value: '40' }).onConflictDoNothing();
  console.log('✅ App config seeded (delivery_fee: 40)');

  console.log('\n🎉 Seeding complete!');
  console.log(`   • 7 categories`);
  console.log(`   • ${inserted.length} food items`);
  console.log(`   • ${comboRows.length} "goes well with" links`);
  console.log(`   • Admin: phone 9999999999`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => pool.end());
