import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("poll")
  .setDescription("Create a quick poll (native Discord poll)")
  .addStringOption((o) =>
    o.setName("question").setDescription("The poll question").setRequired(true).setMaxLength(300)
  )
  .addStringOption((o) =>
    o.setName("option1").setDescription("Choice 1").setRequired(true).setMaxLength(55)
  )
  .addStringOption((o) =>
    o.setName("option2").setDescription("Choice 2").setRequired(true).setMaxLength(55)
  )
  .addStringOption((o) => o.setName("option3").setDescription("Choice 3").setMaxLength(55))
  .addStringOption((o) => o.setName("option4").setDescription("Choice 4").setMaxLength(55))
  .addStringOption((o) => o.setName("option5").setDescription("Choice 5").setMaxLength(55))
  .addIntegerOption((o) =>
    o
      .setName("hours")
      .setDescription("Duration in hours (default 24, max 168)")
      .setMinValue(1)
      .setMaxValue(168)
  )
  .addBooleanOption((o) =>
    o.setName("multi").setDescription("Allow multiple answers (default: no)")
  );

export async function execute(interaction) {
  const question = interaction.options.getString("question");
  const answers = [];
  for (let i = 1; i <= 5; i++) {
    const opt = interaction.options.getString(`option${i}`);
    if (opt) answers.push({ text: opt });
  }
  const duration = interaction.options.getInteger("hours") ?? 24;
  const multi = interaction.options.getBoolean("multi") ?? false;

  try {
    await interaction.channel.send({
      poll: {
        question: { text: question },
        answers,
        duration,
        allowMultiselect: multi,
      },
    });
    await interaction.reply({ content: "📊 Poll posted!", ephemeral: true });
  } catch (err) {
    console.error("poll failed:", err);
    await interaction.reply({
      content: "⚠️ I couldn't post the poll here — check my permissions (Send Messages) in this channel.",
      ephemeral: true,
    });
  }
}
