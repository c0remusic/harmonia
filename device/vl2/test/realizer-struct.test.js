import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realize } from '../src/realizer.js';
import { buildSpec } from '../src/chordspec.js';
import { checkIdentity } from '../src/identity.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const Dm7 = buildSpec({ fn: 'seven', degree: 1, rootPc: 0, scaleArr: MAJOR });
const C = buildSpec({ fn: 'triad', degree: 0, rootPc: 0, scaleArr: MAJOR });

test('drop2/drop3/rootless/piano : zéro violation sur toutes les candidates', () => {
  for (const v of ['drop2', 'drop3', 'rootlessa', 'rootlessb', 'piano'])
    for (const k of realize(Dm7, v, { center: 60 }))
      assert.deepEqual(checkIdentity(k.voicing, k.notes, Dm7), [], v);
});
test('rootless sur TRIADE : fallback explicite, jamais vide', () => {
  const c = realize(C, 'rootlessa', { center: 60 });
  assert.ok(c.length > 0);
  assert.ok(c.every(k => k.fallback === 'rootlessa' && k.voicing === 'classic'));
});
test('drop2 sur triade : fallback défini', () => {
  const c = realize(C, 'drop2', { center: 60 });
  assert.ok(c.length > 0 && c.every(k => k.fallback !== null));
});
test('matrice complète : chaque voicing × chaque fn → candidates non vides + identité 0', () => {
  const FNS = ['triad', 'seven', 'nine', 'add9', 'sus2', 'sus4', 'six', 'sixnine', 'sevensus4', 'mmaj7', 'm7s5'];
  const VOICINGS = ['classic', 'piano', 'open', 'spread', 'house', 'prog', 'rootlessa', 'rootlessb', 'drop2', 'drop3'];
  for (const fn of FNS) for (const d of [0, 1, 4]) {
    let spec;
    try { spec = buildSpec({ fn, degree: d, rootPc: 0, scaleArr: MAJOR }); } catch { continue; }
    for (const v of VOICINGS) {
      const c = realize(spec, v, { center: 60 });
      assert.ok(c.length > 0, `vide: ${v} × ${fn} deg ${d}`);
      for (const k of c) assert.deepEqual(checkIdentity(k.voicing, k.notes, spec), [], `${v} × ${fn} deg ${d}`);
    }
  }
});
