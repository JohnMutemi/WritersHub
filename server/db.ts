// filepath: c:\Users\Sam\Desktop\sam\CODEZONE\WritersHub\server\db.ts
import 'dotenv/config';
import pkg from 'pg'; // import the default export from pg
const { Pool } = pkg; // destructure Pool from the default export
import { drizzle } from 'drizzle-orm/node-postgres'; // use node-postgres version for local db
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?'
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool, { schema });
