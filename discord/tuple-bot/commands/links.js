import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS, INFO } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("links")
  .setDescription("Official Tuple links");

export async function execute(interaction) {
  const lines = [
    `🌐 **Website** — ${INFO.site}`,
    `🎛️ **maxforlive.com** — ${INFO.maxforlive ?? "_coming with the final release_"}`,
    `✉️ **Contact** — ${INFO.email}`,
  ];
  if (INFO.donate) lines.push(`❤️ **Support** — ${INFO.donate}`);

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.infos}Tuple — links`)
    .setDescription(lines.join("\n"));

  await interaction.reply({ embeds: [embed] });
}
