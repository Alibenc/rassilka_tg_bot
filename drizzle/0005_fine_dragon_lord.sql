ALTER TABLE "posts" DROP CONSTRAINT "posts_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;