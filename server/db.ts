import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Using PostgreSQL database');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced pool size for Replit environment stability
  min: 1, // Minimum connections
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  statement_timeout: 30000, // 30 seconds
  query_timeout: 30000, // 30 seconds
  allowExitOnIdle: false, // Keep pool alive
  keepAlive: true, // Enable TCP keep-alive
  keepAliveInitialDelayMillis: 5000, // 5 seconds
});

export const db = drizzle({ client: pool, schema });

// Add graceful shutdown handler for database pool
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
});

console.log('Database setup completed successfully');