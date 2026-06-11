import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lowIntervalViolations, dominantThirdPc } from '../src/rules.js';
import { buildSpec } from '../src/chordspec.js';
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

test('tierce mineure sous E2 = violation ; au-dessus de C3 = OK', () => {
  assert.equal(lowIntervalViolations([40, 43]).length, 1);   // m3 sur E2
  assert.equal(lowIntervalViolations([48, 51]).length, 0);   // m3 sur C3
});
test('quinte grave OK', () => {
  assert.equal(lowIntervalViolations([36, 43]).length, 0);
});
test('dominantThirdPc : B sur G7, null sur CM7', () => {
  assert.equal(dominantThirdPc(buildSpec({ fn: 'seven', degree: 4, rootPc: 0, scaleArr: MAJOR })), 11);
  assert.equal(dominantThirdPc(buildSpec({ fn: 'seven', degree: 0, rootPc: 0, scaleArr: MAJOR })), null);
});
