import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

export async function getUserByTelegramId(
    telegramId: bigint,
) {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId));

    return user;
}

export async function getOwner() {
    const [owner] = await db
        .select()
        .from(users)
        .where(eq(users.role, "OWNER"))
        .limit(1);

    return owner;
}

export async function registerFirstUser(params: {
    telegramId: bigint;
    username?: string;
}) {
    const existingOwner = await getOwner();

    if (existingOwner) {
        return null;
    }

    const [user] = await db
        .insert(users)
        .values({
            telegramId: params.telegramId,
            username: params.username,
            role: "OWNER",
        })
        .returning();

    return user;
}

export async function isAuthorized(
    telegramId: bigint,
) {
    const user = await getUserByTelegramId(telegramId);

    return user?.role === "OWNER";
}