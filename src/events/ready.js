const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ 
            name: 'Mallu Lounge', // This is the name that shows up
            type: ActivityType.Streaming,
            state: 'https://discord.gg/mallulounge',
            url: 'https://twitch.tv/mallulounge',
        }],
        status: 'online',
    });
    
  },
};
