import { Events } from "discord.js";
import { parseChord, parseRoot, pcName, SCALE_LABELS } from "../harmony.js";

export const name = Events.MessageCreate;

// Salons où l'AUTO-détection est active (ailleurs : seulement sur @mention).
const autoChannels = () =>
  [process.env.HARMONY_CHANNEL_ID, process.env.GENERAL_HELP_CHANNEL_ID].filter(Boolean);

const COOLDOWN_MS = 60_000; // 1 suggestion auto max / minute / salon
const lastSuggest = new Map(); // channelId -> timestamp

// ─── Détection (pure, exportée pour les tests) ───

const SCALE_WORDS = {
  major: "major", maj: "major",
  minor: "minor", min: "minor",
  dorian: "dorian", phrygian: "phrygian", lydian: "lydian", mixolydian: "mixolydian",
  "harmonic minor": "harmminor", "harm minor": "harmminor",
};

export function detectScale(text) {
  const m = text.match(
    /\b([A-Ga-g][#b]?)\s+(harmonic minor|harm minor|major|minor|dorian|phrygian|lydian|mixolydian|maj|min)\b/i
  );
  if (!m) return null;
  const rootPc = parseRoot(m[1]);
  if (rootPc === null) return null;
  const scaleName = SCALE_WORDS[m[2].toLowerCase()];
  if (!scaleName) return null;
  return { root: pcName(rootPc), scaleName, label: SCALE_LABELS[scaleName] };
}

// Un accord n'est "net" que si son suffixe porte un marqueur sans ambiguïté
// (chiffre, #, dim/aug/sus/add/maj…). Sinon on l'ignore → pas de faux positifs
// sur AM, PM, DM, GM, "am", ni sur les triades nues (Am, Cm, C…).
const CONFIDENT = /[0-9#+°ø]|dim|aug|sus|add|maj/i;

// Cherche les accords nets d'un texte (jusqu'à `max`), dédupliqués.
// Tolérant : minuscules + espace possible entre racine et suffixe ("c maj7").
export function findChords(text, max = 6) {
  const re = /\b([A-Ga-g][#b]?)\s*([A-Za-z0-9#/+°ø-]+)\b/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(text)) !== null && out.length < max) {
    if (!CONFIDENT.test(m[2])) continue;
    const res = parseChord(m[1] + m[2]);
    if (res.error || seen.has(res.label)) continue;
    seen.add(res.label);
    out.push(res);
  }
  return out;
}

function fmtChord(res) {
  return `**${res.label}** — Notes: ${res.notes.join(" · ")} · Intervals: ${res.degrees.join(" ")}`;
}

const HELP_HINT =
  "Hi! 🎹 I'm a harmony helper — try `/chord` (e.g. `Cmaj7`), `/scale`, `/diatonic`, or `/help`.";

// Réponse quand on @mentionne le bot (toujours répondre).
export function mentionReply(text) {
  const t = text.trim();
  if (t) {
    const whole = parseChord(t); // "@Tuple c maj7", "@Tuple Am" (intentionnel)
    if (!whole.error) return fmtChord(whole);
    const chords = findChords(t); // "@Tuple Cmaj7 G6/9 Em9" → tous
    if (chords.length) return chords.map(fmtChord).join("\n");
    const sc = detectScale(t);
    if (sc) return `**${sc.root} ${sc.label}** → try \`/diatonic\` or \`/scale\` for the full breakdown.`;
  }
  return HELP_HINT;
}

// Suggestion proactive (cooldown géré dans execute). null = on ne dit rien.
export function detectSuggestion(content) {
  const chords = findChords(content);
  if (chords.length === 1)
    return `💡 \`${chords[0].label}\`? Try \`/chord\` to see its notes.`;
  if (chords.length > 1)
    return `💡 Spotted ${chords.map((c) => `\`${c.label}\``).join(" · ")} — \`/chord\` for notes, or \`/diatonic\` for the key.`;

  const sc = detectScale(content);
  if (sc) return `💡 Exploring **${sc.root} ${sc.label}**? Try \`/diatonic\` or \`/scale\`.`;

  if (/\b(bug|crash(?:e[sd]|ing)?|freezes?|broken|do(?:es)?n'?t work|not working)\b/i.test(content))
    return "💡 Found a bug? Use `/bug` — it files it in bug-reports with the right details.";

  if (/\b(feature request|would be (?:cool|nice|great|handy) if|please add|i wish|it'?d be (?:cool|nice))\b/i.test(content))
    return "💡 Got an idea? `/suggest` lets the community vote on it.";

  return null;
}

// ─── Handler ───

export async function execute(message) {
  if (message.author.bot || !message.guild) return;
  const content = message.content;
  if (!content) return;

  const mentionRe = new RegExp(`<@!?${message.client.user.id}>`);

  // 1) @mention → toujours répondre
  if (mentionRe.test(content)) {
    const text = content.replace(new RegExp(mentionRe.source, "g"), " ").trim();
    try {
      await message.reply({
        content: mentionReply(text),
        allowedMentions: { repliedUser: false },
      });
    } catch (err) {
      console.error("mention reply failed:", err.message);
    }
    return;
  }

  // 2) Auto-détection : salons autorisés + cooldown + accords/gammes nets
  if (!autoChannels().includes(message.channelId)) return;
  const now = Date.now();
  if (now - (lastSuggest.get(message.channelId) ?? 0) < COOLDOWN_MS) return;

  const suggestion = detectSuggestion(content);
  if (!suggestion) return;

  lastSuggest.set(message.channelId, now);
  try {
    await message.reply({ content: suggestion, allowedMentions: { repliedUser: false } });
  } catch (err) {
    console.error("suggestion failed:", err.message);
  }
}
