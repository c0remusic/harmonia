// progressions.js — progressions de référence pour le banc.
import { buildSpec, buildColorSpec } from '../src/chordspec.js';
const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
const d = (fn, deg, scale = MAJ) => ({ spec: buildSpec({ fn, degree: deg, rootPc: 0, scaleArr: scale }) });
const col = (semis, type) => ({ spec: buildColorSpec({ semis, type, keyRootPc: 0 }) });

export const PROGRESSIONS = [
  { name: 'ii-V-I (C)',            seq: [d('seven', 1), d('seven', 4), d('seven', 0)] },
  { name: 'I-vi-IV-V (C)',         seq: [d('triad', 0), d('triad', 5), d('triad', 3), d('triad', 4)] },
  { name: 'i-VII-VI (Am nat)',     seq: [d('triad', 0, MIN), d('triad', 6, MIN), d('triad', 5, MIN)] },
  { name: 'IV-iv-I (chromatique)', seq: [d('triad', 3), col(5, 'min'), d('triad', 0)] },
  { name: 'vamp Am7-D7 (loop)',    loop: 4, seq: [d('seven', 5), col(2, 'dom7')] },
  { name: 'chaine 12 accords',     seq: [0, 3, 4, 5, 1, 4, 0, 2, 5, 3, 4, 0].map(x => d('seven', x)) }
];
