import { and, eq, lte } from "drizzle-orm";

import { db } from "../db/";
import {
    campaigns,
    campaignPosts,
    posts,
} from "../db/schema.js";

interface CreateCampaignParams {
    topicName: string;
    messages: CampaignMessage[];
    intervalMinutes: number;
    createdBy: number;
}

export interface CampaignMedia {
    type: "photo" | "video";
    fileId: string;
}

export interface CampaignMessage {
    type: "TEXT" | "MEDIA";
    text?: string;
    media?: CampaignMedia[];
}

export async function createCampaign({
                                         topicName,
                                         messages,
                                         intervalMinutes,
                                         createdBy,
                                     }: CreateCampaignParams) {
    return db.transaction(async (tx) => {
        const [campaign] = await tx
            .insert(campaigns)
            .values({
                topicName,
                intervalMinutes,
                status: "ACTIVE",
                currentPostIndex: 0,
                nextRunAt: new Date(),
                createdBy,
            })
            .returning();

        for (const [index, message] of messages.entries()) {
            const [post] = await tx
                .insert(posts)
                .values({
                    type: message.type,
                    text: message.text ?? null,
                    media: message.media
                        ? JSON.stringify(message.media)
                        : null,
                    createdBy,
                })
                .returning();

            await tx
                .insert(campaignPosts)
                .values({
                    campaignId: campaign.id,
                    postId: post.id,
                    position: index,
                });
        }

        return campaign;
    });
}

export async function getDueCampaigns() {
    return db
        .select()
        .from(campaigns)
        .where(
            and(
                eq(campaigns.status, "ACTIVE"),
                lte(
                    campaigns.nextRunAt,
                    new Date(),
                ),
            ),
        );
}

export async function getCampaignPost(
    campaignId: number,
    position: number,
) {
    const [result] = await db
        .select({
            postId: posts.id,
            type: posts.type,
            text: posts.text,
            media: posts.media,
        })
        .from(campaignPosts)
        .innerJoin(
            posts,
            eq(
                campaignPosts.postId,
                posts.id,
            ),
        )
        .where(
            and(
                eq(
                    campaignPosts.campaignId,
                    campaignId,
                ),
                eq(
                    campaignPosts.position,
                    position,
                ),
            ),
        );

    if (!result) {
        return undefined;
    }

    return {
        ...result,
        text: result.text ?? undefined,
        media: result.media
            ? JSON.parse(result.media) as CampaignMedia[]
            : [],
    };
}

export async function getCampaignPostCount(
    campaignId: number,
) {
    const result = await db
        .select()
        .from(campaignPosts)
        .where(
            eq(
                campaignPosts.campaignId,
                campaignId,
            ),
        );

    return result.length;
}

export async function completeCampaign(
    campaignId: number,
) {
    await db
        .update(campaigns)
        .set({
            status: "COMPLETED",
            nextRunAt: null,
            updatedAt: new Date(),
        })
        .where(
            eq(campaigns.id, campaignId),
        );
}

export async function scheduleNextCampaignPost(
    campaignId: number,
    currentPostIndex: number,
    intervalMinutes: number,
) {
    const nextRunAt = new Date(
        Date.now() +
        intervalMinutes * 60 * 1000,
    );

    await db
        .update(campaigns)
        .set({
            currentPostIndex:
                currentPostIndex + 1,
            nextRunAt,
            updatedAt: new Date(),
        })
        .where(
            eq(campaigns.id, campaignId),
        );
}