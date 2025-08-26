
import express from 'express';
import { payoutService } from '../services/payoutService';
import { storage } from '../storage';

const router = express.Router();

// Get creator payout history
router.get('/creator/:id/history', async (req, res) => {
  try {
    const creatorId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required'
      });
    }
    
    const payouts = await payoutService.getCreatorPayoutHistory(creatorId, limit);
    
    res.json({
      success: true,
      data: payouts
    });
  } catch (error: any) {
    console.error('Error fetching payout history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payout history'
    });
  }
});

// Get creator payout statistics
router.get('/creator/:id/stats', async (req, res) => {
  try {
    const creatorId = parseInt(req.params.id);
    
    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required'
      });
    }
    
    const stats = await payoutService.getPayoutStats(creatorId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching payout stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payout statistics'
    });
  }
});

// Calculate current month earnings (preview)
router.get('/creator/:id/current-earnings', async (req, res) => {
  try {
    const creatorId = parseInt(req.params.id);
    
    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required'
      });
    }
    
    const now = new Date();
    const period_start = new Date(now.getFullYear(), now.getMonth(), 1);
    const period_end = now;
    
    const calculation = await payoutService.calculateCreatorEarnings(creatorId, period_start, period_end);
    
    res.json({
      success: true,
      data: {
        ...calculation,
        period_start,
        period_end,
        is_preview: true
      }
    });
  } catch (error: any) {
    console.error('Error calculating current earnings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate current earnings'
    });
  }
});

// Admin: Process monthly payouts manually
router.post('/admin/process-monthly', async (req, res) => {
  try {
    // In a real app, add admin authentication here
    
    await payoutService.processMonthlyPayouts();
    
    res.json({
      success: true,
      message: 'Monthly payouts processed successfully'
    });
  } catch (error: any) {
    console.error('Error processing monthly payouts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process monthly payouts'
    });
  }
});

// Admin: Get all payout statistics
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await payoutService.getPayoutStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching admin payout stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payout statistics'
    });
  }
});

export default router;
