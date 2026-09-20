import { bot, initBot } from "./bot/index.js";
import { startCampaignScheduler } from "./services/campaign.scheduler.js";
import {
    createUser,
    getUserByTelegramId,
} from "./services/user.service.js";
import {
    INITIAL_OWNER_IDS,
} from "./config/auth.js";

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

bot.command("start", async (ctx) => {
    if (!ctx.from) {
        return;
    }

    const telegramId = BigInt(ctx.from.id);

    const user =
        await getUserByTelegramId(
            telegramId,
        );


    console.log(user);

    if (!user) {
        await ctx.reply(
            "У тебя нет доступа к боту.",
        );

        return;
    }

    await ctx.reply(
        "Привет! Бот работает 🚀",
    );
});

initBot()
    .then(async () => {
        await initOwners();

        startCampaignScheduler();

        bot.start();
    })
    .catch((error) => {
        console.error(
            "Failed to start bot:",
            error,
        );
    });

bot.catch((err) => {
    console.error(
        "Bot error:",
        err.error,
    );
});