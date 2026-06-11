import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS } from '../src/chordspec.js';

test('le module charge et expose STEPS', () => {
  assert.equal(STEPS.triad.length, 3);
});
