import path from 'path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import * as schema from '../db/schema';

export type TestDb = NodePgDatabase<typeof schema>;

let container: StartedPostgreSqlContainer;
let pool: Pool;

export async function startTestDb(): Promise<{ db: TestDb; stop: () => Promise<void> }> {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const connectionUri = container.getConnectionUri();

  // DbService.onModuleInit() reads this directly from process.env
  process.env.DATABASE_URL = connectionUri;

  pool = new Pool({ connectionString: connectionUri });
  const db = drizzle(pool, { schema }) as TestDb;

  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../../drizzle'),
  });

  return {
    db,
    stop: async () => {
      await pool.end();
      await container.stop();
    },
  };
}

export async function clearTables(db: TestDb) {
  await db.execute(sql`
    TRUNCATE
      wallet_transactions, wallets,
      order_status_history, payments, order_items, orders,
      cart_items, food_items, categories,
      addresses, notifications, otp_verifications, users
    CASCADE
  `);
}
