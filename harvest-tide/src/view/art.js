// Procedural art for every entity (spec 6.2). Each function draws centred on (0, 0), facing right.
// Shape cues (stripes, spikes, dots, rings) make every entity readable without colour.
import { PAL, fillStroke, roundRect, starPath } from './gfx.js';

function eye(ctx, x, y, r = 2.4) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.35, r * 0.4, 0, Math.PI * 2); ctx.fillStyle = PAL.white; ctx.fill();
}

function tail(ctx, x, h, color) {
  ctx.beginPath(); ctx.moveTo(x + 4, 0); ctx.lineTo(x - h * 0.9, -h); ctx.lineTo(x - h * 0.6, 0); ctx.lineTo(x - h * 0.9, h); ctx.closePath();
  fillStroke(ctx, color);
}

function sardine(ctx) {
  tail(ctx, -14, 7, '#9FC2D3');
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 6.5, 0, 0, Math.PI * 2); fillStroke(ctx, '#C9E2EC');
  ctx.strokeStyle = '#5E8799'; ctx.lineWidth = 1.6;                 // dash marks
  for (let i = -8; i <= 6; i += 5) { ctx.beginPath(); ctx.moveTo(i, 1); ctx.lineTo(i + 3, 1); ctx.stroke(); }
  eye(ctx, 10, -1.5, 1.8);
}

function snapper(ctx) {
  tail(ctx, -21, 11, '#C95B45');
  ctx.beginPath(); ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2); fillStroke(ctx, '#E2725B');
  ctx.save(); ctx.clip();
  ctx.strokeStyle = '#A9473A'; ctx.lineWidth = 3.5;                  // stripes
  for (let i = -14; i <= 10; i += 8) { ctx.beginPath(); ctx.moveTo(i, -13); ctx.lineTo(i - 4, 13); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = PAL.ink; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(4, -17); ctx.lineTo(10, -10); fillStroke(ctx, '#C95B45');
  eye(ctx, 15, -3);
}

function puffer(ctx, puff = 1) {
  ctx.save(); ctx.scale(puff, puff);
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2;                      // spikes
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.lineTo(Math.cos(a) * 23, Math.sin(a) * 23); ctx.stroke();
  }
  tail(ctx, -15, 7, '#D9A94E');
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); fillStroke(ctx, '#E9C46A');
  ctx.beginPath(); ctx.arc(0, 5, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 2; ctx.strokeStyle = '#F8E7B5'; ctx.stroke();
  eye(ctx, 8, -5, 3);
  ctx.restore();
}

function koi(ctx, t = 0) {
  tail(ctx, -24, 13, '#E39B12');
  ctx.beginPath(); ctx.ellipse(0, 0, 28, 13, 0, 0, Math.PI * 2); fillStroke(ctx, PAL.gold, PAL.ink, 2.5);
  ctx.fillStyle = PAL.white;                                         // white dots
  for (const [x, y, r] of [[-10, -4, 3], [2, 5, 2.5], [8, -6, 2], [-16, 4, 2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  eye(ctx, 18, -3);
  const s = 5 + Math.sin(t * 6) * 1.5;                               // sparkle
  starPath(ctx, 22, -18, s, 0.35); fillStroke(ctx, PAL.white, PAL.ink, 1.2);
}

function boot(ctx) {
  ctx.beginPath();
  ctx.moveTo(-8, -20); ctx.lineTo(6, -20); ctx.lineTo(6, 6); ctx.lineTo(16, 10); ctx.lineTo(16, 20); ctx.lineTo(-10, 20); ctx.lineTo(-10, -18);
  ctx.closePath(); fillStroke(ctx, '#6E4B2E', PAL.ink, 2.5);
  ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(16, 14); ctx.lineWidth = 2; ctx.strokeStyle = PAL.ink; ctx.stroke();
}

function jellyfish(ctx, t = 0) {
  ctx.strokeStyle = PAL.hazard; ctx.lineWidth = 2.5; ctx.setLineDash([3, 4]);       // dotted tentacles
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath(); ctx.moveTo(i, 2);
    ctx.quadraticCurveTo(i + Math.sin(t * 4 + i) * 6, 14, i + Math.sin(t * 3 + i) * 4, 26); ctx.stroke();
  }
  ctx.setLineDash([]);
  const p = 1 + Math.sin(t * 5) * 0.05;
  ctx.beginPath(); ctx.ellipse(0, 0, 20 * p, 16 / p, 0, Math.PI, 0); ctx.lineTo(20 * p, 2); ctx.lineTo(-20 * p, 2); ctx.closePath();
  ctx.globalAlpha = 0.9; fillStroke(ctx, '#F08A86', PAL.ink, 2); ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.ellipse(-6, -7, 5, 3, -0.4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
}

/** Draw a fish or hazard. dir: 1 right, -1 left. */
export function drawCreature(ctx, kind, x, y, dir = 1, t = 0, { scale = 1, puff = 1, alpha = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  if (kind !== 'boot' && kind !== 'jellyfish') ctx.scale(dir * scale, scale); else ctx.scale(scale, scale);
  switch (kind) {
    case 'sardine': sardine(ctx); break;
    case 'snapper': snapper(ctx); break;
    case 'puffer': puffer(ctx, puff); break;
    case 'golden_koi': koi(ctx, t); break;
    case 'boot': boot(ctx); break;
    case 'jellyfish': jellyfish(ctx, t); break;
  }
  ctx.restore();
}

/** Draw a harvest node. progress (0..1) fills the secure ring for pearls. */
export function drawNode(ctx, kind, x, y, t = 0, { progress = null, scale = 1, alpha = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha *= alpha;
  const glow = 0.25 + 0.15 * Math.sin(t * 4 + x * 0.05);
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fillStyle = `rgba(242,180,58,${glow * (kind === 'golden_pearl' ? 1.4 : 0.8)})`; ctx.fill();
  switch (kind) {
    case 'kelp': {
      ctx.beginPath(); ctx.moveTo(0, 26);
      for (let i = 0; i <= 6; i++) { const yy = 26 - i * 9; ctx.lineTo(Math.sin(t * 2 + i) * 3 + (i % 2 ? 7 : -7), yy); }
      ctx.lineTo(0, -28);
      for (let i = 6; i >= 0; i--) { const yy = 26 - i * 9; ctx.lineTo(Math.sin(t * 2 + i) * 3 + (i % 2 ? 2 : -2), yy); }
      ctx.closePath(); fillStroke(ctx, '#3E8E4F');
      break;
    }
    case 'pearl':
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); fillStroke(ctx, '#F7F3EA');
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.strokeStyle = '#B9B0A0'; ctx.stroke();
      ctx.beginPath(); ctx.arc(-4, -4, 2.5, 0, Math.PI * 2); ctx.fillStyle = PAL.white; ctx.fill();
      break;
    case 'crab_pot': {
      roundRect(ctx, -18, -14, 36, 28, 4); fillStroke(ctx, '#C46A2B');
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 1.5;
      for (let i = -9; i <= 9; i += 9) { ctx.beginPath(); ctx.moveTo(i, -14); ctx.lineTo(i, 14); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.stroke();
      break;
    }
    case 'golden_pearl':
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); fillStroke(ctx, PAL.gold, PAL.ink, 2.5);
      starPath(ctx, 0, 0, 7, 0.45); fillStroke(ctx, PAL.white, PAL.ink, 1.2);
      break;
  }
  if (progress !== null && progress < 1) {                          // secure ring
    ctx.beginPath(); ctx.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.lineWidth = 4; ctx.strokeStyle = PAL.safe; ctx.stroke();
  } else if (progress === 1) {
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = PAL.safe; ctx.stroke();
  }
  ctx.restore();
}
