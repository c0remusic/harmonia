import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS, INFO } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("version")
  .setDescription("Current Tuple version");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.infos}Tuple — ${INFO.version}`)
    .setDescription(
      `Tuple is currently in **${INFO.version}** — ${INFO.versionNote}.\n\n` +
        `🌐 ${INFO.site}\n` +
        "See what's coming with `/roadmap`."
    );

  await interaction.reply({ embeds: [embed] });
}
