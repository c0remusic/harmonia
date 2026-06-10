import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COLORS } from "../config.js";
import { EMOJI } from "../emojis.js";
import { getMessageId, setMessageId } from "../store.js";

export const data = new SlashCommandBuilder()
  .setName("support")
  .setDescription("Open (or reopen) your support thread in #general-help")
  .addStringOption((o) =>
    o
      .setName("topic")
      .setDescription("What do you need help with?")
      .setRequired(true)
      .setMaxLength(60)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.guild.channels.cache.get(
    process.env.GENERAL_HELP_CHANNEL_ID
  );
  if (!channel) {
    await interaction.editReply(
      "⚠️ General-help channel not found. Check GENERAL_HELP_CHANNEL_ID in the .env."
    );
    return;
  }

  const topic = interaction.options.getString("topic");
  const storeKey = `support:${interaction.user.id}`;

  // Un seul fil ACTIF par membre : s'il en a déjà un d'ouvert, on y ajoute le
  // sujet au lieu d'en créer un nouveau (évite l'accumulation de fils).
  const existingId = getMessageId(storeKey);
  if (existingId) {
    const existing = await channel.threads
      .fetch(existingId)
      .catch(() => null);
    if (existing && !existing.archived) {
      try {
        await existing.send(`${interaction.user} added a topic: **${topic}**`);
      } catch {
        /* l'éphémère ci-dessous pointe quand même vers le fil */
      }
      await interaction.editReply(
        `💬 You already have an open support thread — added your topic there: ${existing}`
      );
      return;
    }
  }

  // Sinon : nouveau fil.
  try {
    const thread = await channel.threads.create({
      name: `🛟 ${interaction.user.username} — ${topic}`.slice(0, 100),
      autoArchiveDuration: 1440, // 1 jour d'inactivité → le fil se range tout seul
      reason: `Support thread for ${interaction.user.tag}`,
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.green)
      .setTitle(`${EMOJI.support}Support — ${topic}`)
      .setDescription(
        "Describe your problem here with as much detail as you can:\n" +
          "• what you did, what you expected, what happened\n" +
          "• OS + Live version, Tuple version\n\n" +
          "Someone from the community or the team will jump in. 🧡\n" +
          "_This thread auto-archives after a day of silence — just post again to reopen it._"
      );

    await thread.send({ content: `${interaction.user}`, embeds: [embed] });
    setMessageId(storeKey, thread.id);
    await interaction.editReply(`✅ Support thread opened: ${thread}`);
  } catch (err) {
    console.error(err);
    await interaction.editReply(
      `⚠️ I couldn't create a thread in ${channel} — check my permissions there (Create Public Threads + Send Messages in Threads).`
    );
  }
}
