import { InlineKeyboard } from "grammy";

export function topicNamesKeyboard(
    names: string[],
) {
    const keyboard = new InlineKeyboard();

    for (const name of names) {
        keyboard
            .text(
                name,
                `campaign_topic:${name}`,
            )
            .row();
    }

    return keyboard;
}