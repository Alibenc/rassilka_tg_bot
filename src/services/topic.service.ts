import {and, asc, eq} from "drizzle-orm";

import { db } from "../db/";
import {
    supergroups,
    topics,
} from "../db/schema.js";

interface UpsertTopicParams {
    telegramChatId: bigint;
    telegramThreadId: number;
    name: string;
}

export async function upsertTopic({
                                      telegramChatId,
                                      telegramThreadId,
                                      name,
                                  }: UpsertTopicParams) {
    const [supergroup] = await db
        .select()
        .from(supergroups)
        .where(
            eq(supergroups.telegramChatId, telegramChatId),
        );

    if (!supergroup) {
        throw new Error(
            `Supergroup ${telegramChatId} not found`,
        );
    }

    const [topic] = await db
        .insert(topics)
        .values({
            telegramThreadId,
            name,
            supergroupId: supergroup.id,
        })
        .onConflictDoUpdate({
            target: [
                topics.supergroupId,
                topics.telegramThreadId,
            ],
            set: {
                name,
                updatedAt: new Date(),
            },
        })
        .returning();

    return topic;
}

export async function closeTopic(
    telegramChatId: bigint,
    telegramThreadId: number,
) {
    const [supergroup] = await db
        .select()
        .from(supergroups)
        .where(
            eq(supergroups.telegramChatId, telegramChatId),
        );

    if (!supergroup) return;

    await db
        .update(topics)
        .set({
            isClosed: true,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(topics.supergroupId, supergroup.id),
                eq(topics.telegramThreadId, telegramThreadId),
            ),
        );
}

export async function reopenTopic(
    telegramChatId: bigint,
    telegramThreadId: number,
) {
    const [supergroup] = await db
        .select()
        .from(supergroups)
        .where(
            eq(supergroups.telegramChatId, telegramChatId),
        );

    if (!supergroup) return;

    await db
        .update(topics)
        .set({
            isClosed: false,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(topics.supergroupId, supergroup.id),
                eq(topics.telegramThreadId, telegramThreadId),
            ),
        );
}

export async function renameTopic(
    telegramChatId: bigint,
    telegramThreadId: number,
    name: string,
) {
    const [supergroup] = await db
        .select()
        .from(supergroups)
        .where(
            eq(supergroups.telegramChatId, telegramChatId),
        );

    if (!supergroup) return;

    await db
        .update(topics)
        .set({
            name,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(topics.supergroupId, supergroup.id),
                eq(topics.telegramThreadId, telegramThreadId),
            ),
        );
}

export async function getTopicsBySupergroup(
    supergroupId: number,
) {
    return db
        .select()
        .from(topics)
        .where(
            eq(topics.supergroupId, supergroupId),
        );
}

export async function getAllTopics() {
    return db
        .select({
            topicId: topics.id,
            telegramThreadId: topics.telegramThreadId,
            telegramChatId: supergroups.telegramChatId,
        })
        .from(topics)
        .innerJoin(
            supergroups,
            eq(topics.supergroupId, supergroups.id),
        );
}

export async function getTopicsByName(name: string) {
    return db
        .select({
            threadId: topics.telegramThreadId,
            chatId: supergroups.telegramChatId,
        })
        .from(topics)
        .innerJoin(
            supergroups,
            eq(topics.supergroupId, supergroups.id),
        )
        .where(
            and(
                eq(topics.name, name),
                eq(supergroups.isActive, true),
            ),
        );
}

export async function getTopicNames() {
    return db
        .selectDistinct({
            name: topics.name,
        })
        .from(topics)
        .innerJoin(
            supergroups,
            eq(topics.supergroupId, supergroups.id),
        )
        .where(eq(supergroups.isActive, true))
        .orderBy(asc(topics.name));
}