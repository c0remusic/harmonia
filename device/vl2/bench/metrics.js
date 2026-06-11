// metrics.js — mesures objectives sur une séquence d'accords réalisés.
const mod = n => ((n % 12) + 12) % 12;
const vs = a => [...a].sort((x, y) => x - y);

// seq = [[notes accord 1], [notes accord 2], ...]
export function metrics(seq) {
  let move = 0, sopMax = 0, commons = 0, pairs = 0, parallels = 0;
  for (let i = 1; i < seq.length; i++) {
    const a = vs(seq[i - 1]), b = vs(seq[i]);
    const n = Math.min(a.length, b.length);
    const bSet = new Set(b);
    for (const x of a) if (bSet.has(x)) commons++;   // tenues par ensemble de notes
    for (let j = 0; j < n; j++) {
      move += Math.abs(b[j] - a[j]);
      pairs++;
    }
    sopMax = Math.max(sopMax, Math.abs(b[n - 1] - a[n - 1]));
    for (let j = 0; j < n - 1; j++) {
      const i1 = mod(a[j + 1] - a[j]), i2 = mod(b[j + 1] - b[j]);
      if (i1 === i2 && (i1 === 0 || i1 === 7) && a[j] !== b[j]) parallels++;
    }
  }
  return {
    totalMove: move,
    sopranoMaxJump: sopMax,
    commonPct: pairs ? Math.round(100 * commons / pairs) : 0,
    parallels
  };
}

export function loopStable(passes) {           // passes = [seq, seq, ...]
  return passes.every(p => JSON.stringify(p) === JSON.stringify(passes[0]));
}
