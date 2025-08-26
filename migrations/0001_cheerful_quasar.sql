CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"reported_by" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_id" integer NOT NULL,
	"target_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"admin_notes" text,
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_payouts" ALTER COLUMN "currency" SET DEFAULT 'GHS';--> statement-breakpoint
ALTER TABLE "payment_transactions" ALTER COLUMN "currency" SET DEFAULT 'GHS';--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_tiers" ALTER COLUMN "currency" SET DEFAULT 'GHS';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;