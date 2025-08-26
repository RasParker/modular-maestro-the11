
import express from 'express';
import { paymentService } from '../services/paymentService';

const router = express.Router();

// Test payment configuration
router.get('/test-config', (req, res) => {
  try {
    const publicKey = paymentService.getPublicKey();
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.json({
      success: true,
      data: {
        public_key: publicKey,
        is_development: isDevelopment,
        has_secret_key: !!process.env.PAYSTACK_SECRET_KEY,
        has_public_key: !!process.env.PAYSTACK_PUBLIC_KEY,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test payment initialization
router.post('/test-payment', async (req, res) => {
  try {
    const testPayment = await paymentService.initializePayment({
      email: 'test@example.com',
      amount: 10.00,
      currency: 'GHS',
      metadata: {
        test: true,
        description: 'Test payment integration'
      }
    });

    res.json({
      success: true,
      data: testPayment,
      message: 'Test payment initialized successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test payment verification
router.post('/test-verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const verification = await paymentService.verifyPayment(reference);

    res.json({
      success: true,
      data: verification,
      message: 'Payment verification test completed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
