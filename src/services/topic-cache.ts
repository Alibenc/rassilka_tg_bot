const knownTopics = new Set<string>();

export function makeTopicKey(
    telegramChatId: bigint | number,
    telegramThreadId: number,
) {
    return `${telegramChatId}:${telegramThreadId}`;
}

export function hasTopic(
    telegramChatId: bigint | number,
    telegramThreadId: number,
) {
    return knownTopics.has(
        makeTopicKey(
            telegramChatId,
            telegramThreadId,
        ),
    );
}

export function addTopic(
    telegramChatId: bigint | number,
    telegramThreadId: number,
) {
    knownTopics.add(
        makeTopicKey(
            telegramChatId,
            telegramThreadId,
        ),
    );
}