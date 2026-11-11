// Cannon (aim, fire rate, clip, reload, jam, cannon level) and bullets (movement, bounces, lock-on, hits).
// Spec 3.1–3.2.
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

export function modeCannon(S) { return S.mode === 'arcade' ? S.cfg.cannon.arcade : S.cfg.cannon.reef; }

function fireRate(S) {
  if (S.mode === 'arcade' && S.combo.feverActive) return S.cfg.fever.fireRateTicks;
  return modeCannon(S).fireRateTicks;
}

/** Highest cannon level ≤ the chosen one that the player can afford (min level 1). */
export function effectiveLevel(S) {
  const costs = S.cfg.reef.shotCost;
  let lv = S.levelChosen;
  while (lv > 1 && costs[lv - 1] > S.coins) lv--;
  return lv;
}

function syncLevel(S) {
  S.level = effectiveLevel(S);
  S.cost = S.cfg.reef.shotCost[S.level - 1];
}

export function changeLevel(S, delta) {
  const max = S.cfg.reef.shotCost.length;
  S.levelChosen = Math.max(1, Math.min(max, S.levelChosen + delta));
  syncLevel(S);
  emit(S, 'level:change', { level: S.level, cost: S.cost });
}

/** Spec 3.12 step 4. */
export function tickCannon(S) {
  const a = S.cfg.cannon.arcade;
  if (S.cooldown > 0) S.cooldown--;
  if (S.jamLeft > 0) S.jamLeft--;
  if (S.reloadLeft > 0 && --S.reloadLeft === 0) { S.ammo = a.clipSize; emit(S, 'reload:end', {}); }
  if (S.mode === 'reef') syncLevel(S);
  if (!S.firing || S.cooldown > 0 || S.jamLeft > 0 || S.reloadLeft > 0) return;
  if (S.bullets.length >= modeCannon(S).maxBullets) return;
  if (S.mode === 'reef' && S.coins < S.cost) return;
  const d = aimDir(S.cfg, S.aim.x, S.aim.y);
  const c = S.cfg.cannon;
  const b = { id: S.nextBullet++, x: c.pos.x + d.x * c.muzzlePx, y: c.pos.y + d.y * c.muzzlePx, dx: d.x, dy: d.y,
              bounces: 0, life: S.cfg.bullet.lifeTicks, cost: 0, lucky: false };
  if (S.mode === 'reef') {
    b.cost = S.cost; S.coins -= S.cost; S.spent += S.cost;
    if (S.lucky.ready && !S.lucky.inFlight) { b.lucky = true; S.lucky.inFlight = true; }
  } else {
    S.ammo--;
    if (S.ammo === 0) { S.reloadLeft = a.reloadTicks; emit(S, 'reload:start', { ticks: a.reloadTicks }); }
  }
  S.bullets.push(b);
  S.shots++;
  S.cooldown = fireRate(S);
  emit(S, 'shot', { id: b.id, x: b.x, y: b.y, dx: d.x, dy: d.y, cost: b.cost, level: S.level, lucky: b.lucky });
}

/** Spec 3.12 step 6 (move, steer, bounce, hit) and the bullet half of step 8 (expiry, returns). */
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
        const nx = b.dx + tx / tl * cfg.powerups.lockonSteer, ny = b.dy + ty / tl * cfg.powerups.lockonSteer;
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
      const landed = resolveNet(S, b.x, b.y, b);
      if (S.mode === 'reef' && !landed) giveBack(S, b, 'no_payer');
      if (S.state === 'WHEEL') break;                // everything else waits for the wheel
    } else if (b.bounces > B.maxBounces || b.y > F.h + 20 || b.life <= 0) {
      b.dead = true;
      emit(S, 'bullet:expire', { id: b.id, x: b.x, y: b.y });
      if (S.mode === 'reef') giveBack(S, b, 'miss');
    }
  }
  S.bullets = S.bullets.filter(b => !b.dead);
}

/** Missed shots cost nothing in Treasure Reef. */
function giveBack(S, b, reason) {
  if (b.lucky) S.lucky.inFlight = false;
  if (!b.cost) return;
  S.coins += b.cost; S.spent -= b.cost;
  emit(S, 'shot:return', { cost: b.cost, reason });
}
