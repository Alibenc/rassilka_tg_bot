import "dotenv/config";

const token = process.env.BOT_TOKEN;

if (!token) {
    throw new Error("BOT_TOKEN is not defined");
}

export const env = {
    botToken: token,
};