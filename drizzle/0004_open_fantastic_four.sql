CREATE TYPE "public"."post_type" AS ENUM('TEXT', 'MEDIA');--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "text" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "type" "post_type" DEFAULT 'TEXT' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "media" text;