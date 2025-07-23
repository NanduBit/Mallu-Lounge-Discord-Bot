const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply({ content: '⏳ Calculating ping...' });
    const sent = await interaction.fetchReply();
    return interaction.editReply(
      `🏓 **Pong!**\n💓 **Websocket Heartbeat:** ${
        interaction.client.ws.ping
      }ms\n⏱️ **Roundtrip Latency:** ${
        sent.createdTimestamp - interaction.createdTimestamp
      }ms`
    );
  },
};