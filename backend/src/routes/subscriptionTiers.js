import express from 'express';
import SubscriptionTier from '../models/SubscriptionTier.js';

const router = express.Router();

// GET /subscription-tiers
router.get('/', async (req, res) => {
  try {
    const tiers = await SubscriptionTier.find();
    res.status(200).json(tiers);
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ error: 'Failed to load subscription tiers' });
  }
});

router.get('/tier-by-name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const tier = await SubscriptionTier.findOne({ name });
    if (!tier) return res.status(404).json({ error: 'Subscription tier not found' });
    res.status(200).json(tier);
  } catch (error) {
    console.error('Error fetching subscription tier by name:', error);
    res.status(500).json({ error: 'Failed to load subscription tier by name' });
  }
});

export default router;
