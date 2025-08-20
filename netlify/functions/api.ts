import { Handler } from '@netlify/functions';
import { db } from '../../server/db.js';
import { menuItems, categories, orders, orderItems, toppings } from '../../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  const { path, httpMethod } = event;
  const apiPath = path.replace('/.netlify/functions/api', '');

  try {
    // Menu Items endpoints
    if (apiPath === '/menu-items' && httpMethod === 'GET') {
      const items = await db
        .select({
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
          categoryName: categories.name,
        })
        .from(menuItems)
        .leftJoin(categories, eq(menuItems.categoryId, categories.id))
        .where(eq(menuItems.isAvailable, true))
        .orderBy(menuItems.name);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    }

    // Categories endpoint
    if (apiPath === '/categories' && httpMethod === 'GET') {
      const categoriesList = await db
        .select()
        .from(categories)
        .orderBy(categories.displayOrder, categories.name);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(categoriesList),
      };
    }

    // Toppings endpoint
    if (apiPath === '/toppings' && httpMethod === 'GET') {
      const toppingsList = await db
        .select()
        .from(toppings)
        .where(eq(toppings.isActive, true))
        .orderBy(toppings.category, toppings.name);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(toppingsList),
      };
    }

    // Orders endpoint - GET
    if (apiPath === '/orders' && httpMethod === 'GET') {
      const ordersList = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(50);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(ordersList),
      };
    }

    // Orders endpoint - POST
    if (apiPath === '/orders' && httpMethod === 'POST') {
      const orderData = JSON.parse(event.body || '{}');
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Insert order
      const [newOrder] = await db
        .insert(orders)
        .values({
          orderNumber: orderNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          deliveryAddress: orderData.deliveryAddress,
          orderType: orderData.orderType,
          subtotal: orderData.subtotal,
          deliveryFee: orderData.deliveryFee || '0',
          totalAmount: orderData.totalAmount,
          paymentMethod: orderData.paymentMethod,
          specialInstructions: orderData.specialInstructions,
        })
        .returning();

      // Insert order items
      if (orderData.items && orderData.items.length > 0) {
        const orderItemsData = orderData.items.map((item: any) => ({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          specialInstructions: item.specialInstructions,
        }));

        await db.insert(orderItems).values(orderItemsData);
      }

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(newOrder),
      };
    }

    // Health check
    if (apiPath === '/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          status: 'OK', 
          timestamp: new Date().toISOString(),
          function: 'netlify-function'
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
