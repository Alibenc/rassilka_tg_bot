    import { Bot } from "grammy";

    import {
        getAllTopics,
        upsertTopic,
        closeTopic,
        reopenTopic,
        renameTopic,
    } from "../../services/topic.service.js";

    import {
        addTopic,
        hasTopic,
    } from "../../services/topic-cache.js";

    import { upsertSupergroup } from "../../services/supergroup.service.js";

    export function registerTopicHandlers(bot: Bot, botId: number,) {
        bot.on("message", async (ctx, next) => {
            if (ctx.chat.type !== "supergroup") {
                await next();
                return;
            }

            const threadId = ctx.message.message_thread_id;

            if (!threadId) {
                await next();
                return;
            }

            const chatId = BigInt(ctx.chat.id);

            if (hasTopic(chatId, threadId)) {
                await next();
                return;
            }

            const topicName =
                ctx.message.reply_to_message?.forum_topic_created?.name;

            if (topicName) {
                await upsertSupergroup({
                    botId,
                    telegramChatId: chatId,
                    title: ctx.chat.title,
                    username: ctx.chat.username,
                });

                await upsertTopic({
                    telegramChatId: chatId,
                    telegramThreadId: threadId,
                    name: topicName,
                });

                addTopic(chatId, threadId);

                console.log(
                    `Topic discovered: ${topicName} (${threadId})`,
                );
            }

            await next();
        });

        bot.on(
            "message:forum_topic_created",
            async (ctx) => {
                const topic = ctx.message.forum_topic_created;
                const threadId = ctx.message.message_thread_id;

                if (!threadId) return;

                const chatId = BigInt(ctx.chat.id);

                await upsertTopic({
                    telegramChatId: chatId,
                    telegramThreadId: threadId,
                    name: topic.name,
                });

                addTopic(chatId, threadId);

                console.log(`Topic created: ${topic.name}`);
            },
        );

        bot.on(
            "message:forum_topic_edited",
            async (ctx) => {
                const topic = ctx.message.forum_topic_edited;
                const threadId = ctx.message.message_thread_id;

                if (!threadId || !topic.name) return;

                await renameTopic(
                    BigInt(ctx.chat.id),
                    threadId,
                    topic.name,
                );
            },
        );

        bot.on(
            "message:forum_topic_closed",
            async (ctx) => {
                const threadId = ctx.message.message_thread_id;

                if (!threadId) return;

                await closeTopic(
                    BigInt(ctx.chat.id),
                    threadId,
                );
            },
        );

        bot.on(
            "message:forum_topic_reopened",
            async (ctx) => {
                const threadId = ctx.message.message_thread_id;

                if (!threadId) return;

                await reopenTopic(
                    BigInt(ctx.chat.id),
                    threadId,
                );
            },
        );
    }

    export async function initTopicCache() {
        const topics = await getAllTopics();

        for (const topic of topics) {
            addTopic(
                topic.telegramChatId,
                topic.telegramThreadId,
            );
        }

        console.log(
            `Loaded ${topics.length} topics into cache`,
        );
    }