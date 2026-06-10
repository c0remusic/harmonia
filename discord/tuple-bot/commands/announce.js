import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Post an announcement to the announcements channel")
  .addStringOption((opt) =>
    opt.setName("title").setDescription("Announcement title").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("message").setDescription("Announcement body").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const channelId = process.env.ANNOUNCEMENTS_CHANNEL_ID;
  const channel = interaction.guild.channels.cache.get(channelId);

  if (!channel) {
    return interaction.reply({
      content:
        "⚠️ Announcements channel not found. Check ANNOUNCEMENTS_CHANNEL_ID in your .env.",
      ephemeral: true,
    });
  }

  const title = interaction.options.getString("title");
  const message = interaction.options.getString("message");

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.announcements}${title}`)
    .setDescription(message)
    .setTimestamp()
    .setFooter({ text: `Posted by ${interaction.user.username}` });

  await channel.send({ embeds: [embed] });
  await interaction.reply({
    content: `✅ Announcement posted in ${channel}.`,
    ephemeral: true,
  });
}
