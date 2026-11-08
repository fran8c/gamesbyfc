// Visual effects: nets, coin bursts and flights, popups, lightning, big-win overlays. Visual only.
import { C, T, goldText, easeOut, lerp } from './theme.js';

const MAX_PARTS = 80, MAX_COINS = 40;

export function createFx() {
  return { nets: [], parts: [], coins: [], popups: [], bolts: [], banners: [], flash: null, shake: 0 };
}

export function addNet(fx, x, y, r) { if (fx.nets.length < 16) fx.nets.push({ x, y, r, age: 0, life: 0.45 }); }

export function burst(fx, x, y, n, color, speed = 260) {
  for (let i = 0; i < n && fx.parts.length < MAX_PARTS; i++) {
    const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random() * 0.6);
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, age: 0, life: 0.4 + Math.random() * 0.4, color, r: 2.5 + Math.random() * 3.5 });
  }
}

/** Coins that fly from (x, y) to the score/bank panel. */
export function coinFlight(fx, x, y, n, to) {
  for (let i = 0; i < n && fx.coins.length < MAX_COINS; i++) {
    fx.coins.push({ x0: x + (Math.random() - 0.5) * 40, y0: y + (Math.random() - 0.5) * 30, x1: to.x, y1: to.y,
                    age: -i * 0.04, life: 0.7, spin: Math.random() * 6 });
  }
}

export function popup(fx, x, y, str, { color = C.gold, size = 30, big = false } = {}) {
  if (fx.popups.length >= 14) fx.popups.shift();
  fx.popups.push({ x, y, str, color, size, big, age: 0, life: big ? 1.3 : 0.9 });
}

export function bolt(fx, points) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], path = [a];
    for (let k = 1; k < 7; k++) path.push({ x: lerp(a.x, b.x, k / 7) + (Math.random() - 0.5) * 30, y: lerp(a.y, b.y, k / 7) + (Math.random() - 0.5) * 30 });
    path.push(b); segs.push(path);
  }
  fx.bolts.push({ segs, age: 0, life: 0.45 });
}

/** Big-win banner. tier 2 = BIG CATCH, 3 = MEGA CATCH. */
export function banner(fx, tier, amount, label) {
  fx.banners.push({ tier, amount, label, age: 0, life: tier === 3 ? 2.0 : 1.3 });
  if (fx.banners.length > 2) fx.banners.shift();
}

export function flash(fx, color, a = 0.35) { fx.flash = { color, a }; }

export function updateFx(fx, dt) {
  for (const n of fx.nets) n.age += dt;
  fx.nets = fx.nets.filter(n => n.age < n.life);
  for (const p of fx.parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; }
  fx.parts = fx.parts.filter(p => p.age < p.life);
  for (const c of fx.coins) c.age += dt;
  fx.coins = fx.coins.filter(c => c.age < c.life);
  for (const p of fx.popups) { p.age += dt; p.y -= (p.big ? 30 : 55) * dt; }
  fx.popups = fx.popups.filter(p => p.age < p.life);
  for (const b of fx.bolts) b.age += dt;
  fx.bolts = fx.bolts.filter(b => b.age < b.life);
  if (fx.banners.length) { fx.banners[0].age += dt; if (fx.banners[0].age >= fx.banners[0].life) fx.banners.shift(); }
  if (fx.flash) { fx.flash.a -= dt * 1.6; if (fx.flash.a <= 0) fx.flash = null; }
  fx.shake = Math.max(0, fx.shake - dt * 2);
}

function coin(ctx, x, y, r, spin) {
  const w = Math.abs(Math.cos(spin)) * r + 1.5;
  ctx.beginPath(); ctx.ellipse(x, y, w, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#B86E00'; ctx.stroke();
}

/** World-layer effects (under the HUD). */
export function drawFxWorld(ctx, fx) {
  for (const n of fx.nets) {
    const k = n.age / n.life, r = n.r * (0.6 + 0.4 * easeOut(Math.min(1, k * 2.2)));
    ctx.save(); ctx.globalAlpha = 1 - k * k; ctx.shadowColor = C.glow; ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(191,239,255,0.95)'; ctx.lineWidth = 2;
    for (let j = 1; j <= 3; j++) { ctx.beginPath(); ctx.arc(n.x, n.y, r * j / 3, 0, 7); ctx.stroke(); }
    for (let a = 0; a < 12; a++) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.x + Math.cos(a * Math.PI / 6) * r, n.y + Math.sin(a * Math.PI / 6) * r); ctx.stroke(); }
    ctx.restore();
  }
  for (const b of fx.bolts) {
    ctx.save(); ctx.globalAlpha = 1 - b.age / b.life; ctx.shadowColor = '#FFF59A'; ctx.shadowBlur = 24;
    for (const path of b.segs) {
      ctx.beginPath(); path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,240,140,0.6)'; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = C.white; ctx.stroke();
    }
    ctx.restore();
  }
  for (const p of fx.parts) {
    ctx.globalAlpha = 1 - p.age / p.life;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = p.color; ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of fx.popups) {
    const a = p.age > p.life * 0.6 ? 1 - (p.age - p.life * 0.6) / (p.life * 0.4) : 1;
    const s = p.age < 0.12 ? 0.6 + 0.4 * (p.age / 0.12) : 1;
    goldText(ctx, p.str, p.x, p.y, p.size * s, 'center', a);
  }
}

/** Overlay effects (above the HUD): flying coins, banners, flash. */
export function drawFxOverlay(ctx, fx) {
  for (const c of fx.coins) {
    if (c.age < 0) continue;
    const k = easeOut(c.age / c.life);
    const x = lerp(c.x0, c.x1, k), y = lerp(c.y0, c.y1, k) - Math.sin(k * Math.PI) * 80;
    coin(ctx, x, y, 9, c.spin + c.age * 14);
  }
  const b = fx.banners[0];
  if (b) {
    const k = b.age / b.life, a = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1;
    ctx.save(); ctx.globalAlpha = a;
    if (b.tier === 3) { ctx.fillStyle = 'rgba(4,14,26,0.5)'; ctx.fillRect(0, 0, 1280, 720); }
    const cx = 640, cy = b.tier === 3 ? 330 : 230;
    // light burst
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.age * 0.8);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -320); ctx.lineTo(30, -320); ctx.closePath();
      ctx.fillStyle = 'rgba(255,201,60,0.13)'; ctx.fill();
    }
    ctx.restore();
    const rg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260); rg.addColorStop(0, 'rgba(255,201,60,0.45)'); rg.addColorStop(1, 'rgba(255,201,60,0)');
    ctx.fillStyle = rg; ctx.fillRect(cx - 300, cy - 200, 600, 400);
    const pop = k < 0.15 ? 0.5 + 0.5 * easeOut(k / 0.15) : 1;
    T(ctx, b.tier === 3 ? 'MEGA CATCH!' : 'BIG CATCH!', cx, cy - 58 * pop, { size: (b.tier === 3 ? 46 : 34) * pop, w: 900, align: 'center', fill: C.white, sw: 8 });
    const shown = Math.round(b.amount * Math.min(1, k / 0.5));
    goldText(ctx, '+' + shown.toLocaleString('en-US'), cx, cy + 8, (b.tier === 3 ? 110 : 78) * pop);
    if (b.label) T(ctx, b.label, cx, cy + 80, { size: 24, w: 800, align: 'center', fill: C.ice, sw: 5 });
    ctx.restore();
  }
  if (fx.flash) { ctx.globalAlpha = Math.max(0, fx.flash.a); ctx.fillStyle = fx.flash.color; ctx.fillRect(0, 0, 1280, 720); ctx.globalAlpha = 1; }
}
