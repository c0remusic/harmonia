import { Events } from "discord.js";
import { WELCOME_MESSAGE } from "../config.js";

export const name = Events.GuildMemberAdd;

export async function execute(member) {
  // 1. Attribuer automatiquement le rôle Member
  const roleId = process.env.MEMBER_ROLE_ID;
  if (roleId) {
    try {
      await member.roles.add(roleId);
    } catch (err) {
      console.error(
        `Impossible d'attribuer le rôle Member à ${member.user.tag}:`,
        err.message,
        "\n→ Vérifie que le rôle du bot est AU-DESSUS de Member dans la hiérarchie."
      );
    }
  }

  // 2. Poster le message de bienvenue
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (channelId) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
      const text = WELCOME_MESSAGE.replace("{user}", `<@${member.id}>`);
      try {
        await channel.send(text);
      } catch (err) {
        console.error("Impossible de poster le message de bienvenue:", err.message);
      }
    }
  }
}
