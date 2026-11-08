// Glowing deep-sea background (drawn once to an offscreen canvas), ambient glow particles, ice frame.
import { C } from './theme.js';

function makeRng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function coral(ctx, x, y, h, col) {
  ctx.strokeStyle = col; ctx.lineCap = 'round';
  const br = (x0, y0, len, ang, wdt) => {
    if (len < 10) return;
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    br(x1, y1, len * 0.72, ang - 0.45, wdt * 0.72); br(x1, y1, len * 0.7, ang + 0.4, wdt * 0.72);
  };
  br(x, y, h, -Math.PI / 2, 12);
}

function crystal(ctx, x, y, len, ang, w) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const cg = ctx.createLinearGradient(0, -w, len, w);
  cg.addColorStop(0, 'rgba(230,250,255,0.95)'); cg.addColorStop(1, 'rgba(120,200,240,0.55)');
  ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(len * 0.8, -w * 0.6); ctx.lineTo(len, 0); ctx.lineTo(len * 0.8, w * 0.6); ctx.lineTo(0, w); ctx.closePath();
  ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
  ctx.restore();
}

function paintBackground(ctx, R) {
  const g = ctx.createRadialGradient(640, 120, 40, 640, 360, 900);
  g.addColorStop(0, '#1A86B8'); g.addColorStop(0.45, C.sea); g.addColorStop(1, C.abyss);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = 'rgba(6,30,55,0.75)';
  ctx.beginPath(); ctx.moveTo(0, 720);
  for (let x = 0; x <= 1280; x += 40) ctx.lineTo(x, 600 - Math.abs(Math.sin(x * 0.011)) * 70 - R() * 20);
  ctx.lineTo(1280, 720); ctx.fill();
  ctx.save(); ctx.shadowColor = C.coral; ctx.shadowBlur = 14;
  coral(ctx, 110, 720, 70, '#C2306B'); coral(ctx, 190, 720, 52, '#7E3BC9');
  coral(ctx, 1110, 720, 74, '#C2306B'); coral(ctx, 1190, 720, 50, '#2BB59A');
  ctx.restore();
}

function paintFrame(ctx, R) {
  for (const [cx, cy, base] of [[0, 0, 0.25], [1280, 0, Math.PI - 0.25], [0, 720, -0.25], [1280, 720, Math.PI + 0.25]]) {
    for (let i = 0; i < 5; i++) crystal(ctx, cx, cy, 70 + R() * 70, base + (R() - 0.5) * 1.2 + (cy ? -0.5 : 0.5) * (cx ? -1 : 1) * 0.6, 10 + R() * 8);
  }
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(191,239,255,0.35)'; ctx.strokeRect(3, 3, 1274, 714);
}

export function createSea({ particles = 60 } = {}) {
  const R = makeRng(7);
  const bg = document.createElement('canvas'); bg.width = 1280; bg.height = 720;
  paintBackground(bg.getContext('2d'), R);
  const frame = document.createElement('canvas'); frame.width = 1280; frame.height = 720;
  paintFrame(frame.getContext('2d'), makeRng(11));
  const parts = [];
  for (let i = 0; i < particles; i++) {
    parts.push({ x: R() * 1280, y: R() * 720, r: 2 + R() * 5, vy: -(6 + R() * 16), ph: R() * 6.28, lime: R() < 0.7 });
  }
  return {
    drawBack(ctx, t, { fever = false, freeze = false } = {}) {
      ctx.drawImage(bg, 0, 0, 1280, 720);
      // slow light rays
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const x = 180 + i * 170 + Math.sin(t * 0.3 + i) * 30;
        const rg = ctx.createLinearGradient(x, 0, x + 120, 720);
        rg.addColorStop(0, `rgba(120,230,255,${0.10 + 0.05 * Math.sin(t * 0.7 + i * 1.7)})`); rg.addColorStop(1, 'rgba(120,230,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 70, 0); ctx.lineTo(x + 260, 720); ctx.lineTo(x + 120, 720); ctx.fill();
      }
      for (const p of parts) {
        const y = ((p.y + p.vy * t) % 760 + 760) % 760 - 20, x = p.x + Math.sin(t * 0.8 + p.ph) * 12;
        const col = fever ? '198,255,74' : p.lime ? '198,255,74' : '63,227,255';
        const pg = ctx.createRadialGradient(x, y, 0, x, y, p.r * 3);
        pg.addColorStop(0, `rgba(${col},${fever ? 0.7 : 0.45})`); pg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(x, y, p.r * 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (freeze) { ctx.fillStyle = 'rgba(160,230,255,0.16)'; ctx.fillRect(0, 0, 1280, 720); }
    },
    drawFrame(ctx, { fever = false, freeze = false } = {}) {
      ctx.drawImage(frame, 0, 0, 1280, 720);
      if (fever || freeze) {
        const col = fever ? '198,255,74' : '191,239,255';
        const v = ctx.createRadialGradient(640, 360, 300, 640, 360, 760);
        v.addColorStop(0, `rgba(${col},0)`); v.addColorStop(1, `rgba(${col},0.32)`);
        ctx.fillStyle = v; ctx.fillRect(0, 0, 1280, 720);
      }
    },
  };
}
