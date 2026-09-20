import {
    bigint,
    boolean,
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
    "OWNER",
    "ADMIN",
    "CONTENT_MANAGER",
]);

export const users = pgTable("users", {
    id: serial("id").primaryKey(),

    telegramId: bigint("telegram_id", {
        mode: "bigint",
    }).notNull().unique(),

    username: text("username"),

    role: userRoleEnum("role")
        .notNull()
        .default("CONTENT_MANAGER"),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

export const supergroups = pgTable("supergroups", {
    id: serial("id").primaryKey(),

    telegramChatId: bigint("telegram_chat_id", {
        mode: "bigint",
    }).notNull().unique(),

    title: text("title").notNull(),

    username: text("username"),

    isActive: boolean("is_active")
        .notNull()
        .default(true),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

export const topics = pgTable(
    "topics",
    {
        id: serial("id").primaryKey(),

        telegramThreadId: integer("telegram_thread_id")
            .notNull(),

        name: text("name").notNull(),

        isClosed: boolean("is_closed")
            .notNull()
            .default(false),

        supergroupId: integer("supergroup_id")
            .notNull()
            .references(() => supergroups.id, {
                onDelete: "cascade",
            }),

        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at")
            .notNull()
            .defaultNow(),
    },

    (table) => ({
        supergroupThreadUnique: unique().on(
            table.supergroupId,
            table.telegramThreadId,
        ),
    }),
);

export const campaignStatusEnum = pgEnum("campaign_status", [
    "DRAFT",
    "ACTIVE",
    "PAUSED",
    "COMPLETED",
]);

export const postTypeEnum = pgEnum("post_type", [
    "TEXT",
    "MEDIA",
]);

export const posts = pgTable("posts", {
    id: serial("id").primaryKey(),

    type: postTypeEnum("type")
        .notNull()
        .default("TEXT"),

    text: text("text"),

    media: text("media"),

    createdBy: integer("created_by")
        .references(() => users.id, {
            onDelete: "set null",
        }),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
});

export const campaigns = pgTable("campaigns", {
    id: serial("id").primaryKey(),

    topicName: text("topic_name").notNull(),

    intervalMinutes: integer("interval_minutes")
        .notNull(),

    currentPostIndex: integer("current_post_index")
        .notNull()
        .default(0),

    status: campaignStatusEnum("status")
        .notNull()
        .default("DRAFT"),

    nextRunAt: timestamp("next_run_at"),

    createdBy: integer("created_by")
        .notNull()
        .references(() => users.id),

    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at")
        .notNull()
        .defaultNow(),
});

export const campaignPosts = pgTable(
    "campaign_posts",
    {
        id: serial("id").primaryKey(),

        campaignId: integer("campaign_id")
            .notNull()
            .references(() => campaigns.id, {
                onDelete: "cascade",
            }),

        postId: integer("post_id")
            .notNull()
            .references(() => posts.id, {
                onDelete: "cascade",
            }),

        position: integer("position")
            .notNull(),
    },
    (table) => ({
        campaignPositionUnique: unique().on(
            table.campaignId,
            table.position,
        ),
    }),
);