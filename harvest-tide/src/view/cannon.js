// Cannon (changes look with cannon level), lucky ring, aim guide and bullets.
import { C, glow, starPath, roundRect, T } from './theme.js';
import { ART } from '../platform/images.js';
import { aimDir } from '../sim/shots.js';
import { luckyNeed } from '../sim/catch.js';

const TAU = Math.PI * 2;
const STYLE = {
  arcade: { c: ['#F1E6FF', '#A47BFF', '#4B2AB0'], barrels: 2, len: 92, w: 20, glow: '#B79BFF' },
  1:      { c: ['#FFE2B8', '#D2873A', '#6E3A10'], barrels: 1, len: 82, w: 24, glow: '#FFB86B' },
  2:      { c: ['#FFFFFF', '#B5CCE0', '#4D6478'], barrels: 2, len: 90, w: 18, glow: '#BFEFFF' },
  3:      { c: ['#FFF8CF', '#FFC21A', '#B56A00'], barrels: 3, len: 100, w: 16, glow: '#FFD54A' },
};

/** Visual tier: Arcade style, or 1–3 by Treasure Reef cannon level. */
export function cannonTier(S) {
  if (S.mode === 'arcade') return 'arcade';
  return S.level <= 2 ? 1 : S.level <= 5 ? 2 : 3;
}

function luckyFrac(S) { return S.lucky.ready ? 1 : S.lucky.fill / luckyNeed(S); }

export function drawCannon(ctx, S, V) {
  const c = S.cfg.cannon.pos, tier = cannonTier(S), st = STYLE[tier];
  const d = aimDir(S.cfg, S.aim.x, S.aim.y);
  const ang = Math.atan2(d.y, d.x);
  const recoil = V.recoil * 12;
  const ready = S.lucky.ready;
  const t = V.t;
  // platform
  ctx.save();
  ctx.shadowColor = ready ? C.gold : S.combo.feverActive ? C.lime : st.glow; ctx.shadowBlur = ready ? 40 : 26;
  ctx.beginPath(); ctx.arc(c.x, c.y + 14, 74, Math.PI, 0); ctx.closePath();
  const pg = ctx.createLinearGradient(0, c.y - 60, 0, c.y + 14);
  pg.addColorStop(0, '#2B5577'); pg.addColorStop(1, '#0D2236');
  ctx.fillStyle = pg; ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(c.x, c.y + 14, 74, Math.PI, 0); ctx.lineWidth = 4; ctx.strokeStyle = C.ice; ctx.stroke();
  // lucky ring
  const lf = luckyFrac(S);
  ctx.beginPath(); ctx.arc(c.x, c.y + 14, 86, Math.PI, 0); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(8,21,33,0.75)'; ctx.stroke();
  if (lf > 0) {
    ctx.save();
    if (ready) { ctx.shadowColor = C.gold; ctx.shadowBlur = 24 + 10 * Math.sin(t * 8); }
    ctx.beginPath(); ctx.arc(c.x, c.y + 14, 86, Math.PI, Math.PI + Math.PI * lf);
    const lg = ctx.createLinearGradient(c.x - 86, 0, c.x + 86, 0); lg.addColorStop(0, '#7CFF6B'); lg.addColorStop(1, C.gold);
    ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = lg; ctx.stroke();
    ctx.restore();
  }
  // turret
  const img = ART[tier === 'arcade' ? 'cannon-arcade' : 'cannon-' + tier] || (tier === 'arcade' ? ART['cannon-2'] : null);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(ang);
  ctx.translate(-recoil, 0);
  if (img) {
    // painted cannon: barrel points up in the file; pivot 25% up from the bottom edge
    const h = 150 + (S.mode === 'reef' ? (S.level - 1) * 4 : 8), w = h * img.width / img.height;
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -w / 2, -h * 0.75, w, h);
  } else {
    const len = st.len + (S.mode === 'reef' ? (S.level - 1) * 3 : 0), n = st.barrels, bw = st.w;
    const spread = n === 1 ? [0] : n === 2 ? [-12, 12] : [-18, 0, 18];
    for (const off of spread) {
      roundRect(ctx, 6, off - bw / 2, len, bw, bw * 0.45);
      const g = ctx.createLinearGradient(0, off - bw / 2, 0, off + bw / 2);
      g.addColorStop(0, st.c[0]); g.addColorStop(0.5, st.c[1]); g.addColorStop(1, st.c[2]);
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
      roundRect(ctx, len - 6, off - bw / 2 - 5, 18, bw + 10, 6);
      ctx.fillStyle = S.jamLeft > 0 ? C.coral : ready ? C.gold : st.c[1]; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, off - bw * 0.22); ctx.lineTo(len - 10, off - bw * 0.22); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
    }
    if (S.mode === 'reef' && S.level === 7) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 5);
      ctx.drawImage(glow('255,220,120'), len - 40, -50, 100, 100); ctx.restore();
    }
    // muzzle flash
    if (V.recoil > 0.55) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const s = 40 * V.recoil;
      for (const off of spread) { starPath(ctx, len + 16, off, s * 0.6, 0.35); ctx.fillStyle = ready ? 'rgba(255,220,120,0.9)' : 'rgba(190,250,255,0.9)'; ctx.fill(); }
      ctx.restore();
    }
  }
  ctx.restore();
  // hub
  ctx.beginPath(); ctx.arc(c.x, c.y, 34, 0, TAU);
  const hg = ctx.createRadialGradient(c.x - 10, c.y - 10, 4, c.x, c.y, 34);
  hg.addColorStop(0, '#FFFFFF'); hg.addColorStop(0.5, ready ? '#FFE07A' : st.c[1]); hg.addColorStop(1, st.c[2]);
  ctx.fillStyle = hg; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.ink; ctx.stroke();
  if (S.mode === 'reef') T(ctx, String(S.level), c.x, c.y + 2, { size: 26, w: 900, align: 'center', base: 'middle', fill: C.white, sw: 5 });
  // status
  if (S.reloadLeft > 0) {
    const k = 1 - S.reloadLeft / S.cfg.cannon.arcade.reloadTicks;
    ctx.beginPath(); ctx.arc(c.x, c.y, 44, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.lineWidth = 6; ctx.strokeStyle = C.glow; ctx.stroke();
    T(ctx, 'RELOADING', c.x, c.y - 100, { size: 18, w: 900, align: 'center', fill: C.glow, sw: 5 });
  } else if (S.jamLeft > 0) T(ctx, 'STUNG!', c.x, c.y - 100, { size: 22, w: 900, align: 'center', fill: C.coral, sw: 6 });
  else if (ready) T(ctx, S.mode === 'reef' ? 'LUCKY SHOT READY!' : 'LUCKY CATCH READY!', c.x, c.y - 100,
    { size: 20 + Math.sin(t * 8) * 1.5, w: 900, align: 'center', fill: C.gold, sw: 6 });
}

/** Dotted aim line (with wall bounces) while the player is touching. */
export function drawAimGuide(ctx, S, t) {
  if (S.pointer.activeId === null || S.state !== 'PLAYING') return;
  const cfg = S.cfg, F = cfg.field, d = aimDir(cfg, S.aim.x, S.aim.y);
  let x = cfg.cannon.pos.x + d.x * cfg.cannon.muzzlePx, y = cfg.cannon.pos.y + d.y * cfg.cannon.muzzlePx, dx = d.x, dy = d.y;
  const step = 4, total = 1000, gap = 24;
  let dist = 0, nextDot = (t * 60) % gap;
  ctx.save();
  while (dist < total) {
    x += dx * step; y += dy * step; dist += step;
    if (x < F.x0) { x = 2 * F.x0 - x; dx = -dx; }
    if (x > F.x1) { x = 2 * F.x1 - x; dx = -dx; }
    if (y < F.y0) { y = 2 * F.y0 - y; dy = -dy; }
    if (dist >= nextDot) {
      nextDot += gap;
      const a = 0.75 * (1 - dist / total);
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fillStyle = `rgba(220,250,255,${a})`; ctx.fill();
    }
  }
  ctx.restore();
  // finger marker
  ctx.beginPath(); ctx.arc(S.aim.x, S.aim.y, 18, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(220,250,255,0.6)'; ctx.stroke();
}

export function drawBullets(ctx, S, t) {
  const tier = cannonTier(S);
  const col = S.mode === 'arcade' ? '63,227,255' : tier === 3 ? '255,210,90' : tier === 2 ? '200,240,255' : '255,170,90';
  ctx.save();
  ctx.lineCap = 'round';
  for (const b of S.bullets) {
    const lucky = b.lucky, c = lucky ? '255,210,60' : col, r = lucky ? 13 : 9;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(${c},0.5)`; ctx.lineWidth = r;
    ctx.beginPath(); ctx.moveTo(b.x - b.dx * 40, b.y - b.dy * 40); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.drawImage(glow(c), b.x - r * 3, b.y - r * 3, r * 6, r * 6);
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.6, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    if (lucky) { starPath(ctx, b.x, b.y, 10 + Math.sin(t * 20) * 2, 0.4); ctx.fillStyle = 'rgba(255,240,150,0.9)'; ctx.fill(); }
  }
  ctx.restore();
}
