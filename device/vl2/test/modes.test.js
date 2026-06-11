import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, resetState, select } from '../src/selector.js';
import { realize } from '../src/realizer.js';
import { buildSpec, specKey } from '../src/chordspec.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const spec = d => buildSpec({ fn: 'seven', degree: d, rootPc: 0, scaleArr: MAJOR });
const play = (st, s, mode) =>
  select(realize(s, 'classic', { center: 60 }), st, { mode, center: 60, key: specKey(s), spec: s }).notes;

test('ANCHOR : boucle A-B-C-D identique à chaque passage (verrou)', () => {
  const st = createState();
  const seq = [0, 5, 3, 4].map(spec);
  const pass1 = seq.map(s => play(st, s, 'anchor'));
  const pass2 = seq.map(s => play(st, s, 'anchor'));
  assert.deepEqual(pass2, pass1);
});
test('ANCHOR : le wrap (dernier accord) ne déforme pas le premier', () => {
  const st = createState();
  const A = spec(0), D = spec(4);
  const a1 = play(st, A, 'anchor');
  play(st, D, 'anchor');
  assert.deepEqual(play(st, A, 'anchor'), a1);
});
test('reset → ré-ancrage : premier accord proche du centre', () => {
  const st = createState();
  const n = play(st, spec(0), 'anchor');
  const mean = n.reduce((x, y) => x + y, 0) / n.length;
  assert.ok(Math.abs(mean - 60) <= 12, 'mean=' + mean);
  resetState(st);
  assert.equal(st.voices, null);
});
test('FLOW : vamp 2 accords converge (cycle limite, pas de flip-flop)', () => {
  const st = createState();
  const A = spec(5), B = spec(4);
  const hist = [];
  for (let i = 0; i < 6; i++) hist.push([play(st, A, 'flow'), play(st, B, 'flow')]);
  assert.deepEqual(hist[5], hist[4]);
});
test('FLOW : dérive bornée sur longue chaîne (ressort)', () => {
  const st = createState();
  let last;
  for (let i = 0; i < 40; i++) last = play(st, spec(i % 7), 'flow');
  const mean = last.reduce((x, y) => x + y, 0) / last.length;
  assert.ok(Math.abs(mean - 60) <= 19, 'dérive: mean=' + mean);
});
