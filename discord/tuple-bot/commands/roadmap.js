import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS, ROADMAP } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("roadmap")
  .setDescription("What's coming to Tuple");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.announcements}Tuple — roadmap`)
    .setDescription("Plans, not promises — things can shift.");

  for (const section of ROADMAP) {
    embed.addFields({
      name: section.heading,
      value: section.items.map((i) => `• ${i}`).join("\n"),
    });
  }

  await interaction.reply({ embeds: [embed] });
}
