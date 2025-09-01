
import express from 'express';
import { cronService } from '../services/cronService';
import { payoutService } from '../services/payoutService';
import { storage } from '../storage';

const router = express.Router();

// Manually trigger monthly payouts (for testing/admin use)
router.post('/trigger-monthly-payouts', async (req, res) => {
  try {
    // In production, add proper admin authentication here
    await cronService.triggerMonthlyPayouts();
    
    res.json({
      success: true,
      message: 'Monthly payouts triggered successfully'
    });
  } catch (error: any) {
    console.error('Error triggering monthly payouts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger monthly payouts'
    });
  }
});

// Get admin payout dashboard data
router.get('/payout-dashboard', async (req, res) => {
  try {
    const stats = await payoutService.getPayoutStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching admin payout dashboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payout dashboard data'
    });
  }
});

// Get platform statistics for admin dashboard
router.get('/platform-stats', async (req, res) => {
  try {
    const stats = await storage.getPlatformStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch platform statistics'
    });
  }
});

// Get top performing creators
router.get('/top-creators', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const topCreators = await storage.getTopCreators(limit);
    res.json(topCreators);
  } catch (error: any) {
    console.error('Error fetching top creators:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top creators'
    });
  }
});

// Get system health metrics
router.get('/system-health', async (req, res) => {
  try {
    const systemHealth = await storage.getSystemHealth();
    res.json(systemHealth);
  } catch (error: any) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch system health'
    });
  }
});

// Get category statistics for admin
router.get('/category-stats', async (req, res) => {
  try {
    const stats = await storage.getCategoryStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch category statistics'
    });
  }
});

// Get all categories for admin management
router.get('/categories', async (req, res) => {
  try {
    const categories = await storage.getAllCategoriesWithCounts();
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch categories'
    });
  }
});

// Create new category (admin only)
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Category name is required'
      });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || '',
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      icon: 'User',
      color: '#6366f1',
      is_active: true
    };

    const newCategory = await storage.createCategory(categoryData);
    res.json(newCategory);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({
      error: error.message || 'Failed to create category'
    });
  }
});

// Update category (admin only)
router.put('/categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Category name is required'
      });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || '',
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    };

    const updatedCategory = await storage.updateCategory(categoryId, categoryData);
    
    if (!updatedCategory) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.json(updatedCategory);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: error.message || 'Failed to update category'
    });
  }
});

// Delete category (admin only)
router.delete('/categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const deleted = await storage.deleteCategory(categoryId);
    
    if (!deleted) {
      return res.status(400).json({
        error: 'Cannot delete category - it may be in use by creators'
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete category'
    });
  }
});

export default router;
