CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "campaign_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "campaign_posts_campaign_id_position_unique" UNIQUE("campaign_id","position")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic_name" text NOT NULL,
	"interval_seconds" integer NOT NULL,
	"current_post_index" integer DEFAULT 0 NOT NULL,
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"next_run_at" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_posts" ADD CONSTRAINT "campaign_posts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_posts" ADD CONSTRAINT "campaign_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;