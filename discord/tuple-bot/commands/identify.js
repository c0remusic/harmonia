import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";
import { identifyChord } from "../harmony.js";

export const data = new SlashCommandBuilder()
  .setName("identify")
  .setDescription("Name a chord from its notes (the reverse of /chord)")
  .addStringOption((o) =>
    o
      .setName("notes")
      .setDescription("Notes, space- or comma-separated: C E G B")
      .setRequired(true)
      .setMaxLength(60)
  );

export async function execute(interaction) {
  const raw = interaction.options.getString("notes");
  const notes = raw.split(/[\s,]+/).filter(Boolean);
  const res = identifyChord(notes);

  if (res.error === "parse") {
    await interaction.reply({
      content: `❌ Invalid note: \`${res.bad}\`. Use letters A–G with optional #/b, e.g. \`C E G B\`.`,
      flags: 64,
    });
    return;
  }
  if (res.error === "few") {
    await interaction.reply({ content: "❌ Give me at least 2 notes.", flags: 64 });
    return;
  }
  if (res.length === 0) {
    await interaction.reply({
      content: `🤔 Couldn't match a known chord for: ${notes.join(" · ")}`,
      flags: 64,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.harmony}${res.map((m) => m.label).join("  /  ")}`)
    .setDescription("```\n" + notes.join("  ·  ") + "\n```");

  await interaction.reply({ embeds: [embed] });
}
