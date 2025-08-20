-- Add missing tables to existing Supabase database
-- Run this in your Supabase SQL editor

-- Create topping_groups table
CREATE TABLE IF NOT EXISTS topping_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    min_selections INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0
);

-- Create topping_group_items table
CREATE TABLE IF NOT EXISTS topping_group_items (
    id SERIAL PRIMARY KEY,
    topping_group_id INTEGER REFERENCES topping_groups(id) NOT NULL,
    topping_id INTEGER REFERENCES toppings(id) NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Create menu_item_topping_groups table
CREATE TABLE IF NOT EXISTS menu_item_topping_groups (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) NOT NULL,
    topping_group_id INTEGER REFERENCES topping_groups(id) NOT NULL
);

-- Create category_topping_groups table
CREATE TABLE IF NOT EXISTS category_topping_groups (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) NOT NULL,
    topping_group_id INTEGER REFERENCES topping_groups(id) NOT NULL
);

-- Create restaurant_settings table
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id SERIAL PRIMARY KEY,
    is_open BOOLEAN DEFAULT true,
    opening_hours TEXT NOT NULL DEFAULT '{"monday":"11:00-22:00","tuesday":"11:00-22:00","wednesday":"11:00-22:00","thursday":"11:00-22:00","friday":"11:00-23:00","saturday":"11:00-23:00","sunday":"12:00-22:00"}',
    pickup_hours TEXT NOT NULL DEFAULT '{"monday":"11:00-22:00","tuesday":"11:00-22:00","wednesday":"11:00-22:00","thursday":"11:00-22:00","friday":"11:00-23:00","saturday":"11:00-23:00","sunday":"12:00-22:00"}',
    delivery_hours TEXT NOT NULL DEFAULT '{"monday":"11:00-21:30","tuesday":"11:00-21:30","wednesday":"11:00-21:30","thursday":"11:00-21:30","friday":"11:00-22:30","saturday":"11:00-22:30","sunday":"12:00-21:30"}',
    lunch_buffet_hours TEXT NOT NULL DEFAULT '{"monday":"11:00-15:00","tuesday":"11:00-15:00","wednesday":"11:00-15:00","thursday":"11:00-15:00","friday":"11:00-15:00","saturday":"11:00-15:00","sunday":"12:00-15:00"}',
    special_message TEXT,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add RLS policies for new tables
ALTER TABLE topping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE topping_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_topping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_topping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to topping_groups" ON topping_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access to topping_group_items" ON topping_group_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access to menu_item_topping_groups" ON menu_item_topping_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access to category_topping_groups" ON category_topping_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access to restaurant_settings" ON restaurant_settings FOR SELECT USING (true);

-- Admin policies (allow all operations - you should restrict these in production)
CREATE POLICY "Allow admin full access to topping_groups" ON topping_groups FOR ALL USING (true);
CREATE POLICY "Allow admin full access to topping_group_items" ON topping_group_items FOR ALL USING (true);
CREATE POLICY "Allow admin full access to menu_item_topping_groups" ON menu_item_topping_groups FOR ALL USING (true);
CREATE POLICY "Allow admin full access to category_topping_groups" ON category_topping_groups FOR ALL USING (true);
CREATE POLICY "Allow admin full access to restaurant_settings" ON restaurant_settings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topping_group_items_topping_group_id ON topping_group_items(topping_group_id);
CREATE INDEX IF NOT EXISTS idx_topping_group_items_topping_id ON topping_group_items(topping_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_topping_groups_menu_item_id ON menu_item_topping_groups(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_topping_groups_topping_group_id ON menu_item_topping_groups(topping_group_id);
CREATE INDEX IF NOT EXISTS idx_category_topping_groups_category_id ON category_topping_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_category_topping_groups_topping_group_id ON category_topping_groups(topping_group_id);

-- Create trigger for restaurant_settings updated_at
CREATE TRIGGER update_restaurant_settings_updated_at 
    BEFORE UPDATE ON restaurant_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default restaurant settings if none exist
INSERT INTO restaurant_settings (id, is_open, opening_hours, pickup_hours, delivery_hours, lunch_buffet_hours)
SELECT 1, true, 
    '{"monday":"11:00-22:00","tuesday":"11:00-22:00","wednesday":"11:00-22:00","thursday":"11:00-22:00","friday":"11:00-23:00","saturday":"11:00-23:00","sunday":"12:00-22:00"}',
    '{"monday":"11:00-22:00","tuesday":"11:00-22:00","wednesday":"11:00-22:00","thursday":"11:00-22:00","friday":"11:00-23:00","saturday":"11:00-23:00","sunday":"12:00-22:00"}',
    '{"monday":"11:00-21:30","tuesday":"11:00-21:30","wednesday":"11:00-21:30","thursday":"11:00-21:30","friday":"11:00-22:30","saturday":"11:00-22:30","sunday":"12:00-21:30"}',
    '{"monday":"11:00-15:00","tuesday":"11:00-15:00","wednesday":"11:00-15:00","thursday":"11:00-15:00","friday":"11:00-15:00","saturday":"11:00-15:00","sunday":"12:00-15:00"}'
WHERE NOT EXISTS (SELECT 1 FROM restaurant_settings WHERE id = 1);
