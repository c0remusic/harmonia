// analyze_bach.mjs — fetch corpus JSB chorales et extraire les stats de voice leading
// Usage : node bench/analyze_bach.mjs

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Fetch (Node 18+ built-in fetch, sinon fallback https)
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch (e) {
    // fallback https
    return new Promise((resolve, reject) => {
      const https = require('https');
      https.get(url, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }
}

const URL = 'https://raw.githubusercontent.com/czhuang/JSB-Chorales-dataset/master/jsb-chorales-16th.json';
console.log('Fetching Bach chorales…');
const raw = await fetchJSON(URL);

// Corpus = train + valid + test
const chorales = [...(raw.train || []), ...(raw.valid || []), ...(raw.test || [])];
console.log(`${chorales.length} chorales chargés.`);

// Stats accumulateurs
const stats = {
  transitions: 0,          // paires consécutives avec au moins 1 voix qui bouge
  totalMove: 0,            // mouvement total (toutes voix, demi-tons)
  moveByVoice: [0,0,0,0],  // mouvement cumulé par voix (b=0, t=1, a=2, s=3 après sort)
  commonTones: 0,          // notes exactes tenues
  commonPcs: 0,            // pitch-classes communs (même note différente octave)
  parallels: 0,            // quintes/octaves parallèles détectées
  crossings: 0,            // croisements (swap moins coûteux que direct)
  leaps: { soprano: 0, bass: 0, inner: 0 },  // sauts > 4 st par registre
  voiceCount: 4,
  sopranoMoves: [],        // distribution des mouvements soprano
  bassMoves: [],           // distribution des mouvements basse
};

const mod = n => ((n % 12) + 12) % 12;

for (const chorale of chorales) {
  for (let t = 0; t < chorale.length - 1; t++) {
    const raw_prev = chorale[t];
    const raw_next = chorale[t + 1];
    // JSB format: [soprano, alto, tenor, bass] — on trie grave→aigu pour notre engine
    const prev = [...raw_prev].sort((a, b) => a - b);
    const next = [...raw_next].sort((a, b) => a - b);

    // Ignorer les répétitions exactes (pas de mouvement)
    if (prev.every((p, i) => p === next[i])) continue;
    stats.transitions++;

    const n = Math.min(prev.length, next.length);
    const bSet = new Set(next);
    const prevPcs = new Set(prev.map(mod));
    const nextPcs = new Set(next.map(mod));

    // Notes communes exactes
    for (const p of prev) if (bSet.has(p)) stats.commonTones++;
    // Pitch-classes communs
    for (const pc of prevPcs) if (nextPcs.has(pc)) stats.commonPcs++;

    // Mouvement par voix
    let totalThisStep = 0;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(next[i] - prev[i]);
      stats.totalMove += d;
      stats.moveByVoice[i] += d;
      totalThisStep += d;
      if (i === n - 1) stats.sopranoMoves.push(d);
      if (i === 0)     stats.bassMoves.push(d);
      if (d > 4) {
        if (i === n - 1) stats.leaps.soprano++;
        else if (i === 0) stats.leaps.bass++;
        else stats.leaps.inner++;
      }
    }

    // Quintes/octaves parallèles
    for (let i = 0; i < n - 1; i++) {
      const i1 = mod(prev[i + 1] - prev[i]);
      const i2 = mod(next[i + 1] - next[i]);
      if (i1 === i2 && (i1 === 0 || i1 === 7) && prev[i] !== next[i]) stats.parallels++;
    }

    // Croisements (heuristique swap)
    for (let i = 0; i < n - 1; i++) {
      const direct = Math.abs(next[i] - prev[i]) + Math.abs(next[i + 1] - prev[i + 1]);
      const swap   = Math.abs(next[i + 1] - prev[i]) + Math.abs(next[i] - prev[i + 1]);
      if (swap < direct) stats.crossings++;
    }
  }
}

const T = stats.transitions;
console.log(`\n=== Statistiques sur ${T} transitions (mouvements ≠ 0) ===\n`);
console.log(`Mouvement moyen / transition         : ${(stats.totalMove / T).toFixed(2)} demi-tons`);
console.log(`Mouvement moyen basse  (voix 0)      : ${(stats.moveByVoice[0] / T).toFixed(2)} st`);
console.log(`Mouvement moyen ténor  (voix 1)      : ${(stats.moveByVoice[1] / T).toFixed(2)} st`);
console.log(`Mouvement moyen alto   (voix 2)      : ${(stats.moveByVoice[2] / T).toFixed(2)} st`);
console.log(`Mouvement moyen soprano(voix 3)      : ${(stats.moveByVoice[3] / T).toFixed(2)} st`);
console.log(`Notes communes exactes / transition  : ${(stats.commonTones / T).toFixed(2)}`);
console.log(`PC communs / transition              : ${(stats.commonPcs / T).toFixed(2)}`);
console.log(`Quintes/octaves parallèles / trans.  : ${(stats.parallels / T).toFixed(3)}`);
console.log(`Croisements (swap) / transition      : ${(stats.crossings / T).toFixed(3)}`);
console.log(`% sauts soprano (>4st)               : ${(stats.leaps.soprano / T * 100).toFixed(1)}%`);
console.log(`% sauts basse   (>4st)               : ${(stats.leaps.bass / T * 100).toFixed(1)}%`);
console.log(`% sauts inner   (>4st)               : ${(stats.leaps.inner / T * 100).toFixed(1)}%`);

// Distribution des mouvements soprano
const sopranoHist = {};
for (const d of stats.sopranoMoves) sopranoHist[d] = (sopranoHist[d] || 0) + 1;
const sopranoTotal = stats.sopranoMoves.length;
console.log('\nDistribution mouvement soprano:');
for (let d = 0; d <= 12; d++) {
  const cnt = sopranoHist[d] || 0;
  const pct = (cnt / sopranoTotal * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(cnt / sopranoTotal * 50));
  console.log(`  ${String(d).padStart(2)}st : ${bar} ${pct}%`);
}
const sopranoAvg = stats.sopranoMoves.reduce((a, b) => a + b, 0) / sopranoTotal;
const sopranoMax = Math.max(...stats.sopranoMoves);
console.log(`  avg=${sopranoAvg.toFixed(2)} max=${sopranoMax}`);

// Distribution des mouvements basse
const bassHist = {};
for (const d of stats.bassMoves) bassHist[d] = (bassHist[d] || 0) + 1;
const bassTotal = stats.bassMoves.length;
console.log('\nDistribution mouvement basse:');
for (let d = 0; d <= 12; d++) {
  const cnt = bassHist[d] || 0;
  const pct = (cnt / bassTotal * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(cnt / bassTotal * 50));
  console.log(`  ${String(d).padStart(2)}st : ${bar} ${pct}%`);
}
const bassAvg = stats.bassMoves.reduce((a, b) => a + b, 0) / bassTotal;
const bassMax = Math.max(...stats.bassMoves);
console.log(`  avg=${bassAvg.toFixed(2)} max=${bassMax}`);
