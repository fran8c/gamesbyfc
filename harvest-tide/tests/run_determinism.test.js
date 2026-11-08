import { test, eq, ok } from './harness.js';
import { DEFAULT_CONFIG } from '../src/config/tuning.js';
import { createRun, step, replay, hashEvents } from '../src/sim/runSim.js';
import { createBot } from '../src/dev/bot.js';

/** Play a whole run with the robot. Table sessions are capped at 10 minutes. */
export function botRun(seed, profile = 'expert', mode = 'arcade', maxTicks = 36000) {
  const S = createRun({ config: DEFAULT_CONFIG, seed, mode });
  const bot = createBot(seed, profile, { bet: mode === 'table' ? 20 : null });
  const all = [];
  while (!S.over && S.tick < maxTicks) { bot.act(S); for (const e of step(S)) all.push(e); }
  return { S, events: all, log: S.inputLog.slice() };
}

test('TS-17 replay: 10 seeds per mode, same input log → identical event hash', () => {
  for (const mode of ['arcade', 'table']) {
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
    const t = botRun(200, p, 'table', 60 * 60 * 30);
    ok(t.S.bank >= 0, 'bank never negative');
  }
});

test('Table: bank only changes by bets, wins and refunds (bookkeeping)', () => {
  const { S, events } = botRun(31, 'mid', 'table', 20000);
  let bank = 1000;
  for (const e of events) {
    if (e.type === 'shot') bank -= e.bet;
    if (e.type === 'refund') bank += e.bet;
    if (e.type === 'catch:credit') bank += e.amount;
  }
  eq(bank, S.bank);
});
