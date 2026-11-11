// Harvest Tide palette, text, panels, buttons, icons and small cached sprites (spec Section 6).
import { ART } from '../platform/images.js';

export const C = Object.freeze({
  abyss: '#06223F', sea: '#0B4F7A', glow: '#3FE3FF', ice: '#BFEFFF', gold: '#FFC93C',
  coral: '#FF5E8A', lime: '#C6FF4A', ink: '#081521', white: '#FFFFFF', red: '#FF4D5E', violet: '#9B6BFF',
});

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const TAU = Math.PI * 2;

export function T(ctx, s, x, y, { size = 24, w = 800, align = 'left', base = 'alphabetic', fill = C.white,
  stroke = C.ink, sw = 6, a = 1, maxW = 0 } = {}) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = `${w} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = base;
  if (maxW) { const mw = ctx.measureText(s).width; if (mw > maxW) { ctx.font = `${w} ${Math.floor(size * maxW / mw)}px ${FONT}`; } }
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
  ctx.restore();
}

/** Big gold number with a dark outline and a vertical shine. */
export function goldText(ctx, s, x, y, size, align = 'center', a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, size * 0.17); ctx.strokeStyle = C.ink; ctx.strokeText(s, x, y);
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#FFFBE0'); g.addColorStop(0.45, C.gold); g.addColorStop(1, '#E07A00');
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
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
}

/** Frosted-glass panel. */
export function frost(ctx, x, y, w, h, r = 16, { glow = false, alpha = 0.62, border = 'rgba(191,239,255,0.85)', glowColor = C.glow } = {}) {
  ctx.save();
  if (glow) { ctx.shadowColor = glowColor; ctx.shadowBlur = 20; }
  roundRect(ctx, x, y, w, h, r);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgba(20,70,110,${alpha})`); g.addColorStop(1, `rgba(6,30,58,${alpha + 0.08})`);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, r); ctx.lineWidth = 2.5; ctx.strokeStyle = border; ctx.stroke();
  roundRect(ctx, x + 3, y + 3, w - 6, h * 0.42, Math.max(2, r - 3)); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
}

/** Glossy button. Returns its rect for hit-testing. */
export function button(ctx, label, x, y, w, h, { primary = false, disabled = false, size = 30, sub = null, pressed = false, color = null } = {}) {
  ctx.save();
  ctx.globalAlpha = disabled ? 0.45 : 1;
  const dy = pressed ? 3 : 0;
  if (primary || color) {
    const [c0, c1] = color || ['#FFE58A', '#F29A00'];
    roundRect(ctx, x, y + 6, w, h, 22); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.shadowColor = c1; ctx.shadowBlur = 26;
    roundRect(ctx, x, y + dy, w, h, 22);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    roundRect(ctx, x + 8, y + dy + 6, w - 16, h * 0.38, 14); ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill();
  } else {
    frost(ctx, x, y + dy, w, h, 22, { glow: true });
  }
  ctx.restore();
  const ty = (sub ? y + h / 2 - 12 : y + h / 2 + 2) + dy;
  const dark = primary || color;
  T(ctx, label, x + w / 2, ty, { size, w: 900, align: 'center', base: 'middle', fill: dark ? C.ink : C.white,
    stroke: dark ? null : C.ink, a: disabled ? 0.5 : 1, maxW: w - 24 });
  if (sub) T(ctx, sub, x + w / 2, y + h / 2 + 24 + dy, { size: 19, w: 700, align: 'center', base: 'middle',
    fill: dark ? C.ink : C.ice, stroke: null, a: disabled ? 0.5 : 0.92, maxW: w - 24 });
  return { x, y, w, h };
}

/** Round icon button (64–80 px). Returns rect. */
export function iconButton(ctx, icon, x, y, s = 72, { active = false, label = null } = {}) {
  frost(ctx, x, y, s, s, s * 0.28, { glow: active, glowColor: C.gold, border: active ? C.gold : 'rgba(191,239,255,0.85)' });
  drawIcon(ctx, icon, x + s / 2, y + s / 2 - (label ? 6 : 0), s * 0.42, active ? C.gold : C.ice);
  if (label) T(ctx, label, x + s / 2, y + s - 9, { size: 13, w: 800, align: 'center', fill: C.ice, stroke: null });
  return { x, y, w: s, h: s };
}

/** Toggle switch row. Returns the clickable rect. */
export function toggle(ctx, label, on, x, y, w = 560) {
  frost(ctx, x, y, w, 64, 18, { alpha: 0.5 });
  T(ctx, label, x + 24, y + 41, { size: 24, w: 800, stroke: null, maxW: w - 140 });
  const tx = x + w - 104, ty = y + 14;
  roundRect(ctx, tx, ty, 80, 36, 18);
  ctx.fillStyle = on ? '#3BD16F' : 'rgba(8,21,33,0.8)'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = on ? '#B9FFD0' : 'rgba(191,239,255,0.6)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(on ? tx + 62 : tx + 18, ty + 18, 14, 0, TAU); ctx.fillStyle = C.white; ctx.fill();
  T(ctx, on ? 'ON' : 'OFF', on ? tx + 26 : tx + 54, ty + 24, { size: 13, w: 900, align: 'center', fill: on ? '#063A1A' : C.ice, stroke: null });
  return { x, y, w, h: 64 };
}

export function hit(r, p) { return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function easeOut(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
export function easeBack(t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
export function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

// ---------- cached sprites ----------
let glowSprite = null, coinFrames = null;

/** Soft round glow (white); tint by drawing with globalCompositeOperation or use coloured variants. */
export function glow(color = '255,255,255') {
  glowSprite = glowSprite || {};
  if (glowSprite[color]) return glowSprite[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, `rgba(${color},1)`); rg.addColorStop(0.35, `rgba(${color},0.45)`); rg.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  return (glowSprite[color] = c);
}

function makeCoinFrames() {
  const frames = [];
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'); g.translate(24, 24);
    const sx = Math.max(0.12, Math.abs(Math.cos(i / 8 * Math.PI)));
    g.scale(sx, 1);
    g.beginPath(); g.arc(0, 0, 20, 0, TAU);
    const rg = g.createRadialGradient(-6, -7, 2, 0, 0, 22); rg.addColorStop(0, '#FFF7C9'); rg.addColorStop(0.5, '#FFC93C'); rg.addColorStop(1, '#C27400');
    g.fillStyle = rg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#7A4500'; g.stroke();
    g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(160,90,0,0.8)'; g.stroke();
    starPath(g, 0, 0, 8, 0.45); g.fillStyle = '#FFE58A'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#A35F00'; g.stroke();
    frames.push(c);
  }
  return frames;
}

/** Spinning gold coin. */
export function drawCoin(ctx, x, y, r = 12, spin = 0) {
  if (ART.coin) { const s = r * 2.1; ctx.drawImage(ART.coin, x - s / 2, y - s / 2, s, s); return; }
  coinFrames = coinFrames || makeCoinFrames();
  const f = coinFrames[((Math.floor(spin * 8) % 8) + 8) % 8];
  ctx.drawImage(f, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
}

// ---------- icons (line icons drawn in code) ----------
export function drawIcon(ctx, name, x, y, s, color = C.ice) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2.5, s * 0.14); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const k = s;
  switch (name) {
    case 'pause': ctx.fillRect(-k * 0.42, -k * 0.55, k * 0.3, k * 1.1); ctx.fillRect(k * 0.12, -k * 0.55, k * 0.3, k * 1.1); break;
    case 'play': ctx.beginPath(); ctx.moveTo(-k * 0.35, -k * 0.55); ctx.lineTo(k * 0.55, 0); ctx.lineTo(-k * 0.35, k * 0.55); ctx.closePath(); ctx.fill(); break;
    case 'gear': {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? k * 0.62 : k * 0.82; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, k * 0.28, 0, TAU); ctx.fill();
      break;
    }
    case 'trophy':
      ctx.beginPath(); ctx.moveTo(-k * 0.5, -k * 0.6); ctx.lineTo(k * 0.5, -k * 0.6); ctx.quadraticCurveTo(k * 0.5, k * 0.15, 0, k * 0.2); ctx.quadraticCurveTo(-k * 0.5, k * 0.15, -k * 0.5, -k * 0.6); ctx.fill();
      ctx.beginPath(); ctx.arc(-k * 0.55, -k * 0.3, k * 0.22, 1.2, 4.6); ctx.stroke(); ctx.beginPath(); ctx.arc(k * 0.55, -k * 0.3, k * 0.22, -1.5, 1.9); ctx.stroke();
      ctx.fillRect(-k * 0.08, k * 0.2, k * 0.16, k * 0.3); ctx.fillRect(-k * 0.35, k * 0.48, k * 0.7, k * 0.16);
      break;
    case 'help':
      ctx.beginPath(); ctx.arc(0, -k * 0.2, k * 0.36, Math.PI * 1.05, Math.PI * 2.35); ctx.lineTo(0, k * 0.22); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, k * 0.55, k * 0.1, 0, TAU); ctx.fill();
      break;
    case 'fullscreen':
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.beginPath(); ctx.moveTo(sx * k * 0.6, sy * k * 0.2); ctx.lineTo(sx * k * 0.6, sy * k * 0.6); ctx.lineTo(sx * k * 0.2, sy * k * 0.6); ctx.stroke();
      }
      break;
    case 'home':
      ctx.beginPath(); ctx.moveTo(-k * 0.65, 0); ctx.lineTo(0, -k * 0.6); ctx.lineTo(k * 0.65, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-k * 0.45, -k * 0.1); ctx.lineTo(-k * 0.45, k * 0.6); ctx.lineTo(k * 0.45, k * 0.6); ctx.lineTo(k * 0.45, -k * 0.1); ctx.stroke();
      break;
    case 'back':
      ctx.beginPath(); ctx.moveTo(k * 0.25, -k * 0.55); ctx.lineTo(-k * 0.3, 0); ctx.lineTo(k * 0.25, k * 0.55); ctx.stroke();
      break;
    case 'next':
      ctx.beginPath(); ctx.moveTo(-k * 0.25, -k * 0.55); ctx.lineTo(k * 0.3, 0); ctx.lineTo(-k * 0.25, k * 0.55); ctx.stroke();
      break;
    case 'close':
      ctx.beginPath(); ctx.moveTo(-k * 0.45, -k * 0.45); ctx.lineTo(k * 0.45, k * 0.45); ctx.moveTo(k * 0.45, -k * 0.45); ctx.lineTo(-k * 0.45, k * 0.45); ctx.stroke();
      break;
    case 'freeze':
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, -k * 0.8); ctx.lineTo(0, k * 0.8); ctx.stroke();
        for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, sgn * k * 0.5); ctx.lineTo(k * 0.22, sgn * k * 0.72); ctx.moveTo(0, sgn * k * 0.5); ctx.lineTo(-k * 0.22, sgn * k * 0.72); ctx.stroke(); }
        ctx.restore();
      }
      break;
    case 'lockon':
      ctx.beginPath(); ctx.arc(0, 0, k * 0.55, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, k * 0.18, 0, TAU); ctx.fill();
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { ctx.beginPath(); ctx.moveTo(dx * k * 0.4, dy * k * 0.4); ctx.lineTo(dx * k * 0.9, dy * k * 0.9); ctx.stroke(); }
      break;
    case 'lightning':
      ctx.beginPath(); ctx.moveTo(k * 0.2, -k * 0.85); ctx.lineTo(-k * 0.45, k * 0.1); ctx.lineTo(0, k * 0.1); ctx.lineTo(-k * 0.2, k * 0.85); ctx.lineTo(k * 0.5, -k * 0.15); ctx.lineTo(k * 0.02, -k * 0.15); ctx.closePath(); ctx.fill();
      break;
    case 'clover':
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2 + Math.PI / 4); ctx.beginPath(); ctx.arc(0, -k * 0.32, k * 0.3, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(k * 0.2, k * 0.5, k * 0.45, k * 0.8); ctx.stroke();
      break;
    case 'music':
      ctx.beginPath(); ctx.arc(-k * 0.35, k * 0.45, k * 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(k * 0.45, k * 0.3, k * 0.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-k * 0.17, k * 0.45); ctx.lineTo(-k * 0.17, -k * 0.55); ctx.lineTo(k * 0.63, -k * 0.7); ctx.lineTo(k * 0.63, k * 0.3); ctx.stroke();
      break;
  }
  ctx.restore();
}

/** Power-up icon: a PNG from assets/ui/ if provided, else the drawn icon. */
export function drawPowerIcon(ctx, id, x, y, s, color) {
  const img = ART[id];
  if (img) { const w = s * 2.1, h = w * img.height / img.width; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); return; }
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 18;
  drawIcon(ctx, id, x, y, s, color);
  ctx.restore();
}
