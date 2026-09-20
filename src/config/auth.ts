const rawOwnerIds =
    process.env.INITIAL_OWNER_IDS ?? "";

export const INITIAL_OWNER_IDS =
    rawOwnerIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => BigInt(id));

export function isInitialOwner(
    telegramId: bigint,
) {
    return INITIAL_OWNER_IDS.includes(
        telegramId,
    );
}