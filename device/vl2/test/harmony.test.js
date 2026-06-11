import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harmonicBonus } from '../src/selector.js';
import { buildSpec } from '../src/chordspec.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const G7 = buildSpec({ fn: 'seven', degree: 4, rootPc: 0, scaleArr: MAJOR });
const C = buildSpec({ fn: 'triad', degree: 0, rootPc: 0, scaleArr: MAJOR });

test('V7→I : la 7e qui résout vers la 3ce est récompensée', () => {
  // prev G7 = G B D F. good résout (E présent, F absent) ; bad garde F (pas de résolution).
  const good = harmonicBonus([55, 59, 62, 65], [55, 60, 64, 67], { prevSpec: G7, spec: C }, []); // G C E G
  const bad  = harmonicBonus([55, 59, 62, 65], [60, 65, 69, 72], { prevSpec: G7, spec: C }, []); // C F A C (F reste)
  assert.ok(good < bad);
});
test('mouvement chromatique demi-ton récompensé', () => {
  const semi = harmonicBonus([60, 64, 67], [60, 63, 67], { prevSpec: C, spec: C }, []);
  const none = harmonicBonus([60, 64, 67], [60, 67, 72], { prevSpec: C, spec: C }, []);
  assert.ok(semi < none);
});
test('sans contexte : 0', () => {
  assert.equal(harmonicBonus([60], [60], {}, []), 0);
});
