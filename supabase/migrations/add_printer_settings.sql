-- Migration: Add printer settings to restaurant_settings table
-- This adds persistent printer configuration to the Supabase database

ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS default_printer_id TEXT,
ADD COLUMN IF NOT EXISTS printer_auto_reconnect BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS printer_tab_sticky BOOLEAN DEFAULT true;

-- Update the table comment
COMMENT ON TABLE restaurant_settings IS 'Restaurant configuration including hours, status, and printer settings';
COMMENT ON COLUMN restaurant_settings.default_printer_id IS 'ID of the default/preferred printer device';
COMMENT ON COLUMN restaurant_settings.printer_auto_reconnect IS 'Whether to automatically reconnect to the last used printer on app start';
COMMENT ON COLUMN restaurant_settings.printer_tab_sticky IS 'Whether the printer tab should remain active/sticky in the UI';
