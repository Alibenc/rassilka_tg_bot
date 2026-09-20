import { Bot } from "grammy";

import { env } from "../config/env";
import { registerChatHandlers } from "./handlers/chat";
import {initTopicCache, registerTopicHandlers} from "./handlers/topic";
import { registerGroupHandlers } from "./handlers/groups";
import { registerCampaignHandlers } from "./handlers/campaign";
import { registerUserHandlers } from "./handlers/users.js";

export const bot = new Bot(env.botToken);


registerChatHandlers(bot);
registerTopicHandlers(bot);
registerGroupHandlers(bot);
registerCampaignHandlers(bot);
registerUserHandlers(bot);

export async function initBot() {
    await initTopicCache();
}