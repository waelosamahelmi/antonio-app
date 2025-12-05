import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { printers } from './shared/schema';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    
    const client = postgres(connectionString);
    const db = drizzle({ client });
    
    console.log('✅ Database client created');
    
    // Try to query the printers table
    console.log('🔍 Checking if printers table exists...');
    const result = await db.select().from(printers).limit(1);
    
    console.log('✅ Printers table exists!');
    console.log('📊 Sample result:', result);
    
    await client.end();
    console.log('✅ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();
