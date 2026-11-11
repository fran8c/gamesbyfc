import { test, eq, ok } from './harness.js';
import { DEFAULT_CONFIG } from '../src/config/tuning.js';
import { createRun, step, replay, hashEvents } from '../src/sim/runSim.js';
import { createBot } from '../src/dev/bot.js';

/** Play a whole run with the robot. Table sessions are capped at 10 minutes. */
export function botRun(seed, profile = 'expert', mode = 'arcade', maxTicks = 36000) {
  const S = createRun({ config: DEFAULT_CONFIG, seed, mode });
  const bot = createBot(seed, profile, { level: mode === 'reef' ? 5 : null });
  const all = [];
  while (!S.over && S.tick < maxTicks) { bot.act(S); for (const e of step(S)) all.push(e); }
  return { S, events: all, log: S.inputLog.slice() };
}

test('TS-17 replay: 10 seeds per mode, same input log → identical event hash', () => {
  for (const mode of ['arcade', 'reef']) {
    for (let i = 1; i <= 10; i++) {
      const seed = i * 7919;
      const a = botRun(seed, 'expert', mode, 7200);
      const r = replay({ config: DEFAULT_CONFIG, seed, mode }, a.log, a.S.tick);
      eq(r.hash, hashEvents(a.events), `${mode} seed ${seed}`);
    }
  }
});

test('different seeds give different runs', () => {
  ok(hashEvents(botRun(1).events) !== hashEvents(botRun(2).events));
});

test('robot runs complete in both modes without errors', () => {
  for (const p of ['novice', 'mid', 'expert']) {
    const { S } = botRun(100, p, 'arcade');
    ok(S.over && Number.isInteger(S.summary.score) && S.summary.score > 0, 'arcade ' + p);
    const t = botRun(200, p, 'reef', 60 * 60 * 10);
    ok(t.S.coins >= 0, 'coins never negative');
  }
});

test('Reef: coins only change by shot costs, returned shots and catches (bookkeeping)', () => {
  const { S, events } = botRun(31, 'mid', 'reef', 20000);
  let coins = 1000;
  for (const e of events) {
    if (e.type === 'shot') coins -= e.cost;
    if (e.type === 'shot:return') coins += e.cost;
    if (e.type === 'catch:credit') coins += e.amount;
  }
  eq(coins, S.coins);
});

test('no gambling words in player-facing code', async () => {
  if (!(typeof process !== 'undefined' && process.versions && process.versions.node)) return 'skip';
  const fs = await import('node:fs/promises');
  const dirs = ['scenes', 'view'];
  const bad = [];
  for (const d of dirs) {
    const dir = new URL('../src/' + d + '/', import.meta.url);
    for (const name of await fs.readdir(dir)) {
      const src = await fs.readFile(new URL(name, dir), 'utf8');
      const strings = src.match(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g) || [];
      for (const str of strings) if (/\b(bet|bets|betting|wager|gamble|gambling|casino|jackpot|payout|odds)\b/i.test(str)) bad.push(`${d}/${name}: ${str}`);
    }
  }
  eq(bad.length, 0, bad.join(' | '));
});
