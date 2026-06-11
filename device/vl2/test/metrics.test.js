import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metrics, loopStable } from '../bench/metrics.js';

test('metrics compte mouvement, communes, parallèles', () => {
  const m = metrics([[60, 64, 67], [60, 65, 69]]);
  assert.equal(m.totalMove, 3);
  assert.equal(m.commonPct, 33);
});
test('loopStable', () => {
  assert.ok(loopStable([[[60]], [[60]]]));
  assert.ok(!loopStable([[[60]], [[61]]]));
});
