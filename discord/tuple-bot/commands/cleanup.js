import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("cleanup")
  .setDescription("Delete the bot's own recent messages in this channel (staff)")
  .addIntegerOption((o) =>
    o
      .setName("amount")
      .setDescription("How many recent messages to scan (default 50, max 100)")
      .setMinValue(1)
      .setMaxValue(100)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });

  const amount = interaction.options.getInteger("amount") ?? 50;
  const me = interaction.client.user.id;

  try {
    const fetched = await interaction.channel.messages.fetch({ limit: amount });
    const mine = fetched.filter((m) => m.author.id === me);
    if (mine.size === 0) {
      await interaction.editReply(`No messages of mine found in the last ${amount}.`);
      return;
    }
    // bulkDelete(…, true) = ignore les messages de plus de 14 jours (non supprimables).
    const deleted = await interaction.channel.bulkDelete(mine, true);
    await interaction.editReply(`🧹 Deleted ${deleted.size} of my message(s).`);
  } catch (err) {
    console.error("cleanup failed:", err);
    await interaction.editReply(
      "⚠️ Couldn't clean up — I need **Manage Messages** here, and only messages younger than 14 days can be bulk-deleted."
    );
  }
}
