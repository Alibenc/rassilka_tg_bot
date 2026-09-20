import { Bot } from "grammy";

import { authMiddleware } from "../middleware/auth.js";
import { ownerMiddleware } from "../middleware/owner.js";

import {
    createBot,
    getBotByTelegramId,
} from "../../services/bot.service.js";

import {
    createBotInstance,
} from "../index.js";

export function registerBotHandlers(
    bot: Bot,
) {
    bot.command(
        "addbot",
        authMiddleware,
        ownerMiddleware,
        async (ctx) => {

            const text =
                ctx.message?.text?.trim();

            const token =
                text?.split(/\s+/)[1];

            if (!token) {
                await ctx.reply(
                    "Укажи токен бота.\n\n" +
                    "Пример:\n" +
                    "/addbot 123456789:ABCDEF...",
                );

                return;
            }

            /*
             * Сначала проверяем токен через Telegram.
             */
            const tempBot = new Bot(token);

            let me;

            try {
                me = await tempBot.api.getMe();
            } catch {
                await ctx.reply(
                    "Неверный токен бота.",
                );

                return;
            }

            /*
             * Проверяем, не добавлен ли бот раньше.
             */
            const existingBot =
                await getBotByTelegramId(
                    BigInt(me.id),
                );

            if (existingBot) {
                await ctx.reply(
                    `Бот @${me.username ?? me.first_name} уже добавлен.`,
                );

                return;
            }

            /*
             * Сохраняем бота в БД.
             */
            const botRecord =
                await createBot({
                    telegramBotId:
                        BigInt(me.id),

                    username:
                    me.username,

                    token,

                    isMain: false,
                });

            /*
             * Создаём полноценный экземпляр
             * со всеми теми же handlers.
             */
            const newBot =
                await createBotInstance(
                    token,
                    botRecord.id,
                );

            /*
             * Запускаем сразу.
             * Перезапуск приложения не нужен.
             */
            void newBot.start({
                onStart: () => {
                    console.log(
                        `Additional bot started: @${me.username ?? me.first_name}`,
                    );
                },
            }).catch((error) => {
                console.error(
                    `Failed to start additional bot @${me.username ?? me.first_name}:`,
                    error,
                );
            });

            await ctx.reply(
                `Бот добавлен и запущен ✅\n\n` +
                `Бот: @${me.username ?? me.first_name}\n` +
                `Telegram ID: ${me.id}\n` +
                `Внутренний ID: ${botRecord.id}`,
            );
        },
    );
}