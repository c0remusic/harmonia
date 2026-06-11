// ─── Contenu éditable du bot ───────────────────────────────
// Modifie librement les textes ici sans toucher à la logique.

import { EMOJI } from "./emojis.js";

export const COLORS = {
  gold: 0xffdc82, // accent Tuple
  grey: 0x232323,
  red: 0xe25555, // bug reports
  green: 0x6fbf73, // support
};

// ─── Infos & liens — ÉDITE ICI (tout le reste s'y réfère) ───
// Avant la release : passer version à "1.0", remplacer site, renseigner
// maxforlive et donate (laisser null = masqué / "coming soon").
export const INFO = {
  version: "Beta", // affiché par /version
  versionNote: "1.0 at release",
  site: "https://tuple.live/",
  maxforlive: null, // null → "coming with the final release" ; sinon mettre l'URL
  email: "c0re_m4l@proton.me",
  donate: "https://www.paypal.com/paypalme/c0remusic", // null → masqué dans /links
};

// Répondu par /faq — le champ "emoji" est le nom d'un emoji custom (voir emojis.js)
export const FAQ = [
  {
    emoji: "faq",
    q: "What is Tuple?",
    a: "Tuple is a MIDI effect device for Ableton Live that helps you build, explore, and play chords and progressions in key.",
  },
  {
    emoji: "infos",
    q: "What do I need to run it?",
    a: "Ableton Live with **Max for Live** (included in Live Suite, or an add-on for Live Standard). Works on macOS and Windows.",
  },
  {
    emoji: "announcements",
    q: "Where do I download it?",
    a: "From the official site and from maxforlive.com. Links are in the announcements channel.",
  },
  {
    emoji: "harmony",
    q: "How do I install it?",
    a: "Drag the `.amxd` file onto a MIDI track in Live. That's it.",
  },
  {
    emoji: "bug_reports",
    q: "I found a bug.",
    a: "Post in the bug-reports channel using the pinned template (OS, Live version, steps to reproduce).",
  },
];

// Affiché par /roadmap — contenu PUBLIC, édite/élague librement.
export const ROADMAP = [
  {
    heading: "🔧 In progress",
    items: [
      "Push 2 integration — one chord per pad, color-coded by degree",
      "Humanize & Strum — timing/velocity feel and per-chord strum",
    ],
  },
  {
    heading: "🗺️ Planned",
    items: [
      "Roomier interface — more space for the chord grid and new controls",
      "More scales & modes",
      "Cleaner, properly sized window",
    ],
  },
  {
    heading: "📦 With the 1.0 release",
    items: ["Illustrated manual (PDF)", "Updated website"],
  },
];

// Affiché par /tip (au hasard) — brouillon, à relire/compléter.
export const TIPS = [
  "Turn on Voice Leading — Tuple moves notes the shortest distance between chords for smooth changes.",
  "Borrowed chords live right inside the grid — no menu digging.",
  "The EXT toggle reveals every extra chord in the key without hiding the main grid.",
  "Try different Voicings (open, spread, drop2…) to reshape a chord without changing its harmony.",
  "Sync pulls the current scale from Live so Tuple matches your project key instantly.",
  "Hold lets you sustain a chord and play a melody on top of it.",
  "Change Octave to move the whole grid into a register that fits your part.",
  "Voice Leading Mode swaps the movement algorithm — anchored, relative and piano feel different.",
  "Seventh and ninth chords only appear on a degree when they're valid in the key — what you see stays in-key.",
  "Secondary dominants (V/V, V/vi) in the borrowed column add a strong pull toward the next chord.",
  "Push mode maps the grid onto Push 2: one chord per pad, a color per degree.",
  "Use /diatonic and /chord right here in Discord to sketch a progression before opening Live.",
];

// Rôles auto-attribuables (commande /rolemenu → message à boutons).
// Crée chaque rôle dans Discord, puis colle son ID dans `id`.
// Un `id` vide ("") = bouton ignoré → tu peux préparer avant d'avoir les IDs.
// ⚠️ Le rôle du BOT doit être AU-DESSUS de ces rôles + permission "Manage Roles".
export const ROLE_MENU = {
  title: "Pick your roles",
  description: "Click a button to add or remove a role.",
  roles: [
    { id: "", label: "Release Pings", emoji: "🔔" },
    { id: "", label: "Beta Tester", emoji: "🧪" },
    { id: "", label: "Producer", emoji: "🎹" },
    { id: "", label: "Beatmaker", emoji: "🥁" },
    { id: "", label: "Composer", emoji: "🎼" },
    { id: "", label: "Sound Designer", emoji: "🔊" },
    { id: "", label: "Theory Head", emoji: "🤓" },
    { id: "", label: "Plays by Ear", emoji: "👂" },
    { id: "", label: "Push User", emoji: "🎛️" },
  ],
};

// Message de bienvenue auto (variable {user} = mention du nouveau membre)
export const WELCOME_MESSAGE =
  `${EMOJI.welcome}Welcome to **Tuple**, {user}!\n\n` +
  "Glad you're here. A few things to get you started:\n" +
  `${EMOJI.rules}Read the **rules** channel\n` +
  `${EMOJI.faq}Check the **faq** before asking\n` +
  `${EMOJI.general_help}Need help? Head to **general-help**\n` +
  `${EMOJI.harmony}Talk chords with us in **harmony** 🟡`;
