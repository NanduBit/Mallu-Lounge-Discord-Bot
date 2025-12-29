const { Events, EmbedBuilder } = require("discord.js");
const { deletedMsgLogServerID, deletedMsgLogChannelID, observedServerID } = require("../config");

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message) {
    // Ignore if message is from a bot or is a partial/uncached message without content
    if (message.author?.bot) return;
    
    // Only monitor the specified observed server
    if (message.guild?.id !== observedServerID) return;

    try {
      // Get the log server and channel
      const logServer = await message.client.guilds.fetch(deletedMsgLogServerID);
      if (!logServer) {
        console.error("❌ Log server not found");
        return;
      }

      const logChannel = await logServer.channels.fetch(deletedMsgLogChannelID);
      if (!logChannel) {
        console.error("❌ Log channel not found");
        return;
      }

      // Prepare message content (handle partial messages)
      const messageContent = message.content || "*[Message content not available]*";
      const messageAuthor = message.author ? `${message.author.tag} (${message.author.id})` : "*[Author unknown]*";
      const messageChannel = message.channel ? `<#${message.channel.id}> (${message.channel.name})` : "*[Channel unknown]*";
      const messageCreatedAt = message.createdAt ? message.createdAt : "*[Unknown]*";
      const deletedAt = new Date();

      // Create embed with deleted message details
      const embed = new EmbedBuilder()
        .setTitle("🗑️ Message Deleted")
        .setColor(0xFF0000)
        .addFields(
          { name: "Author", value: messageAuthor, inline: true },
          { name: "Channel", value: messageChannel, inline: true },
          { name: "Server", value: `${message.guild.name} (${message.guild.id})`, inline: false },
          { name: "Message Content", value: messageContent.length > 1024 ? messageContent.substring(0, 1021) + "..." : messageContent, inline: false },
          { name: "Posted At", value: `<t:${Math.floor(messageCreatedAt.getTime() / 1000)}:F>`, inline: true },
          { name: "Deleted At", value: `<t:${Math.floor(deletedAt.getTime() / 1000)}:F>`, inline: true }
        )
        .setTimestamp(deletedAt);

      // Add author avatar if available
      if (message.author?.displayAvatarURL) {
        embed.setThumbnail(message.author.displayAvatarURL());
      }

      // Add attachments information if any
      if (message.attachments?.size > 0) {
        const attachmentUrls = message.attachments.map(att => att.url).join("\n");
        embed.addFields({ 
          name: `Attachments (${message.attachments.size})`, 
          value: attachmentUrls.length > 1024 ? attachmentUrls.substring(0, 1021) + "..." : attachmentUrls, 
          inline: false 
        });
      }

      // Send the log embed
      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error("❌ Error logging deleted message:", error);
    }
  },
};
