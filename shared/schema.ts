import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull().default("fan"), // fan, creator, admin
  status: text("status").notNull().default("active"), // active, suspended
  display_name: text("display_name"),
  bio: text("bio"),
  cover_image: text("cover_image"),
  social_links: json("social_links").$type<{
    twitter?: string;
    instagram?: string;
    website?: string;
  }>(),
  verified: boolean("verified").notNull().default(false),
  total_subscribers: integer("total_subscribers").notNull().default(0),
  total_earnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0.00"),
  commission_rate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("0.15"), // 15% platform fee
  comments_enabled: boolean("comments_enabled").notNull().default(true), // Allow comments on posts
  auto_post_enabled: boolean("auto_post_enabled").notNull().default(false), // Auto-post to social media
  watermark_enabled: boolean("watermark_enabled").notNull().default(true), // Add watermark to images
  profile_discoverable: boolean("profile_discoverable").notNull().default(true), // Allow profile to appear in search results
  activity_status_visible: boolean("activity_status_visible").notNull().default(false), // Show when user is online
  is_online: boolean("is_online").notNull().default(false), // Current online status
  last_seen: timestamp("last_seen"), // Last activity timestamp
  primary_category_id: integer("primary_category_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull(), // Lucide icon name
  color: text("color").notNull().default("#6366f1"), // Hex color for category
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const creator_categories = pgTable("creator_categories", {
  id: serial("id").primaryKey(),
  creator_id: integer("creator_id").notNull(),
  category_id: integer("category_id").notNull(),
  is_primary: boolean("is_primary").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  creator_id: integer('creator_id').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  media_type: text('media_type').notNull().default('text'),
  media_urls: text("media_urls").array().notNull().default([]),
  tier: text('tier').notNull().default('public'),
  status: text('status').notNull().default('published'), // published, draft, scheduled
  scheduled_for: timestamp('scheduled_for'), // when to publish scheduled posts
  likes_count: integer('likes_count').notNull().default(0),
  comments_count: integer('comments_count').notNull().default(0),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  post_id: integer("post_id").notNull(),
  user_id: integer("user_id").notNull(),
  parent_id: integer("parent_id"), // for replies
  content: text("content").notNull(),
  likes_count: integer("likes_count").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const comment_likes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  comment_id: integer("comment_id").notNull(),
  user_id: integer("user_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const post_likes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  post_id: integer("post_id").notNull(),
  user_id: integer("user_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Subscription system tables
export const subscription_tiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  creator_id: integer("creator_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GHS"),
  benefits: jsonb("benefits").notNull().default(["Basic access"]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  fan_id: integer("fan_id").notNull(),
  creator_id: integer("creator_id").notNull(),
  tier_id: integer("tier_id").notNull(),
  status: text("status").notNull().default("active"), // active, paused, cancelled, expired
  started_at: timestamp("started_at").notNull().defaultNow(),
  ends_at: timestamp("ends_at"),
  auto_renew: boolean("auto_renew").notNull().default(true),
  next_billing_date: timestamp("next_billing_date"),
  previous_tier_id: integer("previous_tier_id"), // For tracking tier changes
  billing_cycle_anchor: timestamp("billing_cycle_anchor"), // Original billing date for pro-rating
  proration_credit: decimal("proration_credit", { precision: 10, scale: 2 }).default("0.00"), // Credit from downgrades
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const payment_transactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  subscription_id: integer("subscription_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GHS"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  payment_method: text("payment_method"), // stripe, paypal, etc.
  transaction_id: text("transaction_id"), // external payment processor transaction ID
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const creator_payouts = pgTable("creator_payouts", {
  id: serial("id").primaryKey(),
  creator_id: integer("creator_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GHS"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  period_start: timestamp("period_start").notNull(),
  period_end: timestamp("period_end").notNull(),
  payout_method: text("payout_method"), // mtn_momo, vodafone_cash, bank_transfer, etc.
  transaction_id: text("transaction_id"), // External payout provider transaction ID
  processed_at: timestamp("processed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const creator_payout_settings = pgTable("creator_payout_settings", {
  id: serial("id").primaryKey(),
  creator_id: integer("creator_id").notNull().unique(),
  payout_method: text("payout_method").notNull(), // mtn_momo, vodafone_cash, bank_transfer, etc.
  // Mobile Money fields
  momo_provider: text("momo_provider"), // mtn, vodafone, airteltigo
  momo_phone: text("momo_phone"),
  momo_name: text("momo_name"),
  // Bank Transfer fields
  bank_name: text("bank_name"),
  account_number: text("account_number"),
  account_name: text("account_name"),
  // Other settings
  auto_withdraw_enabled: boolean("auto_withdraw_enabled").notNull().default(false),
  auto_withdraw_threshold: decimal("auto_withdraw_threshold", { precision: 10, scale: 2 }).default("500.00"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'content', 'user', 'payment'
  reason: text("reason").notNull(),
  description: text("description"),
  reported_by: integer("reported_by").notNull(),
  target_type: text("target_type").notNull(), // 'post', 'user', 'comment'
  target_id: integer("target_id").notNull(),
  target_name: text("target_name"), // Human readable target name
  status: text("status").notNull().default('pending'), // 'pending', 'under_review', 'resolved', 'dismissed'
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high'
  admin_notes: text("admin_notes"),
  resolved_by: integer("resolved_by"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

// Messaging system tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant_1_id: integer("participant_1_id").notNull(),
  participant_2_id: integer("participant_2_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Notification system tables
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  type: text("type").notNull(), // 'new_subscriber', 'new_message', 'new_comment', 'new_post', 'payment_success', 'payment_failed', 'payout_completed', 'like'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  action_url: text("action_url"), // URL to navigate to when clicked
  actor_id: integer("actor_id"), // ID of user who triggered the notification
  entity_type: text("entity_type"), // 'post', 'comment', 'subscription', 'message', 'payment'
  entity_id: integer("entity_id"), // ID of the related entity
  metadata: json("metadata").$type<{
    [key: string]: any;
  }>(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const notification_preferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().unique(),
  // Email notifications
  email_new_subscribers: boolean("email_new_subscribers").notNull().default(true),
  email_new_messages: boolean("email_new_messages").notNull().default(true),
  email_new_comments: boolean("email_new_comments").notNull().default(true),
  email_new_posts: boolean("email_new_posts").notNull().default(false),
  email_payments: boolean("email_payments").notNull().default(true),
  email_payouts: boolean("email_payouts").notNull().default(true),
  email_likes: boolean("email_likes").notNull().default(false),
  // In-app notifications
  app_new_subscribers: boolean("app_new_subscribers").notNull().default(true),
  app_new_messages: boolean("app_new_messages").notNull().default(true),
  app_new_comments: boolean("app_new_comments").notNull().default(true),
  app_new_posts: boolean("app_new_posts").notNull().default(true),
  app_payments: boolean("app_payments").notNull().default(true),
  app_payouts: boolean("app_payouts").notNull().default(true),
  app_likes: boolean("app_likes").notNull().default(true),
  // Push notifications (for future mobile app)
  push_enabled: boolean("push_enabled").notNull().default(false),
  push_new_messages: boolean("push_new_messages").notNull().default(false),
  push_new_subscribers: boolean("push_new_subscribers").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id").notNull(),
  sender_id: integer("sender_id").notNull(),
  recipient_id: integer("recipient_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Creator interaction tables
export const creator_likes = pgTable("creator_likes", {
  id: serial("id").primaryKey(),
  fan_id: integer("fan_id").notNull(),
  creator_id: integer("creator_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const creator_favorites = pgTable("creator_favorites", {
  id: serial("id").primaryKey(),
  fan_id: integer("fan_id").notNull(),
  creator_id: integer("creator_id").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Subscription change tracking for audit trail
export const subscription_changes = pgTable("subscription_changes", {
  id: serial("id").primaryKey(),
  subscription_id: integer("subscription_id").notNull(),
  from_tier_id: integer("from_tier_id"),
  to_tier_id: integer("to_tier_id").notNull(),
  change_type: text("change_type").notNull(), // upgrade, downgrade, reactivate, pause, cancel
  proration_amount: decimal("proration_amount", { precision: 10, scale: 2 }).default("0.00"),
  effective_date: timestamp("effective_date").notNull().defaultNow(),
  billing_impact: text("billing_impact"), // immediate, next_cycle, prorated
  reason: text("reason"), // user_initiated, admin_action, system_auto
  metadata: json("metadata").$type<{
    [key: string]: any;
  }>(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Pending subscription changes (for scheduled downgrades, etc.)
export const pending_subscription_changes = pgTable("pending_subscription_changes", {
  id: serial("id").primaryKey(),
  subscription_id: integer("subscription_id").notNull(),
  from_tier_id: integer("from_tier_id").notNull(),
  to_tier_id: integer("to_tier_id").notNull(),
  change_type: text("change_type").notNull(), // downgrade, upgrade, cancel
  scheduled_date: timestamp("scheduled_date").notNull(), // when change should take effect
  proration_amount: decimal("proration_amount", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").notNull().default("pending"), // pending, applied, cancelled
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Pro-rating credits for billing adjustments
export const proration_credits = pgTable("proration_credits", {
  id: serial("id").primaryKey(),
  subscription_id: integer("subscription_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("GHS"),
  credit_type: text("credit_type").notNull(), // upgrade_proration, downgrade_credit, refund
  description: text("description").notNull(),
  applied_to_payment_id: integer("applied_to_payment_id"), // which payment this credit was applied to
  status: text("status").notNull().default("pending"), // pending, applied, expired
  expires_at: timestamp("expires_at"), // when credit expires if not used
  created_at: timestamp("created_at").notNull().defaultNow(),
  applied_at: timestamp("applied_at"),
});

// Database relations
export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  comments: many(comments),
  subscriptions: many(subscriptions),
  subscription_tiers: many(subscription_tiers),
  payment_transactions: many(payment_transactions),
  creator_payouts: many(creator_payouts),
  payout_settings: one(creator_payout_settings),
  sent_messages: many(messages, { relationName: "sentMessages" }),
  received_messages: many(messages, { relationName: "receivedMessages" }),
  notifications: many(notifications),
  notification_preferences: one(notification_preferences),
  liked_creators: many(creator_likes, { relationName: "fanLikes" }),
  creator_likes_received: many(creator_likes, { relationName: "creatorLikes" }),
  favorite_creators: many(creator_favorites, { relationName: "fanFavorites" }),
  creator_favorites_received: many(creator_favorites, { relationName: "creatorFavorites" }),
  primary_category: one(categories, {
    fields: [users.primary_category_id],
    references: [categories.id],
  }),
  creator_categories: many(creator_categories),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  creator: one(users, {
    fields: [posts.creator_id],
    references: [users.id],
  }),
  comments: many(comments),
  post_likes: many(post_likes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.post_id],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.user_id],
    references: [users.id],
  }),
  comment_likes: many(comment_likes),
}));

export const subscriptionTiersRelations = relations(subscription_tiers, ({ one, many }) => ({
  creator: one(users, {
    fields: [subscription_tiers.creator_id],
    references: [users.id],
  }),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  fan: one(users, {
    fields: [subscriptions.fan_id],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [subscriptions.creator_id],
    references: [users.id],
  }),
  tier: one(subscription_tiers, {
    fields: [subscriptions.tier_id],
    references: [subscription_tiers.id],
  }),
  previous_tier: one(subscription_tiers, {
    fields: [subscriptions.previous_tier_id],
    references: [subscription_tiers.id],
  }),
  payment_transactions: many(payment_transactions),
  subscription_changes: many(subscription_changes),
  pending_changes: many(pending_subscription_changes),
  proration_credits: many(proration_credits),
}));

export const paymentTransactionsRelations = relations(payment_transactions, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payment_transactions.subscription_id],
    references: [subscriptions.id],
  }),
}));

export const creatorPayoutsRelations = relations(creator_payouts, ({ one }) => ({
  creator: one(users, {
    fields: [creator_payouts.creator_id],
    references: [users.id],
  }),
}));

export const creatorPayoutSettingsRelations = relations(creator_payout_settings, ({ one }) => ({
  creator: one(users, {
    fields: [creator_payout_settings.creator_id],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant_1: one(users, {
    fields: [conversations.participant_1_id],
    references: [users.id],
  }),
  participant_2: one(users, {
    fields: [conversations.participant_2_id],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.sender_id],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [messages.recipient_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actor_id],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notification_preferences, ({ one }) => ({
  user: one(users, {
    fields: [notification_preferences.user_id],
    references: [users.id],
  }),
}));

export const creatorLikesRelations = relations(creator_likes, ({ one }) => ({
  fan: one(users, {
    fields: [creator_likes.fan_id],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [creator_likes.creator_id],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  creator_categories: many(creator_categories),
  primary_users: many(users),
}));

export const creatorCategoriesRelations = relations(creator_categories, ({ one }) => ({
  creator: one(users, {
    fields: [creator_categories.creator_id],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [creator_categories.category_id],
    references: [categories.id],
  }),
}));

export const creatorFavoritesRelations = relations(creator_favorites, ({ one }) => ({
  fan: one(users, {
    fields: [creator_favorites.fan_id],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [creator_favorites.creator_id],
    references: [users.id],
  }),
}));

export const subscriptionChangesRelations = relations(subscription_changes, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscription_changes.subscription_id],
    references: [subscriptions.id],
  }),
  from_tier: one(subscription_tiers, {
    fields: [subscription_changes.from_tier_id],
    references: [subscription_tiers.id],
  }),
  to_tier: one(subscription_tiers, {
    fields: [subscription_changes.to_tier_id],
    references: [subscription_tiers.id],
  }),
}));

export const pendingSubscriptionChangesRelations = relations(pending_subscription_changes, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [pending_subscription_changes.subscription_id],
    references: [subscriptions.id],
  }),
  from_tier: one(subscription_tiers, {
    fields: [pending_subscription_changes.from_tier_id],
    references: [subscription_tiers.id],
  }),
  to_tier: one(subscription_tiers, {
    fields: [pending_subscription_changes.to_tier_id],
    references: [subscription_tiers.id],
  }),
}));

export const prorationCreditsRelations = relations(proration_credits, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [proration_credits.subscription_id],
    references: [subscriptions.id],
  }),
  applied_payment: one(payment_transactions, {
    fields: [proration_credits.applied_to_payment_id],
    references: [payment_transactions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  display_name: true,
  bio: true,
  cover_image: true,
  social_links: true,
  primary_category_id: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  creator_id: true,
  title: true,
  content: true,
  media_urls: true,
  media_type: true,
  tier: true,
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
  benefits: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  fan_id: true,
  creator_id: true,
  tier_id: true,
  status: true,
  started_at: true,
  ends_at: true,
  auto_renew: true,
  next_billing_date: true,
}).extend({
  fan_id: z.number(),
  creator_id: z.number(),
  tier_id: z.number(),
  started_at: z.date().optional(),
  ends_at: z.date().optional().nullable(),
  next_billing_date: z.date().optional(),
});

export const insertPaymentTransactionSchema = createInsertSchema(payment_transactions).pick({
  subscription_id: true,
  amount: true,
  currency: true,
  status: true,
  payment_method: true,
  transaction_id: true,
  processed_at: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  type: true,
  reason: true,
  description: true,
  reported_by: true,
  target_type: true,
  target_id: true,
  target_name: true,
  status: true,
  priority: true,
  admin_notes: true,
  resolved_by: true,
});

export const insertCreatorPayoutSettingsSchema = createInsertSchema(creator_payout_settings).pick({
  creator_id: true,
  payout_method: true,
  momo_provider: true,
  momo_phone: true,
  momo_name: true,
  bank_name: true,
  account_number: true,
  account_name: true,
  auto_withdraw_enabled: true,
  auto_withdraw_threshold: true,
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

export const insertConversationSchema = createInsertSchema(conversations).pick({
  participant_1_id: true,
  participant_2_id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversation_id: true,
  sender_id: true,
  recipient_id: true,
  content: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  user_id: true,
  type: true,
  title: true,
  message: true,
  action_url: true,
  actor_id: true,
  entity_type: true,
  entity_id: true,
  metadata: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notification_preferences).pick({
  user_id: true,
  email_new_subscribers: true,
  email_new_messages: true,
  email_new_comments: true,
  email_new_posts: true,
  email_payments: true,
  email_payouts: true,
  email_likes: true,
  app_new_subscribers: true,
  app_new_messages: true,
  app_new_comments: true,
  app_new_posts: true,
  app_payments: true,
  app_payouts: true,
  app_likes: true,
  push_enabled: true,
  push_new_messages: true,
  push_new_subscribers: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notification_preferences.$inferSelect;

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  icon: true,
  color: true,
  is_active: true,
});

export const insertCreatorCategorySchema = createInsertSchema(creator_categories).pick({
  creator_id: true,
  category_id: true,
  is_primary: true,
});

export const insertCreatorLikeSchema = createInsertSchema(creator_likes).pick({
  fan_id: true,
  creator_id: true,
});

export const insertCreatorFavoriteSchema = createInsertSchema(creator_favorites).pick({
  fan_id: true,
  creator_id: true,
});

export const insertSubscriptionChangeSchema = createInsertSchema(subscription_changes).pick({
  subscription_id: true,
  from_tier_id: true,
  to_tier_id: true,
  change_type: true,
  proration_amount: true,
  effective_date: true,
  billing_impact: true,
  reason: true,
  metadata: true,
});

export const insertPendingSubscriptionChangeSchema = createInsertSchema(pending_subscription_changes).pick({
  subscription_id: true,
  from_tier_id: true,
  to_tier_id: true,
  change_type: true,
  scheduled_date: true,
  proration_amount: true,
  status: true,
});

export const insertProrationCreditSchema = createInsertSchema(proration_credits).pick({
  subscription_id: true,
  amount: true,
  currency: true,
  credit_type: true,
  description: true,
  applied_to_payment_id: true,
  status: true,
  expires_at: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCreatorCategory = z.infer<typeof insertCreatorCategorySchema>;
export type CreatorCategory = typeof creator_categories.$inferSelect;

export type InsertCreatorLike = z.infer<typeof insertCreatorLikeSchema>;
export type CreatorLike = typeof creator_likes.$inferSelect;
export type InsertCreatorFavorite = z.infer<typeof insertCreatorFavoriteSchema>;
export type CreatorFavorite = typeof creator_favorites.$inferSelect;
export type InsertSubscriptionChange = z.infer<typeof insertSubscriptionChangeSchema>;
export type SubscriptionChange = typeof subscription_changes.$inferSelect;
export type InsertPendingSubscriptionChange = z.infer<typeof insertPendingSubscriptionChangeSchema>;
export type PendingSubscriptionChange = typeof pending_subscription_changes.$inferSelect;
export type InsertProrationCredit = z.infer<typeof insertProrationCreditSchema>;
export type ProrationCredit = typeof proration_credits.$inferSelect;