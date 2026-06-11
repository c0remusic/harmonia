// engine.js — façade publique du double moteur. reset() pour les resets
// structurels (Key/Scale/voicing/VL/octave), play(spec, voicing, opts) pour jouer.

import { realize } from './realizer.js';
import { select, createState, resetState } from './selector.js';
import { specKey } from './chordspec.js';

export function createEngine() {
  const st = createState();
  let prevSpec = null;
  return {
    reset() { resetState(st); prevSpec = null; },
    // spec -> { notes, explain, voicing, fallback }
    play(spec, voicing, { mode = 'flow', center = 60, targetVoices } = {}) {
      const cands = realize(spec, voicing, { center, targetVoices });
      if (!cands.length) return { notes: [], explain: ['no-candidates'], voicing, fallback: null };
      const r = select(cands, st, { mode, center, key: specKey(spec) + '|' + voicing, spec, prevSpec });
      prevSpec = spec;
      return r;
    }
  };
}
