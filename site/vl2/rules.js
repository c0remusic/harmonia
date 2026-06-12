// rules.js — règles d'écriture transverses (registre grave, dominante).

// Low interval limits pragmatiques : un intervalle ≤ iv est interdit si la note
// BASSE de la paire est sous min. (Constantes à affiner au banc.)
const LOW_LIMITS = [ { iv: 2, min: 50 }, { iv: 4, min: 48 }, { iv: 6, min: 41 } ];

export function lowIntervalViolations(notes) {
  const r = [...notes].sort((a, b) => a - b), v = [];
  for (let i = 0; i < r.length - 1; i++) {
    const iv = r[i + 1] - r[i];
    for (const L of LOW_LIMITS) {
      if (iv <= L.iv && r[i] < L.min) { v.push(iv + 'st@' + r[i]); break; }
    }
  }
  return v;
}

// Pc de la 3ce d'une dominante (à ne JAMAIS doubler), sinon null.
export function dominantThirdPc(spec) {
  if (!spec.isDominant) return null;
  const t = spec.pcs.find(p => p.role === 'third');
  return t ? t.pc : null;
}
