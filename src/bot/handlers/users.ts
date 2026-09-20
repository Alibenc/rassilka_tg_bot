import {
    Bot,
    InlineKeyboard,
    Context,
} from "grammy";

import {
    createUser,
    deleteUser,
    getUsers,
} from "../../services/user.service.js";

import {
    INITIAL_OWNER_IDS,
} from "../../config/auth.js";

import { authMiddleware } from "../middleware/auth.js";
import { ownerMiddleware } from "../middleware/owner.js";

interface UserDraft {
    action: "ADD" | "DELETE";
}

const drafts = new Map<
    number,
    UserDraft
>();

function usersKeyboard() {
    return new InlineKeyboard()
        .text(
            "➕ Добавить пользователя",
            "users:add",
        )
        .row()
        .text(
            "➖ Удалить пользователя",
            "users:delete",
        );
}

export function registerUserHandlers(
    bot: Bot,
) {
    bot.command(
        "users",
        authMiddleware,
        ownerMiddleware,
        async (ctx) => {
            await showUsers(ctx);
        },
    );

    bot.callbackQuery(
        "users:add",
        authMiddleware,
        ownerMiddleware,
        async (ctx) => {
            drafts.set(ctx.from.id, {
                action: "ADD",
            });

            await ctx.answerCallbackQuery();

            await ctx.editMessageText(
                "Отправь Telegram ID пользователя.\n\n" +
                "Например: 123456789",
            );
        },
    );

    bot.callbackQuery(
        "users:delete",
        authMiddleware,
        ownerMiddleware,
        async (ctx) => {
            drafts.set(ctx.from.id, {
                action: "DELETE",
            });

            await ctx.answerCallbackQuery();

            await ctx.editMessageText(
                "Отправь Telegram ID пользователя, которого нужно удалить.",
            );
        },
    );

    bot.on(
        "message:text",
        authMiddleware,
        // ownerMiddleware,
        async (ctx, next) => {
            const draft =
                drafts.get(ctx.from.id);

            if (!draft) {
                await next();
                return;
            }

            if (
                ctx.message.text.startsWith("/")
            ) {
                await next();
                return;
            }

            const telegramIdText =
                ctx.message.text.trim();

            if (!/^\d+$/.test(telegramIdText)) {
                await ctx.reply(
                    "Telegram ID должен состоять только из цифр.\n\n" +
                    "Например: 123456789",
                );

                return;
            }

            const telegramId =
                BigInt(telegramIdText);

            /*
             * Нельзя удалить OWNER,
             * прописанного в INITIAL_OWNER_IDS.
             */
            if (
                draft.action === "DELETE" &&
                INITIAL_OWNER_IDS.includes(
                    telegramId,
                )
            ) {
                await ctx.reply(
                    "Нельзя удалить владельца, указанного в INITIAL_OWNER_IDS.",
                );

                drafts.delete(ctx.from.id);

                return;
            }

            if (draft.action === "ADD") {
                const existingUsers =
                    await getUsers();

                const exists =
                    existingUsers.some(
                        (user) =>
                            user.telegramId ===
                            telegramId,
                    );

                if (exists) {
                    await ctx.reply(
                        "Этот пользователь уже добавлен.",
                    );

                    drafts.delete(
                        ctx.from.id,
                    );

                    return;
                }

                await createUser({
                    telegramId,
                    role: "CONTENT_MANAGER",
                });

                drafts.delete(ctx.from.id);

                await ctx.reply(
                    `Пользователь ${telegramId} добавлен.`,
                );

                return;
            }

            await deleteUser(telegramId);

            drafts.delete(ctx.from.id);

            await ctx.reply(
                `Пользователь ${telegramId} удалён.`,
            );
        },
    );
}

async function showUsers(ctx: Context) {
    const users = await getUsers();

    if (users.length === 0) {
        await ctx.reply(
            "Пользователей пока нет.",
            {
                reply_markup:
                    usersKeyboard(),
            },
        );

        return;
    }

    const lines = users.map((user) => {
        const isOwner =
            INITIAL_OWNER_IDS.includes(
                user.telegramId,
            );

        const role = isOwner
            ? "👑 OWNER"
            : "👤 USER";

        const username = user.username
            ? `@${user.username}`
            : "без username";

        return (
            `${role} — ${username}\n` +
            `ID: ${user.telegramId}`
        );
    });

    await ctx.reply(
        `Пользователи:\n\n${lines.join("\n\n")}`,
        {
            reply_markup:
                usersKeyboard(),
        },
    );
}