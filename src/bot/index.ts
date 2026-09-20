import { Bot } from "grammy";

import {
    initTopicCache,
    registerTopicHandlers,
} from "./handlers/topic.js";

import { registerChatHandlers } from "./handlers/chat.js";
import { registerGroupHandlers } from "./handlers/groups.js";
import { registerCampaignHandlers } from "./handlers/campaign.js";
import { registerUserHandlers } from "./handlers/users.js";
import {
    registerBotHandlers,
} from "./handlers/bots.js";

import {
    registerRunningBot,
} from "./bot-registry.js";

export async function createBotInstance(
    token: string,
    botId: number,
    isMain = false,
) {
    const bot = new Bot(token);

    /*
     * Handlers, которым важно знать,
     * какому боту принадлежат данные.
     */
    registerChatHandlers(
        bot,
        botId,
    );

    registerGroupHandlers(
        bot,
        botId,
    );

    registerCampaignHandlers(
        bot,
        botId,
    );

    /*
     * Топики определяют свою группу через
     * уникальный telegramChatId, поэтому
     * botId здесь не нужен.
     */
    registerTopicHandlers(bot, botId);

    /*
     * Пользователи пока общие для всех ботов.
     */
    registerUserHandlers(bot);
    if (isMain) {
        registerBotHandlers(bot);
    }

    /*
     * Кэш топиков пока общий.
     * Это допустимо, поскольку telegramChatId
     * супергруппы глобально уникален.
     */
    await initTopicCache();

    /*
     * Регистрируем запущенный экземпляр,
     * чтобы scheduler мог найти нужного бота.
     */
    registerRunningBot(
        botId,
        bot,
    );

    bot.catch((err) => {
        console.error(
            `Bot ${botId} error:`,
            err.error,
        );
    });

    return bot;
}