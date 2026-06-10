import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { COLORS, ROLE_MENU } from "../config.js";
import { EMOJI } from "../emojis.js";

export const data = new SlashCommandBuilder()
  .setName("rolemenu")
  .setDescription("Post the self-assign role menu")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const roles = ROLE_MENU.roles.filter((r) => r.id); // ignore les IDs vides
  if (!roles.length) {
    await interaction.reply({
      content:
        "⚠️ No roles configured yet. Create the roles in Discord, then paste their IDs into `ROLE_MENU.roles` in `config.js`.",
      ephemeral: true,
    });
    return;
  }

  // Discord : 5 boutons max par ligne.
  const rows = [];
  for (let i = 0; i < roles.length; i += 5) {
    rows.push(
      new ActionRowBuilder().addComponents(
        roles.slice(i, i + 5).map((r) =>
          new ButtonBuilder()
            .setCustomId(`role:${r.id}`)
            .setLabel(r.label)
            .setEmoji(r.emoji)
            .setStyle(ButtonStyle.Secondary)
        )
      )
    );
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.infos}${ROLE_MENU.title}`)
    .setDescription(ROLE_MENU.description);

  try {
    await interaction.channel.send({ embeds: [embed], components: rows });
    await interaction.reply({ content: "✅ Role menu posted.", ephemeral: true });
  } catch (err) {
    console.error("rolemenu post failed:", err);
    await interaction.reply({
      content: `⚠️ I couldn't post here — check my permissions (Send Messages + Embed Links) in ${interaction.channel}.`,
      ephemeral: true,
    });
  }
}
