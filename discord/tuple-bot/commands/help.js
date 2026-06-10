import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show what the Tuple bot can do");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.infos}Tuple bot — commands`)
    .setDescription(
      [
        `${EMOJI.faq}\`/faq\` — frequently asked questions about Tuple`,
        `${EMOJI.harmony}\`/scale\` — notes of a scale`,
        `${EMOJI.harmony}\`/diatonic\` — diatonic chords of a key, Tuple-grid style`,
        `${EMOJI.harmony}\`/chord\` — break down a chord name into notes`,
        `${EMOJI.harmony}\`/identify\` — name a chord from its notes`,
        `${EMOJI.bug_reports}\`/bug\` — report a bug (form → #bug-reports)`,
        `${EMOJI.feature_requests}\`/suggest\` — suggest a feature (community votes)`,
        `${EMOJI.support}\`/support\` — open a help thread in #general-help`,
        `${EMOJI.infos}\`/version\` — current Tuple version`,
        `${EMOJI.infos}\`/links\` — official links`,
        `${EMOJI.announcements}\`/roadmap\` — what's coming to Tuple`,
        `${EMOJI.harmony}\`/tip\` — a random Tuple tip`,
        `📊 \`/poll\` — create a quick poll`,
        `${EMOJI.infos}\`/help\` — show this message`,
        `${EMOJI.announcements}\`/announce\` — *(staff only)* post an announcement`,
        `${EMOJI.rules}\`/setup\` — *(staff only)* post or update channel content`,
        `${EMOJI.infos}\`/rolemenu\` — *(staff only)* post the self-assign role menu`,
        `${EMOJI.bug_reports}\`/cleanup\` — *(staff only)* delete the bot's recent messages here`,
      ].join("\n")
    )
    .setFooter({ text: "Need a human? Ask in #general-help" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
