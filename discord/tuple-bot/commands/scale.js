import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";
import { SCALES, SCALE_LABELS, scaleNotes, parseRoot, pcName } from "../harmony.js";

export const data = new SlashCommandBuilder()
  .setName("scale")
  .setDescription("Show the notes of a scale (Tuple-style)")
  .addStringOption((o) =>
    o.setName("root").setDescription("Root note: C, C#, Db, F#…").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("scale")
      .setDescription("Scale type")
      .setRequired(true)
      .addChoices(
        ...Object.keys(SCALES).map((k) => ({ name: SCALE_LABELS[k], value: k }))
      )
  );

export async function execute(interaction) {
  const rootStr = interaction.options.getString("root");
  const scaleName = interaction.options.getString("scale");

  const rootPc = parseRoot(rootStr);
  if (rootPc === null) {
    await interaction.reply({
      content: `❌ Invalid root note: \`${rootStr}\`. Try C, C#, Db, F#…`,
      ephemeral: true,
    });
    return;
  }

  const notes = scaleNotes(rootPc, scaleName);

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.harmony}${pcName(rootPc)} ${SCALE_LABELS[scaleName]}`)
    .setDescription("```\n" + notes.join("  ·  ") + "\n```");

  await interaction.reply({ embeds: [embed] });
}
