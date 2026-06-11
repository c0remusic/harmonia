import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkIdentity } from '../src/identity.js';
import { buildSpec } from '../src/chordspec.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const Dm7 = buildSpec({ fn: 'seven', degree: 1, rootPc: 0, scaleArr: MAJOR }); // D F A C, root pc 2

test('rootless : présence de la fondamentale = violation', () => {
  assert.ok(checkIdentity('rootlessa', [62, 65, 69, 72], Dm7).length > 0); // 62 = D = root
});
test('rootless valide sans fondamentale (3 et 7 présentes)', () => {
  assert.equal(checkIdentity('rootlessa', [65, 69, 72], Dm7).length, 0);   // F A C
});
test('drop2 : vraie forme drop2 OK, close = violation', () => {
  assert.equal(checkIdentity('drop2', [57, 62, 65, 72], Dm7).length, 0);   // A3 D4 F4 C5
  assert.ok(checkIdentity('drop2', [62, 65, 69, 72], Dm7).length > 0);     // close
});
test('piano : basse = fondamentale, MD ≤ 1 octave', () => {
  assert.equal(checkIdentity('piano', [38, 62, 65, 72], Dm7).length, 0);   // D2 + D4 F4 C5
  assert.ok(checkIdentity('piano', [41, 62, 65, 72], Dm7).length > 0);     // basse F
});
test('guide tones : 7e absente sur un accord de 7e = violation', () => {
  assert.ok(checkIdentity('classic', [62, 65, 69], Dm7).some(v => v.includes('7'))); // D F A, pas de C
});
