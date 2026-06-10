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
  .setName("suggest")
  .setDescription("Suggest a Tuple feature (the community votes)");

export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("modal:suggest")
    .setTitle("Suggest a feature — Tuple")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Feature in one line")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80)
          .setPlaceholder("e.g. Strum amount per chord column")
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("desc")
          .setLabel("Your idea — what & why")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1500)
          .setPlaceholder("What should it do? When would you use it?")
      )
    );

  await interaction.showModal(modal);
}

export async function handleModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.guild.channels.cache.get(
    process.env.FEATURE_REQUESTS_CHANNEL_ID
  );
  if (!channel) {
    await interaction.editReply(
      "⚠️ Feature-requests channel not found. Check FEATURE_REQUESTS_CHANNEL_ID in the .env."
    );
    return;
  }

  const title = interaction.fields.getTextInputValue("title");
  const desc = interaction.fields.getTextInputValue("desc");

  const n = nextCounter("suggestion");
  const num = `#${String(n).padStart(3, "0")}`;

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle(`${EMOJI.feature_requests}Suggestion ${num} — ${title}`)
    .setDescription(desc)
    .setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp()
    .setFooter({ text: "Vote with the reactions below · via /suggest" });

  try {
    const message = await channel.send({ embeds: [embed] });
    try {
      await message.react("👍");
      await message.react("👎");
    } catch (err) {
      console.error("Could not add vote reactions:", err);
    }
    await interaction.editReply(
      `✅ Suggestion ${num} posted in ${channel} — ${message.url}`
    );
  } catch (err) {
    console.error(err);
    await interaction.editReply(
      `⚠️ I couldn't post in ${channel} — check my permissions there (Send Messages + Embed Links + Add Reactions).`
    );
  }
}
