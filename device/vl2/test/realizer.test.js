import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realize, closeFrom } from '../src/realizer.js';
import { buildSpec } from '../src/chordspec.js';
import { checkIdentity } from '../src/identity.js';
import { lowIntervalViolations } from '../src/rules.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const G7 = buildSpec({ fn: 'seven', degree: 4, rootPc: 0, scaleArr: MAJOR });

test('closeFrom empile les rôles en montant', () => {
  assert.deepEqual(closeFrom(G7, 55), [55, 59, 62, 65]);  // G3 B3 D4 F4
});
test('realize classic : ≥3 candidates, toutes saines', () => {
  const c = realize(G7, 'classic', { center: 60 });
  assert.ok(c.length >= 3);
  for (const k of c) {
    assert.equal(checkIdentity('classic', k.notes, G7).length, 0);
    assert.equal(lowIntervalViolations(k.notes).length, 0);
    assert.ok(k.notes.length <= 6);
  }
});
test('realize house : basse=fondamentale, structure supérieure rootless', () => {
  const mod = n => ((n % 12) + 12) % 12;
  const c = realize(G7, 'house', { center: 60 });
  assert.ok(c.length > 0);
  for (const k of c) {
    assert.equal(checkIdentity('house', k.notes, G7).length, 0);
    assert.equal(mod(k.notes[0]), G7.rootPc);                                  // basse = fondamentale
    assert.equal(k.notes.filter(n => mod(n) === G7.rootPc).length, 1);         // rootless au-dessus
  }
});
test('targetVoices stabilise le nombre de voix', () => {
  const triad = buildSpec({ fn: 'triad', degree: 0, rootPc: 0, scaleArr: MAJOR });
  const c = realize(triad, 'classic', { center: 60, targetVoices: 4 });
  assert.ok(c.length > 0);
  assert.ok(c.every(k => k.notes.length === 4));
});
