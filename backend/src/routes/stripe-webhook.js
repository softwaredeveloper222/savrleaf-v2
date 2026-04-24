import express from 'express';
import { getStripe } from '../../lib/stripe.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Dispensary from '../models/Dispensary.js';
const router = express.Router();

// Stripe requires raw body for webhook signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  if (!sig || Array.isArray(sig)) return res.status(400).send('Missing Stripe signature');

  console.log('Stripe webhook received', sig, process.env.STRIPE_WEBHOOK_SECRET);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log('event', event.type);
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userEmail = session.customer_email;
        const subscriptionId = session.metadata.subscriptionId;

        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) break;
        subscription.status = 'active';
        subscription.stripeSubscriptionId = session.subscription;
        await subscription.save();

        if (session.metadata.tier === 'extra') {
          if (!session.metadata.dispensaryId) break;
          const dispensary = await Dispensary.findById(session.metadata.dispensaryId);
          if (!dispensary) break;
          dispensary.additionalSkuLimit += 1;
          await dispensary.save();
        } else {
          const dispensary = await Dispensary.findOne({ subscription: subscription._id });
          if (!dispensary) break;
          dispensary.skuLimit = 21;
          dispensary.isPurchased = true;
          await dispensary.save();
        }

        console.log(`✅ User ${userEmail} activated, subscription updated.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const userEmail = invoice.customer_email;

        // if (userEmail) {
        //   const user = await User.findOne({ email: userEmail });
        //   if (user) {
        //     user.isActive = false;
        //     await user.save();
        //     console.log(`⚠️ Payment failed for user ${userEmail}`);
        //   }
        // }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        console.log("stripeSub", stripeSub);
        const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
        console.log("subscription", subscription);
        if (subscription) {
          // subscription.status = 'canceled';
          const dispensary = await Dispensary.findOne({ subscription: subscription._id });
          console.log("dispensary", dispensary);
          if (dispensary) {
            if (subscription.tier.name === 'extra') {
              dispensary.additionalSkuLimit = 0;
              subscription.status = 'canceled';
              await subscription.save();
            } else {
              dispensary.isPurchased = false;
              dispensary.skuLimit = 0;
              dispensary.usedSkus = 0;
              subscription.status = 'canceled';
              await subscription.save();
            }
            await dispensary.save();
          }
          await subscription.save();
          console.log(`🛑 Subscription ${stripeSub.id} canceled`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook event:', err);
    res.status(500).send('Internal server error');
  }
});

export default router;
