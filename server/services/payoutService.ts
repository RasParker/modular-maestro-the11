
import { storage } from '../storage';
import { eq, and, gte, lte, sum } from 'drizzle-orm';
import { payment_transactions, creator_payouts } from '../../shared/schema';

export interface PayoutCalculation {
  creator_id: number;
  gross_revenue: number;
  platform_fee: number;
  paystack_fees: number;
  net_payout: number;
  transaction_count: number;
}

export interface PayoutProvider {
  name: string;
  process(amount: number, recipient: any): Promise<{ success: boolean; transaction_id?: string; error?: string }>;
}

// Mock payout providers - replace with real implementations
class MTNMobileMoneyProvider implements PayoutProvider {
  name = 'MTN Mobile Money';
  
  async process(amount: number, recipient: any): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
    // Mock implementation - replace with actual MTN MoMo API
    console.log(`Processing MTN MoMo payout: GHS ${amount} to ${recipient.phone}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success (80% success rate for demo)
    const success = Math.random() > 0.2;
    
    if (success) {
      return {
        success: true,
        transaction_id: `mtn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        error: 'MTN Mobile Money service temporarily unavailable'
      };
    }
  }
}

class VodafoneCashProvider implements PayoutProvider {
  name = 'Vodafone Cash';
  
  async process(amount: number, recipient: any): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
    console.log(`Processing Vodafone Cash payout: GHS ${amount} to ${recipient.phone}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.2;
    return success 
      ? { success: true, transaction_id: `voda_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
      : { success: false, error: 'Vodafone Cash service temporarily unavailable' };
  }
}

class BankTransferProvider implements PayoutProvider {
  name = 'Bank Transfer';
  
  async process(amount: number, recipient: any): Promise<{ success: boolean; transaction_id?: string; error?: string }> {
    console.log(`Processing bank transfer: GHS ${amount} to ${recipient.account_number}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = Math.random() > 0.1; // Higher success rate for bank transfers
    return success 
      ? { success: true, transaction_id: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
      : { success: false, error: 'Bank transfer failed - invalid account details' };
  }
}

export class PayoutService {
  private providers = new Map<string, PayoutProvider>([
    ['mtn_momo', new MTNMobileMoneyProvider()],
    ['vodafone_cash', new VodafoneCashProvider()],
    ['bank_transfer', new BankTransferProvider()]
  ]);

  // Calculate creator earnings for a specific period
  async calculateCreatorEarnings(
    creatorId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<PayoutCalculation> {
    try {
      // Get all successful payment transactions for this creator in the period
      const transactions = await storage.getCreatorPaymentTransactions(creatorId, startDate, endDate);
      
      let gross_revenue = 0;
      let transaction_count = 0;
      
      for (const transaction of transactions) {
        gross_revenue += parseFloat(transaction.amount);
        transaction_count++;
      }
      
      // Get platform settings for commission rate
      const platformSettings = await storage.getPlatformSettings();
      const platform_fee_rate = platformSettings.commission_rate; // Use dynamic commission rate
      const paystack_fee_rate = 0.035; // 3.5% Paystack fee (approximate)
      
      const platform_fee = gross_revenue * platform_fee_rate;
      const paystack_fees = gross_revenue * paystack_fee_rate;
      const net_payout = gross_revenue - platform_fee - paystack_fees;
      
      return {
        creator_id: creatorId,
        gross_revenue,
        platform_fee,
        paystack_fees,
        net_payout: Math.max(0, net_payout), // Ensure non-negative
        transaction_count
      };
    } catch (error) {
      console.error('Error calculating creator earnings:', error);
      throw error;
    }
  }

  // Process payout for a specific creator
  async processCreatorPayout(calculation: PayoutCalculation, period_start: Date, period_end: Date): Promise<void> {
    try {
      // Minimum payout threshold
      const MINIMUM_PAYOUT = 10.00; // GHS 10
      
      if (calculation.net_payout < MINIMUM_PAYOUT) {
        console.log(`Skipping payout for creator ${calculation.creator_id}: Below minimum threshold (GHS ${calculation.net_payout})`);
        return;
      }
      
      // Get creator details
      const creator = await storage.getUser(calculation.creator_id);
      if (!creator) {
        throw new Error(`Creator ${calculation.creator_id} not found`);
      }
      
      // Get creator's payout settings
      const payoutSettings = await storage.getCreatorPayoutSettings(calculation.creator_id);
      if (!payoutSettings || !payoutSettings.payout_method) {
        console.log(`Skipping payout for creator ${calculation.creator_id}: No payout method configured`);
        return;
      }
      
      // Create pending payout record
      const payout = await storage.createCreatorPayout({
        creator_id: calculation.creator_id,
        amount: calculation.net_payout.toString(),
        currency: 'GHS',
        status: 'pending',
        period_start,
        period_end,
        payout_method: payoutSettings.payout_method
      });
      
      console.log(`Created payout record ${payout.id} for creator ${calculation.creator_id}: GHS ${calculation.net_payout}`);
      
      // Process the actual payout
      const provider = this.providers.get(payoutSettings.payout_method);
      if (!provider) {
        await storage.updateCreatorPayoutStatus(payout.id, 'failed');
        throw new Error(`Unsupported payout method: ${payoutSettings.payout_method}`);
      }
      
      try {
        const result = await provider.process(calculation.net_payout, payoutSettings);
        
        if (result.success) {
          await storage.updateCreatorPayoutStatus(payout.id, 'completed', result.transaction_id);
          console.log(`Payout ${payout.id} completed successfully: ${result.transaction_id}`);
        } else {
          await storage.updateCreatorPayoutStatus(payout.id, 'failed');
          console.error(`Payout ${payout.id} failed: ${result.error}`);
        }
      } catch (error) {
        await storage.updateCreatorPayoutStatus(payout.id, 'failed');
        console.error(`Payout ${payout.id} processing error:`, error);
      }
    } catch (error) {
      console.error('Error processing creator payout:', error);
      throw error;
    }
  }

  // Process monthly payouts for all creators
  async processMonthlyPayouts(): Promise<void> {
    try {
      const now = new Date();
      const period_end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
      const period_start = new Date(period_end.getFullYear(), period_end.getMonth(), 1); // First day of previous month
      
      console.log(`Processing monthly payouts for period: ${period_start.toISOString()} to ${period_end.toISOString()}`);
      
      // Get all creators
      const creators = await storage.getAllCreators();
      
      for (const creator of creators) {
        try {
          // Calculate earnings for this creator
          const calculation = await this.calculateCreatorEarnings(creator.id, period_start, period_end);
          
          if (calculation.net_payout > 0) {
            await this.processCreatorPayout(calculation, period_start, period_end);
          }
        } catch (error) {
          console.error(`Error processing payout for creator ${creator.id}:`, error);
          // Continue with other creators
        }
      }
      
      console.log('Monthly payout processing completed');
    } catch (error) {
      console.error('Error in monthly payout processing:', error);
      throw error;
    }
  }

  // Get payout history for a creator
  async getCreatorPayoutHistory(creatorId: number, limit: number = 10): Promise<any[]> {
    return storage.getCreatorPayouts(creatorId, limit);
  }

  // Get payout statistics
  async getPayoutStats(creatorId?: number): Promise<any> {
    if (creatorId) {
      return storage.getCreatorPayoutStats(creatorId);
    }
    return storage.getAllPayoutStats();
  }
}

export const payoutService = new PayoutService();
