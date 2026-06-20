import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const isLocal = env.databaseUrl.includes('localhost') || env.databaseUrl.includes('127.0.0.1');

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: !isLocal ? { rejectUnauthorized: false } : false,
});

export const query = (text, params = []) => pool.query(text, params);

export const withTransaction = async callback => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
