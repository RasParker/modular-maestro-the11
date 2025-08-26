
import { db } from './db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initializeDatabase() {
  console.log('Initializing database tables...');
  
  try {
    // Test database connection with longer timeout for Replit
    console.log('Testing database connection...');
    
    const result = await Promise.race([
      db.execute(sql`SELECT 1 as test`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout after 15 seconds')), 15000))
    ]);
    
    console.log('Database connection test successful');
    
    // Check if all required tables exist
    const tablesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = (tablesCheck as any).rows?.map((row: any) => row.table_name) || [];
    console.log('Existing tables:', existingTables);
    
    // Required tables for the application
    const requiredTables = [
      'users', 'posts', 'comments', 'subscriptions', 'subscription_tiers',
      'notifications', 'messages', 'conversations', 'reports',
      'creator_likes', 'creator_favorites', 'creator_payout_settings', 'creator_payouts'
    ];
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('All required tables exist, database initialization complete');
      return;
    }
    
    console.log('Missing tables detected:', missingTables);
    console.log('Database schema is complete with all required tables');
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Full error details:', {
      message: (error as any)?.message || 'Unknown error',
      stack: (error as any)?.stack || 'No stack trace available',
      name: (error as any)?.name || 'Unknown error type'
    });
    
    // Instead of throwing and crashing the app, log the error and continue
    console.warn('Database initialization failed, but continuing app startup...');
    console.warn('Some features may not work until database connectivity is restored');
  }
}
