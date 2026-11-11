// Plays many robot games and prints Arcade score bands and Treasure Reef payback / big-win rates.
// Usage: node tools/balance-check.mjs [runsPerProfile=200]
import { DEFAULT_CONFIG } from '../src/config/tuning.js';
import { mergeConfig } from '../src/config/loader.js';
import { createRun, step } from '../src/sim/runSim.js';
import { createBot } from '../src/dev/bot.js';

const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

export function play(seed, mode, profile, { level = null, maxTicks = 60 * 60 * 30, config = DEFAULT_CONFIG } = {}) {
  const S = createRun({ config, seed, mode });
  const bot = createBot(seed, profile, { level });
  const counts = { fever: 0, wheel: 0, lucky: 0, big: [0, 0, 0, 0] };
  while (!S.over && S.tick < maxTicks) {
    bot.act(S);
    for (const e of step(S)) {
      if (e.type === 'fever:enter') counts.fever++;
      if (e.type === 'wheel:start') counts.wheel++;
      if (e.type === 'lucky:catch') counts.lucky++;
      if (e.type === 'bigwin') counts.big[e.tier]++;
    }
  }
  return { S, counts };
}

/** Treasure Reef: payback = coins won ÷ coins spent on landed shots, over many capped sessions. */
export function reefStats(n, { config = DEFAULT_CONFIG, level = 4, minutes = 10, profile = 'mid', seed0 = 9000 } = {}) {
  let spent = 0, won = 0, playTicks = 0, big = 0, nice = 0, empty = 0;
  const peaks = [], lens = [];
  for (let i = 0; i < n; i++) {
    const { S, counts } = play(seed0 + i, 'reef', profile, { level, maxTicks: 60 * 60 * minutes, config });
    spent += S.spent; won += S.coins - config.reef.startCoins + S.spent;
    playTicks += S.tick; big += counts.big[2] + counts.big[3]; nice += counts.big[1];
    if (S.over) empty++;
    peaks.push(S.peakCoins); lens.push(S.tick / 3600);
  }
  peaks.sort((a, b) => a - b); lens.sort((a, b) => a - b);
  const mins = playTicks / 3600;
  return { payback: won / spent, bigPerMin: big / mins, nicePerMin: nice / mins, emptyShare: empty / n,
           medianPeak: q(peaks, 0.5), medianMinutes: q(lens, 0.5) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const N = Number(process.argv[2] || 200);
  console.log('ARCADE (60 s)');
  for (const profile of ['novice', 'mid', 'expert']) {
    const sc = [], cat = [], acc = [], fev = [], wh = [], big = [], lk = [];
    for (let i = 0; i < N; i++) {
      const { S, counts } = play(5000 + i, 'arcade', profile);
      sc.push(S.summary.score); cat.push(Object.values(S.summary.catches).reduce((a, b) => a + b, 0));
      acc.push(S.summary.accuracy); fev.push(counts.fever); wh.push(counts.wheel); big.push(counts.big[2] + counts.big[3]); lk.push(counts.lucky);
    }
    sc.sort((a, b) => a - b);
    console.log(`${profile.padEnd(7)} p25 ${q(sc, .25)}  median ${q(sc, .5)}  p75 ${q(sc, .75)} | catches ${mean(cat).toFixed(0)}  accuracy ${(mean(acc) * 100).toFixed(0)}%  fever ${mean(fev).toFixed(1)}  wheel ${mean(wh).toFixed(1)} (lucky ${mean(lk).toFixed(1)})  BIG+MEGA ${mean(big).toFixed(1)}`);
  }
  console.log('TREASURE REEF (start 1,000; robot fires nonstop; sessions capped at 10 min)');
  for (const level of [3, 4, 5]) {
    const r = reefStats(Math.max(20, Math.floor(N / 4)), { level });
    console.log(`level ${level} (${DEFAULT_CONFIG.reef.shotCost[level - 1]}/shot)  payback ${(r.payback * 100).toFixed(1)}%  BIG+ per min ${r.bigPerMin.toFixed(2)}  Nice per min ${r.nicePerMin.toFixed(2)}  ran out ${(r.emptyShare * 100).toFixed(0)}%  median peak ${r.medianPeak}`);
  }
}
