import express from 'express';
import Subscription from '../models/Subscription.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

//create subscription
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { user, tier, status, startDate, metadata } = req.body;
    console.log('Creating subscription:', user, tier, status, startDate, metadata);
    if (!user || !tier || !status || !startDate || !metadata) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const subscription = await Subscription.create({ user, tier, status, startDate, metadata });
    res.status(201).json(subscription);
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(400).json({ error: 'Failed to create subscription' });
  }
});

router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminSkuOverride } = req.body;

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      { adminSkuOverride },
      { new: true, runValidators: true }
    )
      .populate('tier')
      .lean();

    if (!updatedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(updatedSubscription);
  } catch (err) {
    console.error('Failed to update subscription:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update subscription status
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['inactive', 'active', 'trialing', 'past_due', 'unpaid', 'canceled', 'pending'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = status;
    await subscription.save();

    const populated = await Subscription.findById(subscription._id).populate('tier').lean();
    res.json({ message: `Subscription status updated to ${status}`, subscription: populated });
  } catch (err) {
    console.error('Failed to update subscription status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
