// selector.js — Moteur B : le MOUVEMENT. Choisit, parmi les candidates du
// Realizer, la réalisation qui bouge le plus naturellement depuis l'état courant.
// Coût PAR VOIX + conscience harmonique + modes ANCHOR/FLOW.

const mod = n => ((n % 12) + 12) % 12;
const vsort = a => [...a].sort((x, y) => x - y);
const mean = ns => ns.reduce((a, b) => a + b, 0) / ns.length;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// W_classical — calibrés sur 382 chorals Bach (33 128 transitions).
// Voicings avec fondamentale : classic, piano, open, spread.
//   soprano/basse ratio corpus = 2.07× → W.soprano/W.bass ≈ 1.83
//   sauts soprano >4st = 4.6% → leapFactor 0.7 ; croisements = 0.000 → crossing 12.
export const W = {
  move: 1, leapOver: 4, leapFactor: 0.7,
  common: -7, commonPc: -2,
  soprano: 2.2, bass: 1.2, bassFreeLeaps: [5, 7, 12],
  parallel: 10, spacingGap: 0.8, countDiff: 6,
  contrary: -1.5, spring: 0.04, recall: -6,
  window: 10, outOfWindow: 50,
  tendency: -5, chromatic: -3,
  crossing: 12
};

// W_jazz — voicings rootless/drop/prog/house (3-5 notes, pas de fondamentale).
// La voix grave est la 3ce ou la 7e (pas une basse harmonique) : sauts de 4te/5te
// ne sont pas "libres". Contrepoint moins strict, approches chromatiques valorisées.
export const W_jazz = {
  move: 1, leapOver: 4, leapFactor: 0.5,
  common: -7, commonPc: -2,
  soprano: 1.8, bass: 1.0, bassFreeLeaps: [],
  parallel: 4, spacingGap: 0.8, countDiff: 6,
  contrary: -1.5, spring: 0.04, recall: -6,
  window: 10, outOfWindow: 50,
  tendency: -5, chromatic: -5,
  crossing: 12
};

const JAZZ_VOICINGS = new Set(['rootlessa', 'rootlessb', 'drop2', 'drop3', 'house', 'jazz', 'nuhouse']);
export function pickW(voicing) { return JAZZ_VOICINGS.has(voicing) ? W_jazz : W; }

// Coût de mouvement prev -> cand (appariement par index trié grave→aigu).
// w = profil W sélectionné par pickW (passé via ctx.W).
export function movementCost(prev, cand, explain, ctx) {
  const w = (ctx && ctx.W) || W;
  const a = vsort(prev), b = vsort(cand);
  const n = Math.min(a.length, b.length);
  let tot = Math.abs(a.length - b.length) * w.countDiff;
  const bSet = new Set(b);
  let commons = 0;
  for (const x of a) if (bSet.has(x)) { tot += w.common; commons++; }
  for (let i = 0; i < n; i++) {
    const isTop = i === n - 1, isBass = i === 0;
    const d = Math.abs(b[i] - a[i]);
    if (d === 0) continue;
    const wv = w.move * (isTop ? w.soprano : isBass ? w.bass : 1);
    tot += d * wv;
    const freeBass = isBass && w.bassFreeLeaps.includes(d);
    if (d > w.leapOver && !freeBass) tot += (d - w.leapOver) * w.leapFactor * (isTop ? w.soprano : 1);
    if (mod(a[i]) === mod(b[i])) tot += w.commonPc;
  }
  for (let j = 0; j < n - 1; j++) {
    const i1 = mod(a[j + 1] - a[j]), i2 = mod(b[j + 1] - b[j]);
    if (i1 === i2 && (i1 === 0 || i1 === 7) && a[j] !== b[j]) tot += w.parallel;
  }
  for (let j = 1; j < b.length - 1; j++)
    if (b[j + 1] - b[j] > 12) tot += (b[j + 1] - b[j] - 12) * w.spacingGap;
  if (n >= 2) {
    const db = b[0] - a[0], dt = b[n - 1] - a[n - 1];
    if (db !== 0 && dt !== 0 && Math.sign(db) !== Math.sign(dt)) tot += w.contrary;
  }
  let crosses = 0;
  for (let i = 0; i < n - 1; i++) {
    const direct = Math.abs(b[i] - a[i]) + Math.abs(b[i + 1] - a[i + 1]);
    const swap   = Math.abs(b[i + 1] - a[i]) + Math.abs(b[i] - a[i + 1]);
    if (swap < direct) crosses++;
  }
  if (crosses) { tot += crosses * w.crossing; explain.push('crossing×' + crosses); }
  if (commons) explain.push('communes:' + commons);
  return tot;
}

// Bonus (négatifs) de contexte harmonique — spec §2b.
export function harmonicBonus(prev, cand, opts, explain) {
  const { prevSpec, spec } = opts;
  if (!prevSpec || !spec || !prev || !prev.length) return 0;
  const w = opts.W || W;
  const a = vsort(prev), b = vsort(cand);
  const n = Math.min(a.length, b.length);
  let bonus = 0, chrom = 0;

  const apcs = new Set(a.map(mod)), bpcs = new Set(b.map(mod));

  if (prevSpec.isDominant) {
    const tri3 = prevSpec.pcs.find(p => p.role === 'third');
    const tri7 = prevSpec.pcs.find(p => p.role === 'seventh');
    if (tri3 && apcs.has(tri3.pc) && bpcs.has(mod(tri3.pc + 1))) {
      bonus += w.tendency; explain.push('triton:3↑');
    }
    if (tri7 && apcs.has(tri7.pc) && bpcs.has(mod(tri7.pc - 1))) {
      bonus += w.tendency; explain.push('triton:7↓');
    }
    if (mod(prevSpec.rootPc - spec.rootPc) === 7) {
      const sev = tri7, thi = spec.pcs.find(p => p.role === 'third');
      if (sev && thi && apcs.has(sev.pc) && bpcs.has(thi.pc) && !bpcs.has(sev.pc)) {
        bonus += w.tendency; explain.push('V7→I:7→3');
      }
    }
  }
  for (let i = 0; i < n && chrom < 2; i++)
    if (Math.abs(b[i] - a[i]) === 1) { bonus += w.chromatic; chrom++; }
  if (chrom) explain.push('chromatique×' + chrom);
  return bonus;
}

export function createState() { return { voices: null, recall: new Map() }; }
export function resetState(st) { st.voices = null; st.recall.clear(); }

// opts: { mode:'anchor'|'flow', center, key, voicing, spec, prevSpec }
export function select(candidates, st, opts) {
  const { mode, center, key } = opts;
  opts.W = pickW(opts.voicing || '');

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
      cost = Math.abs(mean(c.notes) - center);
      ex.push('anchor');
    } else {
      cost = movementCost(st.voices, c.notes, ex, opts);
      cost += harmonicBonus(st.voices, c.notes, opts, ex);
      if (mode === 'flow') {
        const dev = Math.abs(mean(c.notes) - center);
        cost += opts.W.spring * dev * dev;
        if (dev > opts.W.window) cost += opts.W.outOfWindow * (dev - opts.W.window);
        const rc = st.recall.get(key);
        if (rc && same(rc.notes, c.notes)) { cost += opts.W.recall; ex.push('recall'); }
      }
    }
    if (cost < bestC) { bestC = cost; best = c; bestEx = ex; }
  }
  st.voices = [...best.notes];
  if (st.recall.size > 64) st.recall.delete(st.recall.keys().next().value);
  st.recall.set(key, { notes: [...best.notes], voicing: best.voicing, fallback: best.fallback });
  return { notes: [...best.notes], explain: bestEx, cost: bestC, voicing: best.voicing, fallback: best.fallback };
}
