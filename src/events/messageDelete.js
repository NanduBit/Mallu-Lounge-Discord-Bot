const { Events, EmbedBuilder } = require("discord.js");
const { deletedMsgLogServerID, deletedMsgLogChannelID, observedServerID } = require("../config");

const EMBED_FIELD_LIMIT = 1024;

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
      
      // Format user info as: ID(username)
      const userInfo = message.author 
        ? `${message.author.id}(${message.author.username})` 
        : "*[Author unknown]*";
      
      // Format channel info as: ID(channel name)
      const channelInfo = message.channel 
        ? `${message.channel.id}(${message.channel.name})` 
        : "*[Channel unknown]*";
      
      const messageCreatedAt = message.createdAt || new Date(0);
      const deletedAt = new Date();

      // Create embed with deleted message details
      const embed = new EmbedBuilder()
        .setTitle("🗑️ Message Deleted")
        .setColor(0xFF0000)
        .addFields(
          { name: "Author", value: userInfo, inline: true },
          { name: "Channel", value: channelInfo, inline: true },
          { name: "Server", value: `${message.guild?.name || "*[Server unknown]*"} (${message.guild?.id || "*[Unknown ID]*"})`, inline: false },
          { name: "Message Content", value: messageContent.length > EMBED_FIELD_LIMIT ? messageContent.substring(0, EMBED_FIELD_LIMIT - 3) + "..." : messageContent, inline: false },
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
          value: attachmentUrls.length > EMBED_FIELD_LIMIT ? attachmentUrls.substring(0, EMBED_FIELD_LIMIT - 3) + "..." : attachmentUrls, 
          inline: false 
        });
      }

      // Build the message to send with content outside the embed
      const messageToSend = {
        content: `**Deleted Message:**\n**User:** ${userInfo}\n**Channel:** ${channelInfo}\n**Content:** ${messageContent}`,
        embeds: [embed]
      };

      // Send the log with content and embed
      await logChannel.send(messageToSend);

    } catch (error) {
      console.error("❌ Error logging deleted message:", error);
    }
  },
};
