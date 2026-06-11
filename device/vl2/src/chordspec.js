// chordspec.js — QUOI jouer : pitch classes + rôles harmoniques (sans octaves).
// Source de vérité des intervalles : miroir de device/chord_engine.js (STEPS/gridLabel).

export const STEPS = {
  triad: [0, 2, 4], seven: [0, 2, 4, 6], nine: [0, 2, 4, 6, 8], add9: [0, 2, 4, 8],
  sus2: [0, 1, 4], sus4: [0, 3, 4], six: [0, 2, 4, 5], sixnine: [0, 2, 4, 5, 8],
  sevensus4: [0, 3, 4, 6], mmaj7: [0, 2, 4, 6], sevenflat9: [0, 2, 4, 6, 8],
  sevensharp9: [0, 2, 4, 6, 8], m7s5: [0, 2, 4, 6]
};

const STEP_ROLE = { 0: 'root', 1: 'sus', 2: 'third', 3: 'sus', 4: 'fifth', 5: 'sixth', 6: 'seventh', 8: 'ninth' };
const mod = n => ((n % 12) + 12) % 12;

// Spec = QUOI jouer : pitch classes + rôles. Pas d'octaves ici (affaire du Realizer).
export function buildSpec({ fn, degree, rootPc, scaleArr }) {
  const steps = STEPS[fn];
  if (!steps) throw new Error('fn inconnu: ' + fn);
  const pcs = steps.map(s => ({
    pc: mod(rootPc + scaleArr[(degree + s) % 7]),
    role: STEP_ROLE[s]
  }));
  if (fn === 'm7s5') pcs[2].pc = mod(pcs[2].pc + 1);   // quinte augmentée (cf. moteur v1)
  // sevenflat9/sevensharp9 : la gamme fournit déjà l'altération (le chord n'est valide
  // que quand le degré produit naturellement le b9 ou #9 — pas de correction chromatique ici.
  const root = pcs[0].pc;
  const iv = p => mod(p.pc - root);
  return {
    pcs, rootPc: root, fn, degree,
    hasSeventh: pcs.some(p => p.role === 'seventh'),
    isDominant: pcs.some(p => p.role === 'third' && iv(p) === 4)
             && pcs.some(p => p.role === 'seventh' && iv(p) === 10)
  };
}

// Accords empruntés (colorchord du moteur) : intervalles explicites.
export function buildColorSpec({ semis, type, keyRootPc }) {
  const IV = { min: [0, 3, 7], dim7: [0, 3, 6, 9], maj7: [0, 4, 7, 11], dom7: [0, 4, 7, 10], maj: [0, 4, 7] };
  const ROLES = ['root', 'third', 'fifth', 'seventh'];
  const ivs = IV[type] || IV.maj;
  const root = mod(keyRootPc + semis);
  return {
    pcs: ivs.map((v, i) => ({ pc: mod(root + v), role: ROLES[i] })),
    rootPc: root, fn: 'color', degree: semis,
    hasSeventh: ivs.length > 3, isDominant: type === 'dom7'
  };
}

export function specKey(s) { return s.fn + ':' + s.degree + ':' + s.pcs.map(p => p.pc).join('.'); }
