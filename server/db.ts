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
  max: 15, // Increased pool size for better performance
  min: 2, // Maintain minimum connections
  idleTimeoutMillis: 120000, // 2 minutes
  connectionTimeoutMillis: 20000, // 20 seconds for Replit environment
  statement_timeout: 45000, // 45 seconds for complex operations
  query_timeout: 45000, // 45 seconds for complex queries
  allowExitOnIdle: true, // Allow pool to exit when idle
  keepAlive: true, // Enable TCP keep-alive
  keepAliveInitialDelayMillis: 10000, // 10 seconds
});

export const db = drizzle({ client: pool, schema });

console.log('Database setup completed successfully');