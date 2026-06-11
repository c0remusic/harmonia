// selector.js — Moteur B : le MOUVEMENT. Choisit, parmi les candidates du
// Realizer, la réalisation qui bouge le plus naturellement depuis l'état courant.
// Coût PAR VOIX + conscience harmonique + modes ANCHOR/FLOW.

const mod = n => ((n % 12) + 12) % 12;
const vsort = a => [...a].sort((x, y) => x - y);
const mean = ns => ns.reduce((a, b) => a + b, 0) / ns.length;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Poids (point de départ — réglés au banc puis à l'oreille, cf. spec §2b).
// W calibrés sur 382 chorals Bach (33 128 transitions) :
//   soprano/basse ratio corpus = 2.07× → W.soprano/W.bass = 2.2/1.2 ≈ 1.83 (basse intentionnellement plus libre)
//   sauts soprano >4st = 4.6% → leapFactor 0.7 ; croisements corpus = 0.000 → crossing 12.
export const W = {
  move: 1, leapOver: 4, leapFactor: 0.7,
  common: -7, commonPc: -2,
  soprano: 2.2, bass: 1.2, bassFreeLeaps: [5, 7, 12],
  parallel: 10, spacingGap: 0.8, countDiff: 6,
  contrary: -1.5, spring: 0.04, recall: -6,
  window: 10, outOfWindow: 50,
  tendency: -5, chromatic: -3,
  crossing: 12   // Bach = 0 croisements sur 33k transitions → pénalité ferme
};

// Coût de mouvement prev -> cand (appariement par index trié grave→aigu).
export function movementCost(prev, cand, explain, ctx) {
  const a = vsort(prev), b = vsort(cand);
  const n = Math.min(a.length, b.length);
  let tot = Math.abs(a.length - b.length) * W.countDiff;
  // Notes communes TENUES : par ensemble de notes (pas par index — une tenue
  // peut se retrouver à une position différente après revoicing).
  const bSet = new Set(b);
  let commons = 0;
  for (const x of a) if (bSet.has(x)) { tot += W.common; commons++; }
  // Distance de mouvement (appariement par index trié, soprano/basse pondérées).
  for (let i = 0; i < n; i++) {
    const isTop = i === n - 1, isBass = i === 0;
    const d = Math.abs(b[i] - a[i]);
    if (d === 0) continue;                                 // tenue déjà bonifiée ci-dessus
    const w = W.move * (isTop ? W.soprano : isBass ? W.bass : 1);
    tot += d * w;
    const freeBass = isBass && W.bassFreeLeaps.includes(d);
    if (d > W.leapOver && !freeBass) tot += (d - W.leapOver) * W.leapFactor * (isTop ? W.soprano : 1);
    if (mod(a[i]) === mod(b[i])) tot += W.commonPc;
  }
  for (let j = 0; j < n - 1; j++) {
    const i1 = mod(a[j + 1] - a[j]), i2 = mod(b[j + 1] - b[j]);
    if (i1 === i2 && (i1 === 0 || i1 === 7) && a[j] !== b[j]) tot += W.parallel;
  }
  for (let j = 1; j < b.length - 1; j++)
    if (b[j + 1] - b[j] > 12) tot += (b[j + 1] - b[j] - 12) * W.spacingGap;
  if (n >= 2) {
    const db = b[0] - a[0], dt = b[n - 1] - a[n - 1];
    if (db !== 0 && dt !== 0 && Math.sign(db) !== Math.sign(dt)) tot += W.contrary;
  }
  // Croisement de voix (heuristique) : si permuter deux voix adjacentes coûterait
  // moins cher que l'appariement direct (trié→trié), c'est que les voix se croisent.
  let crosses = 0;
  for (let i = 0; i < n - 1; i++) {
    const direct = Math.abs(b[i] - a[i]) + Math.abs(b[i + 1] - a[i + 1]);
    const swap   = Math.abs(b[i + 1] - a[i]) + Math.abs(b[i] - a[i + 1]);
    if (swap < direct) crosses++;
  }
  if (crosses) { tot += crosses * W.crossing; explain.push('crossing×' + crosses); }
  if (commons) explain.push('communes:' + commons);
  return tot;
}

// Bonus (négatifs) de contexte harmonique — spec §2b.
export function harmonicBonus(prev, cand, opts, explain) {
  const { prevSpec, spec } = opts;
  if (!prevSpec || !spec || !prev || !prev.length) return 0;
  const a = vsort(prev), b = vsort(cand);
  const n = Math.min(a.length, b.length);
  let bonus = 0, chrom = 0;

  const apcs = new Set(a.map(mod)), bpcs = new Set(b.map(mod));

  // Résolutions de triton — tout accord dominant (pas seulement V→I).
  // La 3ce majeure (sensible) doit monter d'un demi-ton ; la 7e mineure descendre.
  if (prevSpec.isDominant) {
    const tri3 = prevSpec.pcs.find(p => p.role === 'third');
    const tri7 = prevSpec.pcs.find(p => p.role === 'seventh');
    if (tri3 && apcs.has(tri3.pc) && bpcs.has(mod(tri3.pc + 1))) {
      bonus += W.tendency; explain.push('triton:3↑');
    }
    if (tri7 && apcs.has(tri7.pc) && bpcs.has(mod(tri7.pc - 1))) {
      bonus += W.tendency; explain.push('triton:7↓');
    }
    // V7→I : la 7e disparaît au profit de la 3ce de I (résolution classique).
    if (mod(prevSpec.rootPc - spec.rootPc) === 7) {
      const sev = tri7, thi = spec.pcs.find(p => p.role === 'third');
      if (sev && thi && apcs.has(sev.pc) && bpcs.has(thi.pc) && !bpcs.has(sev.pc)) {
        bonus += W.tendency; explain.push('V7→I:7→3');
      }
    }
  }
  // Lignes chromatiques : voix bougeant d'exactement ±1 (cap 2).
  for (let i = 0; i < n && chrom < 2; i++)
    if (Math.abs(b[i] - a[i]) === 1) { bonus += W.chromatic; chrom++; }
  if (chrom) explain.push('chromatique×' + chrom);
  return bonus;
}

export function createState() { return { voices: null, recall: new Map() }; }
export function resetState(st) { st.voices = null; st.recall.clear(); }

// opts: { mode:'anchor'|'flow', center, key, spec, prevSpec }
export function select(candidates, st, opts) {
  const { mode, center, key } = opts;

  // ANCHOR : verrou dur — un accord déjà réalisé ressort tel quel (le wrap de
  // boucle ne re-dérive jamais ; stabilité par récurrence).
  if (mode === 'anchor' && st.recall.has(key)) {
    const stored = st.recall.get(key);
    st.voices = [...stored.notes];
    return { notes: [...stored.notes], explain: ['recall-lock'], cost: 0, voicing: stored.voicing, fallback: stored.fallback };
  }

  const first = st.voices === null;
  let best = null, bestC = Infinity, bestEx = null;
  for (const c of candidates) {
    const ex = [];
    let cost;
    if (first) {
      cost = Math.abs(mean(c.notes) - center);   // ancre unique : seul le 1er accord vise le centre
      ex.push('anchor');
    } else {
      cost = movementCost(st.voices, c.notes, ex, opts);
      cost += harmonicBonus(st.voices, c.notes, opts, ex);
      if (mode === 'flow') {
        const dev = Math.abs(mean(c.notes) - center);
        cost += W.spring * dev * dev;                                  // centrage doux (tie-break)
        if (dev > W.window) cost += W.outOfWindow * (dev - W.window);  // fenêtre : force le repli d'octave (anti-rochet)
        const rc = st.recall.get(key);
        if (rc && same(rc.notes, c.notes)) { cost += W.recall; ex.push('recall'); }
      }
    }
    if (cost < bestC) { bestC = cost; best = c; bestEx = ex; }
  }
  st.voices = [...best.notes];
  if (st.recall.size > 64) st.recall.delete(st.recall.keys().next().value);
  st.recall.set(key, { notes: [...best.notes], voicing: best.voicing, fallback: best.fallback });
  return { notes: [...best.notes], explain: bestEx, cost: bestC, voicing: best.voicing, fallback: best.fallback };
}
