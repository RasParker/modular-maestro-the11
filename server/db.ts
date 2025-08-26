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
  max: 10, // Increased pool size for better performance
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000, // Increased for Replit environment
  statement_timeout: 30000, // Increased for complex operations
  query_timeout: 30000, // Increased for complex queries
  allowExitOnIdle: true, // Allow pool to exit when idle
});

export const db = drizzle({ client: pool, schema });

console.log('Database setup completed successfully');