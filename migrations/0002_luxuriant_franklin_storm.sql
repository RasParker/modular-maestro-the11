CREATE TABLE "creator_payout_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"payout_method" text NOT NULL,
	"momo_provider" text,
	"momo_phone" text,
	"momo_name" text,
	"bank_name" text,
	"account_number" text,
	"account_name" text,
	"auto_withdraw_enabled" boolean DEFAULT false NOT NULL,
	"auto_withdraw_threshold" numeric(10, 2) DEFAULT '500.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_payout_settings_creator_id_unique" UNIQUE("creator_id")
);
--> statement-breakpoint
ALTER TABLE "creator_payouts" ADD COLUMN "transaction_id" text;