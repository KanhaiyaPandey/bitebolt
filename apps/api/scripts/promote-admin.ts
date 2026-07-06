import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';

import * as schema from '../src/db/schema';
import { users } from '../src/db/schema';

loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

const PHONE = process.argv[2];
if (!PHONE) {
  console.error('Usage: npx tsx scripts/promote-admin.ts <phone>');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  const [user] = await db.select().from(users).where(eq(users.phone, PHONE));

  if (!user) {
    // Upsert: create with ADMIN role if doesn't exist
    const [created] = await db
      .insert(users)
      .values({ phone: PHONE, role: 'ADMIN' })
      .returning();
    console.log(`✅ Created new ADMIN user: ${created.phone} (id: ${created.id})`);
  } else {
    const [updated] = await db
      .update(users)
      .set({ role: 'ADMIN' })
      .where(eq(users.phone, PHONE))
      .returning();
    console.log(`✅ Promoted to ADMIN: ${updated.phone} (id: ${updated.id}, role: ${updated.role})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => pool.end());
