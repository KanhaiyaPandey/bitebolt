import type { Config } from 'drizzle-kit';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

// `drizzle-kit` runs from `apps/api`, while `.env` typically lives at repo root.
loadEnv({ path: path.resolve(process.cwd(), '../../.env') });

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
