// db.ts
import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Select correct DB URL based on NODE_ENV
let databaseUrl: string | undefined;

if (process.env.NODE_ENV === 'production') {
  databaseUrl = process.env.DATABASE_URL_PROD_EXTERNAL;
} else {
  databaseUrl = process.env.DATABASE_URL_DEV;
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set for the current environment.');
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
