// identity.js — invariants par voicing. checkIdentity renvoie la liste des
// violations (vide = conforme). C'est ce qui GARANTIT l'identité d'un voicing :
// le Selector ne verra que des réalisations qui passent ce filtre.

const mod = n => ((n % 12) + 12) % 12;
const span = ns => Math.max(...ns) - Math.min(...ns);

export function checkIdentity(voicing, notes, spec) {
  const v = [];
  const ns = [...notes].sort((a, b) => a - b);
  const pcs = new Set(ns.map(mod));
  const has = role => { const e = spec.pcs.find(p => p.role === role); return e && pcs.has(e.pc); };

  // Garde-fou global : guide tones présents sur les accords de 7e
  if (spec.hasSeventh) {
    if (!has('seventh')) v.push('guide:7e absente');
    if (spec.pcs.some(p => p.role === 'third') && !has('third')) v.push('guide:3ce absente');
  }

  switch (voicing) {
    case 'rootlessa': case 'rootlessb': case 'jazz': case 'nuhouse':
      if (pcs.has(spec.rootPc)) v.push('rootless:fondamentale présente');
      break;
    case 'drop2': case 'drop3': {
      if (ns.length < 4) { v.push('dropN:<4 voix'); break; }
      const lifted = [ns[0] + 12, ...ns.slice(1)].sort((a, b) => a - b);
      let maxGap = 0;
      for (let i = 0; i < lifted.length - 1; i++) maxGap = Math.max(maxGap, lifted[i + 1] - lifted[i]);
      if (maxGap > 12) { v.push('dropN:base non-close'); break; }   // pas de trou d'octave = vrai close stack
      const fromTop = lifted.length - 1 - lifted.indexOf(ns[0] + 12);
      if (voicing === 'drop2' && fromTop !== 1) v.push('drop2:voix abaissée ≠ 2e du haut');
      if (voicing === 'drop3' && fromTop !== 2) v.push('drop3:voix abaissée ≠ 3e du haut');
      break;
    }
    case 'house':
      // deep-house / french-touch stab : basse = fondamentale, structure sup. ROOTLESS (brillante)
      if (mod(ns[0]) !== spec.rootPc) v.push('house:basse ≠ fondamentale');
      if (ns.filter(n => mod(n) === spec.rootPc).length > 1) v.push('house:fondamentale doublée (sup. doit être rootless)');
      break;
    case 'trap':
      if (mod(ns[0]) !== spec.rootPc) v.push('trap:basse ≠ fondamentale');
      if (ns.filter(n => mod(n) === spec.rootPc).length > 1) v.push('trap:fondamentale doublée');
      break;
    case 'piano': {
      if (mod(ns[0]) !== spec.rootPc) v.push('piano:basse ≠ fondamentale');
      const rh = ns.slice(1);
      if (rh.length && span(rh) > 12) v.push('piano:MD > 1 octave');
      break;
    }
    case 'prog':
      if (ns.length >= 2 && ns[1] - ns[0] < 7) v.push('prog:basse non détachée');
      break;
  }
  return v;
}
