import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("fan"), // fan, creator, admin
  status: text("status").notNull().default("active"), // active, suspended
  display_name: text("display_name"),
  bio: text("bio"),
  cover_image: text("cover_image"),
  social_links: text("social_links"), // JSON string
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  total_subscribers: integer("total_subscribers").notNull().default(0),
  total_earnings: real("total_earnings").notNull().default(0.00),
  commission_rate: real("commission_rate").notNull().default(0.15), // 15% platform fee
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  creator_id: integer('creator_id').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  media_type: text('media_type').notNull().default('text'),
  media_urls: text("media_urls").notNull().default('[]'), // JSON string
  tier: text('tier').notNull().default('public'),
  status: text('status').notNull().default('published'), // published, draft, scheduled
  likes_count: integer('likes_count').notNull().default(0),
  comments_count: integer('comments_count').notNull().default(0),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  post_id: integer("post_id").notNull(),
  user_id: integer("user_id").notNull(),
  parent_id: integer("parent_id"), // for replies
  content: text("content").notNull(),
  likes_count: integer("likes_count").notNull().default(0),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const comment_likes = sqliteTable("comment_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  comment_id: integer("comment_id").notNull(),
  user_id: integer("user_id").notNull(),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const post_likes = sqliteTable("post_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  post_id: integer("post_id").notNull(),
  user_id: integer("user_id").notNull(),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Subscription system tables
export const subscription_tiers = sqliteTable("subscription_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creator_id: integer("creator_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  currency: text("currency").notNull().default("GHS"),
  tier_level: text("tier_level").notNull(), // supporter, fan, premium, superfan
  benefits: text("benefits"), // JSON string
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fan_id: integer("fan_id").notNull(),
  creator_id: integer("creator_id").notNull(),
  tier_id: integer("tier_id").notNull(),
  status: text("status").notNull().default("active"), // active, paused, cancelled
  current_period_start: text("current_period_start").notNull(),
  current_period_end: text("current_period_end").notNull(),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  auto_renew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  stripe_subscription_id: text("stripe_subscription_id"),
});

export const payment_transactions = sqliteTable("payment_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscription_id: integer("subscription_id").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("GHS"),
  status: text("status").notNull(), // pending, completed, failed
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  processed_at: text("processed_at"),
});

export const creator_payouts = sqliteTable("creator_payouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creator_id: integer("creator_id").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("GHS"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  stripe_transfer_id: text("stripe_transfer_id"),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  processed_at: text("processed_at"),
});

export const creator_payout_settings = sqliteTable("creator_payout_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creator_id: integer("creator_id").notNull(),
  payout_method: text("payout_method").notNull(), // bank_transfer, mobile_money, etc.
  payout_details: text("payout_details").notNull(), // JSON string with account details
  minimum_payout_amount: real("minimum_payout_amount").notNull().default(50.0),
  auto_payout_enabled: integer("auto_payout_enabled", { mode: "boolean" }).notNull().default(false),
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reporter_id: integer("reporter_id").notNull(),
  reported_user_id: integer("reported_user_id"),
  reported_post_id: integer("reported_post_id"),
  reported_comment_id: integer("reported_comment_id"),
  type: text("type").notNull(), // spam, harassment, inappropriate_content, etc.
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  comments: many(comments),
  postLikes: many(post_likes),
  commentLikes: many(comment_likes),
  subscriptionTiers: many(subscription_tiers),
  subscriptions: many(subscriptions),
  payouts: many(creator_payouts),
  payoutSettings: one(creator_payout_settings),
  reports: many(reports),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  creator: one(users, { fields: [posts.creator_id], references: [users.id] }),
  comments: many(comments),
  likes: many(post_likes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.post_id], references: [posts.id] }),
  user: one(users, { fields: [comments.user_id], references: [users.id] }),
  parent: one(comments, { fields: [comments.parent_id], references: [comments.id] }),
  replies: many(comments),
  likes: many(comment_likes),
}));

export const subscriptionTiersRelations = relations(subscription_tiers, ({ one, many }) => ({
  creator: one(users, { fields: [subscription_tiers.creator_id], references: [users.id] }),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  fan: one(users, { fields: [subscriptions.fan_id], references: [users.id] }),
  creator: one(users, { fields: [subscriptions.creator_id], references: [users.id] }),
  tier: one(subscription_tiers, { fields: [subscriptions.tier_id], references: [subscription_tiers.id] }),
  paymentTransactions: many(payment_transactions),
}));

export const paymentTransactionsRelations = relations(payment_transactions, ({ one }) => ({
  subscription: one(subscriptions, { fields: [payment_transactions.subscription_id], references: [subscriptions.id] }),
}));

export const creatorPayoutsRelations = relations(creator_payouts, ({ one }) => ({
  creator: one(users, { fields: [creator_payouts.creator_id], references: [users.id] }),
}));

export const creatorPayoutSettingsRelations = relations(creator_payout_settings, ({ one }) => ({
  creator: one(users, { fields: [creator_payout_settings.creator_id], references: [users.id] }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  avatar: true,
  role: true,
  status: true,
  display_name: true,
  bio: true,
  cover_image: true,
  social_links: true,
  verified: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  creator_id: true,
  title: true,
  content: true,
  media_type: true,
  media_urls: true,
  tier: true,
  status: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  post_id: true,
  user_id: true,
  parent_id: true,
  content: true,
});

export const insertSubscriptionTierSchema = createInsertSchema(subscription_tiers).pick({
  creator_id: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  tier_level: true,
  benefits: true,
  is_active: true,
}).partial({ tier_level: true });

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  fan_id: true,
  creator_id: true,
  tier_id: true,
  status: true,
  current_period_start: true,
  current_period_end: true,
  auto_renew: true,
  stripe_subscription_id: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(payment_transactions).pick({
  subscription_id: true,
  amount: true,
  currency: true,
  status: true,
  stripe_payment_intent_id: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  reporter_id: true,
  reported_user_id: true,
  reported_post_id: true,
  reported_comment_id: true,
  type: true,
  reason: true,
  description: true,
});

export const insertCreatorPayoutSettingsSchema = createInsertSchema(creator_payout_settings).pick({
  creator_id: true,
  payout_method: true,
  payout_details: true,
  minimum_payout_amount: true,
  auto_payout_enabled: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type SubscriptionTier = typeof subscription_tiers.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof payment_transactions.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type CreatorPayout = typeof creator_payouts.$inferSelect;
export type InsertCreatorPayoutSettings = z.infer<typeof insertCreatorPayoutSettingsSchema>;
export type CreatorPayoutSettings = typeof creator_payout_settings.$inferSelect;