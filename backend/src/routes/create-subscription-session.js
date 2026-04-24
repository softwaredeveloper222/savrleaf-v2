import express from 'express';
import { getStripe } from '../../lib/stripe.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import { PRICE_IDS } from '../constance/prices.js';

const router = express.Router();

// const PRICE_IDS = {
//   starter: 'price_1SQoieP9VfxczzVgY4FPYD74',
//   growth: 'price_1SQolIP9VfxczzVghN7Y3TId',
//   pro: 'price_1SQon4P9VfxczzVgZSCgZscu',
// };



router.post('/', async (req, res) => {
  const stripe = getStripe();
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscriptionId' });
    }

    const subscription = await Subscription.findById(subscriptionId).populate('tier user');
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

    const user = subscription.user;
    const tier = subscription.tier;

    // Get additional locations count from subscription metadata or application
    let additionalLocationsCount = 0;
    if (subscription.additionalLocationsCount) {
      additionalLocationsCount = subscription.additionalLocationsCount;
    } else {
      // Fallback: find application by user email
      const application = await Application.findOne({ email: user.email }).sort({ createdAt: -1 });
      if (application && application.additionalLocationCount) {
        additionalLocationsCount = application.additionalLocationCount;
      }
    }

    const basePriceId = PRICE_IDS[tier.name.toLowerCase()];
    if (!basePriceId) throw new Error('Invalid tier name');

    const additionalLocationPriceId = PRICE_IDS['additional_location'];
    if (!additionalLocationPriceId) throw new Error('Additional location price not configured');

    const customer = await stripe.customers.create({
      email: user.email,
    });

    // Build line items: base subscription + additional locations
    const lineItems = [
      { price: basePriceId, quantity: 1 } // Base subscription (includes 1 location)
    ];

    // Add additional locations if needed
    if (additionalLocationsCount > 0) {
      lineItems.push({
        price: additionalLocationPriceId,
        quantity: additionalLocationsCount
      });
    }

    // Create Stripe Subscription Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: lineItems,
      success_url: `${process.env.FRONTEND_URL}/partner-dashboard?tab=dispensary`,
      cancel_url: `${process.env.FRONTEND_URL}/partner-dashboard?tab=dispensary`,
      metadata: {
        tierName: tier.name,
        tier: tier.name,
        userId: user._id.toString(),
        subscriptionId: subscription._id.toString(),
        additionalLocationsCount: additionalLocationsCount.toString(),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
