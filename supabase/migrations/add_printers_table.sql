-- Add printers table for persistent printer storage
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS printers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('network', 'bluetooth')),
    address TEXT NOT NULL,
    port INTEGER,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    capabilities JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_printers_address ON printers(address);
CREATE INDEX IF NOT EXISTS idx_printers_type ON printers(type);
CREATE INDEX IF NOT EXISTS idx_printers_is_active ON printers(is_active);
CREATE INDEX IF NOT EXISTS idx_printers_is_default ON printers(is_default);

-- Enable RLS
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to printers" ON printers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to printers" ON printers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to printers" ON printers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to printers" ON printers FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_printers_updated_at 
    BEFORE UPDATE ON printers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE printers IS 'Persistent storage for configured printer devices';
COMMENT ON COLUMN printers.id IS 'Unique identifier for the printer (usually address:port)';
COMMENT ON COLUMN printers.name IS 'Human-readable name for the printer';
COMMENT ON COLUMN printers.type IS 'Type of printer connection (network, bluetooth, usb)';
COMMENT ON COLUMN printers.address IS 'IP address for network printers, MAC address for Bluetooth';
COMMENT ON COLUMN printers.port IS 'Port number for network printers';
COMMENT ON COLUMN printers.is_default IS 'Whether this is the default printer';
COMMENT ON COLUMN printers.is_active IS 'Whether this printer is active/enabled';
COMMENT ON COLUMN printers.capabilities IS 'JSON object containing printer capabilities';
COMMENT ON COLUMN printers.metadata IS 'JSON object containing additional printer metadata';
