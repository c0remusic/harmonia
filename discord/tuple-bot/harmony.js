// ───────────────────────────────────────────────────────────────
// harmony.js — MIROIR de device/chord_engine.js (la source de vérité Max).
//
// Le moteur est du JS Max (outlets, variables globales, aucun export) → on ne
// peut pas l'importer ici. On RECOPIE donc ses tables + sa logique de labels
// pour que le bot parle exactement comme le device : mêmes gammes, mêmes types
// d'accords, mêmes labels (M7, ø7, dim7…), mêmes accords empruntés.
//
// ⚠️  SI TU MODIFIES chord_engine.js (SCALES, NOTE_NAMES, gridLabel, BORROWED_*),
//     RÉPERCUTE le changement ICI. Voir docs/superpowers/specs/2026-06-10-tuple-bot-lot1-design.md
// ───────────────────────────────────────────────────────────────

// — Copié de chord_engine.js —
export const SCALES = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmminor:  [0, 2, 3, 5, 7, 8, 11],
};

// Noms affichés EN SORTIE : dièses uniquement (fidèle au device).
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Libellés lisibles pour les menus déroulants des commandes.
export const SCALE_LABELS = {
  major: "Major",
  minor: "Minor (natural)",
  dorian: "Dorian",
  phrygian: "Phrygian",
  lydian: "Lydian",
  mixolydian: "Mixolydian",
  harmminor: "Harmonic minor",
};

// Accords empruntés — copié de chord_engine.js (BORROWED_MAJOR / BORROWED_MINOR).
// semis = décalage en demi-tons depuis la tonique ; suf = suffixe de label.
const BORROWED_MAJOR = [
  { roman: "bIII", semis: 3,  suf: ""     },
  { roman: "iv",   semis: 5,  suf: "m"    },
  { roman: "bVI",  semis: 8,  suf: ""     },
  { roman: "bVII", semis: 10, suf: ""     },
  { roman: "V/V",  semis: 2,  suf: "7"    },
  { roman: "V/ii", semis: 9,  suf: "7"    },
  { roman: "V/vi", semis: 4,  suf: "7"    },
];
const BORROWED_MINOR = [
  { roman: "V",    semis: 7,  suf: ""     },
  { roman: "vii°", semis: 11, suf: "dim7" },
  { roman: "IV",   semis: 5,  suf: ""     },
  { roman: "bII",  semis: 1,  suf: ""     },
  { roman: "V/V",  semis: 2,  suf: "7"    },
  { roman: "V/iv", semis: 0,  suf: "7"    },
  { roman: "V/VI", semis: 3,  suf: "7"    },
];

// Entrée LIBÉRALE : accepte dièses ET bémols (et la casse), y compris les
// enharmonies rares (Cb=B, E#=F…).
const NOTE_TO_PC = {
  C: 0, "C#": 1, DB: 1, D: 2, "D#": 3, EB: 3, E: 4, F: 5,
  "F#": 6, GB: 6, G: 7, "G#": 8, AB: 8, A: 9, "A#": 10, BB: 10, B: 11,
  "B#": 0, CB: 11, "E#": 5, FB: 4,
};

// "C", "c#", "Db", "E♭" … → 0..11, ou null si invalide.
export function parseRoot(str) {
  if (!str) return null;
  const s = String(str).trim().toUpperCase().replace("♯", "#").replace("♭", "B");
  return Object.prototype.hasOwnProperty.call(NOTE_TO_PC, s) ? NOTE_TO_PC[s] : null;
}

export function pcName(pc) {
  return NOTE_NAMES[(((pc % 12) + 12) % 12)];
}

// ─── Logique harmonique (portée de chord_engine.js) ───

// Intervalles en demi-tons (depuis la tonique du degré) pour le degré d (0..6).
function getIntervals(scaleArr, d) {
  const iv = {};
  const base = scaleArr[(((d % 7) + 7) % 7)];
  for (let step = 0; step <= 8; step++) {
    const absIdx = d + step;
    const octShift = Math.floor(absIdx / 7);
    const noteInScale = (((absIdx % 7) + 7) % 7);
    const semi = scaleArr[noteInScale] - base + octShift * 12;
    iv[step] = ((semi % 12) + 12) % 12;
  }
  return iv;
}

// Sous-ensemble de isValid() du moteur : les cas utiles aux labels de 7e.
function isValid(scaleArr, d, type) {
  const iv = getIntervals(scaleArr, d);
  switch (type) {
    case "maj7":  return iv[4] === 7 && iv[6] === 11;
    case "dom7":  return iv[4] === 7 && iv[6] === 10;
    case "min7":  return iv[2] === 3 && iv[4] === 7 && iv[6] === 10;
    case "dim7":  return iv[2] === 3 && iv[4] === 6 && iv[6] === 9;
    case "hdim7": return iv[2] === 3 && iv[4] === 6 && iv[6] === 10;
    default: return false;
  }
}

// Qualité du triade diatonique : "maj" | "min" | "dim" | "aug" (cf. chordQuality).
function triadQuality(scaleArr, d) {
  const semi = (step) => scaleArr[(((step % 7) + 7) % 7)] + 12 * Math.floor(step / 7);
  const root = semi(d), third = semi(d + 2) - root, fifth = semi(d + 4) - root;
  if (third === 3 && fifth === 6) return "dim";
  if (third === 4 && fifth === 8) return "aug";
  if (third === 3) return "min";
  return "maj";
}

// Label d'accord pour un degré (porté de gridLabel : triade & septième).
function chordLabel(rootPc, scaleArr, d, fn) {
  const iv = getIntervals(scaleArr, d);
  const rn = NOTE_NAMES[(rootPc + scaleArr[(((d % 7) + 7) % 7)]) % 12];
  if (fn === "triad") {
    if (iv[2] === 3 && iv[4] === 6) return rn + "dim";
    if (iv[2] === 4 && iv[4] === 8) return rn + "aug";
    if (iv[2] === 3) return rn + "m";
    return rn;
  }
  if (fn === "seven") {
    if (isValid(scaleArr, d, "maj7"))  return rn + "M7";
    if (isValid(scaleArr, d, "min7"))  return rn + "m7";
    if (isValid(scaleArr, d, "dom7"))  return rn + "7";
    if (isValid(scaleArr, d, "dim7"))  return rn + "dim7";
    if (isValid(scaleArr, d, "hdim7")) return rn + "ø7";
  }
  return rn;
}

// ─── API publique ───

// Les 7 notes d'une gamme (noms en dièses).
export function scaleNotes(rootPc, scaleName) {
  const scaleArr = SCALES[scaleName];
  if (!scaleArr) return [];
  return scaleArr.map((s) => NOTE_NAMES[(rootPc + s) % 12]);
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

// Accords diatoniques : [{ roman, triad, seventh }] pour les 7 degrés.
export function diatonic(rootPc, scaleName) {
  const scaleArr = SCALES[scaleName];
  if (!scaleArr) return [];
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const q = triadQuality(scaleArr, d);
    let roman = ROMAN[d];
    if (q === "min" || q === "dim") roman = roman.toLowerCase();
    if (q === "dim") roman += "°";
    if (q === "aug") roman += "+";
    rows.push({
      roman,
      triad: chordLabel(rootPc, scaleArr, d, "triad"),
      seventh: chordLabel(rootPc, scaleArr, d, "seven"),
    });
  }
  return rows;
}

// Accords empruntés : [{ roman, label }] (major/minor seulement, sinon []).
// roman reste en ASCII ("bIII") : labels du moteur + alignement monospace garanti.
export function borrowed(rootPc, scaleName) {
  const table = scaleName === "major" ? BORROWED_MAJOR
              : scaleName === "minor" ? BORROWED_MINOR
              : [];
  return table.map((b) => ({
    roman: b.roman,
    label: NOTE_NAMES[(rootPc + b.semis) % 12] + b.suf,
  }));
}

// ─── /chord : parseur de nom d'accord ───
// Vocabulaire = les labels que le device affiche (gridLabel/sendChord),
// chaque type = suffixe canonique + intervalles + degrés.

const CHORD_TYPES = [
  { suf: "",      iv: [0, 4, 7],          deg: ["1", "3", "5"] },
  { suf: "m",     iv: [0, 3, 7],          deg: ["1", "b3", "5"] },
  { suf: "dim",   iv: [0, 3, 6],          deg: ["1", "b3", "b5"] },
  { suf: "aug",   iv: [0, 4, 8],          deg: ["1", "3", "#5"] },
  { suf: "M7",    iv: [0, 4, 7, 11],      deg: ["1", "3", "5", "7"] },
  { suf: "7",     iv: [0, 4, 7, 10],      deg: ["1", "3", "5", "b7"] },
  { suf: "m7",    iv: [0, 3, 7, 10],      deg: ["1", "b3", "5", "b7"] },
  { suf: "dim7",  iv: [0, 3, 6, 9],       deg: ["1", "b3", "b5", "bb7"] },
  { suf: "ø7",    iv: [0, 3, 6, 10],      deg: ["1", "b3", "b5", "b7"] },
  { suf: "mMaj7", iv: [0, 3, 7, 11],      deg: ["1", "b3", "5", "7"] },
  { suf: "M9",    iv: [0, 4, 7, 11, 14],  deg: ["1", "3", "5", "7", "9"] },
  { suf: "9",     iv: [0, 4, 7, 10, 14],  deg: ["1", "3", "5", "b7", "9"] },
  { suf: "m9",    iv: [0, 3, 7, 10, 14],  deg: ["1", "b3", "5", "b7", "9"] },
  { suf: "add9",  iv: [0, 4, 7, 14],      deg: ["1", "3", "5", "9"] },
  { suf: "madd9", iv: [0, 3, 7, 14],      deg: ["1", "b3", "5", "9"] },
  { suf: "sus2",  iv: [0, 2, 7],          deg: ["1", "2", "5"] },
  { suf: "sus4",  iv: [0, 5, 7],          deg: ["1", "4", "5"] },
  { suf: "6",     iv: [0, 4, 7, 9],       deg: ["1", "3", "5", "6"] },
  { suf: "m6",    iv: [0, 3, 7, 9],       deg: ["1", "b3", "5", "6"] },
  { suf: "6/9",   iv: [0, 4, 7, 9, 14],   deg: ["1", "3", "5", "6", "9"] },
  { suf: "m6/9",  iv: [0, 3, 7, 9, 14],   deg: ["1", "b3", "5", "6", "9"] },
  { suf: "7sus4", iv: [0, 5, 7, 10],      deg: ["1", "4", "5", "b7"] },
  { suf: "7b9",   iv: [0, 4, 7, 10, 13],  deg: ["1", "3", "5", "b7", "b9"] },
  { suf: "7#9",   iv: [0, 4, 7, 10, 15],  deg: ["1", "3", "5", "b7", "#9"] },
  { suf: "m7#5",  iv: [0, 3, 8, 10],      deg: ["1", "b3", "#5", "b7"] },
];

// Écritures alternatives acceptées en entrée → suffixe canonique.
const SUFFIX_ALIASES = {
  "maj": "", "M": "",
  "min": "m", "-": "m",
  "°": "dim", "o": "dim",
  "+": "aug",
  "maj7": "M7", "Δ": "M7", "Δ7": "M7",
  "min7": "m7", "-7": "m7",
  "°7": "dim7", "o7": "dim7",
  "ø": "ø7", "m7b5": "ø7", "min7b5": "ø7", "-7b5": "ø7",
  "mM7": "mMaj7", "minmaj7": "mMaj7", "minMaj7": "mMaj7", "-Maj7": "mMaj7",
  "maj9": "M9", "min9": "m9", "-9": "m9",
  "minadd9": "madd9", "-add9": "madd9",
  "sus": "sus4",
  "min6": "m6", "-6": "m6",
  "69": "6/9", "m69": "m6/9", "min69": "m6/9",
  "7sus": "7sus4",
  "min7#5": "m7#5", "m7+5": "m7#5",
};

const SUFFIX_EXACT = new Map(CHORD_TYPES.map((t) => [t.suf, t]));

// Repli insensible à la casse — UNIQUEMENT pour les écritures sans ambiguïté.
// (un "m7" minuscule entre en collision avec "M7" → la casse fait foi pour ceux-là)
const SUFFIX_LC = (() => {
  const lc = new Map();
  const ambiguous = new Set();
  const add = (key, suf) => {
    const k = key.toLowerCase();
    if (lc.has(k) && lc.get(k) !== suf) ambiguous.add(k);
    else lc.set(k, suf);
  };
  for (const t of CHORD_TYPES) add(t.suf, t.suf);
  for (const [a, suf] of Object.entries(SUFFIX_ALIASES)) add(a, suf);
  for (const k of ambiguous) lc.delete(k);
  return lc;
})();

function resolveSuffix(s) {
  if (SUFFIX_EXACT.has(s)) return SUFFIX_EXACT.get(s);
  if (SUFFIX_ALIASES[s] !== undefined) return SUFFIX_EXACT.get(SUFFIX_ALIASES[s]);
  const viaLc = SUFFIX_LC.get(s.toLowerCase());
  return viaLc !== undefined ? SUFFIX_EXACT.get(viaLc) : null;
}

// "Cmaj7" → { label:"CM7", notes:["C","E","G","B"], degrees:["1","3","5","7"] }
// Erreurs : { error:"root" } ou { error:"type", typePart }.
export function parseChord(input) {
  const s = String(input || "").trim().replace(/♯/g, "#").replace(/♭/g, "b");
  const m = s.match(/^([A-Ga-g](?:#|b)?)\s*(.*)$/);
  if (!m) return { error: "root" };
  const rootPc = parseRoot(m[1]);
  if (rootPc === null) return { error: "root" };
  const type = resolveSuffix(m[2].trim());
  if (!type) return { error: "type", typePart: m[2].trim() };
  return {
    label: pcName(rootPc) + type.suf,
    notes: type.iv.map((i) => pcName(rootPc + i)),
    degrees: type.deg.slice(),
  };
}

// /identify : à partir de noms de notes → nom(s) d'accord.
// { error:"parse", bad } si note invalide · { error:"few" } si < 2 notes ·
// sinon un tableau [{ label, root }] (plusieurs si ambigu, ex. C6 / Am7).
export function identifyChord(noteStrings) {
  const pcs = [];
  for (const s of noteStrings) {
    const pc = parseRoot(s);
    if (pc === null) return { error: "parse", bad: s };
    if (!pcs.includes(pc)) pcs.push(pc);
  }
  if (pcs.length < 2) return { error: "few" };

  const matches = [];
  const seen = new Set();
  for (const root of pcs) {
    const set = [...new Set(pcs.map((p) => (((p - root) % 12) + 12) % 12))]
      .sort((a, b) => a - b)
      .join(",");
    for (const t of CHORD_TYPES) {
      const ivset = [...new Set(t.iv.map((i) => i % 12))].sort((a, b) => a - b).join(",");
      if (ivset === set) {
        const label = pcName(root) + t.suf;
        if (!seen.has(label)) {
          seen.add(label);
          matches.push({ label, root: pcName(root) });
        }
      }
    }
  }
  return matches;
}
