import { Bot } from "grammy";

const runningBots = new Map<number, Bot>();

export function registerRunningBot(
    botId: number,
    bot: Bot,
) {
    if (runningBots.has(botId)) {
        throw new Error(
            `Bot ${botId} is already running`,
        );
    }

    runningBots.set(botId, bot);
}

export function getRunningBot(
    botId: number,
) {
    return runningBots.get(botId);
}

export function removeRunningBot(
    botId: number,
) {
    runningBots.delete(botId);
}

export function hasRunningBot(
    botId: number,
) {
    return runningBots.has(botId);
}