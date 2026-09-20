// import { InputMediaPhoto, InputMediaVideo } from "grammy";

import { getTopicsByName } from "./topic.service.js";
import { bot } from "../bot/index.js";
import type {
    CampaignMessage,
} from "./campaign.service.js";

export async function sendToTopic(
    topicName: string,
    post: CampaignMessage,
) {
    const topics = await getTopicsByName(topicName);

    for (const topic of topics) {
        try {
            const chatId = topic.chatId.toString();

            if (post.type === "TEXT") {
                if (!post.text) {
                    continue;
                }

                await bot.api.sendMessage(
                    chatId,
                    post.text,
                    {
                        message_thread_id:
                        topic.threadId,
                    },
                );

                continue;
            }

            if (!post.media?.length) {
                continue;
            }

            if (post.media.length === 1) {
                const media = post.media[0];

                if (media.type === "photo") {
                    await bot.api.sendPhoto(
                        chatId,
                        media.fileId,
                        {
                            message_thread_id:
                            topic.threadId,
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
                            topic.threadId,
                            caption:
                                post.text ||
                                undefined,
                        },
                    );
                }

                continue;
            }

            const mediaGroup = post.media.map(
                (media, index) => {
                    if (media.type === "photo") {
                        return {
                            type: "photo" as const,
                            media: media.fileId,
                            ...(index === 0 && post.text
                                ? {
                                    caption: post.text,
                                }
                                : {}),
                        };
                    }

                    return {
                        type: "video" as const,
                        media: media.fileId,
                        ...(index === 0 && post.text
                            ? {
                                caption: post.text,
                            }
                            : {}),
                    };
                },
            );

            await bot.api.sendMediaGroup(
                chatId,
                mediaGroup,
                {
                    message_thread_id: topic.threadId,
                },
            );
        } catch (error) {
            console.error(
                `Failed to send to ${topic.chatId}:${topic.threadId}`,
                error,
            );
        }
    }
}