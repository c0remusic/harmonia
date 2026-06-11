import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../src/engine.js';
import { buildSpec } from '../src/chordspec.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

test('play retourne ≤6 notes triées + explain ; reset ré-ancre', () => {
  const e = createEngine();
  const r = e.play(buildSpec({ fn: 'nine', degree: 1, rootPc: 0, scaleArr: MAJOR }), 'prog', { mode: 'flow', center: 60 });
  assert.ok(r.notes.length >= 3 && r.notes.length <= 6);
  assert.deepEqual(r.notes, [...r.notes].sort((a, b) => a - b));
  assert.ok(Array.isArray(r.explain));
  e.reset();
  const r2 = e.play(buildSpec({ fn: 'triad', degree: 0, rootPc: 0, scaleArr: MAJOR }), 'classic', { mode: 'anchor', center: 72 });
  const m = r2.notes.reduce((a, b) => a + b, 0) / r2.notes.length;
  assert.ok(Math.abs(m - 72) <= 12);   // l'octave (center) pilote l'ancre
});
test('déterminisme strict : deux engines, même séquence → mêmes notes', () => {
  const s = [0, 3, 4, 0].map(d => buildSpec({ fn: 'seven', degree: d, rootPc: 0, scaleArr: MAJOR }));
  const run = () => { const e = createEngine(); return s.map(x => e.play(x, 'piano', { mode: 'flow', center: 60 }).notes); };
  assert.deepEqual(run(), run());
});
