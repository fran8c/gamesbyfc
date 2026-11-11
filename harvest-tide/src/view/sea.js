// Glowing reef background: static layers are painted once to offscreen canvases; light rays,
// caustics, seaweed, bubbles and glow motes animate each frame. assets/background.png replaces
// the painted scenery (animated layers still play on top).
import { C, glow } from './theme.js';
import { ART } from '../platform/images.js';

const W = 1280, H = 720, TAU = Math.PI * 2;
function makeRng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function canvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function coralTree(g, x, y, h, col, R) {
  g.strokeStyle = col; g.lineCap = 'round';
  const br = (x0, y0, len, ang, wdt) => {
    if (len < 8) { g.beginPath(); g.arc(x0, y0, wdt * 0.9, 0, TAU); g.fillStyle = col; g.fill(); return; }
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    g.lineWidth = wdt; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (R() - 0.5) * 8, (y0 + y1) / 2, x1, y1); g.stroke();
    br(x1, y1, len * (0.66 + R() * 0.1), ang - 0.35 - R() * 0.3, wdt * 0.72);
    br(x1, y1, len * (0.62 + R() * 0.1), ang + 0.35 + R() * 0.3, wdt * 0.72);
  };
  br(x, y, h, -Math.PI / 2, 13);
}

function brainCoral(g, x, y, r, c0, c1) {
  g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, Math.PI, 0); g.closePath();
  const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r);
  rg.addColorStop(0, c0); rg.addColorStop(1, c1); g.fillStyle = rg; g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.ellipse(x, y, r * i / 4, r * 0.7 * i / 4, 0, Math.PI, 0); g.stroke(); }
}

function chest(g, x, y) {
  g.save(); g.translate(x, y); g.rotate(-0.08);
  g.shadowColor = '#FFC93C'; g.shadowBlur = 30;
  g.beginPath(); g.ellipse(0, -30, 46, 22, 0, Math.PI, 0); g.fillStyle = 'rgba(255,220,120,0.6)'; g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#6B3A1A'; g.fillRect(-48, -30, 96, 46);
  g.strokeStyle = '#2A1408'; g.lineWidth = 3; g.strokeRect(-48, -30, 96, 46);
  g.save(); g.translate(0, -30); g.rotate(-0.5);
  g.beginPath(); g.moveTo(-48, 0); g.lineTo(-48, -18); g.quadraticCurveTo(0, -46, 48, -18); g.lineTo(48, 0); g.closePath();
  g.fillStyle = '#7E4620'; g.fill(); g.stroke(); g.restore();
  g.fillStyle = '#D9A43A'; g.fillRect(-48, -10, 96, 7); g.fillRect(-6, -30, 12, 46);
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-30 + i * 8, -32 - (i % 3) * 4, 6, 4, 0, 0, TAU); g.fillStyle = i % 2 ? '#FFD54A' : '#FFE88A'; g.fill(); g.strokeStyle = '#A86A00'; g.lineWidth = 1.2; g.stroke(); }
  g.restore();
  for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(x + 50 + i * 9, y + 14 + (i % 2) * 3, 6, 3.5, 0, 0, TAU); g.fillStyle = '#FFD54A'; g.fill(); g.strokeStyle = '#A86A00'; g.lineWidth = 1; g.stroke(); }
}

function paintScenery(g) {
  const R = makeRng(7);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1B8DC0'); sky.addColorStop(0.35, '#0E5F92'); sky.addColorStop(0.75, '#08355E'); sky.addColorStop(1, '#051B33');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(640, -60, 10, 640, -60, 620);
  sun.addColorStop(0, 'rgba(190,250,255,0.55)'); sun.addColorStop(1, 'rgba(190,250,255,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, H);
  // far rock arches
  g.fillStyle = 'rgba(8,48,84,0.7)';
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 32) g.lineTo(x, 520 - Math.abs(Math.sin(x * 0.006)) * 120 - R() * 18);
  g.lineTo(W, H); g.fill();
  g.fillStyle = 'rgba(6,36,66,0.85)';
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 28) g.lineTo(x, 590 - Math.abs(Math.sin(x * 0.011 + 1)) * 60 - R() * 14);
  g.lineTo(W, H); g.fill();
  // sand
  const sand = g.createLinearGradient(0, 610, 0, H);
  sand.addColorStop(0, '#2C6A86'); sand.addColorStop(1, '#173E57');
  g.fillStyle = sand; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) g.lineTo(x, 640 + Math.sin(x * 0.01) * 10);
  g.lineTo(W, H); g.fill();
  for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(R() * W, 650 + R() * 70, 1 + R() * 2, 0, TAU); g.fillStyle = 'rgba(200,240,255,0.18)'; g.fill(); }
  // corals
  g.save(); g.shadowColor = C.coral; g.shadowBlur = 16;
  coralTree(g, 90, 700, 74, '#D2357A', R); coralTree(g, 170, 705, 56, '#8E46D8', R);
  coralTree(g, 1120, 700, 80, '#D2357A', R); coralTree(g, 1205, 705, 54, '#2BC2A4', R);
  g.restore();
  brainCoral(g, 245, 712, 40, '#F6A15A', '#B4532A');
  brainCoral(g, 1035, 714, 46, '#B8E86A', '#4E8A2A');
  // starfish and shells
  for (const [x, y, col] of [[1000, 690, '#FF7A59'], [300, 702, '#FFB347']]) {
    g.save(); g.translate(x, y); g.rotate(R());
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = i % 2 ? 6 : 16; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.7); }
    g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5; g.stroke(); g.restore();
  }
  chest(g, 1170, 660);
}

function paintFrame(g) {
  const R = makeRng(11);
  const crystal = (x, y, len, ang, w) => {
    g.save(); g.translate(x, y); g.rotate(ang);
    const cg = g.createLinearGradient(0, -w, len, w);
    cg.addColorStop(0, 'rgba(235,252,255,0.95)'); cg.addColorStop(0.6, 'rgba(150,220,250,0.75)'); cg.addColorStop(1, 'rgba(90,180,235,0.5)');
    g.beginPath(); g.moveTo(0, -w); g.lineTo(len * 0.8, -w * 0.6); g.lineTo(len, 0); g.lineTo(len * 0.8, w * 0.6); g.lineTo(0, w); g.closePath();
    g.fillStyle = cg; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.stroke();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.9, 0); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.stroke();
    g.restore();
  };
  for (const [cx, cy, base] of [[0, 0, 0.25], [W, 0, Math.PI - 0.25], [0, H, -0.25], [W, H, Math.PI + 0.25]]) {
    for (let i = 0; i < 6; i++) crystal(cx, cy, 60 + R() * 70, base + (R() - 0.5) * 1.1 + (cy ? -0.5 : 0.5) * (cx ? -1 : 1) * 0.6, 9 + R() * 8);
  }
  const v = g.createRadialGradient(640, 360, 420, 640, 360, 800);
  v.addColorStop(0, 'rgba(2,10,22,0)'); v.addColorStop(1, 'rgba(2,10,22,0.55)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.lineWidth = 6; g.strokeStyle = 'rgba(191,239,255,0.3)'; g.strokeRect(3, 3, W - 6, H - 6);
}

function paintCaustics() {
  const c = canvas(512, 512), g = c.getContext('2d'), R = makeRng(5);
  g.strokeStyle = 'rgba(200,250,255,0.55)'; g.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const x = R() * 512, y = R() * 512, r = 18 + R() * 40;
    g.beginPath();
    for (let k = 0; k <= 7; k++) { const a = k / 7 * TAU, rr = r * (0.75 + R() * 0.5); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6); }
    g.stroke();
  }
  return c;
}

export function createSea({ particles = 60, reduced = false } = {}) {
  const scenery = canvas(); paintScenery(scenery.getContext('2d'));
  const frame = canvas(); paintFrame(frame.getContext('2d'));
  const caustics = paintCaustics();
  const R = makeRng(3);
  const motes = [];
  for (let i = 0; i < particles; i++) motes.push({ x: R() * W, y: R() * H, r: 3 + R() * 7, vy: -(6 + R() * 16), ph: R() * TAU, lime: R() < 0.65 });
  const bubbles = [];
  for (let i = 0; i < 22; i++) bubbles.push({ x: R() * W, y: R() * H, r: 2 + R() * 5, v: 30 + R() * 50, ph: R() * TAU });
  const weeds = [];
  for (const x of [40, 62, 340, 362, 880, 905, 1240, 1262]) weeds.push({ x, h: 90 + R() * 70, ph: R() * TAU, col: R() < 0.5 ? '#2E9E62' : '#3FBF7A' });

  return {
    drawBack(ctx, t, { fever = false, freeze = false } = {}) {
      if (ART.background) ctx.drawImage(ART.background, 0, 0, W, H);
      else ctx.drawImage(scenery, 0, 0);
      const tt = reduced ? 0 : t;
      // caustic shimmer near the top
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.10;
      for (let k = 0; k < 2; k++) {
        const ox = ((tt * (k ? 14 : -10)) % 512 + 512) % 512, oy = (tt * (k ? 6 : 9)) % 512;
        for (let x = -512; x < W + 512; x += 512) for (let y = -512; y < 420; y += 512) ctx.drawImage(caustics, x + ox, y + oy, 512, 512);
      }
      ctx.restore();
      // light rays
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const x = 150 + i * 190 + Math.sin(tt * 0.25 + i) * 30;
        const a = 0.07 + 0.04 * Math.sin(tt * 0.6 + i * 1.7);
        const rg = ctx.createLinearGradient(x, 0, x + 140, H);
        rg.addColorStop(0, `rgba(150,240,255,${a})`); rg.addColorStop(1, 'rgba(150,240,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 280, H); ctx.lineTo(x + 120, H); ctx.fill();
      }
      ctx.restore();
      // seaweed
      for (const w of weeds) {
        ctx.beginPath(); ctx.moveTo(w.x, H);
        for (let k = 1; k <= 8; k++) {
          const y = H - w.h * k / 8, sway = Math.sin(tt * 1.3 + w.ph + k * 0.5) * k * 2.4;
          ctx.lineTo(w.x + sway, y);
        }
        ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = w.col; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(190,255,200,0.35)'; ctx.stroke();
      }
      // bubbles
      ctx.save();
      for (const b of bubbles) {
        const y = ((b.y - b.v * tt) % (H + 40) + H + 40) % (H + 40) - 20, x = b.x + Math.sin(tt * 2 + b.ph) * 6;
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.strokeStyle = 'rgba(220,250,255,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(x - b.r * 0.35, y - b.r * 0.35, b.r * 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      }
      // glow motes
      ctx.globalCompositeOperation = 'lighter';
      const gl = glow('198,255,74'), gc = glow('63,227,255');
      for (const m of motes) {
        const y = ((m.y + m.vy * tt) % (H + 40) + H + 40) % (H + 40) - 20, x = m.x + Math.sin(tt * 0.8 + m.ph) * 12;
        const s = m.r * 4 * (0.8 + 0.2 * Math.sin(tt * 2 + m.ph));
        ctx.globalAlpha = fever ? 0.75 : 0.42;
        ctx.drawImage(fever || m.lime ? gl : gc, x - s / 2, y - s / 2, s, s);
      }
      ctx.restore();
      if (freeze) { ctx.fillStyle = 'rgba(170,235,255,0.18)'; ctx.fillRect(0, 0, W, H); }
    },
    drawFrame(ctx, { fever = false, freeze = false, t = 0 } = {}) {
      ctx.drawImage(frame, 0, 0);
      if (fever || freeze) {
        const col = fever ? '198,255,74' : '191,239,255';
        const a = fever ? 0.26 + 0.1 * Math.sin(t * 6) : 0.34;
        const v = ctx.createRadialGradient(640, 360, 300, 640, 360, 760);
        v.addColorStop(0, `rgba(${col},0)`); v.addColorStop(1, `rgba(${col},${a})`);
        ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      }
    },
  };
}
