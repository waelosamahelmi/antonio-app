import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please set your Supabase database URL.",
  );
}

// For Supabase, we can use either the direct PostgreSQL connection or the Supabase client
// Using direct PostgreSQL connection for better performance with Drizzle
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle({ client, schema });

// Create a pool for session storage (using pg Pool)
import { Pool } from 'pg';
export const pool = new Pool({
  connectionString: connectionString,
});

// Optional: Export Supabase client for auth and other features
let supabase: ReturnType<typeof createClient> | null = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

export { supabase };