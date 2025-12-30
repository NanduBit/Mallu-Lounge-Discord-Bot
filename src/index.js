const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token, proxyEnabled, proxiflyApiKey } = require("./config.js");
const ProxyManager = require("./utils/proxyManager.js");
const RateLimitHandler = require("./utils/rateLimitHandler.js");
//require("./database/connect.js");

// Initialize proxy manager if enabled (but don't activate proxy yet)
let proxyManager = null;
if (proxyEnabled) {
  proxyManager = new ProxyManager(proxiflyApiKey);
  console.log("✅ Proxy manager initialized (will activate on rate limit)");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.proxyManager = proxyManager; // Attach proxy manager to client

// Initialize rate limit handler if proxy is enabled
if (proxyEnabled && proxyManager) {
  const rateLimitHandler = new RateLimitHandler(client);
  client.rateLimitHandler = rateLimitHandler;
}

const handlerPath = path.join(__dirname, "handlers");
const handlerFiles = fs
  .readdirSync(handlerPath)
  .filter((file) => file.endsWith(".js"));

for (const file of handlerFiles) {
  const filePath = path.join(handlerPath, file);
  const handler = require(filePath);
  if (handler.execute) {
    handler.execute(client);
  } else {
    console.log(`❌ ${file} Handler Doesn't Have Execute Function`);
  }
}

process.on("unhandledRejection", (error) => {
  console.error("❌ Error: ", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Error: ", error);
});

client.login(token).catch((error) => {
  console.error("❌ Failed to login:", error);
  process.exit(1);
});
