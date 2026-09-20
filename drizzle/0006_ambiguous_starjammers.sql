CREATE TABLE "telegram_bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_bot_id" bigint NOT NULL,
	"username" text,
	"token" text NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_bots_telegram_bot_id_unique" UNIQUE("telegram_bot_id"),
	CONSTRAINT "telegram_bots_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "bot_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "supergroups" ADD COLUMN "bot_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_bot_id_telegram_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."telegram_bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supergroups" ADD CONSTRAINT "supergroups_bot_id_telegram_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."telegram_bots"("id") ON DELETE cascade ON UPDATE no action;