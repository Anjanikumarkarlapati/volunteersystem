import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/volunteer_management'
});

async function run() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema...');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');

    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`Reading seed from ${seedPath}...`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log('Applying seed data...');
      await client.query(seedSql);
      console.log('Seed data applied successfully.');
    }
  } catch (error) {
    console.error('Error applying schema/seed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
