import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[drizzle:migrate] Starting database migrations...');
    const drizzleDir = path.resolve(__dirname, '../../drizzle');
    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    await client.query('BEGIN');

    // Create migration tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at timestamptz DEFAULT now()
      )
    `);

    for (const file of sqlFiles) {
      const exists = await client.query(
        'SELECT 1 FROM "__drizzle_migrations" WHERE hash = $1',
        [file]
      );
      if (exists.rowCount === 0) {
        console.log(`[drizzle:migrate] Applying migration: ${file}`);
        const sqlContent = fs.readFileSync(path.join(drizzleDir, file), 'utf8');
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO "__drizzle_migrations" (hash) VALUES ($1)',
          [file]
        );
        console.log(`[drizzle:migrate] Applied: ${file}`);
      } else {
        console.log(`[drizzle:migrate] Skipping already applied: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log('[drizzle:migrate] All migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[drizzle:migrate] Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Direct execution
if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}
