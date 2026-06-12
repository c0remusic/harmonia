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
  // house : stab deep-house ROOTLESS (la basse joue la fonda à part). Cluster serré
  // brillant verrouillé dans l'octave C4 ; toutes les rotations pour le VL. 1 main.
  house:   (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    oct = oct || 0;
    var hm = n => ((n % 12) + 12) % 12;
    var pcs = c.slice(1).map(hm);                                 // rootless
    if (c.length >= 5) pcs = pcs.filter((p, i) => i !== 1);       // 9th+ : lâche la quinte
    var floor = 60 + oct;                                         // verrouillé C4
    var cluster = pcs.map(function (pc) { return floor + hm(pc); })
      .sort(function (a, b) { return a - b; })
      .filter(function (n, i, a) { return i === 0 || n !== a[i - 1]; });
    return rotationsOf(vsort(cluster));
  },
  // prog : pad root-inclus, structure PLEINE + fondamentale doublée à l'octave au-dessus
  // (corps de pad), serré sur ~1 octave. Suit la commande OCTAVE. La tonique reste
  // dans le registre de l'accord (pas de basse séparée).
  prog:    (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    oct = oct || 0;
    var pm = n => ((n % 12) + 12) % 12;
    var rootPc = pm(c[0]);
    var upperPc = c.slice(1).map(pm);
    var root = 48 + oct + rootPc;                                 // fonda C3, l'octave au sommet recentre
    var cl = [root], cur = root;
    upperPc.forEach(function (pc) { var n = cur + 1 + pm(pc - pm(cur + 1)); cl.push(n); cur = n; });
    cl.push(root + 12);                                           // fonda doublée à l'octave
    return [vsort(cl).slice(0, 6)];
  },
  // piano : main droite = structure en toutes ses inversions ; basse = fondamentale
  // ~1 octave SOUS la main droite (couplée à son registre, jamais 2 octaves dessous).
  piano:     c => {
    if (c.length < 3) return [c];
    const pm = n => ((n % 12) + 12) % 12;
    const rootPc = pm(c[0]);
    return rotationsOf(c.slice(1)).map(rh => {
      const lo = Math.min(...rh);
      let d = pm(rootPc - pm(lo - 12)); if (d > 6) d -= 12;   // fonda la plus proche de (lo−12)
      return [lo - 12 + d, ...rh];
    });
  },
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
  // trap : accord GRAVE serré, root-inclus, verrouillé en C3 (son dark/lourd). La
  // sub-basse 808 est jouée par l'instrument de basse à part — ici, accord cohérent
  // en position fondamentale, serré sur ~1 octave. Suit la commande OCTAVE.
  trap: (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    const pm = n => ((n % 12) + 12) % 12;
    oct = oct || 0;
    const rootPc = pm(c[0]);
    let upperPc = c.slice(1).map(pm);
    if (upperPc.length >= 4) upperPc = upperPc.filter((_, i) => i !== 1);  // 9th+ : lâche la 5te
    const root = 48 + oct + rootPc;   // C3 (grave, dark)
    const cl = [root]; let cur = root;
    for (const pc of upperPc) { let n = cur + 1 + pm(pc - pm(cur + 1)); cl.push(n); cur = n; }
    return [vsort(cl)];
  },
  // nuhouse : voicing rootless OUVERT et aéré (nu-house). Cluster rootless en C4, une
  // voix sur deux montée d'une octave → écartement aéré (≠ stab serré de house), mais
  // jouable d'une main (plus de split 2 octaves). Suit la commande OCTAVE.
  nuhouse: (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    const pm = n => ((n % 12) + 12) % 12;
    oct = oct || 0;
    const pcs = c.slice(1).map(pm);
    const floor = 60 + oct;
    let cl = pcs.map(pc => floor + pm(pc)).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]);
    if (cl.length >= 2) cl[1] += 12;   // aéré : 2e voix montée d'une octave (reste 1 main)
    return [vsort(cl)];
  },
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
  },
  // trance : anthème supersaw. Basse fondamentale (C3) + fondamentale doublée à
  // l'octave (corps), structure ouverte au-dessus, fondamentale RE-doublée tout en
  // haut (octave iconique brillante). Root-full, suit la commande OCTAVE. ABSOLUTE.
  // trance : grip ANTHEM 1 main — fondamentale + 3ce (+ 7e si présente) + fondamentale
  // doublée à l'octave au sommet (l'octave brillante iconique). Lâche la 5te sur les
  // accords de 7e (son "power" supersaw). Root-inclus, centré, suit la commande OCTAVE.
  trance: (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    oct = oct || 0;
    const pm = n => ((n % 12) + 12) % 12;
    const rootPc = pm(c[0]);
    let upperPc = c.slice(1).map(pm);
    if (upperPc.length >= 3) upperPc = upperPc.filter((_, i) => i !== 1);  // 7e+ : lâche la 5te
    const root = 48 + oct + rootPc;                             // fonda C3, l'octave au sommet recentre
    const cl = [root]; let cur = root;
    upperPc.forEach(pc => { let n = cur + 1 + pm(pc - pm(cur + 1)); cl.push(n); cur = n; });
    cl.push(root + 12);                                          // octave de fonda au sommet
    return [vsort(cl).slice(0, 6)];
  },
  // funk : grip "10e" root-inclus (soul/funk, Rhodes). Accord mappé dans l'octave C4
  // puis la 2e voix (la 3ce) montée d'une octave → la dixième caractéristique. 1 main,
  // tonique dans le registre. Suit la commande OCTAVE.
  funk: (c, oct) => {
    if (c.length < 3) return [vsort(c)];
    oct = oct || 0;
    const pm = n => ((n % 12) + 12) % 12;
    const floor = 60 + oct;
    let notes = c.map(n => floor + pm(n)).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]);
    if (notes.length >= 2) notes[1] += 12;                       // 2e voix +octave = la "10e"
    return [vsort(notes)];
  }
};
// Gabarits à structure stricte : jamais stabilisés (la stabilisation casserait l'invariant).
const STRUCT = new Set(['piano', 'rootlessa', 'rootlessb', 'drop2', 'drop3', 'house', 'prog', 'jazz', 'nuhouse', 'trap', 'trance', 'funk']);
// Gabarits à REGISTRE ABSOLU : la réalisation ignore l'octave/inversion d'entrée
// (basse posée dans une octave fixe). On ne leur applique donc PAS d'inversions —
// sinon on génère des candidats à mauvaise basse. Le voice leading se fait par le Selector.
const ABSOLUTE = new Set(['house', 'prog', 'jazz', 'nuhouse', 'trap', 'trance', 'funk']);

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
  if ((vc === 'rootlessa' || vc === 'rootlessb' || vc === 'jazz' || vc === 'nuhouse' || vc === 'house') && !spec.hasSeventh) { fallback = vc; vc = 'classic'; }
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
    // classic + VL off (rootPos) => position fondamentale stricte ; VL on => toutes
    // les inversions pour le lissage. ABSOLUTE => registre fixe, pas d'inversion. Voir decisions.md.
    const nInv = ABSOLUTE.has(vc) ? 1 : (vc === 'classic' && opts.rootPos ? 1 : spec.pcs.length);
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
