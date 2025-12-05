import dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';

async function fixPrintersTable() {
  try {
    console.log('🔧 Fixing printers table...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    
    const sql = postgres(connectionString);
    
    // Drop the old table and recreate it with the correct schema
    console.log('🗑️ Dropping old printers table if it exists...');
    await sql`DROP TABLE IF EXISTS printers CASCADE`;
    
    console.log('✨ Creating new printers table...');
    await sql`
      CREATE TABLE printers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        port INTEGER NOT NULL,
        printer_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        font_settings JSONB DEFAULT '{
          "restaurantName": {"width": 2, "height": 2},
          "header": {"width": 2, "height": 2},
          "orderNumber": {"width": 2, "height": 3},
          "menuItems": {"width": 2, "height": 2},
          "toppings": {"width": 1, "height": 1},
          "totals": {"width": 2, "height": 2},
          "finalTotal": {"width": 3, "height": 3},
          "characterSpacing": 0
        }'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('📇 Creating index...');
    await sql`CREATE INDEX idx_printers_is_active ON printers(is_active)`;
    
    await sql.end();
    
    console.log('✅ Printers table created successfully!');
    console.log('🎉 You can now save printers and their font settings!');
    
  } catch (error) {
    console.error('❌ Failed to fix printers table:');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error details:', error);
    process.exit(1);
  }
}

fixPrintersTable();
