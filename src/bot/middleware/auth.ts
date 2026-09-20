import { Context, NextFunction } from "grammy";

import { getUserByTelegramId } from "../../services/user.service.js";

export async function authMiddleware(
    ctx: Context,
    next: NextFunction,
) {
    if (!ctx.from) {
        return;
    }

    const telegramId = BigInt(ctx.from.id);

    const user =
        await getUserByTelegramId(
            telegramId,
        );

    if (!user) {
        if (ctx.callbackQuery) {
            await ctx.answerCallbackQuery({
                text: "У тебя нет доступа к боту.",
                show_alert: true,
            });

            return;
        }

        if (ctx.message) {
            await ctx.reply(
                "У тебя нет доступа к боту.",
            );
        }

        return;
    }

    await next();
}