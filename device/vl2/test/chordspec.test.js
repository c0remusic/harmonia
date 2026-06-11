import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSpec, buildColorSpec, specKey } from '../src/chordspec.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

test('G7 (degré 4 en C majeur) : pcs et rôles corrects', () => {
  const s = buildSpec({ fn: 'seven', degree: 4, rootPc: 0, scaleArr: MAJOR });
  assert.deepEqual(s.pcs.map(p => p.pc), [7, 11, 2, 5]);            // G B D F
  assert.deepEqual(s.pcs.map(p => p.role), ['root', 'third', 'fifth', 'seventh']);
  assert.equal(s.rootPc, 7);
  assert.equal(s.isDominant, true);
  assert.equal(s.hasSeventh, true);
});

test('m7s5 : quinte augmentée (+1)', () => {
  const s = buildSpec({ fn: 'm7s5', degree: 2, rootPc: 0, scaleArr: MAJOR });
  assert.equal(s.pcs[2].pc, (MAJOR[(2 + 4) % 7] + 1) % 12);
});

test('colorchord dom7 : V/V en C = D7', () => {
  const s = buildColorSpec({ semis: 2, type: 'dom7', keyRootPc: 0 });
  assert.deepEqual(s.pcs.map(p => p.pc), [2, 6, 9, 0]);
  assert.equal(s.isDominant, true);
});

test('specKey stable et discriminant', () => {
  const a = buildSpec({ fn: 'triad', degree: 0, rootPc: 0, scaleArr: MAJOR });
  const b = buildSpec({ fn: 'triad', degree: 1, rootPc: 0, scaleArr: MAJOR });
  assert.notEqual(specKey(a), specKey(b));
  assert.equal(specKey(a), specKey(buildSpec({ fn: 'triad', degree: 0, rootPc: 0, scaleArr: MAJOR })));
});
