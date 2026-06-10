import { REST, Routes } from "discord.js";
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [];
const commandsPath = join(__dirname, "commands");
const files = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of files) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if (mod.data) commands.push(mod.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log(`Déploiement de ${commands.length} commande(s)…`);
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
  console.log("✅ Commandes déployées sur le serveur.");
} catch (err) {
  console.error("Erreur de déploiement:", err);
}
