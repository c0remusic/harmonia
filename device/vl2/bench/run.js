// run.js — banc v2 : métriques + critères durs (identité=0, boucles stables,
// dérive bornée) sur les progressions de référence. Écrit RESULTS.md.
// (Comparaison chiffrée vs v1 = phase d'intégration Live, cf. plan.)

import { PROGRESSIONS } from './progressions.js';
import { metrics, loopStable } from './metrics.js';
import { createEngine } from '../src/engine.js';
import { checkIdentity } from '../src/identity.js';
import { writeFileSync } from 'node:fs';

const VOICINGS = ['classic', 'piano', 'open', 'spread', 'house', 'prog', 'rootlessa', 'rootlessb', 'drop2', 'drop3', 'jazz', 'nuhouse', 'trap'];
const mean = ns => ns.reduce((a, b) => a + b, 0) / ns.length;

let totalViol = 0, loopFails = 0, maxDrift = 0;
const rows = [];

for (const voicing of VOICINGS) {
  for (const P of PROGRESSIONS) {
    const passes = P.loop ?? 1;
    const mode = P.loop ? 'anchor' : 'flow';
    const e = createEngine();
    const flat = [], perPass = [];
    for (let pass = 0; pass < passes; pass++) {
      const run = [];
      for (const c of P.seq) {
        const r = e.play(c.spec, voicing, { mode, center: 60 });
        const viol = checkIdentity(r.voicing || voicing, r.notes, c.spec).length;
        totalViol += viol;
        run.push(r.notes);
        flat.push(r.notes);
        if (mode === 'flow') maxDrift = Math.max(maxDrift, Math.abs(mean(r.notes) - 60));
      }
      perPass.push(run);
    }
    const m = metrics(flat);
    let loopCol = '';
    if (P.loop) { const ok = loopStable(perPass); if (!ok) loopFails++; loopCol = ` | loop=${ok}`; }
    rows.push(`- **${voicing}** / ${P.name} : move=${m.totalMove} sopMax=${m.sopranoMaxJump} common=${m.commonPct}% par=${m.parallels}${loopCol}`);
  }
}

const header = [
  '# Banc vl2 — résultats',
  '',
  `Critères durs : violations d'identité = **${totalViol}** (cible 0) · boucles instables = **${loopFails}** (cible 0) · dérive FLOW max = **${maxDrift.toFixed(1)}** demi-tons (cible ≤ ~12).`,
  '',
  'Métriques par voicing × progression (move = mouvement total toutes voix ; sopMax = plus grand saut de soprano ; common% = notes tenues ; par = quintes/octaves parallèles).',
  '',
  '> Comparaison chiffrée vs ancien moteur (v1) : à faire en phase d\'intégration Live (extraction du moteur de demo.html), + écoute A/B.',
  ''
];

writeFileSync(new URL('./RESULTS.md', import.meta.url), header.concat(rows).join('\n'));
console.log(header.concat(rows).join('\n'));
console.log(`\n=== CRITÈRES DURS : viol=${totalViol} loopFails=${loopFails} maxDrift=${maxDrift.toFixed(1)} ===`);
if (totalViol !== 0 || loopFails !== 0) process.exit(1);
