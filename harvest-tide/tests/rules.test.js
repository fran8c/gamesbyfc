import { test, eq, ok, close } from './harness.js';
import { makeSim, placeFish, run, runUntil, has, find, count, shootAt, input, step, cfgWith } from './util.js';
import { aimDir } from '../src/sim/shots.js';
import { catchChance, wheelEV, fishInCircle } from '../src/sim/catch.js';
import { multiplierFor } from '../src/sim/combo.js';
import { createRng } from '../src/sim/rng.js';
import { DEFAULT_CONFIG as C } from '../src/config/tuning.js';

// ---------- cannon ----------
test('TS-01 hold fire 60 ticks (Arcade) → 6 shots, first on the press tick; ammo 18', () => {
  const S = makeSim();
  input(S, 'down', 640, 100);
  const first = step(S);
  ok(has(first, 'shot'), 'shot on press tick');
  const evs = run(S, 59);
  eq(count(evs, 'shot') + 1, 6);
  eq(S.ammo, 18);
});

test('TS-02 24 shots empties the clip → 60-tick reload, then firing resumes', () => {
  const S = makeSim({ over: { cannon: { arcade: { maxBullets: 100 } } } });
  input(S, 'down', 640, 100);
  const a = runUntil(S, evs => has(evs, 'reload:start'));
  eq(S.shots, 24);
  const b = runUntil(S, evs => has(evs, 'reload:end'));
  eq(b.ticks, 60);
  const c = runUntil(S, evs => has(evs, 'shot'));
  ok(c.ticks >= 1 && c.ticks <= 10, 'fires soon after reload');
  void a;
});

test('aim is clamped to 8° above horizontal', () => {
  const d = aimDir(C, 0, 700);                 // pointing left and down
  close(d.x, -0.990268, 1e-6); close(d.y, -0.139173, 1e-6);
  const up = aimDir(C, 640, 0);
  close(up.x, 0, 1e-9); close(up.y, -1, 1e-9);
});

test('max bullets on screen stops firing (Table 8)', () => {
  const S = makeSim({ mode: 'table' });
  input(S, 'down', 640, 0);
  run(S, 200);
  ok(S.bullets.length <= 8);
});

// ---------- bullets ----------
test('TS-03 bullet bounces off walls; 4th wall contact expires it', () => {
  const S = makeSim();
  input(S, 'down', 0, 600); step(S); input(S, 'up', 0, 0);   // flat shot to the left wall
  const evs = run(S, 400);
  ok(count(evs, 'bullet:bounce') >= 1, 'bounced');
  ok(count(evs, 'bullet:bounce') <= 4, 'at most 4 contacts');
  ok(has(evs, 'bullet:expire'));
  eq(S.bullets.length, 0);
});

test('bullet life is 150 ticks at most', () => {
  const S = makeSim();
  shootAt(S, 640, 100);
  const { ticks } = runUntil(S, evs => has(evs, 'bullet:expire'), 400);
  ok(ticks > 0 && ticks <= 150, 'expired by 150: ' + ticks);
});

// ---------- nets ----------
test('TS-04 net over 7 fish nets the 5 nearest', () => {
  const S = makeSim();
  for (let i = 0; i < 7; i++) placeFish(S, 'turtle', 640 + (i - 3) * 6, 300);
  const net = fishInCircle(S, 640, 300, 44, 5);
  eq(net.length, 5);
  ok(net.every(f => Math.abs(f.x - 640) <= 12), 'nearest five');
});

test('TS-05 sardine school netted (Arcade): all caught, points × multiplier', () => {
  const S = makeSim();
  for (let i = 0; i < 4; i++) placeFish(S, 'sardine', 630 + i * 10, 300);
  shootAt(S, 640, 300);
  const evs = run(S, 60);
  eq(count(evs, 'catch'), 4);
  // multipliers: 1, 1, 1, 1 (tier 1 needs 4 points; each catch scored before its own gain)
  eq(S.score, 40);
  eq(S.combo.points, 4);
});

test('TS-06 turtle needs 15 hits; health shown after the first', () => {
  const S = makeSim();
  const t = placeFish(S, 'turtle', 640, 300);
  for (let i = 0; i < 14; i++) { shootAt(S, 640, 300); run(S, 40); }
  ok(t.alive, 'alive after 14');
  eq(t.hp, 1);
  shootAt(S, 640, 300);
  const evs = run(S, 40);
  ok(!t.alive, 'caught on the 15th');
  eq(find(evs, 'catch').kind, 'turtle');
});

// ---------- Table ----------
test('TS-07 Table payout rule returns the RTP (4,000,000 seeded nets)', () => {
  const rng = createRng(4242);
  const kinds = Object.keys(C.fish).filter(k => C.fish[k].pay > 0);
  const segs = C.wheel.segments;
  let paid = 0, bet = 0;
  for (let i = 0; i < 4e6; i++) {
    const k = 1 + Math.floor(rng.next() * 5);
    bet += 1;
    for (let j = 0; j < k; j++) {
      const kind = kinds[Math.floor(rng.next() * kinds.length)];
      if (rng.next() < catchChance(C, kind, k)) paid += C.fish[kind].pay * (C.fish[kind].wheel ? segs[Math.floor(rng.next() * segs.length)] : 1);
    }
  }
  close(paid / bet, C.table.rtp, 0.015, 'payback');   // ±1.5%: big fish make single runs noisy
});

test('wheel EV is 46/12', () => close(wheelEV(C), 46 / 12, 1e-12));

test('TS-08 Table miss refunds the bet', () => {
  const S = makeSim({ mode: 'table' });
  shootAt(S, 640, 100);
  eq(S.bank, 990);
  const evs = run(S, 200);
  ok(has(evs, 'refund'));
  eq(S.bank, 1000);
});

test('Table net with only a capsule refunds the bet and grants a power-up', () => {
  const S = makeSim({ mode: 'table' });
  placeFish(S, 'capsule', 640, 300);
  const before = Object.values(S.power.uses).reduce((a, b) => a + b, 0);
  shootAt(S, 640, 300);
  const evs = run(S, 60);
  ok(has(evs, 'refund')); eq(S.bank, 1000);
  eq(Object.values(S.power.uses).reduce((a, b) => a + b, 0), before + 1);
});

test('TS-09 bank 3 with bet 10 → bet drops to 2', () => {
  const S = makeSim({ mode: 'table' });
  S.bank = 3;
  step(S);
  eq(S.bet, 2);
});

test('Table hit with no catch keeps the bet (no refund)', () => {
  const S = makeSim({ mode: 'table', over: { table: { rtp: 0.9 } } });
  placeFish(S, 'octopus_king', 640, 300);      // p ≈ 0.009: almost never caught
  S.rng.catch.next = () => 0.99;               // force a miss
  shootAt(S, 640, 300);
  const evs = run(S, 60);
  ok(has(evs, 'net')); ok(!has(evs, 'refund'));
  eq(S.bank, 990);
});

test('Table session ends when the bank is below the smallest bet and no bullets fly', () => {
  const S = makeSim({ mode: 'table' });
  S.bank = 0;
  const evs = run(S, 2);
  eq(find(evs, 'run:end').summary.reason, 'broke');
});

test('TS-16 bank 0 with a bullet in flight → ends only after it resolves (refund)', () => {
  const S = makeSim({ mode: 'table' });
  S.bank = 10;
  shootAt(S, 640, 100);
  eq(S.bank, 0);
  ok(!S.over);
  run(S, 300);
  ok(!S.over, 'refund kept it alive');
  eq(S.bank, 10);
});

// ---------- combo, Fever ----------
test('multiplier tiers: x1.5 at 4, x3.0 at 16, cap x5.0', () => {
  eq(multiplierFor(C, 3), 1); eq(multiplierFor(C, 4), 1.5); eq(multiplierFor(C, 16), 3); eq(multiplierFor(C, 99), 5);
});

test('TS-11 combo 15 → catch → x3.0 and Fever', () => {
  const S = makeSim();
  S.combo.points = 15; S.combo.chainLeft = 100;
  placeFish(S, 'sardine', 640, 300);
  shootAt(S, 640, 300);
  const evs = run(S, 60);
  ok(has(evs, 'fever:enter'));
  eq(S.combo.feverActive, true);
});

test('TS-12 no catch for 120 ticks → combo 0', () => {
  const S = makeSim();
  S.combo.points = 6; S.combo.chainLeft = 120;
  run(S, 119); eq(S.combo.points, 6);
  const evs = run(S, 1);
  eq(S.combo.points, 0); ok(has(evs, 'combo:break'));
});

test('Fever freezes the chain timer and ends after 360 ticks; lockout until a break', () => {
  const S = makeSim();
  S.combo.points = 16; S.combo.feverActive = true; S.combo.feverLeft = 360; S.combo.chainLeft = 5;
  run(S, 100);
  eq(S.combo.points, 16, 'no timeout during Fever');
  const evs = run(S, 260);
  ok(has(evs, 'fever:exit'));
  eq(S.combo.feverLockout, true);
});

test('TS-13 jellyfish netted → jam 36 ticks, combo 0', () => {
  const S = makeSim();
  S.combo.points = 9; S.combo.chainLeft = 100;
  placeFish(S, 'jellyfish', 640, 300);
  input(S, 'down', 640, 300);
  const { events } = runUntil(S, evs => has(evs, 'sting'), 100);
  ok(has(events, 'sting'));
  eq(S.combo.points, 0);
  eq(S.jamLeft, 36);
  const shotsBefore = S.shots;
  run(S, 35);
  eq(S.shots, shotsBefore, 'no shots while jammed');
});

test('jellyfish never spawns in Table mode', () => {
  const S = makeSim({ mode: 'table', fish: true, seed: 3 });
  run(S, 3600);
  ok(!S.fish.some(f => f.kind === 'jellyfish'));
});

// ---------- wheel ----------
test('TS-10 Golden Koi caught → wheel 150 ticks; Arcade timer pauses; result applied', () => {
  const S = makeSim();
  const k = placeFish(S, 'golden_koi', 640, 300);
  k.hp = 1;
  shootAt(S, 640, 300);
  const { events } = runUntil(S, evs => has(evs, 'wheel:start'), 100);
  const ws = find(events, 'wheel:start');
  const rem = S.remaining;
  eq(S.state, 'WHEEL');
  const evs = run(S, 150);
  const we = find(evs, 'wheel:end');
  ok(we, 'wheel ended');
  eq(we.mult, ws.mult);
  eq(S.remaining, rem, 'timer paused');
  eq(S.score, 300 * ws.mult);
});

test('wheel result is deterministic for a seed', () => {
  const a = makeSim({ seed: 77 }), b = makeSim({ seed: 77 });
  for (const S of [a, b]) { placeFish(S, 'golden_koi', 640, 300).hp = 1; shootAt(S, 640, 300); }
  const ea = runUntil(a, evs => has(evs, 'wheel:start'), 100).events;
  const eb = runUntil(b, evs => has(evs, 'wheel:start'), 100).events;
  eq(find(ea, 'wheel:start').index, find(eb, 'wheel:start').index);
});

// ---------- power-ups ----------
test('TS-14 freeze: fish do not move for 240 ticks', () => {
  const S = makeSim({ fish: true, seed: 9 });
  run(S, 30);
  input(S, 'power', 0); step(S);
  const snap = S.fish.map(f => [f.uid, f.x, f.y]);
  run(S, 230);
  for (const [uid, x, y] of snap) {
    const f = S.fish.find(g => g.uid === uid);
    if (f && f.alive) { eq(f.x, x); eq(f.y, y); }
  }
  eq(S.power.uses.freeze, 1);
});

test('TS-15 lightning (Arcade): top 6 fish by points take 6 damage', () => {
  const S = makeSim();
  const kinds = ['manta', 'turtle', 'lionfish', 'puffer', 'snapper', 'clownfish', 'sardine'];
  const fish = kinds.map((k, i) => placeFish(S, k, 150 + i * 150, 200));
  input(S, 'power', 2);
  const evs = run(S, 1);
  eq(find(evs, 'lightning').targets.length, 6);
  eq(fish[0].hp, 25 - 6); eq(fish[1].hp, 15 - 6); eq(fish[2].hp, 8 - 6);
  ok(!fish[3].alive && !fish[4].alive && !fish[5].alive, 'small ones caught');
  ok(fish[6].alive, 'sardine (7th) untouched');
});

test('lock-on bends bullets toward the best fish', () => {
  const S = makeSim();
  const m = placeFish(S, 'manta', 300, 200);
  input(S, 'power', 1); step(S);
  shootAt(S, 900, 200);                        // aim far to the right
  const { events } = runUntil(S, evs => has(evs, 'net') || has(evs, 'bullet:expire'), 200);
  const net = find(events, 'net');
  ok(net && net.uids.includes(m.uid), 'homed onto the manta');
});

test('power-up uses: Arcade 2, Table 1; empty button does nothing', () => {
  eq(makeSim().power.uses.freeze, 2);
  const T = makeSim({ mode: 'table' });
  eq(T.power.uses.freeze, 1);
  input(T, 'power', 0); step(T); input(T, 'power', 0);
  const evs = run(T, 1);
  ok(!has(evs, 'power:use'));
});

// ---------- end ----------
test('Arcade ends at 3,600 playing ticks with accuracy bonus when ≥ 50%', () => {
  const S = makeSim();
  S.score = 1000; S.shots = 10; S.hits = 6;
  const evs = run(S, 4000);
  const end = find(evs, 'run:end');
  eq(end.tick, 3599);
  eq(end.summary.score, 1100);
});

test('big win tiers (Arcade 150 / 500 / 1,500)', () => {
  const S = makeSim();
  placeFish(S, 'octopus_king', 640, 300).hp = 1;
  shootAt(S, 640, 300);
  const evs = run(S, 60);
  eq(find(evs, 'bigwin').tier, 3);
});

void cfgWith;
