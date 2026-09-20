import { Bot, InlineKeyboard } from "grammy";
import { getActiveSupergroups } from "../../services/supergroup.service.js";
import { getTopicsBySupergroup } from "../../services/topic.service.js";
import { authMiddleware } from "../middleware/auth.js";
import { groupsKeyboard } from "../keyboards/groups.js";

export function registerGroupHandlers(
    bot: Bot,
    botId: number,
) {
    bot.command(
        "groups",
        authMiddleware,
        async (ctx) => {
            const groups =
                await getActiveSupergroups(botId);

            if (groups.length === 0) {
                await ctx.reply(
                    "Нет зарегистрированных групп.",
                );
                return;
            }

            await ctx.reply("Выбери группу:", {
                reply_markup: groupsKeyboard(groups),
            });
        },
    );

    bot.callbackQuery(
        /^group:(\d+)$/,
        authMiddleware,
        async (ctx) => {
            const groupId = Number(ctx.match[1]);

            const groups =
                await getActiveSupergroups(botId);

            const group = groups.find(
                (group) => group.id === groupId,
            );

            if (!group) {
                await ctx.answerCallbackQuery({
                    text: "Группа недоступна.",
                });

                return;
            }

            const topics =
                await getTopicsBySupergroup(groupId);

            if (topics.length === 0) {
                await ctx.answerCallbackQuery();

                await ctx.editMessageText(
                    "В этой группе пока нет зарегистрированных тем.",
                );

                return;
            }

            const keyboard = topics.reduce(
                (keyboard, topic) => {
                    keyboard
                        .text(
                            topic.name,
                            `topic:${topic.id}`,
                        )
                        .row();

                    return keyboard;
                },
                new InlineKeyboard(),
            );

            await ctx.answerCallbackQuery();

            await ctx.editMessageText(
                "Выбери тему:",
                {
                    reply_markup: keyboard,
                },
            );
        },
    );
}