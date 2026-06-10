import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { CHANNEL_CONTENT } from "../content.js";
import { getMessageId, setMessageId } from "../store.js";

const keys = Object.keys(CHANNEL_CONTENT);
const choices = [
  { name: "all", value: "all" },
  ...keys.map((k) => ({ name: k, value: k })),
];

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Post or update channel content + topic (staff only)")
  .addStringOption((opt) =>
    opt
      .setName("target")
      .setDescription("Which channel to set up")
      .setRequired(true)
      .addChoices(...choices)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function pinSafe(msg, notes) {
  try {
    if (!msg.pinned) await msg.pin();
    notes.push("pinned");
  } catch {
    notes.push("pin✗(needs Manage Messages)");
  }
}

async function applyOne(interaction, key) {
  const entry = CHANNEL_CONTENT[key];
  const channelId = process.env[entry.channelEnv];

  if (!channelId) {
    return `⚠️ \`${key}\` — missing ${entry.channelEnv} in .env`;
  }

  const channel =
    interaction.guild.channels.cache.get(channelId) ??
    (await interaction.guild.channels.fetch(channelId).catch(() => null));
  if (!channel) {
    return `⚠️ \`${key}\` — channel not found (check ${entry.channelEnv})`;
  }

  const notes = [];

  // ── 1. Topic (description du salon) ──
  if (entry.topic) {
    try {
      await channel.setTopic(entry.topic);
      notes.push("topic");
    } catch {
      notes.push("topic✗(needs Manage Channels)");
    }
  }

  // ── 2. Message (posté ou édité) ──
  const content = entry.build();
  const existingId = getMessageId(key);

  if (existingId) {
    try {
      const msg = await channel.messages.fetch(existingId);
      await msg.edit(content);
      await pinSafe(msg, notes);
      return `🔄 \`${key}\` — message updated, ${notes.join(", ")}`;
    } catch {
      // message supprimé → on repostera
    }
  }

  try {
    const msg = await channel.send(content);
    setMessageId(key, msg.id);
    await pinSafe(msg, notes);
    return `✅ \`${key}\` — message posted, ${notes.join(", ")}`;
  } catch (err) {
    return `❌ \`${key}\` — ${err.message} (bot may lack Send Messages here)`;
  }
}

export async function execute(interaction) {
  const target = interaction.options.getString("target");
  await interaction.deferReply({ ephemeral: true });

  const targets = target === "all" ? Object.keys(CHANNEL_CONTENT) : [target];
  const results = [];
  for (const key of targets) {
    results.push(await applyOne(interaction, key));
  }

  await interaction.editReply({ content: results.join("\n") });
}
