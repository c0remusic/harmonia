// ─── Mémorisation des messages postés par le bot ───────────
// Stocke, pour chaque salon, l'ID du message posté par /setup,
// afin de pouvoir l'ÉDITER au lieu d'en reposter un nouveau.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "posted-messages.json");

export function loadStore() {
  if (!existsSync(FILE)) return {};
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function saveStore(store) {
  writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function getMessageId(key) {
  return loadStore()[key] ?? null;
}

export function setMessageId(key, messageId) {
  const store = loadStore();
  store[key] = messageId;
  saveStore(store);
}

// Compteur persistant (numérotation des bugs / suggestions) : 1, 2, 3…
export function nextCounter(key) {
  const store = loadStore();
  const k = `counter:${key}`;
  store[k] = (store[k] ?? 0) + 1;
  saveStore(store);
  return store[k];
}
