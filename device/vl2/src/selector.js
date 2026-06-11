// selector.js — Moteur B : le MOUVEMENT. Choisit, parmi les candidates du
// Realizer, la réalisation qui bouge le plus naturellement depuis l'état courant.
// Coût PAR VOIX + conscience harmonique + modes ANCHOR/FLOW.

const mod = n => ((n % 12) + 12) % 12;
const vsort = a => [...a].sort((x, y) => x - y);
const mean = ns => ns.reduce((a, b) => a + b, 0) / ns.length;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Poids (point de départ — réglés au banc puis à l'oreille, cf. spec §2b).
export const W = {
  move: 1, leapOver: 4, leapFactor: 0.6,
  common: -7, commonPc: -2,
  soprano: 2.5, bass: 1.2, bassFreeLeaps: [5, 7, 12],
  parallel: 10, spacingGap: 0.8, countDiff: 6,
  contrary: -1.5, spring: 0.04, recall: -6,
  window: 10, outOfWindow: 50,
  tendency: -5, chromatic: -3
};

// Coût de mouvement prev -> cand (appariement par index trié grave→aigu).
export function movementCost(prev, cand, explain, ctx) {
  const a = vsort(prev), b = vsort(cand);
  const n = Math.min(a.length, b.length);
  let tot = Math.abs(a.length - b.length) * W.countDiff;
  let commons = 0;
  for (let i = 0; i < n; i++) {
    const isTop = i === n - 1, isBass = i === 0;
    const d = Math.abs(b[i] - a[i]);
    const w = W.move * (isTop ? W.soprano : isBass ? W.bass : 1);
    tot += d * w;
    const freeBass = isBass && W.bassFreeLeaps.includes(d);
    if (d > W.leapOver && !freeBass) tot += (d - W.leapOver) * W.leapFactor * (isTop ? W.soprano : 1);
    if (a[i] === b[i]) { tot += W.common; commons++; }
    else if (mod(a[i]) === mod(b[i])) tot += W.commonPc;
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

  // V7 -> I (fondamentales à une quinte) : la 7e (note tendancielle) disparaît
  // au profit de la 3ce de I → résolution lisse. Détection au niveau pitch-class
  // (le revoicing réordonne les voix → l'index ne suffit pas).
  const isVtoI = prevSpec.isDominant && mod(prevSpec.rootPc - spec.rootPc) === 7;
  if (isVtoI) {
    const sev = prevSpec.pcs.find(p => p.role === 'seventh');
    const thi = spec.pcs.find(p => p.role === 'third');
    const apcs = new Set(a.map(mod)), bpcs = new Set(b.map(mod));
    if (sev && thi && apcs.has(sev.pc) && bpcs.has(thi.pc) && !bpcs.has(sev.pc)) {
      bonus += W.tendency; explain.push('résolution 7→3');
    }
  }
  // lignes chromatiques : voix bougeant d'exactement ±1 (cap 2)
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
    const notes = [...st.recall.get(key)];
    st.voices = [...notes];
    return { notes, explain: ['recall-lock'], cost: 0 };
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
        if (rc && same(rc, c.notes)) { cost += W.recall; ex.push('recall'); }
      }
    }
    if (cost < bestC) { bestC = cost; best = c; bestEx = ex; }
  }
  st.voices = [...best.notes];
  st.recall.set(key, [...best.notes]);
  return { notes: [...best.notes], explain: bestEx, cost: bestC, voicing: best.voicing, fallback: best.fallback };
}
