CREATE TYPE "public"."user_role" AS ENUM('OWNER', 'ADMIN', 'CONTENT_MANAGER');--> statement-breakpoint
CREATE TABLE "supergroups" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" bigint NOT NULL,
	"title" text NOT NULL,
	"username" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supergroups_telegram_chat_id_unique" UNIQUE("telegram_chat_id")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_thread_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"supergroup_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_supergroup_id_telegram_thread_id_unique" UNIQUE("supergroup_id","telegram_thread_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"role" "user_role" DEFAULT 'CONTENT_MANAGER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_supergroup_id_supergroups_id_fk" FOREIGN KEY ("supergroup_id") REFERENCES "public"."supergroups"("id") ON DELETE cascade ON UPDATE no action;