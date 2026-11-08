// Cannon (aim, fire rate, clip, reload, jam, bets) and bullets (movement, bounces, lock-on, hits). Spec 3.1–3.2.
import { emit } from './events.js';
import { resolveNet } from './catch.js';
import { bestTarget } from './powerups.js';

/** Normalised aim direction from the cannon toward (x, y), clamped to ≥ 8° above horizontal. */
export function aimDir(cfg, x, y) {
  const c = cfg.cannon, dx = x - c.pos.x, dy = y - c.pos.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return { x: 0, y: -1 };
  let ux = dx / len, uy = dy / len;
  if (uy > c.minDir.y) { ux = ux < 0 ? -c.minDir.x : c.minDir.x; uy = c.minDir.y; }
  return { x: ux, y: uy };
}

export function modeCannon(S) { return S.mode === 'arcade' ? S.cfg.cannon.arcade : S.cfg.cannon.table; }

function fireRate(S) {
  if (S.mode === 'arcade' && S.combo.feverActive) return S.cfg.fever.fireRateTicks;
  return modeCannon(S).fireRateTicks;
}

/** Largest bet step that is ≤ both the chosen step and the bank. */
export function effectiveBet(S) {
  const steps = S.cfg.table.betSteps;
  let i = S.betIndex;
  while (i > 0 && steps[i] > S.bank) i--;
  return steps[i];
}

export function changeBet(S, delta) {
  const steps = S.cfg.table.betSteps;
  S.betIndex = Math.max(0, Math.min(steps.length - 1, S.betIndex + delta));
  S.bet = effectiveBet(S);
  emit(S, 'bet:change', { bet: S.bet });
}

/** Spec 3.12 step 4. */
export function tickCannon(S) {
  const a = S.cfg.cannon.arcade;
  if (S.cooldown > 0) S.cooldown--;
  if (S.jamLeft > 0) S.jamLeft--;
  if (S.reloadLeft > 0 && --S.reloadLeft === 0) { S.ammo = a.clipSize; emit(S, 'reload:end', {}); }
  if (S.mode === 'table') S.bet = effectiveBet(S);
  if (!S.firing || S.cooldown > 0 || S.jamLeft > 0 || S.reloadLeft > 0) return;
  if (S.bullets.length >= modeCannon(S).maxBullets) return;
  if (S.mode === 'table' && (S.bank < S.bet || S.bet <= 0)) return;
  const d = aimDir(S.cfg, S.aim.x, S.aim.y);
  const c = S.cfg.cannon;
  const b = { id: S.nextBullet++, x: c.pos.x + d.x * c.muzzlePx, y: c.pos.y + d.y * c.muzzlePx, dx: d.x, dy: d.y,
              bounces: 0, life: S.cfg.bullet.lifeTicks, bet: 0 };
  if (S.mode === 'table') { b.bet = S.bet; S.bank -= S.bet; S.wagered += S.bet; }
  else {
    S.ammo--;
    if (S.ammo === 0) { S.reloadLeft = a.reloadTicks; emit(S, 'reload:start', { ticks: a.reloadTicks }); }
  }
  S.bullets.push(b);
  S.shots++;
  S.cooldown = fireRate(S);
  emit(S, 'shot', { id: b.id, x: b.x, y: b.y, dx: d.x, dy: d.y, bet: b.bet });
}

/** Spec 3.12 step 6 (move, steer, bounce, hit) and the bullet half of step 8 (expiry, refunds). */
export function tickBullets(S) {
  const cfg = S.cfg, F = cfg.field, B = cfg.bullet;
  let target = null;
  if (S.power.lockonLeft > 0) {
    target = S.fish.find(f => f.uid === S.power.lockTarget && f.alive) || null;
    if (!target) { const t = bestTarget(S); S.power.lockTarget = t ? t.uid : null; target = t; }
  }
  for (let i = 0; i < S.bullets.length; i++) {
    const b = S.bullets[i];
    if (target) {
      const tx = target.x - b.x, ty = target.y - b.y, tl = Math.sqrt(tx * tx + ty * ty);
      if (tl > 1) {
        let nx = b.dx + tx / tl * cfg.powerups.lockonSteer, ny = b.dy + ty / tl * cfg.powerups.lockonSteer;
        const nl = Math.sqrt(nx * nx + ny * ny); b.dx = nx / nl; b.dy = ny / nl;
      }
    }
    b.x += b.dx * B.speedPxPerTick; b.y += b.dy * B.speedPxPerTick;
    let bounced = false;
    if (b.x < F.x0) { b.x = 2 * F.x0 - b.x; b.dx = -b.dx; bounced = true; }
    else if (b.x > F.x1) { b.x = 2 * F.x1 - b.x; b.dx = -b.dx; bounced = true; }
    if (b.y < F.y0) { b.y = 2 * F.y0 - b.y; b.dy = -b.dy; bounced = true; }
    if (bounced) { b.bounces++; emit(S, 'bullet:bounce', { id: b.id, x: b.x, y: b.y }); }
    b.life--;
    // hit test: first fish (ascending uid) overlapping the bullet
    let hit = null;
    if (b.bounces <= B.maxBounces) {
      for (const f of S.fish) {
        if (!f.alive) continue;
        const dx = f.x - b.x, dy = f.y - b.y, rr = f.r + B.radiusPx;
        if (dx * dx + dy * dy <= rr * rr) { hit = f; break; }
      }
    }
    if (hit) {
      b.dead = true;
      S.hits++;
      const paid = resolveNet(S, b.x, b.y, b.bet);
      if (S.mode === 'table' && !paid) refund(S, b, 'no_payer');
      if (S.state === 'WHEEL') break;                // everything else waits for the wheel
    } else if (b.bounces > B.maxBounces || b.y > F.h + 20 || b.life <= 0) {
      b.dead = true;
      emit(S, 'bullet:expire', { id: b.id, x: b.x, y: b.y });
      if (S.mode === 'table') refund(S, b, 'miss');
    }
  }
  S.bullets = S.bullets.filter(b => !b.dead);
}

function refund(S, b, reason) {
  if (!b.bet) return;
  S.bank += b.bet; S.wagered -= b.bet;
  emit(S, 'refund', { bet: b.bet, reason });
}
