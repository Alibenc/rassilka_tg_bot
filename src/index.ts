import { Bot } from "grammy";

import { env } from "./config/env.js";
import {
    INITIAL_OWNER_IDS,
} from "./config/auth.js";

import {
    createUser,
    getUserByTelegramId,
} from "./services/user.service.js";

import {
    createBot,
    getActiveBots,
    getBotByTelegramId,
} from "./services/bot.service.js";

import {
    createBotInstance,
} from "./bot/index.js";

import {
    startCampaignScheduler,
} from "./services/campaign.scheduler.js";

async function initOwners() {
    for (const telegramId of INITIAL_OWNER_IDS) {
        const existingUser =
            await getUserByTelegramId(
                telegramId,
            );

        if (existingUser) {
            continue;
        }

        await createUser({
            telegramId,
            role: "OWNER",
        });

        console.log(
            `Initial owner created: ${telegramId}`,
        );
    }
}

async function bootstrap() {
    /*
     * Сначала создаём владельцев.
     */
    await initOwners();

    /*
     * Получаем информацию о главном боте
     * по токену из .env.
     */
    const telegramMainBot =
        new Bot(env.botToken);

    const me =
        await telegramMainBot.api.getMe();

    /*
     * Проверяем, зарегистрирован ли главный
     * бот в нашей БД.
     */
    let mainBotRecord =
        await getBotByTelegramId(
            BigInt(me.id),
        );

    /*
     * Первый запуск после добавления
     * multi-bot логики.
     */
    if (!mainBotRecord) {
        mainBotRecord =
            await createBot({
                telegramBotId:
                    BigInt(me.id),

                username:
                me.username,

                token:
                env.botToken,

                isMain: true,
            });

        console.log(
            `Main bot registered: @${me.username}`,
        );
    }

    /*
     * Получаем всех активных ботов.
     * Включая главный.
     */
    const botRecords =
        await getActiveBots();

    /*
     * Создаём и запускаем каждый экземпляр.
     */
    for (const botRecord of botRecords) {
        const bot =
            await createBotInstance(
                botRecord.token,
                botRecord.id,
                botRecord.isMain,
            );

        /*
         * /start одинаковый для всех ботов.
         */
        bot.command(
            "start",
            async (ctx) => {
                if (!ctx.from) {
                    return;
                }

                const telegramId =
                    BigInt(ctx.from.id);

                const user =
                    await getUserByTelegramId(
                        telegramId,
                    );

                if (!user) {
                    await ctx.reply(
                        "У тебя нет доступа к боту.",
                    );

                    return;
                }

                await ctx.reply(
                    "Привет! Бот работает 🚀",
                );
            },
        );

        /*
         * start() не await'им:
         * каждый бот должен работать
         * параллельно с остальными.
         */
        void bot.start({
            onStart: () => {
                console.log(
                    `Bot started: @${botRecord.username ?? botRecord.telegramBotId}`,
                );
            },
        }).catch((error) => {
            console.error(
                `Failed to start bot @${botRecord.username ?? botRecord.telegramBotId}:`,
                error,
            );
        });
    }

    /*
     * Scheduler нужен только один
     * на всё приложение.
     */
    startCampaignScheduler();

    console.log(
        `Started ${botRecords.length} bot(s)`,
    );
}

bootstrap().catch((error) => {
    console.error(
        "Failed to start application:",
        error,
    );

    process.exit(1);
});