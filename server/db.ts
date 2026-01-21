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

// Configure postgres client with connection options for better resilience
// Using smaller pool size and shorter timeouts to work better with Supabase's PgBouncer
const client = postgres(connectionString, {
  max: 3,                     // Smaller pool to reduce connection pressure
  idle_timeout: 10,           // Close idle connections faster
  connect_timeout: 10,        // Shorter connection timeout
  max_lifetime: 60 * 5,       // Max connection lifetime (5 minutes)
  prepare: false,             // Required for Supabase transaction pooler (PgBouncer)
  connection: {
    application_name: 'antonio-admin',
  },
  onnotice: () => {},         // Suppress notice messages
});

export const db = drizzle({ client, schema });

// Create a pool for session storage (using pg Pool)
import { Pool } from 'pg';
export const pool = new Pool({
  connectionString: connectionString,
  max: 3,                       // Small pool for session storage
  idleTimeoutMillis: 10000,     // 10 seconds
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,        // Allow process to exit when pool is idle
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