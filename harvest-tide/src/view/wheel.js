// Prize wheel overlay. The sim already chose the segment; this spins to it (spec 3.7).
import { C, T, goldText, easeOut } from './theme.js';
import { drawFishIcon } from './fishart.js';

const COLS = ['#FF5E8A', '#3FE3FF', '#C6FF4A', '#FFC93C', '#9B6BFF', '#FF8A1F'];
const SEG = (Math.PI * 2) / 12;

/** Wheel angle at `progress` (0..1): five turns, then the chosen segment stops under the pointer. */
export function wheelRotation(n, index, progress) {
  const target = 5 * Math.PI * 2 + (n - index) * (Math.PI * 2 / n);
  return easeOut(Math.min(1, progress)) * target;
}

/** @param w sim wheel state (S.wheel) or a finished copy; `progress` 0..1 */
export function drawWheel(ctx, cfg, w, progress, t, { resultAge = -1 } = {}) {
  const segs = cfg.wheel.segments, n = segs.length;
  const wx = 640, wy = 330, r = 190;
  ctx.fillStyle = 'rgba(4,14,26,0.55)'; ctx.fillRect(0, 0, 1280, 720);
  // rotation: 5 full turns then stop with segment `index` under the top pointer
  const rot = wheelRotation(n, w.index, progress);
  ctx.save(); ctx.shadowColor = C.gold; ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(wx, wy, r + 18, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(wx, wy, r + 18, 0, 7); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(rot);
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * SEG - SEG / 2, a1 = a0 + SEG;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a1); ctx.closePath();
    ctx.fillStyle = COLS[i % COLS.length]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
    const am = (a0 + a1) / 2;
    ctx.save(); ctx.translate(Math.cos(am) * r * 0.7, Math.sin(am) * r * 0.7); ctx.rotate(am + Math.PI / 2);
    T(ctx, i === cfg.wheel.powerSegment ? '★' : '×' + segs[i], 0, 0, { size: 30, w: 900, align: 'center', base: 'middle', sw: 6 });
    ctx.restore();
  }
  ctx.restore();
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12 + t * 2, on = (i + Math.floor(t * 8)) % 2;
    ctx.beginPath(); ctx.arc(wx + Math.cos(a) * (r + 9), wy + Math.sin(a) * (r + 9), 5, 0, 7);
    ctx.fillStyle = on ? C.white : '#FFF2A8'; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(wx, wy, 52, 0, 7);
  const cg = ctx.createRadialGradient(wx - 12, wy - 12, 6, wx, wy, 52); cg.addColorStop(0, '#FFF6C2'); cg.addColorStop(1, '#E08A00');
  ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
  drawFishIcon(ctx, w.kind, wx, wy, 80, t);
  ctx.beginPath(); ctx.moveTo(wx - 22, wy - r - 40); ctx.lineTo(wx + 22, wy - r - 40); ctx.lineTo(wx, wy - r + 6); ctx.closePath();
  ctx.fillStyle = C.coral; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
  if (resultAge >= 0) {
    const s = Math.min(1, resultAge / 0.15);
    const label = w.index === cfg.wheel.powerSegment ? `×${w.mult} + POWER-UP` : '×' + w.mult;
    goldText(ctx, label, wx, wy + r + 70, 64 * (0.6 + 0.4 * s));
  } else {
    T(ctx, `${w.lucky ? 'LUCKY SPIN!' : 'GOLDEN KOI!'}  ${w.base.toLocaleString('en-US')} × wheel`, wx, wy + r + 70,
      { size: 30, w: 900, align: 'center', sw: 7 });
  }
}
