const { Events } = require("discord.js");
const { guildID, welcomeChannelID, generalChannelID } = require("../config");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    if (member.guild.id === guildID) {
      const channel = await member.guild.channels.fetch(welcomeChannelID);
      const generalChannel = await member.guild.channels.fetch(
        generalChannelID
      );
      if (channel) {
        await channel.send({
          content: `**WELCOME TO MY SOUL SOCIETY**\n\nHappy to have you <@${member.id}> ❤️\n\nGrab your controllers, flex those gaming skills, and dive into the action! This is where gamers unite, chaos unfolds, and fun never stops. Let's game, chat, and vibe ✨\n\n❏ Go through <#1309818452705280050> to keep the server safe and fun for everyone ✩°｡⋆\n❏ Come say hi on <#1309818552714530856>\n\n`,
          embeds: [
            {
              color: 0x36a8ff,
              author: {
                name: "",
                icon_url: "",
              },
              title: "𝕎𝕖𝕝𝕔𝕠𝕞𝕖 𝕋𝕠 𝕄𝕒𝕝𝕝𝕦 𝕃𝕠𝕦𝕟𝕘𝕖",
              image: {
                url: "https://i.pinimg.com/originals/b4/84/5c/b4845c9057251890188a121bdc9fa7f5.gif",
              },
              footer: {
                text: `${member.user.username} joined the server!`,
                icon_url: member.user.displayAvatarURL(),
              },
              timestamp: new Date(),
            },
          ],
        });
      }

      if (generalChannel) {
        await generalChannel.send({
          embeds: [
            {
                color: 0xa64d00,
                description: `Welcome to the server <@${member.id}>`,
            },
            {
              color: 0xa64d00,
              image: {
                url: "https://i2.wp.com/drunkenanimeblog.com/wp-content/uploads/2017/07/tumblr_ooueqinkjp1uiicp5o1_500.gif?fit=500%2C235",
              },
            },
          ],
        });
      }
    }
  },
};
