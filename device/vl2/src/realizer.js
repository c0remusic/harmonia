// realizer.js — Moteur A : l'IDENTITÉ. Produit des réalisations CANDIDATES d'un
// spec selon un voicing, toutes conformes à l'identité (checkIdentity) et aux
// règles de registre (lowIntervalViolations). Le Selector choisira parmi elles.

import { checkIdentity } from './identity.js';
import { lowIntervalViolations, dominantThirdPc } from './rules.js';

const mod = n => ((n % 12) + 12) % 12;
const ROLE_ORDER = ['root', 'sus', 'third', 'fifth', 'sixth', 'seventh', 'ninth'];
const vsort = a => [...a].sort((x, y) => x - y);

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
  house:   c => c.length < 3 ? [c] : [vsort([...c, c[0] + 12])],
  prog:    c => {
    if (c.length < 3) return [c];
    const r = [c[0] - 12, c[0]];
    if (c.length >= 3) r.push(c[2]);
    r.push(c[1] + 12);
    for (let i = 3; i < c.length; i++) r.push(c[i] + 12);
    if (c.length === 3) r.push(c[2] + 12);
    return [vsort(r).slice(0, 6)];
  },
  piano:     c => c.length < 3 ? [c] : [[c[0] - 12, ...c.slice(1)]],
  rootlessa: c => c.length < 3 ? [c] : [c.slice(1)],
  rootlessb: c => {
    if (c.length < 3) return [c];
    const u = c.slice(1), k = Math.ceil(u.length / 2);
    return [vsort([...u.slice(k), ...u.slice(0, k).map(n => n + 12)])];
  },
  drop2: c => { const r = vsort(c); r[r.length - 2] -= 12; return [vsort(r)]; },
  drop3: c => { const r = vsort(c); r[r.length - 3] -= 12; return [vsort(r)]; }
};
// Gabarits à structure stricte : jamais stabilisés (la stabilisation casserait l'invariant).
const STRUCT = new Set(['piano', 'rootlessa', 'rootlessb', 'drop2', 'drop3']);

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
  if ((vc === 'rootlessa' || vc === 'rootlessb') && !spec.hasSeventh) { fallback = vc; vc = 'classic'; }
  if (vc === 'drop3' && spec.pcs.length < 4) { fallback = vc; vc = 'drop2'; }
  if (vc === 'drop2' && spec.pcs.length < 4) { fallback = fallback || vc; vc = 'classic'; }

  // Inversions : monter la note la plus basse d'une octave. Indispensable au
  // voice leading — c'est ce qui permet de TENIR les notes communes.
  const rotateUp = arr => { const r = vsort(arr); r.push(r.shift() + 12); return vsort(r); };

  const seen = new Set(), out = [];
  for (let oct = -2; oct <= 2; oct++) {
    const base = 48 + oct * 12;
    const rootMidi = base + mod(spec.rootPc - mod(base));
    let inv = closeFrom(spec, rootMidi);
    for (let k = 0; k < spec.pcs.length; k++) {            // toutes les inversions
      for (const shape of T[vc](inv)) {
        let notes = (want != null && !STRUCT.has(vc)) ? stabilize(shape, spec, want) : vsort(shape).slice(0, 6);
        if (Math.min(...notes) < 24 || Math.max(...notes) > 108) continue;
        if (checkIdentity(vc, notes, spec).length) continue;
        if (lowIntervalViolations(notes).length) continue;
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
