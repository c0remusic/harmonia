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
    // keyOct  : octave courante (entier, 0=défaut).
    // keyRoot : tonique de la gamme (0-11, 0=C).
    // rootPos : true = VL off (position fondamentale stricte, pas de mémoire).
    play(spec, voicing, { mode = 'flow', keyOct = 0, keyRoot = 0, targetVoices, rootPos = false } = {}) {
      // regBase : plancher de l'octave, multiple de 12 (48=C3 à oct0, 36=C2 à oct-1…).
      // tonicPos : root MIDI de la tonique dans ce registre (= regBase + keyRoot).
      // selCtr   : centre de gravité du sélecteur — tonique pour classic, C-ancré sinon.
      const regBase = 48 + Math.max(-12, Math.min(24, keyOct * 12));
      const selCtr = (voicing === 'classic') ? (regBase + keyRoot) : (60 + keyOct * 12);
      const cands = realize(spec, voicing, { regBase, targetVoices, rootPos, keyRoot });
      if (!cands.length) return { notes: [], explain: ['no-candidates'], voicing, fallback: null };
      const key = specKey(spec) + '|' + voicing + '|' + selCtr;
      const r = select(cands, st, { mode, center: selCtr, key, voicing, spec, prevSpec });
      prevSpec = spec;
      return r;
    }
  };
}
