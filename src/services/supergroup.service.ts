import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { supergroups } from "../db/schema.js";

interface UpsertSupergroupParams {
    botId: number;
    telegramChatId: bigint;
    title: string;
    username?: string;
}

export async function upsertSupergroup({
                                           botId,
                                           telegramChatId,
                                           title,
                                           username,
                                       }: UpsertSupergroupParams) {
    const [supergroup] = await db
        .insert(supergroups)
        .values({
            botId,
            telegramChatId,
            title,
            username,
            isActive: true,
        })
        .onConflictDoUpdate({
            target: supergroups.telegramChatId,
            set: {
                botId,
                title,
                username,
                isActive: true,
                updatedAt: new Date(),
            },
        })
        .returning();

    return supergroup;
}

export async function deactivateSupergroup(
    botId: number,
    telegramChatId: bigint,
) {
    await db
        .update(supergroups)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(supergroups.botId, botId),
                eq(
                    supergroups.telegramChatId,
                    telegramChatId,
                ),
            ),
        );
}

export async function getActiveSupergroups(
    botId: number,
) {
    return db
        .select()
        .from(supergroups)
        .where(
            and(
                eq(supergroups.botId, botId),
                eq(supergroups.isActive, true),
            ),
        );
}