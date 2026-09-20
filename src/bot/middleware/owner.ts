import { Context, NextFunction } from "grammy";

import { isInitialOwner } from "../../config/auth.js";

export async function ownerMiddleware(
    ctx: Context,
    next: NextFunction,
) {
    if (!ctx.from) {
        return;
    }

    const telegramId = BigInt(ctx.from.id);

    if (!isInitialOwner(telegramId)) {
        if (ctx.callbackQuery) {
            await ctx.answerCallbackQuery({
                text: "Только владелец может управлять пользователями.",
                show_alert: true,
            });

            return;
        }

        if (ctx.message) {
            await ctx.reply(
                "Только владелец может управлять пользователями.",
            );
        }

        return;
    }

    await next();
}