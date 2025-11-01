const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dm-roles")
    .setDescription("SetUp a button role message!")
    .setDefaultMemberPermissions(0x00002000), // Manage Messages permission
  async execute(interaction) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("1426529183143825458-DMS_OPEN")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Open DMs")
        .setEmoji("<:dms_open:1430917401964314735>"),
      new ButtonBuilder()
        .setCustomId("1426529411234005042-ASK_FOR_DMS")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Ask for DMs")
        .setEmoji("<:ask_to_dm:1430917476992155669>"),
      new ButtonBuilder()
        .setCustomId("1426529471942496316-DMS_CLOSED")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Closed DMs")
        .setEmoji("<:dms_closed:1430917668646555648>")
    );

    

    const components = [row1];

    const embed = new EmbedBuilder()
      .setImage("https://iili.io/KgdrjEX.gif")
      .setColor(0x00ae86);


    await interaction.channel.send({
      embeds: [embed],
      components,
    });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.deleteReply();
  },
};
