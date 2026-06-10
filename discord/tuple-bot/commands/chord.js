import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";
import { parseChord } from "../harmony.js";

export const data = new SlashCommandBuilder()
  .setName("chord")
  .setDescription("Break down a chord name into notes (Tuple-style)")
  .addStringOption((o) =>
    o
      .setName("name")
      .setDescription("Chord name: Cmaj7, F#m7, Bb7b9, Eø7…")
      .setRequired(true)
  );

export async function execute(interaction) {
  const input = interaction.options.getString("name");
  const res = parseChord(input);

  if (res.error === "root") {
    await interaction.reply({
      content: `❌ Invalid root note in \`${input}\`. Try C, C#, Db, F#…`,
      ephemeral: true,
    });
    return;
  }
  if (res.error === "type") {
    await interaction.reply({
      content:
        `❌ Unknown chord type: \`${res.typePart}\`.\n` +
        "Supported: `C` `Cm` `Cdim` `Caug` `C7` `CM7` (maj7) `Cm7` `Cdim7` `Cø7` (m7b5) " +
        "`CmMaj7` `C9` `CM9` `Cm9` `Cadd9` `Csus2` `Csus4` `C6` `Cm6` `C6/9` `C7sus4` `C7b9` `C7#9` `Cm7#5`",
      ephemeral: true,
    });
    return;
  }

  // Colonnes alignées note ↔ degré (même bloc monospace que /scale et /diatonic).
  const notesLine = "Notes      " + res.notes.map((n) => n.padEnd(4)).join("").trimEnd();
  const degLine   = "Intervals  " + res.degrees.map((d) => d.padEnd(4)).join("").trimEnd();

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.harmony}${res.label}`)
    .setDescription("```\n" + notesLine + "\n" + degLine + "\n```");

  await interaction.reply({ embeds: [embed] });
}
