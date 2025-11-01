const { Events } = require("discord.js");
const { guildID, welcomeChannelID, generalChannelID } = require("../config");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    if (member.guild.id === guildID) {
      const channel = await member.guild.channels.fetch(welcomeChannelID);
      const generalChannel = await member.guild.channels.fetch(generalChannelID);

      if (channel) {
        await channel.send({
          embeds: [
            {
              color: 0x36a8ff,
              author: {
                name: "",
                icon_url: "",
              },
              title: "𝕎𝕖𝕝𝕔𝕠𝕞𝕖 𝕋𝕠 𝕄𝕒𝕝𝕝𝕦 𝕃𝕠𝕦𝕟𝕘𝕖",
              description:`**❏ Welcome to Mallu Lounge <@${member.id}> \n❏ Come talk in <#${generalChannelID}>**`,
              image: {
                url: "https://c.tenor.com/0Gis2jrI9rwAAAAd/tenor.gif",
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
              description: `**Welcome to the server <@${member.id}>**`,
              image: {
                 url: "https://media.tenor.com/lxMJcSXfSLIAAAAC/zero2-zero-two.gif"
              },
              color: Math.floor(Math.random() * 16777215),
            },
          ],
        });
      }
    }
  },
};
