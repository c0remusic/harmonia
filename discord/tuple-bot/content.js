// ─── Contenus des salons (source de vérité) ────────────────
// Édite ces textes librement. Puis dans Discord : /setup all  (ou /setup target:<salon>)
// Le bot postera/MAJ le message ET mettra à jour le topic (description en haut du salon).
//
// Les :tuple_xxx: deviennent tes emojis dans le MESSAGE (pas dans le topic : un topic
// est du texte brut, sans emoji custom ni gras).
// Remplace [LINK] par tes vraies URLs.

import { EMOJI } from "./emojis.js";
import { INFO } from "./config.js";

// Liens canoniques (édités dans config.js > INFO) — plus de [LINK] en dur.
const SITE = INFO.site;
const M4L = INFO.maxforlive ?? "coming with the final release";

export const CHANNEL_CONTENT = {
  welcome: {
    channelEnv: "WELCOME_CHANNEL_ID",
    topic: "Start here — what Tuple is and where to go next.",
    build: () =>
      `${EMOJI.welcome}**Welcome to Tuple**\n\n` +
      "Tuple is a MIDI chord device for Ableton Live — built to put harmony at your fingertips.\n\n" +
      "Pick a key, see every in-key chord on one grid, and play full progressions with one hand. " +
      "15 voicings, dynamic voice leading, and scale sync straight from Live.\n\n" +
      "This is the official community: support, updates, and sharing what you make with it.\n\n" +
      `${EMOJI.rules}Read the **#rules** (takes 30 seconds)\n` +
      `${EMOJI.faq}Check **#faq** before asking\n` +
      `${EMOJI.general_help}Need help? **#general-help** or **#bug-reports**\n` +
      `${EMOJI.harmony}Love chords? Talk shop in **#harmony**\n\n` +
      "Glad you're here. 🟡",
  },

  rules: {
    channelEnv: "RULES_CHANNEL_ID",
    topic: "Community rules — read before posting.",
    build: () =>
      `${EMOJI.rules}**Community rules**\n\n` +
      "Keep it simple, keep it kind.\n\n" +
      "**1. Be respectful.** No harassment, hate speech, or personal attacks.\n" +
      "**2. Stay on topic.** Use the right channels.\n" +
      "**3. No spam or self-promo.** Sharing your own music made with Tuple is welcome in #harmony.\n" +
      "**4. No piracy.** Don't share cracked software or links — including Tuple itself.\n" +
      "**5. Search before posting.** Check #faq first.\n" +
      "**6. English please,** so everyone can follow along.\n\n" +
      "Breaking these may lead to a warning, mute, or ban. Questions? DM a @Moderator.",
  },

  faq: {
    channelEnv: "FAQ_CHANNEL_ID",
    topic: "Frequently asked questions about Tuple.",
    build: () =>
      `${EMOJI.faq}**Frequently Asked Questions**\n\n` +
      `${EMOJI.faq}**What is Tuple?**\n` +
      "A MIDI effect device for Ableton Live that helps you build, explore, and play chords and progressions in key. " +
      "Every in-key chord — diatonic and borrowed — sits on one grid, with **15 voicings** (each a one-hand grip; only Piano mode spans two hands), " +
      "**dynamic voice leading** for smooth changes, and **scale sync** that pulls the key straight from Live.\n\n" +
      `${EMOJI.infos}**What do I need to run it?**\n` +
      "Ableton Live with **Max for Live** (included in Live Suite, or an add-on for Standard). Works on macOS and Windows.\n\n" +
      `${EMOJI.announcements}**Where do I download it?**\n` +
      `Official site: ${SITE} · maxforlive.com: ${M4L}\n\n` +
      `${EMOJI.harmony}**How do I install it?**\n` +
      "Drag the \`.amxd\` file onto a MIDI track in Live. That's it.\n\n" +
      `${EMOJI.bug_reports}**I found a bug.**\n` +
      "Post in #bug-reports using the pinned template (OS, Live version, steps).",
  },

  bug_reports: {
    channelEnv: "BUG_REPORTS_CHANNEL_ID",
    topic: "Report bugs here — please use the pinned template.",
    build: () =>
      `${EMOJI.bug_reports}**Reporting a bug**\n\n` +
      "Found something broken? Copy the template below and fill it in. The more detail, the faster we can fix it.\n" +
      "\`\`\`\n" +
      "What happened:\n" +
      "What you expected:\n" +
      "Steps to reproduce:\n" +
      "1.\n" +
      "2.\n" +
      "Tuple version:\n" +
      "Ableton Live version:\n" +
      "OS:\n" +
      "Screenshot or clip:\n" +
      "\`\`\`\n" +
      "Before posting, check #faq and search the channel. 🙏",
  },

  feature_requests: {
    channelEnv: "FEATURE_REQUESTS_CHANNEL_ID",
    topic: "Suggest features — use the pinned template and 👍 ideas you like.",
    build: () =>
      `${EMOJI.feature_requests}**Requesting a feature**\n\n` +
      "Got an idea to make Tuple better? Copy the template and post it.\n" +
      "\`\`\`\n" +
      "The idea:\n" +
      "The problem it solves:\n" +
      "How you'd use it:\n" +
      "Nice-to-have or essential?\n" +
      "\`\`\`\n" +
      "Search first — if your idea exists, react with 👍 instead of reposting. " +
      "Most-voted ideas climb the list. 🟡",
  },

  announcements: {
    channelEnv: "ANNOUNCEMENTS_CHANNEL_ID",
    topic: "Official Tuple releases and news.",
    build: () =>
      `${EMOJI.announcements}**Tuple — what's in the current build**\n\n` +
      "Here's where Tuple stands right now:\n\n" +
      `${EMOJI.harmony}**15 voicings** — each a coherent one-hand grip in a single register, ready to layer over your own bass line. Only Piano mode spans two hands.\n` +
      `${EMOJI.harmony}**Dynamic voice leading** — notes move the shortest distance between chords for smooth changes; toggle it off for closest-to-center picks.\n` +
      `${EMOJI.infos}**Scale sync** — pull the current key and scale straight from Live.\n` +
      `${EMOJI.faq}**Full in-key grid** — diatonic and borrowed chords together, no menu digging.\n\n` +
      `${EMOJI.infos}Official site: ${SITE}\n` +
      `${EMOJI.infos}maxforlive.com: ${M4L}\n\n` +
      "More in #welcome. Bug or idea? #bug-reports · #feature-requests. 🟡",
  },

  harmony: {
    channelEnv: "HARMONY_CHANNEL_ID",
    topic: "Talk chords, progressions, and theory — all levels welcome.",
    build: () =>
      `${EMOJI.harmony}**Harmony**\n\n` +
      "This is where we geek out about chords. 🎹\n\n" +
      "Found a progression that gives you chills? Stuck on a transition? " +
      "Curious why that one chord just *works*? Drop it here. " +
      "Beginners and theory heads both belong — the best discussions happen when they mix.",
  },

  general_help: {
    channelEnv: "GENERAL_HELP_CHANNEL_ID",
    topic: "Ask for help with Tuple — setup, workflow, anything.",
    build: () =>
      `${EMOJI.general_help}**General help**\n\n` +
      "Stuck on something? Ask here — installation, setup, workflow, anything Tuple-related.\n\n" +
      "Two tips for a fast answer: check **#faq** first, and include your **OS + Ableton Live version** when relevant. " +
      "For actual bugs, head to **#bug-reports** instead. 🟡",
  },

  general: {
    channelEnv: "GENERAL_CHANNEL_ID",
    topic: "The main hangout — chat about anything.",
    build: () =>
      `${EMOJI.general}**General**\n\n` +
      "The main hangout — say hi, talk production, share what you're working on, or just chat.\n\n" +
      "Keep support questions in **#general-help** and chord talk in **#harmony** so things stay easy to follow. 🟡",
  },
};
