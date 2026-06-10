import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { FAQ, COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("faq")
  .setDescription("Show the Tuple FAQ");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.faq}Tuple — Frequently Asked Questions`)
    .setDescription(
      FAQ.map(
        (item) => `${EMOJI[item.emoji] ?? ""}**${item.q}**\n${item.a}`
      ).join("\n\n")
    )
    .setFooter({ text: "Still stuck? Ask in #general-help" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
