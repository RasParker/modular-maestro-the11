import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Get user's subscriptions with tier management options
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user's active subscriptions
    const subscriptions = await storage.getSubscriptions(userId);
    
    // Enhance subscriptions with tier management info
    const enhancedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription: any) => {
        // Get available tiers for this creator
        const availableTiers = await storage.getSubscriptionTiers(subscription.creator.id);
        
        // Get pending changes
        const pendingChanges = await storage.getPendingSubscriptionChanges(subscription.id);
        
        // Get subscription history
        const changeHistory = await storage.getSubscriptionChangeHistory(subscription.id);
        
        // Calculate proration for tier options
        const tierOptions = await Promise.all(
          availableTiers
            .filter(tier => tier.id !== subscription.tier_id)
            .map(async (tier) => {
              const proration = await storage.calculateProration(subscription.id, tier.id);
              return {
                ...tier,
                proration_amount: proration.prorationAmount,
                is_upgrade: proration.isUpgrade,
                days_remaining: proration.daysRemaining
              };
            })
        );

        return {
          ...subscription,
          available_tiers: tierOptions,
          pending_changes: pendingChanges,
          change_history: changeHistory.slice(0, 5) // Last 5 changes
        };
      })
    );

    res.json({
      success: true,
      data: enhancedSubscriptions
    });
  } catch (error: any) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscriptions'
    });
  }
});

// Upgrade subscription tier (immediate)
router.post('/:subscriptionId/upgrade', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.subscriptionId);
    const { tier_id } = req.body;
    
    if (!subscriptionId || !tier_id) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID and tier ID are required'
      });
    }

    // Get current subscription
    const subscription = await storage.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get new tier
    const newTier = await storage.getSubscriptionTier(tier_id);
    if (!newTier) {
      return res.status(404).json({
        success: false,
        message: 'Tier not found'
      });
    }

    // Calculate proration
    const proration = await storage.calculateProration(subscriptionId, tier_id);
    
    // Check if this is actually an upgrade
    if (!proration.isUpgrade) {
      return res.status(400).json({
        success: false,
        message: 'Use schedule-downgrade endpoint for downgrades'
      });
    }

    // For upgrades with charges, redirect to payment
    if (proration.prorationAmount > 0) {
      return res.json({
        success: true,
        requires_payment: true,
        message: 'Upgrade requires payment for prorated difference',
        data: {
          proration_amount: proration.prorationAmount,
          days_remaining: proration.daysRemaining,
          payment_required: proration.prorationAmount
        }
      });
    }

    // Free upgrade (e.g., when there are credits)
    const updatedSubscription = await storage.switchSubscriptionTier(
      subscriptionId,
      tier_id,
      proration.prorationAmount
    );

    if (updatedSubscription) {
      res.json({
        success: true,
        message: 'Tier upgraded successfully',
        data: {
          subscription: updatedSubscription,
          proration_amount: proration.prorationAmount
        }
      });
    } else {
      throw new Error('Failed to upgrade tier');
    }
  } catch (error: any) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upgrade subscription'
    });
  }
});

// Schedule downgrade (takes effect next billing cycle)
router.post('/:subscriptionId/schedule-downgrade', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.subscriptionId);
    const { tier_id } = req.body;
    
    if (!subscriptionId || !tier_id) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID and tier ID are required'
      });
    }

    // Get current subscription
    const subscription = await storage.getSubscription(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get new tier
    const newTier = await storage.getSubscriptionTier(tier_id);
    if (!newTier) {
      return res.status(404).json({
        success: false,
        message: 'Tier not found'
      });
    }

    // Calculate proration
    const proration = await storage.calculateProration(subscriptionId, tier_id);
    
    // Check if this is actually a downgrade
    if (proration.isUpgrade) {
      return res.status(400).json({
        success: false,
        message: 'Use upgrade endpoint for upgrades'
      });
    }

    // Schedule the downgrade
    const scheduledDate = subscription.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const pendingChange = await storage.createPendingSubscriptionChange({
      subscription_id: subscriptionId,
      from_tier_id: subscription.tier_id,
      to_tier_id: tier_id,
      change_type: 'downgrade',
      scheduled_date: scheduledDate,
      proration_amount: Math.abs(proration.prorationAmount).toString(),
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Downgrade scheduled successfully. You will keep current tier access until next billing cycle.',
      data: {
        pending_change: pendingChange,
        scheduled_date: scheduledDate,
        credit_amount: Math.abs(proration.prorationAmount),
        current_tier_access_until: scheduledDate
      }
    });
  } catch (error: any) {
    console.error('Error scheduling downgrade:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule downgrade'
    });
  }
});

// Get pending subscription changes
router.get('/:subscriptionId/pending-changes', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.subscriptionId);
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const pendingChanges = await storage.getPendingSubscriptionChanges(subscriptionId);
    
    // Enhance with tier information
    const enhancedChanges = await Promise.all(
      pendingChanges.map(async (change: any) => {
        const fromTier = change.from_tier_id ? await storage.getSubscriptionTier(change.from_tier_id) : null;
        const toTier = await storage.getSubscriptionTier(change.to_tier_id);
        
        return {
          ...change,
          from_tier: fromTier,
          to_tier: toTier
        };
      })
    );

    res.json({
      success: true,
      data: enhancedChanges
    });
  } catch (error: any) {
    console.error('Error fetching pending changes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending changes'
    });
  }
});

// Cancel pending subscription change
router.delete('/pending-changes/:changeId', async (req, res) => {
  try {
    const changeId = parseInt(req.params.changeId);
    
    if (!changeId) {
      return res.status(400).json({
        success: false,
        message: 'Change ID is required'
      });
    }

    const cancelled = await storage.cancelPendingSubscriptionChange(changeId);
    
    if (cancelled) {
      res.json({
        success: true,
        message: 'Scheduled change cancelled successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Pending change not found or already processed'
      });
    }
  } catch (error: any) {
    console.error('Error cancelling pending change:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel pending change'
    });
  }
});

// Get subscription change history
router.get('/:subscriptionId/history', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.subscriptionId);
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const changes = await storage.getSubscriptionChangeHistory(subscriptionId);
    const limitedChanges = changes.slice(0, limit);
    
    // Enhance with tier information
    const enhancedChanges = await Promise.all(
      limitedChanges.map(async (change: any) => {
        const fromTier = change.from_tier_id ? await storage.getSubscriptionTier(change.from_tier_id) : null;
        const toTier = await storage.getSubscriptionTier(change.to_tier_id);
        
        return {
          ...change,
          from_tier: fromTier,
          to_tier: toTier
        };
      })
    );

    res.json({
      success: true,
      data: enhancedChanges
    });
  } catch (error: any) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscription history'
    });
  }
});

// Get subscription with tier options for a specific creator
router.get('/user/:userId/creator/:creatorId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const creatorId = parseInt(req.params.creatorId);
    
    if (!userId || !creatorId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Creator ID are required'
      });
    }

    // Get current subscription to this creator
    const currentSubscription = await storage.getUserSubscriptionToCreator(userId, creatorId);
    
    // Get all available tiers for this creator
    const availableTiers = await storage.getSubscriptionTiers(creatorId);
    
    if (currentSubscription) {
      // Calculate proration for each tier option
      const tierOptions = await Promise.all(
        availableTiers
          .filter(tier => tier.id !== currentSubscription.tier_id)
          .map(async (tier) => {
            const proration = await storage.calculateProration(currentSubscription.id, tier.id);
            return {
              ...tier,
              proration_amount: proration.prorationAmount,
              is_upgrade: proration.isUpgrade,
              days_remaining: proration.daysRemaining,
              can_switch: true
            };
          })
      );

      // Get current tier info
      const currentTier = availableTiers.find(tier => tier.id === currentSubscription.tier_id);
      
      res.json({
        success: true,
        data: {
          has_subscription: true,
          current_subscription: currentSubscription,
          current_tier: currentTier,
          tier_options: tierOptions
        }
      });
    } else {
      // No current subscription - show all available tiers
      res.json({
        success: true,
        data: {
          has_subscription: false,
          current_subscription: null,
          current_tier: null,
          tier_options: availableTiers.map(tier => ({
            ...tier,
            proration_amount: 0,
            is_upgrade: false,
            days_remaining: 0,
            can_switch: false
          }))
        }
      });
    }
  } catch (error: any) {
    console.error('Error fetching creator subscription info:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch creator subscription info'
    });
  }
});

export default router;