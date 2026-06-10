import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS, TIPS } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("tip")
  .setDescription("A random Tuple tip");

export async function execute(interaction) {
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.harmony}Tuple tip`)
    .setDescription(tip);

  await interaction.reply({ embeds: [embed] });
}
