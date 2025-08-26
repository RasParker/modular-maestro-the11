// Quick test script to verify payment integration
import fetch from 'node-fetch';

async function testPaymentFlow() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔧 Testing Payment Integration...\n');
  
  try {
    // Test 1: Check payment initialization
    console.log('1. Testing payment initialization...');
    
    const initResponse = await fetch(`${baseUrl}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fan_id: 2,
        tier_id: 1,
        payment_method: 'card'
      })
    });
    
    const initResult = await initResponse.json();
    console.log('✅ Payment initialization response:', initResult);
    
    if (!initResult.success) {
      console.error('❌ Payment initialization failed:', initResult.message);
      return;
    }
    
    // Test 2: Check if URL is relative (development mode)
    const authUrl = initResult.data.authorization_url;
    console.log('✅ Authorization URL:', authUrl);
    
    if (!authUrl.startsWith('/payment-callback')) {
      console.log('⚠️  Authorization URL is not relative. Expected to start with /payment-callback');
    } else {
      console.log('✅ Authorization URL is correctly formatted for development mode');
    }
    
    // Test 3: Extract reference and test verification
    const urlParams = new URLSearchParams(authUrl.split('?')[1]);
    const reference = urlParams.get('reference');
    
    if (!reference) {
      console.error('❌ No reference found in authorization URL');
      return;
    }
    
    console.log('✅ Reference extracted:', reference);
    
    // Test 4: Verify payment
    console.log('\n2. Testing payment verification...');
    
    const verifyResponse = await fetch(`${baseUrl}/api/payments/verify/${reference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ Payment verification response:', verifyResult);
    
    if (verifyResult.success && verifyResult.data.status === 'success') {
      console.log('✅ Payment verification successful! Subscription should be created.');
    } else {
      console.log('⚠️  Payment verification returned:', verifyResult.data?.status || 'unknown status');
    }
    
    // Test 5: Check subscription creation (query database)
    console.log('\n3. Testing subscription check...');
    
    const subResponse = await fetch(`${baseUrl}/api/subscriptions/user/2/creator/1`);
    const subResult = await subResponse.json();
    
    if (subResponse.ok && subResult.subscription) {
      console.log('✅ Subscription found:', subResult.subscription.status);
    } else {
      console.log('⚠️  No active subscription found or error:', subResult.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentFlow();