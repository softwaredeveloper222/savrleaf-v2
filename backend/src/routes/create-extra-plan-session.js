import express from 'express';
import { getStripe } from '../../lib/stripe.js';
import Dispensary from '../models/Dispensary.js';
import { PRICE_IDS } from '../constance/prices.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const stripe = getStripe();
  try {
    const { dispensaryId, subscriptionId } = req.body;
    const dispensary = await Dispensary.findById(dispensaryId).populate('user');
    if (!dispensary) {
      return res.status(404).json({ error: 'Dispensary not found' });
    }
    if(dispensary.additionalSkuLimit >= dispensary.extraLimit) {
      return res.status(400).json({ error: 'You have reached the maximum additional SKU limit' });
    }
    if(!dispensary.isPurchased) {
      return res.status(400).json({ error: 'You have not purchased the main plan' });
    }
    const priceId = PRICE_IDS.extra;
    const customer = await stripe.customers.create({
      email: dispensary.user.email,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/partner-dashboard?tab=dispensary&added_sku_limit=true&dispensaryId=${dispensaryId}`,
      cancel_url: `${process.env.FRONTEND_URL}/partner-dashboard?tab=dispensary`,
      customer: customer.id, //optional: prefill email
      metadata: {
        tier: 'extra',
        dispensaryId: dispensaryId,
        subscriptionId: subscriptionId,
        userEmail: dispensary.user.email,
      },
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating extra plan session', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;