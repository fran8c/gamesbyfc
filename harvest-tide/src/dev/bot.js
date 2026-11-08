// Robot shooter for tests, balance runs and the title-screen demo. Reads sim state like a player
// reads the screen and acts only through input(). Its own randomness is seeded.
import { createRng } from '../sim/rng.js';
import { input } from '../sim/runSim.js';

export const BOT_PROFILES = {
  //        how often it re-picks a target, aim wobble (px), lead on moving fish (0..1), power-up use
  novice: { retarget: [40, 80], noise: 70, lead: 0.0, pause: 0.25, powerAt: 0.002, pick: 'nearest' },
  mid:    { retarget: [25, 50], noise: 35, lead: 0.5, pause: 0.10, powerAt: 0.004, pick: 'value' },
  expert: { retarget: [15, 30], noise: 15, lead: 1.0, pause: 0.03, powerAt: 0.006, pick: 'value' },
};

export function createBot(seed, profile = 'expert', { bet = null } = {}) {
  const P = BOT_PROFILES[profile];
  const rng = createRng((seed ^ 0xB07B07) >>> 0);
  let target = null, until = 0, resting = 0, down = false, betDone = bet === null;

  function pick(S) {
    const cfg = S.cfg, c = cfg.cannon.pos;
    const live = S.fish.filter(f => f.alive && f.x > 60 && f.x < cfg.field.w - 60 && f.y > 40 && f.y < 600 && !cfg.fish[f.kind].hazard);
    if (!live.length) return null;
    if (P.pick === 'nearest') {
      live.sort((a, b) => ((a.x - c.x) ** 2 + (a.y - c.y) ** 2) - ((b.x - c.x) ** 2 + (b.y - c.y) ** 2));
      return live[rng.intRange(0, Math.min(3, live.length - 1))];
    }
    // value per remaining hit (Arcade) or pay (Table), with a little randomness
    const score = f => (S.mode === 'arcade' ? cfg.fish[f.kind].points / f.hp : cfg.fish[f.kind].pay) * (0.6 + rng.next() * 0.8);
    live.sort((a, b) => score(b) - score(a));
    return live[0];
  }

  return {
    act(S) {
      if (S.over) return;
      if (!betDone && S.mode === 'table') {                  // walk the bet to the requested step
        const want = S.cfg.table.betSteps.indexOf(bet);
        if (S.betIndex < want) input(S, 'bet', 1); else if (S.betIndex > want) input(S, 'bet', -1); else betDone = true;
        return;
      }
      if (S.state !== 'PLAYING') return;
      if (S.mode === 'arcade' || rng.next() < 1) {
        if (rng.next() < P.powerAt) {
          const ids = S.cfg.powerups.ids;
          const i = rng.intRange(0, ids.length - 1);
          if (S.power.uses[ids[i]] > 0) input(S, 'power', i);
        }
      }
      if (resting > 0) { resting--; if (down) { input(S, 'up', 0, 0); down = false; } return; }
      if (!target || !target.alive || S.tick >= until || !S.fish.includes(target)) {
        target = pick(S);
        until = S.tick + rng.intRange(P.retarget[0], P.retarget[1]);
        if (rng.next() < P.pause) { resting = rng.intRange(10, 40); return; }
      }
      if (!target) { if (down) { input(S, 'up', 0, 0); down = false; } return; }
      // lead the target: where it will be when a bullet arrives
      const c = S.cfg.cannon.pos, dx = target.x - c.x, dy = target.y - c.y;
      const tFly = Math.sqrt(dx * dx + dy * dy) / S.cfg.bullet.speedPxPerTick;
      const t = Math.min(1, (target.age + tFly * P.lead) / target.path.ticks);
      const u = 1 - t, p = target.path;
      const px = u * u * p.p0.x + 2 * u * t * p.p1.x + t * t * p.p2.x + target.off.x;
      const py = u * u * p.p0.y + 2 * u * t * p.p1.y + t * t * p.p2.y + target.off.y;
      const ax = (S.power.freezeLeft > 0 ? target.x : px) + (rng.next() - 0.5) * P.noise;
      const ay = (S.power.freezeLeft > 0 ? target.y : py) + (rng.next() - 0.5) * P.noise;
      if (!down) { input(S, 'down', ax, ay); down = true; }
      else input(S, 'move', ax, ay);
    },
  };
}
