
import * as cron from 'node-cron';
import { payoutService } from './payoutService';
import { db } from '../db';
import { posts } from '../../shared/schema';
import { eq, and, lte, sql } from 'drizzle-orm';

export class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private lastErrorLog: number = 0;

  // Start all scheduled jobs
  start(): void {
    console.log('Starting cron service...');
    
    // Schedule monthly payouts (1st of every month at 9:00 AM)
    const monthlyPayoutJob = cron.schedule('0 9 1 * *', async () => {
      console.log('Running scheduled monthly payout processing...');
      try {
        await payoutService.processMonthlyPayouts();
        console.log('Scheduled monthly payout processing completed');
      } catch (error) {
        console.error('Error in scheduled monthly payout processing:', error);
      }
    }, {
      timezone: 'Africa/Accra' // Ghana timezone
    });

    this.jobs.set('monthly-payouts', monthlyPayoutJob);
    monthlyPayoutJob.start();

    // Schedule weekly payout status checks (every Monday at 10:00 AM)
    const weeklyStatusJob = cron.schedule('0 10 * * 1', async () => {
      console.log('Running weekly payout status check...');
      try {
        await this.checkPendingPayouts();
        console.log('Weekly payout status check completed');
      } catch (error) {
        console.error('Error in weekly payout status check:', error);
      }
    }, {
      timezone: 'Africa/Accra'
    });

    this.jobs.set('weekly-status-check', weeklyStatusJob);
    weeklyStatusJob.start();

    // Schedule post publishing check (every minute)
    const postPublishingJob = cron.schedule('* * * * *', async () => {
      try {
        await this.publishScheduledPosts();
      } catch (error) {
        console.error('Error in scheduled post publishing:', error);
      }
    }, {
      timezone: 'Africa/Accra'
    });

    this.jobs.set('post-publishing', postPublishingJob);
    postPublishingJob.start();

    console.log('Cron service started with scheduled jobs:');
    console.log('- Monthly payouts: 1st of every month at 9:00 AM');
    console.log('- Weekly status checks: Every Monday at 10:00 AM');
    console.log('- Post publishing: Every minute');
  }

  // Stop all scheduled jobs
  stop(): void {
    console.log('Stopping cron service...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  // Check and retry pending payouts
  private async checkPendingPayouts(): Promise<void> {
    console.log('Checking pending payouts...');
    // Implementation would check for payouts stuck in pending status
    // and retry them or mark them as failed after a certain time
  }

  // Publish scheduled posts that are due
  private async publishScheduledPosts(): Promise<void> {
    try {
      // Check if database tables exist first
      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'posts'
      `);
      
      if (!result || (result as any).rows?.length === 0) {
        // Tables don't exist yet, skip this execution
        return;
      }

      const now = new Date();
      
      // Find all scheduled posts where scheduled_for <= now
      const scheduledPosts = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.status, 'scheduled'),
            lte(posts.scheduled_for, now)
          )
        );

      if (scheduledPosts.length > 0) {
        console.log(`Publishing ${scheduledPosts.length} scheduled posts...`);

        // Update each post to published status
        for (const post of scheduledPosts) {
          await db
            .update(posts)
            .set({ 
              status: 'published',
              updated_at: new Date()
            })
            .where(eq(posts.id, post.id));

          console.log(`Published post "${post.title}" (ID: ${post.id})`);
        }

        console.log(`Successfully published ${scheduledPosts.length} scheduled posts`);
      }
    } catch (error) {
      // Only log the error once every 10 minutes to avoid spam
      if (!this.lastErrorLog || Date.now() - this.lastErrorLog > 600000) {
        console.error('Error publishing scheduled posts:', error instanceof Error ? error.message : 'Unknown error');
        this.lastErrorLog = Date.now();
      }
    }
  }

  // Manual trigger for monthly payouts (for testing/admin use)
  async triggerMonthlyPayouts(): Promise<void> {
    console.log('Manually triggering monthly payout processing...');
    await payoutService.processMonthlyPayouts();
  }

  // Manual trigger for publishing scheduled posts (for testing/admin use)
  async triggerScheduledPostPublishing(): Promise<void> {
    console.log('Manually triggering scheduled post publishing...');
    await this.publishScheduledPosts();
  }
}

export const cronService = new CronService();
