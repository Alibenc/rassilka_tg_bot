import { eq } from "drizzle-orm";

import { db } from "../db/";
import { supergroups } from "../db/schema.js";

interface UpsertSupergroupParams {
    telegramChatId: bigint;
    title: string;
    username?: string;
}

export async function upsertSupergroup({
                                           telegramChatId,
                                           title,
                                           username,
                                       }: UpsertSupergroupParams) {
    const [supergroup] = await db
        .insert(supergroups)
        .values({
            telegramChatId,
            title,
            username,
            isActive: true,
        })
        .onConflictDoUpdate({
            target: supergroups.telegramChatId,
            set: {
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
    telegramChatId: bigint,
) {
    await db
        .update(supergroups)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(
            eq(supergroups.telegramChatId, telegramChatId),
        );
}

export async function getActiveSupergroups() {
    return db
        .select()
        .from(supergroups)
        .where(eq(supergroups.isActive, true));
}