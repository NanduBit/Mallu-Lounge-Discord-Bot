const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setPresence({
      status: "online",
      activities: [
        {
          name: "The Kids",
          type: ActivityType.Watching,
        },
      ],
    });
    
  },
};
