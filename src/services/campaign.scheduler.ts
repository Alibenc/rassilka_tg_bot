import {
    completeCampaign,
    getCampaignPost,
    getCampaignPostCount,
    getDueCampaigns,
    scheduleNextCampaignPost,
} from "./campaign.service.js";

import { sendToTopic } from "./mailing.service.js";

const CHECK_INTERVAL_MS = 5000;

const processingCampaigns = new Set<number>();

async function processCampaign(
    campaign: Awaited<
        ReturnType<typeof getDueCampaigns>
    >[number],
) {
    if (processingCampaigns.has(campaign.id)) {
        return;
    }

    processingCampaigns.add(campaign.id);

    try {
        const post = await getCampaignPost(
            campaign.id,
            campaign.currentPostIndex,
        );

        if (!post) {
            console.error(
                `Post not found for campaign ${campaign.id}`,
            );

            await completeCampaign(campaign.id);

            return;
        }

        console.log(
            `Campaign ${campaign.id}: sending post ${campaign.currentPostIndex + 1}`,
        );

        await sendToTopic(
            campaign.botId,
            campaign.topicName,
            post,
        );

        const postCount =
            await getCampaignPostCount(
                campaign.id,
            );

        const isLastPost =
            campaign.currentPostIndex >=
            postCount - 1;

        if (isLastPost) {
            await completeCampaign(
                campaign.id,
            );

            console.log(
                `Campaign ${campaign.id}: completed`,
            );

            return;
        }

        await scheduleNextCampaignPost(
            campaign.id,
            campaign.currentPostIndex,
            campaign.intervalMinutes,
        );

        console.log(
            `Campaign ${campaign.id}: next post in ${campaign.intervalMinutes} min`,
        );
    } catch (error) {
        console.error(
            `Campaign ${campaign.id}: processing failed`,
            error,
        );
    } finally {
        processingCampaigns.delete(
            campaign.id,
        );
    }
}

async function processDueCampaigns() {
    try {
        const campaigns =
            await getDueCampaigns();

        if (campaigns.length === 0) {
            return;
        }

        console.log(
            `Due campaigns: ${campaigns.length}`,
        );

        for (const campaign of campaigns) {
            await processCampaign(campaign);
        }
    } catch (error) {
        console.error(
            "Campaign scheduler error:",
            error,
        );
    }
}

export function startCampaignScheduler() {
    console.log(
        "Campaign scheduler started",
    );

    void processDueCampaigns();

    setInterval(() => {
        void processDueCampaigns();
    }, CHECK_INTERVAL_MS);
}