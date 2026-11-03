import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ecofone_user:secure_password@localhost:5432/ecofone',
});

export const db = drizzle(pool, { schema });
export { schema };
