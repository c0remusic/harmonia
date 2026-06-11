import { test } from 'node:test';
import assert from 'node:assert/strict';
import { movementCost, W } from '../src/selector.js';

test('notes communes : bonus (coût négatif vs mouvement nul)', () => {
  const c = movementCost([60, 64, 67], [60, 64, 67], [], {});
  assert.ok(c < 0, 'tout-commun doit être négatif: ' + c);
});
test('la soprano pèse plus que les voix internes', () => {
  const inner = movementCost([60, 64, 67], [60, 65, 67], [], {});  // alto bouge de 1
  const top   = movementCost([60, 64, 67], [60, 64, 68], [], {});  // soprano bouge de 1
  assert.ok(top > inner);
});
test('quintes parallèles pénalisées', () => {
  const par   = movementCost([60, 67], [62, 69], [], {});  // 5te -> 5te parallèle
  const nopar = movementCost([60, 67], [62, 67], [], {});
  assert.ok(par > nopar + W.parallel - 1);
});
test('différence de nombre de voix pénalisée', () => {
  const same = movementCost([60, 64, 67], [60, 64, 67], [], {});
  const diff = movementCost([60, 64, 67], [60, 64, 67, 71], [], {});
  assert.ok(diff > same);
});
