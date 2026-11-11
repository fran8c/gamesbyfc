// Code-drawn sea creatures (spec 6). Each species is pre-rendered into a few animation frames
// (sprites), so drawing 30 detailed fish per frame stays cheap on phones.
// A PNG in assets/ (see platform/images.js) replaces the drawn version.
import { ART } from '../platform/images.js';

const INK = '#0A1826';
const FRAMES = 8;
const SPR = 1.5;              // sprite resolution (× spec size) — sharp on high-density screens
const PAD = 1.55;             // room around the body for fins, tentacles and glow
const PAD_BY = { golden_koi: 2.0, lionfish: 2.1, snapper: 1.8, turtle: 1.7 };

export const SIZES = {
  sardine: [44, 18], clownfish: [46, 30], snapper: [64, 32], puffer: [52, 52], lionfish: [84, 50],
  turtle: [130, 96], manta: [170, 110], golden_koi: [92, 44], octopus_king: [230, 220], jellyfish: [48, 64], capsule: [44, 44],
};
const ANIM_RATE = { sardine: 3.2, clownfish: 2.6, snapper: 2.2, puffer: 1.8, lionfish: 1.4, turtle: 0.9, manta: 0.7,
  golden_koi: 2.0, octopus_king: 0.8, jellyfish: 0.9, capsule: 1.2 };

// ---------- drawing helpers ----------
const TAU = Math.PI * 2;
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function rgrad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function line(ctx, w, c = INK) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function eye(ctx, x, y, r, iris = '#1A1A1A') {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill(); line(ctx, Math.max(1, r * 0.28));
  ctx.beginPath(); ctx.arc(x + r * 0.22, y + r * 0.05, r * 0.62, 0, TAU); ctx.fillStyle = iris; ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.08, r * 0.34, 0, TAU); ctx.fillStyle = '#05080C'; ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.05, y - r * 0.3, r * 0.26, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
}
function shine(ctx, x, y, rx, ry, a = 0.38, rot = -0.15) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.restore();
}
/** Streamlined fish body: nose at +L/2, tail joint at -0.36 L. */
function bodyPath(ctx, L, H, { nose = 0.42, belly = 0.5 } = {}) {
  ctx.beginPath();
  ctx.moveTo(L / 2, 0);
  ctx.bezierCurveTo(L * nose, -H * 0.56, -L * 0.1, -H * 0.62, -L * 0.36, -H * 0.15);
  ctx.lineTo(-L * 0.36, H * 0.15);
  ctx.bezierCurveTo(-L * 0.1, H * 0.62, L * nose, H * belly, L / 2, 0);
  ctx.closePath();
}
function tailPath(ctx, jx, jh, len, spread, wag) {
  ctx.beginPath();
  ctx.moveTo(jx + 3, -jh);
  ctx.quadraticCurveTo(jx - len * 0.45, -spread * 0.35 + wag * 0.6, jx - len, -spread + wag);
  ctx.quadraticCurveTo(jx - len * 0.62, wag * 0.8, jx - len, spread + wag);
  ctx.quadraticCurveTo(jx - len * 0.45, spread * 0.35 + wag * 0.6, jx + 3, jh);
  ctx.closePath();
}
function finRays(ctx, x0, y0, pts, color) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha *= 0.6;
  for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke(); }
  ctx.restore();
}
function star(ctx, x, y, r, inner = 0.42) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

// ---------- species ----------
function sardine(ctx, p) {
  const L = 44, H = 18, wag = Math.sin(p * TAU) * 3;
  tailPath(ctx, -L * 0.36, H * 0.15, 11, 8, wag);
  ctx.fillStyle = vgrad(ctx, -8, 8, [[0, '#5B8DB8'], [1, '#C9E2F2']]); ctx.fill(); line(ctx, 1.4);
  ctx.beginPath(); ctx.moveTo(-2, -H * 0.42); ctx.lineTo(-8, -H * 0.72); ctx.lineTo(-12, -H * 0.36); ctx.closePath();
  ctx.fillStyle = '#6E9CC4'; ctx.fill(); line(ctx, 1.2);
  bodyPath(ctx, L, H);
  ctx.fillStyle = vgrad(ctx, -H / 2, H / 2, [[0, '#2C5C8E'], [0.42, '#8FBCDC'], [0.58, '#E4F2FB'], [1, '#FFFFFF']]); ctx.fill();
  ctx.save(); bodyPath(ctx, L, H); ctx.clip();
  ctx.beginPath(); ctx.moveTo(-L * 0.36, -1); ctx.quadraticCurveTo(0, -3, L * 0.42, -1); ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(120,230,255,0.9)'; ctx.stroke();
  ctx.fillStyle = 'rgba(20,40,70,0.55)';
  for (const x of [-10, -4, 2, 8]) { ctx.beginPath(); ctx.arc(x, -4.5, 1.3, 0, TAU); ctx.fill(); }
  ctx.restore();
  bodyPath(ctx, L, H); line(ctx, 1.5);
  shine(ctx, 4, -4, 12, 2.4, 0.45);
  eye(ctx, 14, -1.5, 2.9);
}

function clownfish(ctx, p) {
  const L = 46, H = 30, wag = Math.sin(p * TAU) * 3;
  tailPath(ctx, -L * 0.36, H * 0.13, 10, 10, wag);
  ctx.fillStyle = '#FF7A12'; ctx.fill(); line(ctx, 1.6);
  ctx.beginPath(); ctx.moveTo(-13, -12); ctx.quadraticCurveTo(-4, -22, 8, -12); ctx.closePath();
  ctx.fillStyle = '#FF8A1F'; ctx.fill(); line(ctx, 1.6);
  ctx.beginPath(); ctx.moveTo(-15, 11); ctx.quadraticCurveTo(-8, 19, -1, 12); ctx.closePath();
  ctx.fillStyle = '#FF8A1F'; ctx.fill(); line(ctx, 1.6);
  bodyPath(ctx, L, H, { nose: 0.45, belly: 0.56 });
  ctx.fillStyle = vgrad(ctx, -H / 2, H / 2, [[0, '#FF5200'], [0.5, '#FF8E1F'], [1, '#FFC46B']]); ctx.fill();
  ctx.save(); bodyPath(ctx, L, H, { nose: 0.45, belly: 0.56 }); ctx.clip();
  for (const [x, w, bend] of [[11, 6, 3], [-3, 7, 2], [-15, 5, 1]]) {
    ctx.beginPath(); ctx.moveTo(x - w / 2 + bend, -18); ctx.quadraticCurveTo(x - w / 2 - bend, 0, x - w / 2 + bend, 18);
    ctx.lineTo(x + w / 2 + bend, 18); ctx.quadraticCurveTo(x + w / 2 - bend, 0, x + w / 2 + bend, -18); ctx.closePath();
    ctx.fillStyle = '#FFFFFF'; ctx.fill(); line(ctx, 1.6, '#151515');
  }
  ctx.restore();
  bodyPath(ctx, L, H, { nose: 0.45, belly: 0.56 }); line(ctx, 1.8);
  ctx.beginPath(); ctx.ellipse(2, 5, 6, 3, 0.5 + Math.sin(p * TAU) * 0.25, 0, TAU); ctx.fillStyle = '#FF9A35'; ctx.fill(); line(ctx, 1.3);
  shine(ctx, 3, -7, 12, 3.2, 0.4);
  eye(ctx, 15.5, -3, 4.2, '#2B1608');
}

function snapper(ctx, p) {
  const L = 64, H = 32, wag = Math.sin(p * TAU) * 4;
  tailPath(ctx, -L * 0.36, H * 0.15, 16, 13, wag);
  ctx.fillStyle = vgrad(ctx, -13, 13, [[0, '#C4223E'], [1, '#FF8C9A']]); ctx.fill(); line(ctx, 1.8);
  // spiny dorsal fin
  ctx.beginPath(); ctx.moveTo(-14, -13);
  for (let i = 0; i <= 6; i++) { const x = -14 + i * 4.5; ctx.lineTo(x + 1, -23 - (i % 2 ? 0 : 3) + Math.sin(p * TAU + i) * 0.8); ctx.lineTo(x + 3.5, -15); }
  ctx.lineTo(16, -12); ctx.closePath();
  ctx.fillStyle = 'rgba(226,52,79,0.9)'; ctx.fill(); line(ctx, 1.5);
  ctx.beginPath(); ctx.moveTo(-12, 13); ctx.quadraticCurveTo(-4, 22, 4, 13); ctx.closePath(); ctx.fillStyle = '#E0445C'; ctx.fill(); line(ctx, 1.4);
  bodyPath(ctx, L, H, { nose: 0.38 });
  ctx.fillStyle = vgrad(ctx, -H / 2, H / 2, [[0, '#A5102F'], [0.38, '#EE4A62'], [0.7, '#FF9DAA'], [1, '#FFE3E7']]); ctx.fill();
  ctx.save(); bodyPath(ctx, L, H, { nose: 0.38 }); ctx.clip();
  ctx.strokeStyle = 'rgba(120,10,30,0.28)'; ctx.lineWidth = 1;
  for (let r = -8; r <= 6; r += 5) for (let x = -20; x < 22; x += 6) { ctx.beginPath(); ctx.arc(x + (r % 2 ? 3 : 0), r, 3.2, -0.5 * Math.PI, 0.5 * Math.PI); ctx.stroke(); }
  ctx.restore();
  bodyPath(ctx, L, H, { nose: 0.38 }); line(ctx, 2);
  ctx.beginPath(); ctx.moveTo(30, 2); ctx.quadraticCurveTo(26, 5, 22, 4); line(ctx, 1.4);
  ctx.beginPath(); ctx.ellipse(6, 5, 8, 3.5, 0.6 + Math.sin(p * TAU) * 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,170,180,0.95)'; ctx.fill(); line(ctx, 1.2);
  shine(ctx, 4, -8, 18, 3.6, 0.38);
  eye(ctx, 20, -4, 4.4, '#E9B40F');
}

function puffer(ctx, p, puff = 1) {
  const R = 20 * puff;
  ctx.save();
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a), len = 7 * puff + (i % 2) * 2;
    ctx.beginPath(); ctx.moveTo(c * (R - 2) - s * 2.5, s * (R - 2) + c * 2.5); ctx.lineTo(c * (R + len), s * (R + len)); ctx.lineTo(c * (R - 2) + s * 2.5, s * (R - 2) - c * 2.5); ctx.closePath();
    ctx.fillStyle = '#D9A13A'; ctx.fill(); line(ctx, 1.2);
  }
  ctx.restore();
  const flap = Math.sin(p * TAU) * 0.5;
  ctx.beginPath(); ctx.moveTo(-R + 2, 0); ctx.lineTo(-R - 10, -7 + flap * 4); ctx.lineTo(-R - 10, 7 + flap * 4); ctx.closePath();
  ctx.fillStyle = '#E9B44C'; ctx.fill(); line(ctx, 1.5);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
  ctx.fillStyle = rgrad(ctx, -6, -8, 2, R + 4, [[0, '#FFF6C4'], [0.5, '#F7CB4D'], [1, '#C88A1C']]); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
  ctx.beginPath(); ctx.ellipse(2, R * 0.55, R * 0.95, R * 0.6, 0, 0, TAU); ctx.fillStyle = 'rgba(255,250,225,0.9)'; ctx.fill();
  ctx.fillStyle = 'rgba(120,70,15,0.55)';
  for (const [x, y, r] of [[-8, -10, 2.4], [-1, -14, 2], [6, -12, 1.8], [-12, -2, 2], [-4, -5, 1.6]]) { ctx.beginPath(); ctx.arc(x * puff, y * puff, r, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); line(ctx, 2);
  ctx.beginPath(); ctx.ellipse(2, 6, 6, 3.5, -0.8 + flap, 0, TAU); ctx.fillStyle = '#F2BC45'; ctx.fill(); line(ctx, 1.2);
  ctx.beginPath(); ctx.arc(R - 1, 4, 2.6, 0, TAU); ctx.fillStyle = '#C2493B'; ctx.fill(); line(ctx, 1);
  ctx.beginPath(); ctx.ellipse(6, 2, 3, 1.8, 0, 0, TAU); ctx.fillStyle = 'rgba(255,120,120,0.45)'; ctx.fill();
  shine(ctx, -6, -11, 7, 4, 0.55, -0.5);
  eye(ctx, 9, -6, 5.6, '#3A2410');
}

function lionfish(ctx, p) {
  const L = 84, H = 46, sp = Math.sin(p * TAU) * 0.12;
  // big striped pectoral fan
  ctx.save(); ctx.translate(4, 4);
  for (let i = 0; i < 9; i++) {
    const a = 1.9 + i * 0.16 + sp, len = 40 - Math.abs(i - 4) * 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.lineWidth = 3.4; ctx.strokeStyle = i % 2 ? 'rgba(255,240,230,0.85)' : 'rgba(196,44,62,0.85)'; ctx.stroke();
  }
  ctx.restore();
  // venomous dorsal spines
  for (let i = 0; i < 11; i++) {
    const x = -18 + i * 4.6, h = 26 + Math.sin(i * 1.3) * 5 + Math.sin(p * TAU + i * 0.6) * 1.5;
    ctx.beginPath(); ctx.moveTo(x, -12); ctx.lineTo(x - 4, -12 - h);
    ctx.lineWidth = 2.2; ctx.strokeStyle = i % 2 ? '#F7E6DA' : '#B5283A'; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-20, -12); for (let i = 0; i <= 10; i++) ctx.lineTo(-18 + i * 4.6 - 3, -26 - Math.sin(i * 1.3) * 3); ctx.lineTo(28, -11); ctx.closePath();
  ctx.fillStyle = 'rgba(255,200,200,0.35)'; ctx.fill();
  // fan tail
  const w = Math.sin(p * TAU) * 3;
  ctx.beginPath(); ctx.moveTo(-28, -6); ctx.quadraticCurveTo(-46, -20 + w, -50, -2 + w); ctx.quadraticCurveTo(-46, 16 + w, -28, 6); ctx.closePath();
  ctx.fillStyle = 'rgba(255,225,225,0.75)'; ctx.fill(); line(ctx, 1.4);
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(181,40,58,0.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-28, 0, 6 + i * 5, 2.2, 4.1); ctx.stroke(); }
  ctx.restore();
  bodyPath(ctx, L * 0.78, H * 0.62, { nose: 0.36 });
  ctx.fillStyle = vgrad(ctx, -14, 14, [[0, '#F5D9C8'], [0.6, '#FFF3EA'], [1, '#FFFFFF']]); ctx.fill();
  ctx.save(); bodyPath(ctx, L * 0.78, H * 0.62, { nose: 0.36 }); ctx.clip();
  for (let x = -30; x < 34; x += 7) {
    ctx.beginPath(); ctx.moveTo(x, -16); ctx.quadraticCurveTo(x - 6, 0, x - 1, 16); ctx.lineWidth = 4; ctx.strokeStyle = '#B5283A'; ctx.stroke();
  }
  ctx.restore();
  bodyPath(ctx, L * 0.78, H * 0.62, { nose: 0.36 }); line(ctx, 2);
  shine(ctx, 4, -7, 16, 3, 0.35);
  eye(ctx, 22, -3, 4, '#B5283A');
}

function turtle(ctx, p) {
  const s = Math.sin(p * TAU), c = Math.cos(p * TAU);
  const flipper = (x, y, ang, len, w) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, -w * 0.5); ctx.quadraticCurveTo(len * 0.6, -w, len, 0); ctx.quadraticCurveTo(len * 0.6, w * 0.6, 0, w * 0.5); ctx.closePath();
    ctx.fillStyle = vgrad(ctx, -w, w, [[0, '#3E9A5B'], [1, '#7FD39A']]); ctx.fill(); line(ctx, 2);
    ctx.fillStyle = 'rgba(20,70,40,0.45)';
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.arc(len * i / 4.5, -1, 2.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  flipper(22, -30, -2.2 + s * 0.45, 46, 18);
  flipper(22, 30, 2.2 - s * 0.45, 46, 18);
  flipper(-34, -24, -2.6 - c * 0.25, 24, 12);
  flipper(-34, 24, 2.6 + c * 0.25, 24, 12);
  ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-60, -3); ctx.lineTo(-60, 3); ctx.closePath(); ctx.fillStyle = '#5DB874'; ctx.fill(); line(ctx, 1.6);
  // head
  ctx.beginPath(); ctx.ellipse(56, 0, 17, 13, 0, 0, TAU);
  ctx.fillStyle = rgrad(ctx, 52, -5, 2, 18, [[0, '#A6E6B6'], [1, '#4FA867']]); ctx.fill(); line(ctx, 2);
  ctx.fillStyle = 'rgba(20,70,40,0.35)'; for (const [x, y] of [[50, -6], [56, 6], [48, 4]]) { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
  eye(ctx, 63, -6, 3.6, '#4A2A12');
  ctx.beginPath(); ctx.arc(70, 3, 4, 0.2, 1.4); line(ctx, 1.4);
  // shell
  ctx.beginPath(); ctx.ellipse(0, 0, 52, 42, 0, 0, TAU);
  ctx.fillStyle = rgrad(ctx, -10, -14, 6, 58, [[0, '#E3A84E'], [0.6, '#B97A2C'], [1, '#7C4E1A']]); ctx.fill(); line(ctx, 3);
  ctx.beginPath(); ctx.ellipse(0, 0, 45, 35, 0, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,220,150,0.5)'; ctx.stroke();
  const hex = (hx, hy, r, fill) => {
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; ctx.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.9); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); line(ctx, 1.8, 'rgba(60,30,8,0.9)');
  };
  hex(0, 0, 13, rgrad(ctx, -3, -4, 1, 14, [[0, '#F6CC77'], [1, '#C98A3A']]));
  for (const [hx, hy] of [[-22, -14], [22, -14], [-22, 14], [22, 14], [-34, 0], [34, 0]]) hex(hx, hy, 10, rgrad(ctx, hx - 2, hy - 3, 1, 11, [[0, '#EFBF66'], [1, '#B47528']]));
  shine(ctx, -12, -22, 18, 6, 0.35, -0.3);
}

function manta(ctx, p) {
  const f = Math.sin(p * TAU) * 16;
  ctx.beginPath(); ctx.moveTo(-50, 0); ctx.quadraticCurveTo(-100, 4, -128, 10 + f * 0.2); line(ctx, 3.2, '#2A1D52');
  const wing = () => {
    ctx.beginPath();
    ctx.moveTo(62, 0);
    ctx.bezierCurveTo(48, -26, 20, -58 - f, -18, -74 - f);
    ctx.quadraticCurveTo(-10, -30, -58, 0);
    ctx.quadraticCurveTo(-10, 30, -18, 74 + f);
    ctx.bezierCurveTo(20, 58 + f, 48, 26, 62, 0);
    ctx.closePath();
  };
  wing();
  const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#2A1D52'); g.addColorStop(0.5, '#4B2C8F'); g.addColorStop(1, '#3A2470');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); wing(); ctx.clip();
  const rim = ctx.createRadialGradient(0, 0, 30, 0, 0, 80); rim.addColorStop(0, 'rgba(224,70,155,0)'); rim.addColorStop(1, 'rgba(240,90,190,0.85)');
  ctx.fillStyle = rim; ctx.fillRect(-80, -100, 160, 200);
  ctx.fillStyle = 'rgba(255,235,255,0.8)';
  for (const [x, y, r] of [[-20, -30, 5], [8, -38, 4], [-4, -14, 5.5], [24, -14, 4], [-28, 8, 4.5], [6, 12, 5.5], [24, 26, 4], [-10, 32, 5], [10, 44, 3], [-34, -10, 3], [-18, 52, 3], [-18, -52, 3]]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
  wing(); line(ctx, 3);
  // cephalic fins and head ridge
  for (const sgn of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(58, sgn * 10); ctx.quadraticCurveTo(76, sgn * 12, 74, sgn * 22); ctx.quadraticCurveTo(64, sgn * 18, 56, sgn * 16); ctx.closePath();
    ctx.fillStyle = '#4B2C8F'; ctx.fill(); line(ctx, 2);
    eye(ctx, 52, sgn * 14, 3.4, '#1A1030');
  }
  ctx.beginPath(); ctx.moveTo(56, 0); ctx.quadraticCurveTo(10, -6, -40, 0); ctx.quadraticCurveTo(10, 6, 56, 0); ctx.fillStyle = 'rgba(160,120,255,0.35)'; ctx.fill();
  shine(ctx, 10, -30, 30, 8, 0.25, -0.5);
}

function golden_koi(ctx, p) {
  const L = 92, H = 40, w = Math.sin(p * TAU);
  ctx.save(); ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 22;
  // flowing tail
  ctx.beginPath(); ctx.moveTo(-30, -6);
  ctx.bezierCurveTo(-48, -18 + w * 6, -62, -22 + w * 10, -74, -14 + w * 12);
  ctx.quadraticCurveTo(-64, 0 + w * 8, -74, 16 + w * 12);
  ctx.bezierCurveTo(-60, 20 + w * 8, -46, 16 + w * 5, -30, 6); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -20, 20, [[0, 'rgba(255,240,180,0.9)'], [1, 'rgba(255,190,60,0.85)']]); ctx.fill();
  ctx.restore();
  line(ctx, 1.4, 'rgba(10,24,38,0.7)');
  finRays(ctx, -30, 0, [[-72, -12 + w * 12], [-70, 0 + w * 10], [-72, 14 + w * 12], [-60, -18 + w * 8], [-60, 18 + w * 8]], '#E08A00');
  // flowing pectoral & dorsal fins
  ctx.beginPath(); ctx.moveTo(10, 8); ctx.quadraticCurveTo(0, 26 + w * 4, -14, 24 + w * 6); ctx.quadraticCurveTo(-4, 14, 2, 8); ctx.closePath();
  ctx.fillStyle = 'rgba(255,236,170,0.85)'; ctx.fill(); line(ctx, 1.2);
  ctx.beginPath(); ctx.moveTo(-18, -14); ctx.quadraticCurveTo(-2, -28 + w * 3, 16, -16); ctx.closePath();
  ctx.fillStyle = 'rgba(255,215,90,0.9)'; ctx.fill(); line(ctx, 1.3);
  bodyPath(ctx, L * 0.86, H * 0.9, { nose: 0.4 });
  ctx.fillStyle = vgrad(ctx, -H / 2, H / 2, [[0, '#F29A00'], [0.35, '#FFC21A'], [0.7, '#FFE680'], [1, '#FFF6CF']]); ctx.fill();
  ctx.save(); bodyPath(ctx, L * 0.86, H * 0.9, { nose: 0.4 }); ctx.clip();
  ctx.fillStyle = 'rgba(255,90,40,0.75)';
  ctx.beginPath(); ctx.ellipse(-10, -8, 12, 7, 0.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, -10, 8, 5, -0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.ellipse(2, 6, 10, 5, 0.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(160,90,0,0.35)'; ctx.lineWidth = 1;
  for (let r = -10; r <= 8; r += 6) for (let x = -24; x < 26; x += 7) { ctx.beginPath(); ctx.arc(x + (r % 4 ? 3 : 0), r, 4, -0.5 * Math.PI, 0.5 * Math.PI); ctx.stroke(); }
  ctx.restore();
  bodyPath(ctx, L * 0.86, H * 0.9, { nose: 0.4 }); line(ctx, 2.2);
  ctx.beginPath(); ctx.moveTo(36, 5); ctx.quadraticCurveTo(46, 12 + w * 2, 52, 8); line(ctx, 1.4, '#B86E00');
  ctx.beginPath(); ctx.moveTo(36, 6); ctx.quadraticCurveTo(44, 16 + w * 2, 46, 18); line(ctx, 1.4, '#B86E00');
  shine(ctx, 6, -9, 22, 4, 0.5);
  eye(ctx, 27, -4, 4.4, '#3A1A00');
  ctx.fillStyle = '#FFFFFF';
  for (const [x, y, r] of [[34, -22, 5], [-40, -24, 3.5], [-6, 26, 3]]) { star(ctx, x, y, r * (0.8 + 0.3 * Math.sin(p * TAU * 2 + x))); ctx.fill(); }
}

function octopus_king(ctx, p) {
  const ph = p * TAU;
  // tentacles
  for (let i = 0; i < 8; i++) {
    const sx = -66 + i * 19, sgn = i < 4 ? -1 : 1, wv = Math.sin(ph + i * 0.9);
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      pts.push([sx + sgn * t * 30 + Math.sin(ph + i + t * 4) * 12 * t + wv * 6 * t, 30 + t * 92]);
    }
    for (let k = 0; k < 10; k++) {
      ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]);
      ctx.lineWidth = 22 * (1 - k / 11) + 3; ctx.strokeStyle = '#0A1826'; ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = 22 * (1 - k / 11); ctx.strokeStyle = k % 2 ? '#E8345E' : '#F04468'; ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,214,224,0.9)';
    for (let k = 1; k < 9; k += 2) { ctx.beginPath(); ctx.arc(pts[k][0] - sgn * 4, pts[k][1], 3.2 * (1 - k / 12), 0, TAU); ctx.fill(); }
  }
  // head
  ctx.beginPath(); ctx.ellipse(0, -16, 86, 74, 0, 0, TAU);
  ctx.fillStyle = rgrad(ctx, -24, -46, 10, 100, [[0, '#FF8FAA'], [0.45, '#F04468'], [1, '#A3163E']]); ctx.fill(); line(ctx, 4);
  ctx.fillStyle = 'rgba(160,20,60,0.5)';
  for (const [x, y, r] of [[-40, -54, 7], [-12, -66, 5], [30, -58, 8], [50, -30, 5], [-56, -20, 5], [12, -40, 4]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  shine(ctx, -28, -58, 26, 12, 0.4, -0.5);
  // eyes and brows
  for (const ex of [-30, 30]) {
    ctx.beginPath(); ctx.ellipse(ex, 0, 20, 24, 0, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill(); line(ctx, 4);
    ctx.beginPath(); ctx.arc(ex + 5, 5, 10, 0, TAU); ctx.fillStyle = '#2A0A14'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 1, -1, 3.5, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(ex - 20, -30 + (ex < 0 ? -4 : 6)); ctx.lineTo(ex + 18, -30 + (ex < 0 ? 6 : -4)); line(ctx, 7);
  }
  ctx.beginPath(); ctx.moveTo(-14, 34); ctx.quadraticCurveTo(0, 42 + Math.sin(ph) * 3, 14, 34); line(ctx, 4);
  // crown
  ctx.save(); ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(-50, -80); ctx.lineTo(-38, -122); ctx.lineTo(-20, -94); ctx.lineTo(0, -134); ctx.lineTo(20, -94); ctx.lineTo(38, -122); ctx.lineTo(50, -80); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -134, -80, [[0, '#FFF3B0'], [0.5, '#FFC93C'], [1, '#D98A00']]); ctx.fill();
  ctx.restore(); line(ctx, 3.5);
  for (const [x, y, col] of [[0, -100, '#3FE3FF'], [-30, -92, '#FF3D6E'], [30, -92, '#7CFF6B']]) {
    ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fillStyle = col; ctx.fill(); line(ctx, 2);
    ctx.beginPath(); ctx.arc(x - 2, y - 2, 2, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  }
}

function jellyfish(ctx, p) {
  const ph = p * TAU;
  ctx.save(); ctx.shadowColor = '#FF5EC8'; ctx.shadowBlur = 18;
  for (let i = 0; i < 5; i++) {
    const x = -14 + i * 7;
    ctx.beginPath(); ctx.moveTo(x, 4);
    for (let k = 1; k <= 8; k++) ctx.lineTo(x + Math.sin(ph + i + k * 0.8) * 4, 4 + k * 5);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,140,220,0.8)'; ctx.stroke();
  }
  ctx.restore();
  for (const x of [-5, 5]) {
    ctx.beginPath(); ctx.moveTo(x, 2);
    ctx.bezierCurveTo(x + Math.sin(ph) * 6, 14, x - Math.sin(ph) * 6, 22, x, 30);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,190,240,0.7)'; ctx.stroke();
  }
  const sq = 1 + Math.sin(ph) * 0.06;
  ctx.beginPath();
  ctx.moveTo(-22 * sq, 4);
  ctx.bezierCurveTo(-24 * sq, -30 / sq, 24 * sq, -30 / sq, 22 * sq, 4);
  for (let i = 0; i < 7; i++) { const x0 = 22 * sq - (i + 1) * (44 * sq / 7); ctx.quadraticCurveTo(x0 + 22 * sq / 7, 10, x0, 4); }
  ctx.closePath();
  ctx.fillStyle = rgrad(ctx, -4, -10, 2, 28, [[0, 'rgba(255,235,250,0.95)'], [0.5, 'rgba(255,120,210,0.8)'], [1, 'rgba(170,60,220,0.75)']]); ctx.fill();
  line(ctx, 1.8, 'rgba(90,20,90,0.9)');
  ctx.beginPath(); ctx.ellipse(0, -6, 10, 7, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  shine(ctx, -8, -14, 6, 3, 0.7, -0.5);
  // electric sparks (hazard cue that does not rely on colour)
  ctx.strokeStyle = '#FFF59A'; ctx.lineWidth = 1.6;
  for (const [x, y, s] of [[-24, -8, 1], [22, -14, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4 * s, y - 4); ctx.lineTo(x + 2 * s, y - 6); ctx.lineTo(x + 7 * s, y - 11); ctx.stroke();
  }
}

function capsule(ctx, p) {
  const pulse = 1 + Math.sin(p * TAU) * 0.06;
  ctx.save(); ctx.shadowColor = '#7FF3FF'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(0, 0, 19 * pulse, 0, TAU);
  ctx.fillStyle = rgrad(ctx, -6, -7, 2, 22, [[0, 'rgba(255,255,255,0.95)'], [0.45, 'rgba(140,240,255,0.8)'], [1, 'rgba(40,140,220,0.85)']]); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, 19 * pulse, 0, TAU); line(ctx, 2.2, 'rgba(10,40,70,0.9)');
  ctx.save(); ctx.rotate(p * TAU / 5);
  star(ctx, 0, 1, 10); ctx.fillStyle = vgrad(ctx, -10, 10, [[0, '#FFF6C2'], [1, '#F2A300']]); ctx.fill(); line(ctx, 1.6);
  ctx.restore();
  shine(ctx, -7, -9, 6, 3.5, 0.8, -0.6);
}

const DRAW = { sardine, clownfish, snapper, puffer, lionfish, turtle, manta, golden_koi, octopus_king, jellyfish, capsule };

// ---------- sprite cache ----------
const cache = {};
function sprites(kind, variant = '') {
  const key = kind + variant;
  if (cache[key]) return cache[key];
  const [w, h] = SIZES[kind], pad = PAD_BY[kind] || PAD;
  const cw = Math.ceil(w * pad * SPR), ch = Math.ceil(h * pad * SPR);
  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    g.translate(cw / 2, ch / 2); g.scale(SPR, SPR);
    if (kind === 'puffer') puffer(g, i / FRAMES, variant === 'puff' ? 1.18 : 1);
    else DRAW[kind](g, i / FRAMES);
    frames.push(c);
  }
  return (cache[key] = { frames, w: cw / SPR, h: ch / SPR });
}

/** Warm the sprite cache (call once at boot so the first frame does not stutter). */
export function prewarm() { for (const k of Object.keys(DRAW)) sprites(k); sprites('puffer', 'puff'); }

function frameAt(kind, t, seed) {
  return Math.floor((((t * ANIM_RATE[kind] + seed * 0.137) % 1) + 1) % 1 * FRAMES) % FRAMES;
}

/** Draw a creature centred at (x, y). dir 1 = facing right. */
export function drawCreature(ctx, kind, x, y, { dir = 1, t = 0, seed = 0, tilt = 0, scale = 1, alpha = 1, puff = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  const img = ART[kind];
  if (img) {
    const [w] = SIZES[kind];
    const sw = w * scale * 1.12, sh = sw * img.height / img.width;
    const wob = Math.sin((t * ANIM_RATE[kind] + seed * 0.137) * TAU);
    if (kind !== 'capsule' && kind !== 'jellyfish' && kind !== 'octopus_king') ctx.scale(dir, 1);
    ctx.rotate(tilt + wob * 0.04);
    ctx.scale(1 + wob * 0.025, 1 - wob * 0.025);
    ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
  } else {
    const sp = sprites(kind, kind === 'puffer' && puff ? 'puff' : '');
    const fr = sp.frames[frameAt(kind, t, seed)];
    if (kind !== 'capsule' && kind !== 'jellyfish' && kind !== 'octopus_king') ctx.scale(dir, 1);
    ctx.rotate(tilt);
    ctx.drawImage(fr, -sp.w * scale / 2, -sp.h * scale / 2, sp.w * scale, sp.h * scale);
  }
  ctx.restore();
}

/** Bright flash over a creature that was just hit. */
export function drawHitFlash(ctx, kind, x, y, opts, strength) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawCreature(ctx, kind, x, y, { ...opts, alpha: Math.min(1, strength) * 0.75 });
  ctx.restore();
}

/** Small icon of a creature fitted into a box (legends, menus, results). */
export function drawFishIcon(ctx, kind, x, y, box = 40, t = 0) {
  const [w, h] = SIZES[kind];
  const s = box / Math.max(w, h * 1.1) * 1.05;
  drawCreature(ctx, kind, x, y, { dir: 1, t, scale: s });
}
