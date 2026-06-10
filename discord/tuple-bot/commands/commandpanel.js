import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("commandpanel")
  .setDescription("Post a pinned, auto-generated list of commands (staff)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });

  // Auto-généré depuis les commandes chargées ; on masque les commandes staff
  // (celles qui ont des default_member_permissions).
  const cmds = [...interaction.client.commands.values()]
    .map((c) => c.data.toJSON())
    .filter((d) => !d.default_member_permissions)
    .sort((a, b) => a.name.localeCompare(b.name));

  const list = cmds.map((d) => `\`/${d.name}\` — ${d.description}`).join("\n");

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.infos}Tuple bot — commands`)
    .setDescription(list)
    .setFooter({ text: "Tip: @mention me with a chord or scale — e.g. @Tuple BOT Cmaj7" });

  try {
    const msg = await interaction.channel.send({ embeds: [embed] });
    try {
      if (!msg.pinned) await msg.pin();
    } catch {
      /* pas de Manage Messages → posté mais pas épinglé */
    }
    await interaction.editReply("✅ Command panel posted & pinned here.");
  } catch (err) {
    console.error("commandpanel failed:", err);
    await interaction.editReply(
      "⚠️ Couldn't post here — I need Send Messages + Embed Links (and Manage Messages to pin)."
    );
  }
}
