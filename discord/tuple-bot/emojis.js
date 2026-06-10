// ─── Emojis custom du serveur ──────────────────────────────
// Les emojis sont nommés "tuple_xxx" sur le serveur.
// Pour mettre à jour un ID : récupère-le via  \:tuple_faq:  dans un salon
// (Discord affiche <:tuple_faq:ID>), puis colle l'ID ci-dessous.
//
// Tant qu'un "id" reste vide (""), le bot affiche le texte sans emoji — aucun bug.

const EMOJIS = {
  infos:            { name: "tuple_infos",            id: "1514105001897885696" },
  welcome:          { name: "tuple_welcome",          id: "1514105062257987666" },
  rules:            { name: "tuple_rules",            id: "1514105020277194875" },
  announcements:    { name: "tuple_announcements",    id: "1514107098651430952" },
  faq:              { name: "tuple_faq",              id: "1514104925808885901" },
  feature_requests: { name: "tuple_feature_requests", id: "1514104949284540478" },
  bug_reports:      { name: "tuple_bug_reports",      id: "1514104901188190269" },
  general_help:     { name: "tuple_general_help",     id: "1514104981542797493" },
  general:          { name: "tuple_general",          id: "1514104966581850142" },
  support:          { name: "tuple_support",          id: "1514105038916816976" },
  harmony:          { name: "tuple_harmony_bars",     id: "1514114020016263260" },
};

function e(key) {
  const entry = EMOJIS[key];
  if (!entry || !entry.id) return "";
  return `<:${entry.name}:${entry.id}> `;
}

export const EMOJI = new Proxy(
  {},
  {
    get: (_, prop) => e(String(prop)),
  }
);
