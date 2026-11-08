// Plays many robot games and prints score bands (Arcade) and payback / session length (Table).
// Usage: node tools/balance-check.mjs [runsPerProfile=200]
import { DEFAULT_CONFIG } from '../src/config/tuning.js';
import { createRun, step } from '../src/sim/runSim.js';
import { createBot } from '../src/dev/bot.js';

const N = Number(process.argv[2] || 200);
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

export function play(seed, mode, profile, { bet = null, maxTicks = 60 * 60 * 30 } = {}) {
  const S = createRun({ config: DEFAULT_CONFIG, seed, mode });
  const bot = createBot(seed, profile, { bet });
  const counts = { fever: 0, wheel: 0, big: [0, 0, 0, 0] };
  while (!S.over && S.tick < maxTicks) {
    bot.act(S);
    for (const e of step(S)) {
      if (e.type === 'fever:enter') counts.fever++;
      if (e.type === 'wheel:start') counts.wheel++;
      if (e.type === 'bigwin') counts.big[e.tier]++;
    }
  }
  return { S, counts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('ARCADE');
  for (const profile of ['novice', 'mid', 'expert']) {
    const sc = [], cat = [], acc = [], fev = [], wh = [], big = [];
    for (let i = 0; i < N; i++) {
      const { S, counts } = play(5000 + i, 'arcade', profile);
      sc.push(S.summary.score); cat.push(Object.values(S.summary.catches).reduce((a, b) => a + b, 0));
      acc.push(S.summary.accuracy); fev.push(counts.fever); wh.push(counts.wheel); big.push(counts.big[2] + counts.big[3]);
    }
    sc.sort((a, b) => a - b);
    console.log(`${profile.padEnd(7)} p25 ${q(sc, .25)}  median ${q(sc, .5)}  p75 ${q(sc, .75)} | catches ${mean(cat).toFixed(0)}  accuracy ${(mean(acc) * 100).toFixed(0)}%  fever/run ${mean(fev).toFixed(2)}  wheel/run ${mean(wh).toFixed(2)}  BIG+MEGA/run ${mean(big).toFixed(2)}`);
  }
  console.log('TABLE (start 1,000)');
  for (const bet of [5, 10, 20]) {
    const mins = [], peaks = []; let wag = 0, ret = 0, capped = 0;
    for (let i = 0; i < Math.max(20, Math.floor(N / 4)); i++) {
      const { S } = play(9000 + i, 'table', 'mid', { bet, maxTicks: 60 * 60 * 20 });
      if (!S.over) capped++;
      const sm = S.summary || { peakBank: S.peakBank, bank: S.bank, wagered: S.wagered, startBank: 1000 };
      mins.push(S.tick / 3600); peaks.push(sm.peakBank);
      wag += S.wagered; ret += S.wagered - (1000 - S.bank);
    }
    mins.sort((a, b) => a - b); peaks.sort((a, b) => a - b);
    console.log(`bet ${String(bet).padEnd(3)} median session ${q(mins, .5).toFixed(1)} min  median peak ${q(peaks, .5)}  payback ${(ret / wag * 100).toFixed(1)}%  (hit 20-min cap: ${capped})`);
  }
}
