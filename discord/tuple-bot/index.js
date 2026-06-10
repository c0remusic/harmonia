import {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
} from "discord.js";
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // requis pour l'auto-rôle / bienvenue
    GatewayIntentBits.GuildMessages, // recevoir les messages des salons
    GatewayIntentBits.MessageContent, // lire leur contenu (intent privilégié — toggle dans le portail)
  ],
});

// ─── Charger les commandes ─────────────────────────────────
client.commands = new Collection();
const commandsPath = join(__dirname, "commands");
for (const file of readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if (mod.data && mod.execute) client.commands.set(mod.data.name, mod);
}

// ─── Charger les événements ────────────────────────────────
const eventsPath = join(__dirname, "events");
for (const file of readdirSync(eventsPath).filter((f) => f.endsWith(".js"))) {
  const mod = await import(pathToFileURL(join(eventsPath, file)).href);
  if (mod.name && mod.execute) {
    client.on(mod.name, (...args) => mod.execute(...args));
  }
}

// ─── Gérer les interactions (slash commands + modals) ──────
async function reportError(interaction, err) {
  console.error(err);
  const reply = {
    content: "⚠️ Something went wrong running that command.",
    ephemeral: true,
  };
  // Ne JAMAIS relancer ici : une interaction expirée/déjà acquittée ferait
  // remonter l'erreur et crasherait le process.
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  } catch (e) {
    console.error("reportError: impossible de notifier l'utilisateur:", e.message);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  // Soumission d'un formulaire (modal) : customId = "modal:<commande>"
  if (interaction.isModalSubmit()) {
    const [prefix, name] = interaction.customId.split(":");
    if (prefix !== "modal") return;
    const command = client.commands.get(name);
    if (!command || !command.handleModal) return;
    try {
      await command.handleModal(interaction);
    } catch (err) {
      await reportError(interaction, err);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    await reportError(interaction, err);
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Tuple bot en ligne — connecté en tant que ${c.user.tag}`);
});

// ─── Garde-fous : une erreur isolée ne doit jamais tuer le bot ───
client.on(Events.Error, (e) => console.error("Client error:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

client.login(process.env.DISCORD_TOKEN);
