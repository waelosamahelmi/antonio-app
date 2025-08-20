-- Initial schema migration for Restaurant Order Master
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create menu_items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    offer_price DECIMAL(10,2),
    offer_percentage INTEGER,
    offer_start_date TIMESTAMP,
    offer_end_date TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT,
    order_type TEXT NOT NULL, -- 'delivery', 'pickup'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash', -- 'cash', 'card'
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT
);

-- Create users table (for admin users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Create toppings table
CREATE TABLE toppings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'pizza', -- pizza, kebab, chicken, wings, burger, drink, salad, kids
    type TEXT NOT NULL DEFAULT 'topping', -- topping, sauce, extra, size, base, spice, drink
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create topping_groups table
CREATE TABLE topping_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    min_selections INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0
);

-- Create topping_group_items table
CREATE TABLE topping_group_items (
    id SERIAL PRIMARY KEY,
    topping_group_id INTEGER REFERENCES topping_groups(id) NOT NULL,
    topping_id INTEGER REFERENCES toppings(id) NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Create menu_item_topping_groups table
CREATE TABLE menu_item_topping_groups (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) NOT NULL,
    topping_group_id INTEGER REFERENCES topping_groups(id) NOT NULL
);

-- Create category_topping_groups table
CREATE TABLE category_topping_groups (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) NOT NULL,
    topping_group_id INTEGER REFERENCES topping_groups(id) NOT NULL
);

-- Create restaurant_settings table
CREATE TABLE restaurant_settings (
    id SERIAL PRIMARY KEY,
    is_open BOOLEAN DEFAULT true,
    opening_hours TEXT NOT NULL,
    pickup_hours TEXT NOT NULL,
    delivery_hours TEXT NOT NULL,
    lunch_buffet_hours TEXT NOT NULL,
    special_message TEXT,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_toppings_category ON toppings(category);
CREATE INDEX idx_toppings_is_active ON toppings(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_settings_updated_at 
    BEFORE UPDATE ON restaurant_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
-- Enable RLS on tables that need it
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE topping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE topping_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_topping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_topping_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert/read access to orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow public insert/read access to order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow public read access to toppings" ON toppings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to topping_groups" ON topping_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access to topping_group_items" ON topping_group_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access to menu_item_topping_groups" ON menu_item_topping_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access to category_topping_groups" ON category_topping_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read access to restaurant_settings" ON restaurant_settings FOR SELECT USING (true);

-- Admin policies (you'll need to create a function to check if user is admin)
-- For now, we'll allow all operations - you should restrict these in production
CREATE POLICY "Allow admin full access to categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow admin full access to menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow admin full access to toppings" ON toppings FOR ALL USING (true);
CREATE POLICY "Allow admin full access to topping_groups" ON topping_groups FOR ALL USING (true);
CREATE POLICY "Allow admin full access to topping_group_items" ON topping_group_items FOR ALL USING (true);
CREATE POLICY "Allow admin full access to menu_item_topping_groups" ON menu_item_topping_groups FOR ALL USING (true);
CREATE POLICY "Allow admin full access to category_topping_groups" ON category_topping_groups FOR ALL USING (true);
CREATE POLICY "Allow admin full access to restaurant_settings" ON restaurant_settings FOR ALL USING (true);
