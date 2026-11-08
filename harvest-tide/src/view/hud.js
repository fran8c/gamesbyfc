// HUD and cannon (spec 8.2). Returns button rects so the game screen can hit-test presses.
import { C, T, goldText, frost, roundRect, fillStroke } from './theme.js';
import { drawFishIcon } from './fishart.js';
import { multiplier } from '../sim/combo.js';

export const BTN = {
  pause: { x: 16, y: 14, w: 66, h: 56 },
  power: [0, 1, 2].map(i => ({ x: 884 + i * 92, y: 620, w: 80, h: 80 })),
  betDown: { x: 448, y: 640, w: 80, h: 64 },
  betUp: { x: 752, y: 640, w: 80, h: 64 },
};

const NAMES = { sardine: 'Sardine', clownfish: 'Clownfish', snapper: 'Snapper', puffer: 'Puffer', lionfish: 'Lionfish',
  turtle: 'Sea Turtle', manta: 'Manta Ray', golden_koi: 'Golden Koi', octopus_king: 'Octopus King', jellyfish: 'Jellyfish', capsule: 'Power capsule' };
export const fishName = k => NAMES[k] || k;

function fmtTime(ticks) {
  const s = Math.ceil(Math.max(0, ticks) / 60);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function drawCannon(ctx, S, V) {
  const c = S.cfg.cannon.pos;
  const dx = S.aim.x - c.x, dy = Math.min(-20, S.aim.y - c.y);
  const ang = Math.atan2(dy, dx);
  const recoil = V.recoil * 10;
  ctx.save(); ctx.shadowColor = S.combo.feverActive ? C.lime : C.glow; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(c.x, c.y + 10, 64, Math.PI, 0); ctx.fillStyle = '#18324A'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ice; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ang); ctx.translate(-recoil, 0);
  roundRect(ctx, 0, -20, 96, 40, 12);
  const bg = ctx.createLinearGradient(0, -20, 0, 20);
  if (S.mode === 'table') { bg.addColorStop(0, '#FFE9B0'); bg.addColorStop(0.5, '#F2A93B'); bg.addColorStop(1, '#B4651A'); }
  else { bg.addColorStop(0, '#E7D6FF'); bg.addColorStop(0.5, '#9B6BFF'); bg.addColorStop(1, '#5232B8'); }
  fillStroke(ctx, bg, C.ink, 3);
  roundRect(ctx, 76, -26, 26, 52, 8); fillStroke(ctx, S.jamLeft > 0 ? C.coral : C.gold, C.ink, 3);
  ctx.restore();
  ctx.beginPath(); ctx.arc(c.x, c.y, 30, 0, 7);
  const hg = ctx.createRadialGradient(c.x - 8, c.y - 8, 4, c.x, c.y, 30); hg.addColorStop(0, '#FFFFFF'); hg.addColorStop(1, '#3FA9FF');
  fillStroke(ctx, hg, C.ink, 3);
  // reload ring / jam
  if (S.reloadLeft > 0) {
    const k = 1 - S.reloadLeft / S.cfg.cannon.arcade.reloadTicks;
    ctx.beginPath(); ctx.arc(c.x, c.y, 40, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = C.glow; ctx.stroke();
    T(ctx, 'RELOAD', c.x, c.y - 52, { size: 16, w: 900, align: 'center', fill: C.glow, sw: 4 });
  }
  if (S.jamLeft > 0) T(ctx, 'STUNG!', c.x, c.y - 52, { size: 18, w: 900, align: 'center', fill: C.coral, sw: 5 });
}

export function drawBullets(ctx, S) {
  ctx.save(); ctx.shadowColor = C.glow; ctx.shadowBlur = 14; ctx.lineCap = 'round';
  for (const b of S.bullets) {
    ctx.strokeStyle = S.mode === 'table' ? 'rgba(255,201,60,0.55)' : 'rgba(63,227,255,0.55)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(b.x - b.dx * 34, b.y - b.dy * 34); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, 7); ctx.fillStyle = '#E9FDFF'; ctx.fill();
  }
  ctx.restore();
}

export function drawHud(ctx, S, V) {
  // pause
  frost(ctx, BTN.pause.x, BTN.pause.y, BTN.pause.w, BTN.pause.h, 14);
  ctx.fillStyle = C.ice; ctx.fillRect(38, 28, 8, 28); ctx.fillRect(52, 28, 8, 28);
  if (S.mode === 'arcade') {
    frost(ctx, 96, 14, 270, 56);
    T(ctx, 'SCORE', 112, 36, { size: 14, fill: C.ice, stroke: null });
    goldText(ctx, Math.round(V.shownScore).toLocaleString('en-US'), 112, 54, 30, 'left');
    if (V.best) T(ctx, `BEST ${V.best.toLocaleString('en-US')}`, 112, 92, { size: 15, w: 700, fill: C.ice, sw: 4 });
    // combo
    const m = multiplier(S);
    frost(ctx, 470, 14, 340, 56, 16, { glow: S.combo.feverActive });
    const pop = 1 + V.comboPop * 0.3;
    ctx.save(); ctx.translate(528, 43); ctx.scale(pop, pop); goldText(ctx, 'x' + m.toFixed(1), 0, 0, 34); ctx.restore();
    T(ctx, S.combo.points ? `COMBO ${S.combo.points}` : 'COMBO', 592, 36, { size: 13, fill: C.ice, stroke: null });
    roundRect(ctx, 592, 46, 196, 10, 5); ctx.fillStyle = 'rgba(8,21,33,0.7)'; ctx.fill();
    const chain = S.combo.feverActive ? 1 : S.combo.points ? S.combo.chainLeft / S.cfg.combo.chainTicks : 0;
    if (chain > 0) { roundRect(ctx, 592, 46, Math.max(10, 196 * chain), 10, 5); ctx.fillStyle = S.combo.feverActive ? C.lime : chain < 0.3 ? C.coral : C.glow; ctx.fill(); }
    if (S.combo.feverActive) {
      frost(ctx, 470, 76, 340, 30, 12);
      T(ctx, `HARVEST FEVER  ${Math.ceil(S.combo.feverLeft / 60)}`, 640, 98, { size: 18, w: 900, align: 'center', fill: C.lime, sw: 4 });
    }
    // timer
    const low = S.remaining <= S.cfg.run.warningAtTicks;
    frost(ctx, 1090, 14, 174, 56);
    const tp = low ? 1 + Math.max(0, Math.sin(V.t * Math.PI * 2)) * 0.08 : 1;
    ctx.save(); ctx.translate(1177, 42); ctx.scale(tp, tp);
    T(ctx, fmtTime(S.remaining), 0, 0, { size: 34, w: 900, align: 'center', base: 'middle', fill: low ? C.gold : C.white, sw: 7 });
    ctx.restore();
    // ammo
    frost(ctx, 300, 640, 220, 56, 14);
    T(ctx, S.reloadLeft > 0 ? 'RELOADING' : 'AMMO', 316, 662, { size: 13, fill: S.reloadLeft > 0 ? C.glow : C.ice, stroke: null });
    const clip = S.cfg.cannon.arcade.clipSize;
    for (let i = 0; i < 12; i++) {
      roundRect(ctx, 316 + i * 13, 670, 9, 16, 3);
      ctx.fillStyle = i < Math.ceil(S.ammo / 2) && S.reloadLeft === 0 ? C.glow : 'rgba(191,239,255,0.2)'; ctx.fill();
    }
    T(ctx, `${S.reloadLeft > 0 ? 0 : S.ammo}/${clip}`, 506, 686, { size: 16, align: 'right', sw: 4 });
  } else {
    frost(ctx, 96, 14, 320, 56);
    T(ctx, 'BANK', 112, 36, { size: 14, fill: C.ice, stroke: null });
    goldText(ctx, Math.round(V.shownScore).toLocaleString('en-US'), 112, 54, 30, 'left');
    T(ctx, `Pays back ${Math.round(S.cfg.table.rtp * 100)}% of bets on average`, 112, 92, { size: 14, w: 700, fill: C.ice, sw: 4 });
    frost(ctx, 1030, 14, 234, 56);
    T(ctx, 'PEAK', 1046, 36, { size: 13, fill: C.ice, stroke: null });
    T(ctx, S.peakBank.toLocaleString('en-US'), 1046, 60, { size: 22, w: 900, fill: C.white, sw: 5 });
    // bet controls
    frost(ctx, BTN.betDown.x, BTN.betDown.y, BTN.betDown.w, BTN.betDown.h, 18, { glow: true });
    T(ctx, '−', BTN.betDown.x + 40, BTN.betDown.y + 46, { size: 44, w: 900, align: 'center' });
    frost(ctx, BTN.betUp.x, BTN.betUp.y, BTN.betUp.w, BTN.betUp.h, 18, { glow: true });
    T(ctx, '+', BTN.betUp.x + 40, BTN.betUp.y + 46, { size: 44, w: 900, align: 'center' });
    frost(ctx, 545, 690, 190, 26, 10);
    T(ctx, `BET ${S.bet}`, 640, 710, { size: 18, w: 900, align: 'center', fill: C.gold, sw: 4 });
  }
  // power-ups
  const cols = ['#7FE6FF', '#FF6B6B', '#FFE15A'];
  const active = [S.power.freezeLeft > 0, S.power.lockonLeft > 0, false];
  BTN.power.forEach((r, i) => {
    const id = S.cfg.powerups.ids[i], n = S.power.uses[id];
    ctx.save(); ctx.globalAlpha = n > 0 || active[i] ? 1 : 0.45;
    frost(ctx, r.x, r.y, r.w, r.h, 18, { glow: active[i] });
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2 - 2;
    ctx.save(); ctx.shadowColor = cols[i]; ctx.shadowBlur = 18; ctx.fillStyle = cols[i]; ctx.strokeStyle = cols[i];
    if (i === 0) for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(k * Math.PI / 3); ctx.fillRect(-3, -22, 6, 44); ctx.restore(); }
    if (i === 1) { ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, 7); ctx.stroke(); ctx.fillRect(cx - 3, cy - 26, 6, 52); ctx.fillRect(cx - 26, cy - 3, 52, 6); }
    if (i === 2) { ctx.beginPath(); ctx.moveTo(cx + 6, cy - 26); ctx.lineTo(cx - 12, cy + 4); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 8, cy + 28); ctx.lineTo(cx + 14, cy - 4); ctx.lineTo(cx + 2, cy - 4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // active timer ring
    const left = i === 0 ? S.power.freezeLeft / S.cfg.powerups.freezeTicks : i === 1 ? S.power.lockonLeft / S.cfg.powerups.lockonTicks : 0;
    if (left > 0) { ctx.beginPath(); ctx.arc(cx, cy + 2, 36, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = cols[i]; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(r.x + r.w - 6, r.y + 6, 15, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.gold; ctx.stroke();
    T(ctx, String(n), r.x + r.w - 6, r.y + 7, { size: 17, w: 900, align: 'center', base: 'middle', fill: C.gold, stroke: null });
    ctx.restore();
  });
  // value legend for a new fish (P1)
  if (V.legend && V.t - V.legend.at < 3) {
    const k = V.legend.kind, f = S.cfg.fish[k];
    const val = S.mode === 'arcade' ? `${f.points} pts` : `×${f.pay}`;
    const a = Math.min(1, (3 - (V.t - V.legend.at)) / 0.4);
    ctx.save(); ctx.globalAlpha = a;
    frost(ctx, 980, 80, 284, 54, 14);
    drawFishIcon(ctx, k, 1016, 107, 46, V.t);
    T(ctx, fishName(k), 1050, 102, { size: 17, w: 800, fill: C.white, sw: 4 });
    const line = f.hazard ? 'Avoid: stings your cannon' : f.capsule ? 'Shoot for a power-up' : val + (f.wheel ? ' + prize wheel' : '');
    T(ctx, line, 1050, 124, { size: 15, w: 800, fill: f.hazard ? C.coral : C.gold, sw: 4 });
    ctx.restore();
  }
}

/** Caption line (spec 7): bottom-left above the ammo / bet area. */
export function drawCaption(ctx, V) {
  if (!V.caption) return;
  const age = V.t - V.caption.at;
  if (age > 1.4) { V.caption = null; return; }
  const a = age < 0.1 ? age / 0.1 : age > 1.1 ? (1.4 - age) / 0.3 : 1;
  T(ctx, V.caption.text, 640, 150, { size: 28, w: 900, align: 'center', fill: V.caption.color || C.white, sw: 7, a });
}
