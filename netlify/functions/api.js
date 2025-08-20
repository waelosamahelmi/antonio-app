var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/db.ts
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  categoryToppingGroups: () => categoryToppingGroups,
  insertCategorySchema: () => insertCategorySchema,
  insertCategoryToppingGroupSchema: () => insertCategoryToppingGroupSchema,
  insertMenuItemSchema: () => insertMenuItemSchema,
  insertMenuItemToppingGroupSchema: () => insertMenuItemToppingGroupSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertRestaurantSettingsSchema: () => insertRestaurantSettingsSchema,
  insertToppingGroupItemSchema: () => insertToppingGroupItemSchema,
  insertToppingGroupSchema: () => insertToppingGroupSchema,
  insertToppingSchema: () => insertToppingSchema,
  insertUserSchema: () => insertUserSchema,
  menuItemToppingGroups: () => menuItemToppingGroups,
  menuItems: () => menuItems,
  orderItems: () => orderItems,
  orders: () => orders,
  restaurantSettings: () => restaurantSettings,
  toppingGroupItems: () => toppingGroupItems,
  toppingGroups: () => toppingGroups,
  toppings: () => toppings,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true)
});
var menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  descriptionEn: text("description_en"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  displayOrder: integer("display_order").default(0),
  isAvailable: boolean("is_available").default(true),
  offerPrice: decimal("offer_price", { precision: 10, scale: 2 }),
  offerPercentage: integer("offer_percentage"),
  offerStartDate: timestamp("offer_start_date"),
  offerEndDate: timestamp("offer_end_date")
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryAddress: text("delivery_address"),
  orderType: text("order_type").notNull(),
  // 'delivery', 'pickup'
  status: text("status").notNull().default("pending"),
  // 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("cash"),
  // 'cash', 'card'
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions")
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login")
});
var toppings = pgTable("toppings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  category: text("category").notNull().default("pizza"),
  // pizza, kebab, chicken, wings, burger, drink, salad, kids
  type: text("type").notNull().default("topping"),
  // topping, sauce, extra, size, base, spice, drink
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var toppingGroups = pgTable("topping_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  isRequired: boolean("is_required").default(false),
  maxSelections: integer("max_selections").default(1),
  minSelections: integer("min_selections").default(0),
  displayOrder: integer("display_order").default(0)
});
var toppingGroupItems = pgTable("topping_group_items", {
  id: serial("id").primaryKey(),
  toppingGroupId: integer("topping_group_id").references(() => toppingGroups.id).notNull(),
  toppingId: integer("topping_id").references(() => toppings.id).notNull(),
  displayOrder: integer("display_order").default(0)
});
var menuItemToppingGroups = pgTable("menu_item_topping_groups", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  toppingGroupId: integer("topping_group_id").references(() => toppingGroups.id).notNull()
});
var categoryToppingGroups = pgTable("category_topping_groups", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  toppingGroupId: integer("topping_group_id").references(() => toppingGroups.id).notNull()
});
var restaurantSettings = pgTable("restaurant_settings", {
  id: serial("id").primaryKey(),
  isOpen: boolean("is_open").default(true),
  openingHours: text("opening_hours").notNull(),
  pickupHours: text("pickup_hours").notNull(),
  deliveryHours: text("delivery_hours").notNull(),
  lunchBuffetHours: text("lunch_buffet_hours").notNull(),
  specialMessage: text("special_message"),
  // Printer settings
  defaultPrinterId: text("default_printer_id"),
  printerAutoReconnect: boolean("printer_auto_reconnect").default(true),
  printerTabSticky: boolean("printer_tab_sticky").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});
var insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true
});
var insertToppingSchema = createInsertSchema(toppings).omit({
  id: true
});
var insertToppingGroupSchema = createInsertSchema(toppingGroups).omit({
  id: true
});
var insertToppingGroupItemSchema = createInsertSchema(toppingGroupItems).omit({
  id: true
});
var insertMenuItemToppingGroupSchema = createInsertSchema(menuItemToppingGroups).omit({
  id: true
});
var insertCategoryToppingGroupSchema = createInsertSchema(categoryToppingGroups).omit({
  id: true
});
var insertRestaurantSettingsSchema = createInsertSchema(restaurantSettings).omit({
  id: true,
  updatedAt: true
});

// server/db.ts
import { Pool } from "pg";
dotenv.config();
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please set your Supabase database URL."
  );
}
var connectionString = process.env.DATABASE_URL;
var client = postgres(connectionString);
var db = drizzle({ client, schema: schema_exports });
var pool = new Pool({
  connectionString
});
var supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// netlify/functions/api.ts
import { eq, desc } from "drizzle-orm";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true"
};
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }
  const { path, httpMethod } = event;
  const apiPath = path.replace("/.netlify/functions/api", "");
  try {
    if (apiPath === "/menu-items" && httpMethod === "GET") {
      const items = await db.select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        categoryId: menuItems.categoryId,
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.isAvailable,
        isVegetarian: menuItems.isVegetarian,
        isVegan: menuItems.isVegan,
        isGlutenFree: menuItems.isGlutenFree,
        categoryName: categories.name
      }).from(menuItems).leftJoin(categories, eq(menuItems.categoryId, categories.id)).where(eq(menuItems.isAvailable, true)).orderBy(menuItems.name);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(items)
      };
    }
    if (apiPath === "/categories" && httpMethod === "GET") {
      const categoriesList = await db.select().from(categories).orderBy(categories.displayOrder, categories.name);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(categoriesList)
      };
    }
    if (apiPath === "/toppings" && httpMethod === "GET") {
      const toppingsList = await db.select().from(toppings).where(eq(toppings.isActive, true)).orderBy(toppings.category, toppings.name);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(toppingsList)
      };
    }
    if (apiPath === "/orders" && httpMethod === "GET") {
      const ordersList = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(ordersList)
      };
    }
    if (apiPath === "/orders" && httpMethod === "POST") {
      const orderData = JSON.parse(event.body || "{}");
      const orderNumber = `ORD-${Date.now()}`;
      const [newOrder] = await db.insert(orders).values({
        orderNumber,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        deliveryAddress: orderData.deliveryAddress,
        orderType: orderData.orderType,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee || "0",
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        specialInstructions: orderData.specialInstructions
      }).returning();
      if (orderData.items && orderData.items.length > 0) {
        const orderItemsData = orderData.items.map((item) => ({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          specialInstructions: item.specialInstructions
        }));
        await db.insert(orderItems).values(orderItemsData);
      }
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(newOrder)
      };
    }
    if (apiPath === "/health" && httpMethod === "GET") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "OK",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          function: "netlify-function"
        })
      };
    }
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Route not found" })
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};
export {
  handler
};
