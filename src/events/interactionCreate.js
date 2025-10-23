const { EmbedBuilder } = require("discord.js");

const { Events, MessageFlags, Collection } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      if (!interaction.isButton()) return;
      if (interaction.customId === "info-HELP") {
        const messageComponents = interaction.message?.components ?? [];
        const jsonComponents = JSON.stringify(messageComponents, null, 2);

        const roleList = [];
        for (const row of messageComponents) {
          for (const btn of row.components ?? []) {
            const customId = btn.customId ?? btn.custom_id ?? "";
            // skip the info button itself
            if (!customId || customId.startsWith("info-")) continue;

            const rawName = customId.includes("-")
              ? customId.split("-").slice(1).join("-")
              : btn.emoji && btn.emoji.name
              ? btn.emoji.name
              : customId;

            const gameName = rawName
              ? rawName
            .replace(/_/g, " ")
            .toLowerCase()
            .split(" ")
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(" ")
              : rawName;

            let emojiStr = "";
            if (btn.emoji) {
              if (btn.emoji.id && btn.emoji.name) {
          emojiStr = btn.emoji.animated
            ? `<a:${btn.emoji.name}:${btn.emoji.id}>`
            : `<:${btn.emoji.name}:${btn.emoji.id}>`;
              } else if (btn.emoji.name) {
          emojiStr = btn.emoji.name;
              }
            }

            if (gameName) roleList.push(`${emojiStr} **${gameName}**`.trim());
          }
        }

        const description = roleList.join("\n") || "No roles available.";

        const embed = new EmbedBuilder()
          .setTitle("<a:eyekiller:1430580121105862756> LIST")
          .setDescription(description)
          .setColor(0x5865f2)
          .setTimestamp();
        return interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
      const roleId =
        typeof interaction.customId === "string"
          ? interaction.customId.split("-")[0]
          : null;
      if (!roleId) {
        return interaction.reply({
          content: "This button is not configured properly.",
          flags: MessageFlags.Ephemeral,
        });
      }
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) {
        return interaction.reply({
          content: "The role associated with this button no longer exists.",
          flags: MessageFlags.Ephemeral,
        });
      }
      if (interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(roleId);
        return interaction.reply({
          content: `You have removed the role **${role.name}**.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.member.roles.add(roleId);
        return interaction.reply({
          content: `You have been given the role **${role.name} **.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `🔴 No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    const { cooldowns } = interaction.client;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "🔴 There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "🔴 There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  },
};
