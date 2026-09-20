import { Bot, InlineKeyboard } from "grammy";

import { getTopicNames } from "../../services/topic.service.js";
import {
    createCampaign,
    type CampaignMedia,
    type CampaignMessage,
} from "../../services/campaign.service.js";
import { topicNamesKeyboard } from "../keyboards/campaign.js";
import { getUserByTelegramId } from "../../services/user.service.js";
import { authMiddleware } from "../middleware/auth.js";

interface CampaignDraft {
    topicName: string;
    messages: CampaignMessage[];
    waitingForInterval: boolean;
}

interface PendingAlbum {
    userId: number;
    mediaGroupId: string;
    media: CampaignMedia[];
    caption?: string;
    timer: ReturnType<typeof setTimeout>;
}

const drafts = new Map<number, CampaignDraft>();

const pendingAlbums = new Map<string, PendingAlbum>();

const ALBUM_WAIT_MS = 700;

function addSaveButton() {
    return new InlineKeyboard().text(
        "Сохранить сообщения для рассылки",
        "campaign:save_messages",
    );
}

async function saveAlbum(
    album: PendingAlbum,
) {
    const draft = drafts.get(album.userId);

    if (!draft || draft.waitingForInterval) {
        return;
    }

    draft.messages.push({
        type: "MEDIA",
        text: album.caption,
        media: album.media,
    });

    await botInstance.api.sendMessage(
        album.userId,
        `Альбом из ${album.media.length} файлов сохранён.`,
        {
            reply_markup: addSaveButton(),
        },
    );
}

let botInstance: Bot;

export function registerCampaignHandlers(bot: Bot) {
    botInstance = bot;

    bot.command(
        "create_campaign",
        authMiddleware,
        async (ctx) => {
            const topics = await getTopicNames();

            if (topics.length === 0) {
                await ctx.reply(
                    "Нет зарегистрированных топиков.",
                );

                return;
            }

            await ctx.reply(
                "Выбери топик для рассылки:",
                {
                    reply_markup:
                        topicNamesKeyboard(
                            topics.map(
                                (topic) =>
                                    topic.name,
                            ),
                        ),
                },
            );
        },
    );

    bot.callbackQuery(
        /^campaign_topic:(.+)$/,
        authMiddleware,
        async (ctx) => {
            const topicName = ctx.match[1];

            drafts.set(ctx.from.id, {
                topicName,
                messages: [],
                waitingForInterval: false,
            });

            await ctx.answerCallbackQuery();

            await ctx.editMessageText(
                `Выбран топик: ${topicName}\n\n` +
                `Теперь отправляй сообщения по одному.\n` +
                `Можно отправлять текст, фото, видео или альбомы.\n\n` +
                `Когда закончишь — нажми кнопку сохранения.`,
            );

            await ctx.reply(
                "Отправь первое сообщение:",
            );
        },
    );

    bot.on(
        "message",
        authMiddleware,
        async (ctx, next) => {
            if (ctx.chat.type !== "private") {
                await next();
                return;
            }

            const draft = drafts.get(ctx.from.id);

            if (!draft) {
                await next();
                return;
            }

            /*
             * Если ждём интервал, принимаем
             * только текстовое сообщение.
             */
            if (draft.waitingForInterval) {
                if (!("text" in ctx.message)) {
                    await ctx.reply(
                        "Сейчас нужно ввести интервал в минутах.\n\n" +
                        "Например: 5",
                    );

                    return;
                }

                if (
                    "text" in ctx.message &&
                    typeof ctx.message.text === "string" &&
                    ctx.message.text.startsWith("/")
                ) {
                    await next();
                    return;
                }

                const interval = Number(
                    ctx.message.text,
                );

                if (
                    !Number.isInteger(interval) ||
                    interval <= 0
                ) {
                    await ctx.reply(
                        "Введи положительное целое число минут.\n\n" +
                        "Например: 5",
                    );

                    return;
                }

                const user =
                    await getUserByTelegramId(
                        BigInt(ctx.from.id),
                    );

                if (
                    !user
                ) {
                    await ctx.reply(
                        "У тебя нет доступа к боту.",
                    );

                    drafts.delete(ctx.from.id);

                    return;
                }

                const campaign =
                    await createCampaign({
                        topicName:
                        draft.topicName,
                        messages:
                        draft.messages,
                        intervalMinutes:
                        interval,
                        createdBy: user.id,
                    });

                const messageCount =
                    draft.messages.length;

                drafts.delete(ctx.from.id);

                await ctx.reply(
                    `Рассылка создана! 🚀\n\n` +
                    `Топик: ${campaign.topicName}\n` +
                    `Сообщений: ${messageCount}\n` +
                    `Интервал: ${interval} мин.\n\n` +
                    `Первое сообщение будет отправлено в течение нескольких секунд.`,
                );

                return;
            }

            /*
             * Команды не должны становиться
             * сообщениями кампании.
             */
            if (
                "text" in ctx.message &&
                typeof ctx.message.text === "string" &&
                ctx.message.text.startsWith("/")
            ) {
                await next();
                return;
            }

            /*
             * TEXT
             */
            if ("text" in ctx.message) {
                draft.messages.push({
                    type: "TEXT",
                    text: ctx.message.text,
                });

                await ctx.reply(
                    `Сообщение №${draft.messages.length} сохранено.`,
                    {
                        reply_markup:
                            addSaveButton(),
                    },
                );

                return;
            }

            /*
             * PHOTO
             */
            if ("photo" in ctx.message && ctx.message.photo) {
                const photo =
                    ctx.message.photo.at(-1);

                if (!photo) {
                    return;
                }

                const mediaGroupId =
                    ctx.message.media_group_id;

                /*
                 * Обычная одиночная фотография.
                 */
                if (!mediaGroupId) {
                    draft.messages.push({
                        type: "MEDIA",
                        text:
                            ctx.message.caption ||
                            undefined,
                        media: [
                            {
                                type: "photo",
                                fileId:
                                photo.file_id,
                            },
                        ],
                    });

                    await ctx.reply(
                        `Сообщение №${draft.messages.length} сохранено.`,
                        {
                            reply_markup:
                                addSaveButton(),
                        },
                    );

                    return;
                }

                /*
                 * Фото является частью альбома.
                 */
                await addToAlbum({
                    userId: ctx.from.id,
                    mediaGroupId,
                    media: {
                        type: "photo",
                        fileId: photo.file_id,
                    },
                    caption:
                        ctx.message.caption ||
                        undefined,
                });

                return;
            }

            /*
             * VIDEO
             */
            if ("video" in ctx.message && ctx.message.video) {
                const video = ctx.message.video;

                const mediaGroupId =
                    ctx.message.media_group_id;

                /*
                 * Обычное одиночное видео.
                 */
                if (!mediaGroupId) {
                    draft.messages.push({
                        type: "MEDIA",
                        text:
                            ctx.message.caption ||
                            undefined,
                        media: [
                            {
                                type: "video",
                                fileId:
                                video.file_id,
                            },
                        ],
                    });

                    await ctx.reply(
                        `Сообщение №${draft.messages.length} сохранено.`,
                        {
                            reply_markup:
                                addSaveButton(),
                        },
                    );

                    return;
                }

                /*
                 * Видео является частью альбома.
                 */
                await addToAlbum({
                    userId: ctx.from.id,
                    mediaGroupId,
                    media: {
                        type: "video",
                        fileId: video.file_id,
                    },
                    caption:
                        ctx.message.caption ||
                        undefined,
                });

                return;
            }

            /*
             * Остальные типы сообщений
             * пока не поддерживаем.
             */
            await ctx.reply(
                "Поддерживаются только текст, фото, видео и альбомы из фото/видео.",
            );
        },
    );

    bot.callbackQuery(
        "campaign:save_messages",
        authMiddleware,
        async (ctx) => {
            const draft = drafts.get(ctx.from.id);

            if (!draft) {
                await ctx.answerCallbackQuery({
                    text: "Черновик не найден",
                    show_alert: true,
                });

                return;
            }

            if (draft.messages.length === 0) {
                await ctx.answerCallbackQuery({
                    text: "Добавь хотя бы одно сообщение",
                    show_alert: true,
                });

                return;
            }

            /*
             * Если пользователь только что отправил
             * альбом, даём ему немного времени,
             * чтобы он успел полностью собраться.
             */
            const hasPendingAlbum =
                [...pendingAlbums.values()].some(
                    (album) =>
                        album.userId ===
                        ctx.from.id,
                );

            if (hasPendingAlbum) {
                await ctx.answerCallbackQuery({
                    text: "Подожди, альбом ещё обрабатывается.",
                    show_alert: true,
                });

                return;
            }

            draft.waitingForInterval = true;

            await ctx.answerCallbackQuery();

            await ctx.editMessageText(
                `Сохранено сообщений: ${draft.messages.length}\n\n` +
                `Топик: ${draft.topicName}`,
            );

            await ctx.reply(
                "Теперь введи интервал отправки в минутах.\n\n" +
                "Например: 5",
            );
        },
    );
}

async function addToAlbum(params: {
    userId: number;
    mediaGroupId: string;
    media: CampaignMedia;
    caption?: string;
}) {
    const {
        userId,
        mediaGroupId,
        media,
        caption,
    } = params;

    const existing =
        pendingAlbums.get(mediaGroupId);

    if (existing) {
        existing.media.push(media);

        if (caption && !existing.caption) {
            existing.caption = caption;
        }

        clearTimeout(existing.timer);

        existing.timer = setTimeout(() => {
            void finishAlbum(mediaGroupId);
        }, ALBUM_WAIT_MS);

        return;
    }

    const timer = setTimeout(() => {
        void finishAlbum(mediaGroupId);
    }, ALBUM_WAIT_MS);

    pendingAlbums.set(mediaGroupId, {
        userId,
        mediaGroupId,
        media: [media],
        caption,
        timer,
    });
}

async function finishAlbum(
    mediaGroupId: string,
) {
    const album =
        pendingAlbums.get(mediaGroupId);

    if (!album) {
        return;
    }

    pendingAlbums.delete(mediaGroupId);

    await saveAlbum(album);
}