import axios, { AxiosResponse } from 'axios';
import { storage } from '../storage';

export interface PaystackInitializeRequest {
  email: string;
  amount: number; // Amount in GHS
  currency: string;
  reference?: string;
  callback_url?: string;
  metadata?: any;
  channels?: string[];
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
      international_format_phone: string;
    };
  };
}

export interface MobileMoneyRequest {
  email: string;
  amount: number;
  phone: string;
  provider: 'mtn' | 'vod' | 'tgo' | 'airtel';
  reference?: string;
}

export class PaymentService {
  private baseURL = 'https://api.paystack.co';
  private secretKey: string;
  private publicKey: string;

  // Development mode flag - Only use development mode in actual development
  private isDevelopment = process.env.NODE_ENV !== 'production';

  constructor() {
    // In development mode, use fallback values for testing
    if (this.isDevelopment) {
      this.secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_development_key';
      this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_development_key';
    } else {
      // In production, require environment variables
      if (!process.env.PAYSTACK_SECRET_KEY || !process.env.PAYSTACK_PUBLIC_KEY) {
        throw new Error('Missing required Paystack credentials. Please provide PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY environment variables.');
      }
      this.secretKey = process.env.PAYSTACK_SECRET_KEY;
      this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    }
  }

  // Store metadata for development mode
  private devMetadataStore: Map<string, any> = new Map();

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Generate unique reference
  private generateReference(): string {
    return `xclusive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Store metadata for development mode
  private storeDevMetadata(reference: string, metadata: any): void {
    if (this.isDevelopment) {
      this.devMetadataStore.set(reference, metadata);
      console.log('🔧 Stored dev metadata for reference:', reference, metadata);
    }
  }

  // Retrieve metadata for development mode
  private getDevMetadataFromReference(reference: string): any {
    if (this.isDevelopment && this.devMetadataStore.has(reference)) {
      const metadata = this.devMetadataStore.get(reference);
      console.log('🔧 Retrieved dev metadata for reference:', reference, metadata);
      return metadata;
    }
    return {};
  }

  // Initialize standard payment (cards)
  async initializePayment(data: PaystackInitializeRequest): Promise<PaystackInitializeResponse> {
    // Development mode: return mock response
    if (this.isDevelopment) {
      console.log('🔧 Development mode: Simulating Paystack payment initialization');
      const reference = data.reference || this.generateReference();

      // Store metadata for later retrieval
      if (data.metadata) {
        this.storeDevMetadata(reference, data.metadata);
      }

      return {
        status: true,
        message: 'Authorization URL created (Development Mode)',
        data: {
          authorization_url: `/payment-callback?reference=${reference}&status=success`,
          access_code: 'dev_access_code',
          reference: reference
        }
      };
    }

    const payload = {
      email: data.email,
      amount: Math.round(data.amount * 100), // Convert to pesewas
      currency: data.currency || 'GHS',
      reference: data.reference || this.generateReference(),
      callback_url: data.callback_url,
      metadata: data.metadata,
      channels: data.channels || ['card', 'bank', 'ussd', 'mobile_money'],
    };

    try {
      const response: AxiosResponse<PaystackInitializeResponse> = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        payload,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Payment initialization error:', error.response?.data || error.message);
      throw new Error(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Initialize mobile money payment
  async initializeMobileMoneyPayment(data: MobileMoneyRequest): Promise<any> {
    // Development mode: return mock response
    if (this.isDevelopment) {
      console.log('🔧 Development mode: Simulating mobile money payment initialization');
      const reference = data.reference || this.generateReference();
      return {
        status: true,
        message: 'Mobile money charge initiated (Development Mode)',
        data: {
          status: 'send_otp',
          reference: reference,
          display_text: `Please approve the payment on your ${data.provider.toUpperCase()} mobile money wallet`,
          authorization_url: `/payment-callback?reference=${reference}&status=success`
        }
      };
    }

    const payload = {
      email: data.email,
      amount: Math.round(data.amount * 100), // Convert to pesewas
      currency: 'GHS',
      reference: data.reference || this.generateReference(),
      mobile_money: {
        phone: data.phone,
        provider: data.provider
      }
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/charge`,
        payload,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error('Mobile money payment error:', errorData || error.message);

      // Handle specific mobile money errors
      if (errorData?.message === 'Charge attempted' && errorData?.data?.message?.includes('test mobile money number')) {
        throw new Error('Please use test mobile money number: 0551234987 for testing');
      }

      throw new Error(`Mobile money payment failed: ${errorData?.message || error.message}`);
    }
  }

  // Verify payment
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    // Development mode: return mock successful verification with proper metadata
    if (this.isDevelopment) {
      console.log('🔧 Development mode: Simulating payment verification for reference:', reference);

      // Extract metadata from reference if it was stored during initialization
      const devMetadata = this.getDevMetadataFromReference(reference);
      console.log('🔧 Development mode verification - metadata retrieved:', devMetadata);

      return {
        status: true,
        message: 'Verification successful (Development Mode)',
        data: {
          id: Math.floor(Math.random() * 1000000),
          domain: 'test',
          status: 'success',
          reference: reference,
          amount: devMetadata?.tier_price ? parseFloat(devMetadata.tier_price) * 100 : 1000, // Use actual tier price in pesewas
          message: 'Approved (Development Mode)',
          gateway_response: 'Successful',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          channel: 'card',
          currency: 'GHS',
          ip_address: '127.0.0.1',
          metadata: devMetadata,
          log: {},
          fees: 0,
          fees_split: null,
          authorization: {
            authorization_code: 'AUTH_dev123',
            bin: '408408',
            last4: '4081',
            exp_month: '12',
            exp_year: '2030',
            channel: 'card',
            card_type: 'visa',
            bank: 'TEST BANK',
            country_code: 'GH',
            brand: 'visa',
            reusable: true,
            signature: 'SIG_dev123',
            account_name: 'Development User'
          },
          customer: {
            id: 123456,
            first_name: 'Development',
            last_name: 'User',
            email: 'dev@example.com',
            customer_code: 'CUS_dev123',
            phone: '233200000000',
            metadata: {},
            risk_action: 'default',
            international_format_phone: '+233200000000'
          }
        }
      };
    }

    try {
      const response: AxiosResponse<PaystackVerifyResponse> = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Payment verification error:', error.response?.data || error.message);
      throw new Error(`Payment verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create subscription payment
  async createSubscriptionPayment(fanId: number, tierId: number, amount: number, email: string): Promise<PaystackInitializeResponse> {
    const reference = this.generateReference();

    const metadata = {
      fan_id: fanId,
      tier_id: tierId,
      tier_price: amount.toString(),
      payment_type: 'subscription',
      custom_fields: [
        {
          display_name: 'Fan ID',
          variable_name: 'fan_id',
          value: fanId.toString()
        },
        {
          display_name: 'Tier ID',
          variable_name: 'tier_id',
          value: tierId.toString()
        }
      ]
    };

    // Use current environment's callback URL
    const baseUrl = process.env.REPL_SLUG && process.env.REPL_OWNER
      ? `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`
      : 'http://localhost:5000';
    const callbackUrl = `${baseUrl}/payment/callback`;

    return this.initializePayment({
      email,
      amount,
      currency: 'GHS',
      reference,
      callback_url: callbackUrl,
      metadata,
      channels: ['card', 'bank', 'ussd', 'mobile_money']
    });
  }

  // Process successful payment
  async processSuccessfulPayment(paymentData: PaystackVerifyResponse['data']): Promise<void> {
    try {
      // Extract metadata
      const metadata = paymentData.metadata;
      const fanId = metadata?.fan_id || metadata?.custom_fields?.find((f: any) => f.variable_name === 'fan_id')?.value;
      const tierId = metadata?.tier_id || metadata?.custom_fields?.find((f: any) => f.variable_name === 'tier_id')?.value;

      if (!fanId || !tierId) {
        throw new Error('Missing fan_id or tier_id in payment metadata');
      }

      // Get subscription tier details
      const tier = await storage.getSubscriptionTier(parseInt(tierId));
      if (!tier) {
        throw new Error('Subscription tier not found');
      }

      // Create subscription
      const currentDate = new Date();
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const subscription = await storage.createSubscription({
        fan_id: parseInt(fanId),
        creator_id: tier.creator_id,
        tier_id: parseInt(tierId),
        status: 'active',
        auto_renew: true,
        started_at: currentDate,
        ends_at: nextBillingDate,
        next_billing_date: nextBillingDate
      });

      // Create payment transaction record
      await storage.createPaymentTransaction({
        subscription_id: subscription.id,
        amount: (paymentData.amount / 100).toString(), // Convert from pesewas to GHS
        currency: paymentData.currency,
        status: 'completed',
        payment_method: 'paystack',
        transaction_id: paymentData.reference,
        processed_at: new Date(paymentData.paid_at)
      });

      // Notify creator of new subscriber
      try {
        const { NotificationService } = require('../notification-service');
        console.log(`Creating new subscriber notification via payment: creator=${tier.creator_id}, fan=${fanId}, tier=${tier.name}`);

        await NotificationService.notifyNewSubscriber(
          tier.creator_id,
          parseInt(fanId),
          tier.name
        );
        console.log(`✅ Payment flow: Sent notification to creator ${tier.creator_id} for new subscriber ${fanId} (${tier.name} tier)`);
      } catch (notificationError) {
        console.error('❌ Payment flow: Failed to send new subscriber notification:', notificationError);
        // Don't fail the payment processing if notification fails
      }

      console.log(`Subscription created successfully for fan ${fanId} to tier ${tierId}`);
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  // Get public key (for frontend)
  getPublicKey(): string {
    return this.publicKey;
  }

  // Validate webhook signature
  validateWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', this.secretKey).update(payload).digest('hex');
    return hash === signature;
  }
}

export const paymentService = new PaymentService();