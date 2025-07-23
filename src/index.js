const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.js");
//require("./database/connect.js");

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
