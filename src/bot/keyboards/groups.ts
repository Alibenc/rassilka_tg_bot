import { InlineKeyboard } from "grammy";

export function groupsKeyboard(
    groups: { id: number; title: string }[],
) {
    const keyboard = new InlineKeyboard();

    for (const group of groups) {
        keyboard.text(
            group.title,
            `group:${group.id}`,
        ).row();
    }

    return keyboard;
}