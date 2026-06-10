import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";
import { SCALES, SCALE_LABELS, diatonic, borrowed, parseRoot, pcName } from "../harmony.js";

export const data = new SlashCommandBuilder()
  .setName("diatonic")
  .setDescription("Diatonic chords of a key (the Tuple grid)")
  .addStringOption((o) =>
    o.setName("root").setDescription("Root note: C, C#, Db, F#…").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("scale")
      .setDescription("Scale type (default: Major)")
      .addChoices(
        ...Object.keys(SCALES).map((k) => ({ name: SCALE_LABELS[k], value: k }))
      )
  );

export async function execute(interaction) {
  const rootStr = interaction.options.getString("root");
  const scaleName = interaction.options.getString("scale") ?? "major";

  const rootPc = parseRoot(rootStr);
  if (rootPc === null) {
    await interaction.reply({
      content: `❌ Invalid root note: \`${rootStr}\`. Try C, C#, Db, F#…`,
      ephemeral: true,
    });
    return;
  }

  const rows = diatonic(rootPc, scaleName);
  const table = rows
    .map((r) => r.roman.padEnd(5) + r.triad.padEnd(8) + r.seventh)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.harmony}${pcName(rootPc)} ${SCALE_LABELS[scaleName]} — diatonic chords`)
    .setDescription("```\n" + table + "\n```");

  // Même police que la table : bloc monospace, 3 emprunts par ligne.
  const bor = borrowed(rootPc, scaleName);
  if (bor.length) {
    const lines = [];
    for (let i = 0; i < bor.length; i += 3) {
      lines.push(
        bor
          .slice(i, i + 3)
          .map((b) => (b.roman.padEnd(5) + b.label).padEnd(13))
          .join("")
          .trimEnd()
      );
    }
    embed.addFields({
      name: "Borrowed (modal interchange)",
      value: "```\n" + lines.join("\n") + "\n```",
    });
  }

  await interaction.reply({ embeds: [embed] });
}
