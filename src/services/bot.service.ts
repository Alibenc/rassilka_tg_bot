import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { telegramBots } from "../db/schema.js";

interface CreateBotParams {
    telegramBotId: bigint;
    username?: string;
    token: string;
    isMain?: boolean;
}

export async function createBot({
                                    telegramBotId,
                                    username,
                                    token,
                                    isMain = false,
                                }: CreateBotParams) {
    const [bot] = await db
        .insert(telegramBots)
        .values({
            telegramBotId,
            username,
            token,
            isMain,
            isActive: true,
        })
        .returning();

    return bot;
}

export async function getBotByTelegramId(
    telegramBotId: bigint,
) {
    const [bot] = await db
        .select()
        .from(telegramBots)
        .where(
            eq(
                telegramBots.telegramBotId,
                telegramBotId,
            ),
        )
        .limit(1);

    return bot;
}

export async function getBotById(id: number) {
    const [bot] = await db
        .select()
        .from(telegramBots)
        .where(eq(telegramBots.id, id))
        .limit(1);

    return bot;
}

export async function getActiveBots() {
    return db
        .select()
        .from(telegramBots)
        .where(eq(telegramBots.isActive, true));
}

export async function deactivateBot(id: number) {
    const [bot] = await db
        .update(telegramBots)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(eq(telegramBots.id, id))
        .returning();

    return bot;
}