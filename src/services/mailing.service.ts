import { getTopicsByName } from "./topic.service.js";
import { getRunningBot } from "../bot/bot-registry.js";

import type {
    CampaignMessage,
} from "./campaign.service.js";

export async function sendToTopic(
    botId: number,
    topicName: string,
    post: CampaignMessage,
) {
    const bot = getRunningBot(botId);

    if (!bot) {
        throw new Error(
            `Running bot not found: botId=${botId}`,
        );
    }

    /*
     * Получаем только топики супергрупп,
     * принадлежащих этому боту.
     */
    const topics = await getTopicsByName(
        botId,
        topicName,
    );

    for (const topic of topics) {
        try {
            const chatId =
                topic.telegramChatId.toString();

            if (post.type === "TEXT") {
                if (!post.text) {
                    continue;
                }

                await bot.api.sendMessage(
                    chatId,
                    post.text,
                    {
                        message_thread_id:
                        topic.telegramThreadId,
                    },
                );

                continue;
            }

            if (!post.media?.length) {
                continue;
            }

            /*
             * Один файл.
             */
            if (post.media.length === 1) {
                const media = post.media[0];

                if (media.type === "photo") {
                    await bot.api.sendPhoto(
                        chatId,
                        media.fileId,
                        {
                            message_thread_id:
                            topic.telegramThreadId,
                            caption:
                                post.text ||
                                undefined,
                        },
                    );
                } else {
                    await bot.api.sendVideo(
                        chatId,
                        media.fileId,
                        {
                            message_thread_id:
                            topic.telegramThreadId,
                            caption:
                                post.text ||
                                undefined,
                        },
                    );
                }

                continue;
            }

            /*
             * Альбом.
             */
            const mediaGroup = post.media.map(
                (media, index) => {
                    if (media.type === "photo") {
                        return {
                            type: "photo" as const,
                            media: media.fileId,

                            ...(index === 0 &&
                            post.text
                                ? {
                                    caption:
                                    post.text,
                                }
                                : {}),
                        };
                    }

                    return {
                        type: "video" as const,
                        media: media.fileId,

                        ...(index === 0 &&
                        post.text
                            ? {
                                caption:
                                post.text,
                            }
                            : {}),
                    };
                },
            );

            await bot.api.sendMediaGroup(
                chatId,
                mediaGroup,
                {
                    message_thread_id:
                    topic.telegramThreadId,
                },
            );
        } catch (error) {
            console.error(
                `Failed to send: botId=${botId}, chat=${topic.telegramChatId}, thread=${topic.telegramThreadId}`,
                error,
            );
        }
    }
}