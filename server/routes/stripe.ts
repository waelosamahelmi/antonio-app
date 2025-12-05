import express from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { restaurantSettings } from '../../shared/schema';

const router = express.Router();

// Helper function to get Stripe instance with keys from database
async function getStripeInstance(): Promise<Stripe | null> {
  try {
    const settings = await db.select().from(restaurantSettings).limit(1);
    if (!settings[0]?.stripeSecretKey) {
      console.error('Stripe secret key not found in database');
      return null;
    }
    return new Stripe(settings[0].stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  } catch (error) {
    console.error('Error fetching Stripe settings from database:', error);
    return null;
  }
}

// Get Stripe publishable key (for frontend)
router.get('/config', async (req, res) => {
  try {
    const settings = await db.select().from(restaurantSettings).limit(1);
    
    if (!settings[0]?.stripePublishableKey) {
      return res.status(404).json({ 
        error: 'Stripe not configured',
        message: 'Please configure Stripe keys in restaurant settings'
      });
    }

    res.json({
      publishableKey: settings[0].stripePublishableKey,
    });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Stripe configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'sek', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'Please configure Stripe keys in restaurant settings'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (öre for SEK)
      currency: currency.toLowerCase(),
      metadata,
      // Removed automatic_payment_methods to use Stripe Dashboard settings
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Confirm payment intent
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const stripe = await getStripeInstance();
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'Please configure Stripe keys in restaurant settings'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      paymentIntent,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    return res.status(400).send('Webhook secret not configured');
  }

  try {
    const stripe = await getStripeInstance();
    if (!stripe) {
      return res.status(500).send('Stripe not configured');
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        // TODO: Update order status in database
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('PaymentIntent failed:', failedPayment.id);
        // TODO: Handle failed payment
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

export default router;
