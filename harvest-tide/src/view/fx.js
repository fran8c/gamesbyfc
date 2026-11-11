// Visual effects: nets, catch animations, coins, popups, lightning, callouts, big-win overlays, shake.
// Visual only (Math.random is fine here).
import { C, T, goldText, easeOut, easeBack, lerp, drawCoin, glow, starPath, fmt } from './theme.js';
import { drawCreature } from './fishart.js';

const MAX_PARTS = 90, MAX_COINS = 48;

export function createFx() {
  return { nets: [], parts: [], coins: [], popups: [], bolts: [], dying: [], callouts: [], banners: [], rings: [], flash: null, shake: 0 };
}

export function addNet(fx, x, y, r, lucky = false) { if (fx.nets.length < 16) fx.nets.push({ x, y, r, age: 0, life: 0.5, lucky }); }
export function ring(fx, x, y, color, r0 = 10, r1 = 70, life = 0.5) { fx.rings.push({ x, y, color, r0, r1, age: 0, life }); }

export function burst(fx, x, y, n, color, speed = 260) {
  for (let i = 0; i < n && fx.parts.length < MAX_PARTS; i++) {
    const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.6);
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, age: 0, life: 0.45 + Math.random() * 0.4, color, r: 2.5 + Math.random() * 3.5, star: Math.random() < 0.3 });
  }
}

/** Fish that was just caught: spins, flashes and shrinks into coins. */
export function dying(fx, kind, x, y, dir, seed) { if (fx.dying.length < 20) fx.dying.push({ kind, x, y, dir, seed, age: 0, life: 0.6 }); }

/** Coins that fly from (x, y) to the score/coins panel. */
export function coinFlight(fx, x, y, n, to) {
  for (let i = 0; i < n && fx.coins.length < MAX_COINS; i++) {
    fx.coins.push({ x0: x + (Math.random() - 0.5) * 50, y0: y + (Math.random() - 0.5) * 36, x1: to.x, y1: to.y,
                    age: -i * 0.035, life: 0.75, spin: Math.random() });
  }
}

export function popup(fx, x, y, str, { size = 30, big = false, color = null } = {}) {
  if (fx.popups.length >= 16) fx.popups.shift();
  fx.popups.push({ x, y, str, size, big, color, age: 0, life: big ? 1.3 : 0.95 });
}

export function bolt(fx, points) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], path = [a];
    for (let k = 1; k < 7; k++) path.push({ x: lerp(a.x, b.x, k / 7) + (Math.random() - 0.5) * 34, y: lerp(a.y, b.y, k / 7) + (Math.random() - 0.5) * 34 });
    path.push(b); segs.push(path);
  }
  fx.bolts.push({ segs, age: 0, life: 0.5 });
}

/** Big short message in the middle-top of the screen ("GREAT!", "FEVER!", "LUCKY CATCH!"). */
export function callout(fx, text, color = C.gold, sub = null) {
  fx.callouts.length = 0;
  fx.callouts.push({ text, color, sub, age: 0, life: 1.1 });
}

/** Big-win banner. tier 2 = BIG CATCH, 3 = MEGA CATCH. */
export function banner(fx, tier, amount, label, coins = false) {
  fx.banners.push({ tier, amount, label, coins, age: 0, life: tier === 3 ? 2.2 : 1.4 });
  if (fx.banners.length > 2) fx.banners.shift();
}

export function flash(fx, color, a = 0.35) { fx.flash = { color, a }; }
export function shake(fx, amount) { fx.shake = Math.max(fx.shake, amount); }

export function updateFx(fx, dt) {
  const age = arr => { for (const o of arr) o.age += dt; return arr.filter(o => o.age < o.life); };
  fx.nets = age(fx.nets); fx.rings = age(fx.rings); fx.dying = age(fx.dying); fx.bolts = age(fx.bolts); fx.callouts = age(fx.callouts);
  for (const p of fx.parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; }
  fx.parts = fx.parts.filter(p => p.age < p.life);
  for (const c of fx.coins) c.age += dt;
  fx.coins = fx.coins.filter(c => c.age < c.life);
  for (const p of fx.popups) { p.age += dt; p.y -= (p.big ? 28 : 52) * dt; }
  fx.popups = fx.popups.filter(p => p.age < p.life);
  if (fx.banners.length) { fx.banners[0].age += dt; if (fx.banners[0].age >= fx.banners[0].life) fx.banners.shift(); }
  if (fx.flash) { fx.flash.a -= dt * 1.6; if (fx.flash.a <= 0) fx.flash = null; }
  fx.shake = Math.max(0, fx.shake - dt * 30);
}

/** Effects that belong to the world (under the HUD). */
export function drawFxWorld(ctx, fx, t) {
  for (const d of fx.dying) {
    const k = d.age / d.life;
    const s = k < 0.25 ? 1 + k * 0.6 : 1.15 * (1 - (k - 0.25) / 0.75);
    drawCreature(ctx, d.kind, d.x, d.y - k * 20, { dir: d.dir, t, seed: d.seed, tilt: k * 3, scale: Math.max(0.05, s), alpha: 1 - k * 0.6 });
    if (k < 0.3) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.3 - k) / 0.3;
      ctx.drawImage(glow('255,240,170'), d.x - 60, d.y - 60, 120, 120); ctx.restore();
    }
  }
  for (const n of fx.nets) {
    const k = n.age / n.life, r = n.r * (0.55 + 0.45 * easeOut(Math.min(1, k * 2.4)));
    ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.shadowColor = n.lucky ? C.gold : C.glow; ctx.shadowBlur = 18;
    ctx.strokeStyle = n.lucky ? 'rgba(255,225,120,0.95)' : 'rgba(200,245,255,0.95)'; ctx.lineWidth = 2.2;
    for (let j = 1; j <= 3; j++) { ctx.beginPath(); ctx.arc(n.x, n.y, r * j / 3, 0, 7); ctx.stroke(); }
    for (let a = 0; a < 12; a++) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.x + Math.cos(a * Math.PI / 6) * r, n.y + Math.sin(a * Math.PI / 6) * r); ctx.stroke(); }
    ctx.restore();
  }
  for (const r of fx.rings) {
    const k = r.age / r.life;
    ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r0, r.r1, easeOut(k)), 0, 7);
    ctx.globalAlpha = 1 - k; ctx.lineWidth = 4; ctx.strokeStyle = r.color; ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const b of fx.bolts) {
    ctx.save(); ctx.globalAlpha = 1 - b.age / b.life; ctx.shadowColor = '#FFF59A'; ctx.shadowBlur = 26;
    for (const path of b.segs) {
      ctx.beginPath(); path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,240,140,0.6)'; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = C.white; ctx.stroke();
    }
    ctx.restore();
  }
  for (const p of fx.parts) {
    ctx.globalAlpha = 1 - p.age / p.life;
    if (p.star) { starPath(ctx, p.x, p.y, p.r * 1.8, 0.4); ctx.fillStyle = p.color; ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = p.color; ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  for (const p of fx.popups) {
    const a = p.age > p.life * 0.6 ? 1 - (p.age - p.life * 0.6) / (p.life * 0.4) : 1;
    const s = p.age < 0.14 ? 0.5 + 0.5 * easeBack(p.age / 0.14) : 1;
    if (p.color) T(ctx, p.str, p.x, p.y, { size: p.size * s, w: 900, align: 'center', base: 'middle', fill: p.color, sw: 6, a });
    else goldText(ctx, p.str, p.x, p.y, p.size * s, 'center', a);
  }
}

/** Overlay effects (above the HUD): flying coins, callouts, banners, flash. */
export function drawFxOverlay(ctx, fx, t) {
  for (const c of fx.coins) {
    if (c.age < 0) continue;
    const k = easeOut(c.age / c.life);
    const x = lerp(c.x0, c.x1, k), y = lerp(c.y0, c.y1, k) - Math.sin(k * Math.PI) * 90;
    drawCoin(ctx, x, y, 11, c.spin + c.age * 2.5);
  }
  for (const c of fx.callouts) {
    const k = c.age / c.life, a = k > 0.75 ? (1 - k) / 0.25 : 1;
    const s = k < 0.18 ? 0.4 + 0.6 * easeBack(k / 0.18) : 1;
    ctx.save(); ctx.translate(640, 196); ctx.scale(s, s);
    T(ctx, c.text, 0, 0, { size: 58, w: 900, align: 'center', base: 'middle', fill: c.color, sw: 10, a });
    if (c.sub) T(ctx, c.sub, 0, 44, { size: 24, w: 800, align: 'center', base: 'middle', fill: C.white, sw: 6, a });
    ctx.restore();
  }
  const b = fx.banners[0];
  if (b) {
    const k = b.age / b.life, a = k < 0.08 ? k / 0.08 : k > 0.85 ? (1 - k) / 0.15 : 1;
    ctx.save(); ctx.globalAlpha = a;
    if (b.tier === 3) { ctx.fillStyle = 'rgba(4,14,26,0.55)'; ctx.fillRect(0, 0, 1280, 720); }
    const cx = 640, cy = b.tier === 3 ? 330 : 300;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.age * 0.9);
    for (let i = 0; i < 14; i++) {
      ctx.rotate(Math.PI / 7);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-34, -360); ctx.lineTo(34, -360); ctx.closePath();
      ctx.fillStyle = 'rgba(255,201,60,0.12)'; ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow('255,200,80'), cx - 280, cy - 220, 560, 440);
    ctx.globalCompositeOperation = 'source-over';
    const pop = k < 0.15 ? 0.4 + 0.6 * easeBack(k / 0.15) : 1;
    T(ctx, b.tier === 3 ? 'MEGA CATCH!' : 'BIG CATCH!', cx, cy - 66 * pop, { size: (b.tier === 3 ? 56 : 42) * pop, w: 900, align: 'center', fill: C.white, sw: 10 });
    const shown = Math.round(b.amount * Math.min(1, k / 0.45));
    if (b.coins) drawCoin(ctx, cx - (b.tier === 3 ? 230 : 170) * pop, cy + 8, 26 * pop, t * 1.5);
    goldText(ctx, '+' + fmt(shown), cx, cy + 8, (b.tier === 3 ? 120 : 86) * pop);
    if (b.label) T(ctx, b.label, cx, cy + 86, { size: 26, w: 800, align: 'center', fill: C.ice, sw: 6 });
    ctx.restore();
  }
  if (fx.flash) { ctx.globalAlpha = Math.max(0, fx.flash.a); ctx.fillStyle = fx.flash.color; ctx.fillRect(0, 0, 1280, 720); ctx.globalAlpha = 1; }
}
