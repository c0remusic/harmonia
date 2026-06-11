// realizer.js — Moteur A : l'IDENTITÉ. Produit des réalisations CANDIDATES d'un
// spec selon un voicing, toutes conformes à l'identité (checkIdentity) et aux
// règles de registre (lowIntervalViolations). Le Selector choisira parmi elles.

import { checkIdentity } from './identity.js';
import { lowIntervalViolations, dominantThirdPc } from './rules.js';

const mod = n => ((n % 12) + 12) % 12;
const ROLE_ORDER = ['root', 'sus', 'third', 'fifth', 'sixth', 'seventh', 'ninth'];
const vsort = a => [...a].sort((x, y) => x - y);

// Toutes les inversions d'un cluster (monte la note la plus basse d'une octave).
// Indispensable au voice leading des voicings à fondamentale contrainte (rootless,
// piano) : ils filtrent les inversions de la pile complète (la fondamentale y revient),
// donc sans ça le Realizer ne sort que la position fondamentale -> transposition en bloc.
const rotationsOf = arr => {
  const out = []; let r = vsort(arr);
  for (let i = 0; i < arr.length; i++) { out.push([...r]); r = vsort([...r.slice(1), r[0] + 12]); }
  return out;
};

// Empile la spec en position serrée, fondamentale à rootMidi.
export function closeFrom(spec, rootMidi) {
  const ordered = [...spec.pcs].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  const out = [rootMidi];
  let last = rootMidi;
  for (const p of ordered.slice(1)) {
    let n = last + 1; n += mod(p.pc - mod(n));
    out.push(n); last = n;
  }
  return out;
}

// Transforms géométriques (portés de v1, inchangés musicalement).
const T = {
  classic: c => [c],
  open:    c => c.length < 2 ? [c] : [vsort(c.map((n, i) => i === 1 ? n + 12 : n))],
  spread:  c => c.length < 3 ? [c] : [vsort(c.map((n, i) => i % 2 === 1 ? n + 12 : n))],
  house:   (c, oct) => {
    if (c.length < 3) return [vsort(c)];                          // <3 notes : close (rare)
    oct = oct || 0;                                               // décalage d'octave (commande OCTAVE)
    var hm = n => ((n % 12) + 12) % 12;
    var rootPc = hm(c[0]);
    var upperPc = c.slice(1).map(hm);
    if (c.length >= 5) upperPc = upperPc.filter((p, i) => i !== 1);  // m9/maj9 : on lâche la quinte
    // Stab Rhodes : basse = fondamentale (jamais de sub-low) ; cluster rootless SERRÉ
    // dans une octave fixe -> poche brillante constante, seule la basse bouge.
    // Le tout suit la commande OCTAVE via `oct`.
    var bass = 48 + oct + rootPc;                                 // octave de basse (défaut C3)
    var floor = 60 + oct;                                         // base du cluster (défaut C4)
    var cluster = upperPc.map(function (pc) { return floor + hm(pc); }) // chaque tension dans [floor,floor+11]
      .sort(function (a, b) { return a - b; })
      .filter(function (n, i, a) { return i === 0 || n !== a[i - 1]; }); // dédup de classe
    return [vsort([bass].concat(cluster))];
  },
  prog:    (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    oct = oct || 0;                                               // décalage d'octave (commande OCTAVE)
    var pm = n => ((n % 12) + 12) % 12;
    var rootPc = pm(c[0]);
    var upperPc = c.slice(1).map(pm);                             // 3,5,(7,9) — structure PLEINE (5te gardée)
    // Pad "grand" : basse + fondamentale doublée à l'octave (corps) + structure brillante
    // au-dessus. Suit la commande OCTAVE via `oct`.
    var bass = 48 + oct + rootPc;                                 // octave de basse (défaut C3, pas de sub-low)
    var rootOct = bass + 12;
    var cl = [], last = Math.max(rootOct, 59 + oct);
    upperPc.forEach(function (pc) { var n = last + 1; n += pm(pc - pm(n)); cl.push(n); last = n; });
    // Structure haute en TOUTES ses inversions -> le Selector voice-leade le haut du
    // pad (basse + fondamentale doublée restent le corps fixe).
    return rotationsOf(cl).map(function (up) { return vsort([bass, rootOct].concat(up)).slice(0, 6); });
  },
  // piano : basse = fondamentale (octave grave), main droite = structure en toutes
  // ses inversions -> le Selector peut TENIR les notes communes à la MD.
  piano:     c => c.length < 3 ? [c] : rotationsOf(c.slice(1)).map(rh => [c[0] - 12, ...rh]),
  // rootless : cluster sans fondamentale, en toutes ses inversions.
  rootlessa: c => c.length < 3 ? [c] : rotationsOf(c.slice(1)),
  rootlessb: c => {
    if (c.length < 3) return [c];
    const u = c.slice(1), k = Math.ceil(u.length / 2);
    // Forme "open" : moitié basse remontée d'une octave → écartement ~2 octaves.
    // On génère 4 positions d'octave de cette MÊME forme (pas des rotations) :
    // rootlessa voice-leade par INVERSION du cluster serré ;
    // rootlessb voice-leade par REGISTRE de l'écartement large — sons distincts.
    const spread = vsort([...u.slice(k), ...u.slice(0, k).map(n => n + 12)]);
    return [-1, 0, 1, 2].map(o => vsort(spread.map(n => n + o * 12)));
  },
  drop2: c => { const r = vsort(c); r[r.length - 2] -= 12; return [vsort(r)]; },
  drop3: c => { const r = vsort(c); r[r.length - 3] -= 12; return [vsort(r)]; },
  // jazz : cluster rootless ancré en C3+oct (zone comping LH jazz/électro).
  // Pas de fondamentale. Toutes les rotations pour le voice leading.
  // Distinct de rootlessa : registre FIXE (ABSOLUTE) → le cluster reste dans la
  // poche C3-C4 quelle que soit la commande OCTAVE, comme une main gauche de pianiste.
  jazz: (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    const pm = n => ((n % 12) + 12) % 12;
    oct = oct || 0;
    const pcs = c.slice(1).map(pm);   // sans fondamentale, ordre ROLE_ORDER
    const floor = 48 + oct;           // C3 par défaut
    const cluster = [];
    let cur = floor;
    for (const pc of pcs) {
      let n = cur + pm(pc - pm(cur));
      if (cluster.length && n <= cluster[cluster.length - 1]) n += 12;
      cluster.push(n);
      cur = n;
    }
    return rotationsOf(vsort(cluster));
  }
};
// Gabarits à structure stricte : jamais stabilisés (la stabilisation casserait l'invariant).
const STRUCT = new Set(['piano', 'rootlessa', 'rootlessb', 'drop2', 'drop3', 'house', 'prog', 'jazz']);
// Gabarits à REGISTRE ABSOLU : la réalisation ignore l'octave/inversion d'entrée
// (basse posée dans une octave fixe). On ne leur applique donc PAS d'inversions —
// sinon on génère des candidats à mauvaise basse. Le voice leading se fait par le Selector.
const ABSOLUTE = new Set(['house', 'prog', 'jazz']);

// Doublures/omissions pour atteindre `target` voix (jamais la 3ce d'une dominante).
function stabilize(notes, spec, target) {
  const out = [...notes];
  const avoid = dominantThirdPc(spec);
  const prefer = ['root', 'fifth', 'third'].map(r => spec.pcs.find(p => p.role === r)).filter(Boolean)
    .filter(p => p.pc !== avoid);
  let pi = 0;
  while (out.length < target && prefer.length) {
    const pc = prefer[pi % prefer.length].pc; pi++;
    const top = Math.max(...out);
    out.push(top + 1 + mod(pc - mod(top + 1)));
  }
  while (out.length > Math.min(target, 6)) {
    const fifth = spec.pcs.find(p => p.role === 'fifth');
    const i = fifth ? out.findIndex(n => mod(n) === fifth.pc) : -1;
    out.splice(i >= 0 ? i : out.length - 1, 1);
  }
  return vsort(out);
}

export function realize(spec, voicing, opts = {}) {
  const center = opts.center ?? 60;
  const want = opts.targetVoices ?? null;   // null = préserver la longueur naturelle du gabarit
  let vc = voicing, fallback = null;

  // Edge cases définis (spec §2a) : fallback explicites, jamais silencieux.
  if ((vc === 'rootlessa' || vc === 'rootlessb' || vc === 'jazz') && !spec.hasSeventh) { fallback = vc; vc = 'classic'; }
  if (vc === 'drop3' && spec.pcs.length < 4) { fallback = vc; vc = 'drop2'; }
  if (vc === 'drop2' && spec.pcs.length < 4) { fallback = fallback || vc; vc = 'classic'; }

  // Inversions : monter la note la plus basse d'une octave. Indispensable au
  // voice leading — c'est ce qui permet de TENIR les notes communes.
  const rotateUp = arr => { const r = vsort(arr); r.push(r.shift() + 12); return vsort(r); };

  // Décalage d'octave pour les gabarits ABSOLUTE : ils suivent la commande OCTAVE
  // (transmise via `center`). Borné : un stab/pad ne doit jamais plonger en sub-bass
  // (basse < C2 -> low-interval tue l'unique candidat = silence).
  const octShift = Math.max(-12, Math.min(24, Math.round((center - 60) / 12) * 12));

  const seen = new Set(), out = [];
  for (let oct = -2; oct <= 2; oct++) {
    const base = 48 + oct * 12;
    const rootMidi = base + mod(spec.rootPc - mod(base));
    let inv = closeFrom(spec, rootMidi);
    const nInv = ABSOLUTE.has(vc) ? 1 : spec.pcs.length;  // registre absolu -> pas d'inversions
    for (let k = 0; k < nInv; k++) {                       // toutes les inversions (sauf ABSOLUTE)
      for (const shape of T[vc](inv, octShift)) {
        let notes = (want != null && !STRUCT.has(vc)) ? stabilize(shape, spec, want) : vsort(shape).slice(0, 6);
        if (Math.min(...notes) < 24 || Math.max(...notes) > 108) continue;
        if (checkIdentity(vc, notes, spec).length) continue;
        // Low-interval : exigé pour les voicings à candidats multiples ; best-effort pour
        // les ABSOLUTE (candidat unique -> ne jamais produire de silence aux octaves basses).
        if (!ABSOLUTE.has(vc) && lowIntervalViolations(notes).length) continue;
        const key = notes.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ notes, voicing: vc, fallback });
      }
      inv = rotateUp(inv);
    }
  }
  return out;
}
