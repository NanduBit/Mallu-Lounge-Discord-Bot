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
    .setName("test")
    .setDescription("SetUp a button role message!")
    .setDefaultMemberPermissions(0x00002000), // Manage Messages permission
  async execute(interaction) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("1357915705323950151-AMONG_US")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:amongus:1430599942774325318>"),
      new ButtonBuilder()
        .setCustomId("1357914758921195651-VALORANT")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:valorant:1430599893461897306>"),
      new ButtonBuilder()
        .setCustomId("1430574943032049804-CALL_OF_DUTY")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:cod:1430602191265071295>"),
      new ButtonBuilder()
        .setCustomId("1421789987090858029-FINALS")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:finals:1430601338282184754>"),
      new ButtonBuilder()
        .setCustomId("1430575222645329980-WUTHERING_WAVES")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:wuwa:1430554070082388031>")
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("1430575404682313770-GENSHIN_IMPACT")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<a:genshin:1430554117058597058>"),
      new ButtonBuilder()
        .setCustomId("1357915079919538236-PUBGY")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:pubg:1430554026344190023>"),
      new ButtonBuilder()
        .setCustomId("1366078572782948442-DOTA")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:dota:1430553970153357353>"),
      new ButtonBuilder()
        .setCustomId("1357915212556009623-CSGO")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:csgo:1430553918378606614>"),
      new ButtonBuilder()
        .setCustomId("1357916272419147869-GTA_5")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:gta5:1430553867309023361>")
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("1429399097034539058-BATTLEFIELD")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:battlefield:1430553630838358228>"),
      new ButtonBuilder()
        .setCustomId("1366091747754770547-HELLDIVERS")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<a:helldivers:1430553796399992902>"),
      new ButtonBuilder()
        .setCustomId("1361225156940267610-RIVALS")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<a:rivals:1430553709011665011>"),
      new ButtonBuilder()
        .setCustomId("1430576317589487636-MINECRAFT")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:minecraft:1430573108376371364>"),
      new ButtonBuilder()
        .setCustomId("1430576430177058896-ROBLOX")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:roblox:1430572897608405116>")
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("info-HELP")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("<a:info:1430601792147951617>")
    );

    const components = [row1, row2, row3, row4];

    const embed = new EmbedBuilder()
      .setTitle("<a:eyekiller:1430580121105862756> 𝑮𝒂𝒎𝒊𝒏𝒈 𝑹𝒐𝒍𝒆 𝑺𝒆𝒍𝒆𝒄𝒕𝒊𝒐𝒏")
      .setDescription("𝑷𝒊𝒄𝒌 𝒕𝒉𝒆 𝒈𝒂𝒎𝒆𝒔 𝒖 𝒑𝒍𝒂𝒚!")
      .setColor(0x00ae86)
      .setTimestamp();


    await interaction.channel.send({
      embeds: [embed],
      components,
    });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.deleteReply();
  },
};