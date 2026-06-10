import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";
import { nextCounter } from "../store.js";

export const data = new SlashCommandBuilder()
  .setName("bug")
  .setDescription("Report a Tuple bug (structured form)");

export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("modal:bug")
    .setTitle("Report a bug — Tuple")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Short summary")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
          .setPlaceholder("e.g. Voice leading jumps an octave on V7")
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("desc")
          .setLabel("What happened? Steps to reproduce")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
          .setPlaceholder("1) Select C major  2) Play V7 then I  3) …")
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("env")
          .setLabel("OS + Live version")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder("e.g. Windows 11 · Live 12.1")
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ver")
          .setLabel("Tuple version (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(30)
          .setPlaceholder("e.g. 1.1")
      )
    );

  await interaction.showModal(modal);
}

export async function handleModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.guild.channels.cache.get(
    process.env.BUG_REPORTS_CHANNEL_ID
  );
  if (!channel) {
    await interaction.editReply(
      "⚠️ Bug-reports channel not found. Check BUG_REPORTS_CHANNEL_ID in the .env."
    );
    return;
  }

  const title = interaction.fields.getTextInputValue("title");
  const desc = interaction.fields.getTextInputValue("desc");
  const env = interaction.fields.getTextInputValue("env");
  const ver = interaction.fields.getTextInputValue("ver") || "—";

  const n = nextCounter("bug");
  const num = `#${String(n).padStart(3, "0")}`;

  const embed = new EmbedBuilder()
    .setColor(COLORS.red)
    .setTitle(`${EMOJI.bug_reports}Bug ${num} — ${title}`)
    .setDescription(desc)
    .addFields(
      { name: "Environment", value: env, inline: true },
      { name: "Tuple version", value: ver, inline: true }
    )
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()
    .setFooter({ text: "via /bug" });

  try {
    const message = await channel.send({ embeds: [embed] });
    await interaction.editReply(`✅ Bug ${num} posted in ${channel} — ${message.url}`);
  } catch (err) {
    console.error(err);
    await interaction.editReply(
      `⚠️ I couldn't post in ${channel} — check my permissions there (Send Messages + Embed Links).`
    );
  }
}
