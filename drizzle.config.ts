import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for Supabase connection");
}

export default defineConfig({
  out: "./supabase/migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Supabase specific settings
  schemaFilter: ["public"],
  tablesFilter: ["*"],
});
