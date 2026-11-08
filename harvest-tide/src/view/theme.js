// Harvest Tide palette and drawing helpers (spec Section 6).
export const C = Object.freeze({
  abyss: '#06223F', sea: '#0B4F7A', glow: '#3FE3FF', ice: '#BFEFFF', gold: '#FFC93C',
  coral: '#FF5E8A', lime: '#C6FF4A', ink: '#081521', white: '#FFFFFF', red: '#FF4D5E',
});

/** Older names used by art.js (shared fish drawings). */
export const PAL = Object.freeze({
  ink: C.ink, white: C.white, gold: '#F2B43A', hazard: '#D9534F', safe: '#5CB85C', sky: '#F4E3C1',
});

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function T(ctx, s, x, y, { size = 24, w = 800, align = 'left', base = 'alphabetic', fill = C.white,
  stroke = C.ink, sw = 6, a = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = `${w} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = base;
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
  ctx.restore();
}

/** Big gold number with a dark outline and a vertical shine. */
export function goldText(ctx, s, x, y, size, align = 'center', a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, size * 0.16); ctx.strokeStyle = C.ink; ctx.strokeText(s, x, y);
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#FFF6C2'); g.addColorStop(0.5, C.gold); g.addColorStop(1, '#E08A00');
  ctx.fillStyle = g; ctx.fillText(s, x, y);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillStroke(ctx, fill, stroke = C.ink, lw = 2) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

export function starPath(ctx, x, y, r, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * inner : r;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/** Frosted-glass panel. */
export function frost(ctx, x, y, w, h, r = 16, { glow = false, alpha = 0.62 } = {}) {
  ctx.save();
  if (glow) { ctx.shadowColor = C.glow; ctx.shadowBlur = 18; }
  roundRect(ctx, x, y, w, h, r); ctx.fillStyle = `rgba(8,40,70,${alpha})`; ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, r); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(191,239,255,0.85)'; ctx.stroke();
  roundRect(ctx, x + 3, y + 3, w - 6, h * 0.42, Math.max(2, r - 3)); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
}

/** Glossy button. Returns its rect for hit-testing. */
export function button(ctx, label, x, y, w, h, { primary = false, disabled = false, size = 30, sub = null } = {}) {
  ctx.save();
  ctx.globalAlpha = disabled ? 0.45 : 1;
  if (primary) {
    ctx.shadowColor = C.gold; ctx.shadowBlur = 24;
    roundRect(ctx, x, y, w, h, 20);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#FFE58A'); g.addColorStop(1, '#F29A00');
    ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    roundRect(ctx, x + 6, y + 5, w - 12, h * 0.4, 14); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  } else {
    frost(ctx, x, y, w, h, 20, { glow: true });
  }
  ctx.restore();
  const ty = sub ? y + h / 2 - 10 : y + h / 2 + 2;
  T(ctx, label, x + w / 2, ty, { size, w: 900, align: 'center', base: 'middle', fill: primary ? C.ink : C.white,
    stroke: primary ? null : C.ink, a: disabled ? 0.5 : 1 });
  if (sub) T(ctx, sub, x + w / 2, y + h / 2 + 22, { size: 17, w: 700, align: 'center', base: 'middle',
    fill: primary ? C.ink : C.ice, stroke: null, a: disabled ? 0.5 : 0.9 });
  return { x, y, w, h };
}

export function hit(r, p) { return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function easeOut(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
