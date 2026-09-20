import { Bot } from "grammy";

import {
    deactivateSupergroup,
    upsertSupergroup,
} from "../../services/supergroup.service.js";

export function registerChatHandlers(bot: Bot) {
    bot.on("my_chat_member", async (ctx) => {
        if (ctx.chat.type !== "supergroup") {
            return;
        }

        const status = ctx.myChatMember.new_chat_member.status;

        const isActive =
            status === "member" ||
            status === "administrator";

        if (isActive) {
            await upsertSupergroup({
                telegramChatId: BigInt(ctx.chat.id),
                title: ctx.chat.title,
                username:
                    "username" in ctx.chat
                        ? ctx.chat.username
                        : undefined,
            });

            console.log(
                `Supergroup registered: ${ctx.chat.title}`,
            );

            return;
        }

        await deactivateSupergroup(
            BigInt(ctx.chat.id),
        );

        console.log(
            `Supergroup deactivated: ${ctx.chat.title}`,
        );
    });
}