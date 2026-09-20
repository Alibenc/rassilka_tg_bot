import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export async function getUserByTelegramId(
    telegramId: bigint,
) {
    const [user] = await db
        .select()
        .from(users)
        .where(
            eq(
                users.telegramId,
                telegramId,
            ),
        );

    return user;
}

export async function createUser(params: {
    telegramId: bigint;
    username?: string;
    role: "OWNER" | "ADMIN" | "CONTENT_MANAGER";
}) {
    const [user] = await db
        .insert(users)
        .values({
            telegramId: params.telegramId,
            username: params.username,
            role: params.role,
        })
        .returning();

    return user;
}

export async function getUsers() {
    return db
        .select()
        .from(users)
        .orderBy(users.id);
}

export async function deleteUser(
    telegramId: bigint,
) {
    await db
        .delete(users)
        .where(
            eq(
                users.telegramId,
                telegramId,
            ),
        );
}

export async function updateUsername(
    telegramId: bigint,
    username?: string,
) {
    const [user] = await db
        .update(users)
        .set({
            username,
            updatedAt: new Date(),
        })
        .where(
            eq(
                users.telegramId,
                telegramId,
            ),
        )
        .returning();

    return user;
}