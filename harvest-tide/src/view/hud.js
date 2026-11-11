// HUD (spec 8.2): top bar, combo / lucky meter, ammo, cannon level controls, power-up buttons,
// value tags on big fish, first-sighting legend and captions. Button rects are exported for input.
import { C, T, goldText, frost, roundRect, drawCoin, drawIcon, drawPowerIcon, fmt, starPath } from './theme.js';
import { drawFishIcon } from './fishart.js';
import { multiplier } from '../sim/combo.js';
import { luckyNeed } from '../sim/catch.js';

export const BTN = {
  pause: { x: 16, y: 12, w: 68, h: 68 },
  power: [0, 1, 2].map(i => ({ x: 940 + i * 106, y: 610, w: 96, h: 96 })),
  levelDown: { x: 410, y: 618, w: 104, h: 90 },
  levelUp: { x: 766, y: 618, w: 104, h: 90 },
};

const NAMES = { sardine: 'Sardine', clownfish: 'Clownfish', snapper: 'Snapper', puffer: 'Pufferfish', lionfish: 'Lionfish',
  turtle: 'Sea Turtle', manta: 'Manta Ray', golden_koi: 'Golden Koi', octopus_king: 'Octopus King', jellyfish: 'Jellyfish', capsule: 'Power Pearl' };
export const fishName = k => NAMES[k] || k;
export const POWER_NAMES = { freeze: 'Freeze', lockon: 'Lock-on', lightning: 'Zap' };
const POWER_COLORS = ['#8FEAFF', '#FF7A7A', '#FFE15A'];

function fmtTime(ticks) {
  const s = Math.ceil(Math.max(0, ticks) / 60);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Value tag under big fish: points (Arcade) or coins at the current cannon level (Treasure Reef). */
export function drawValueTags(ctx, S) {
  for (const f of S.fish) {
    if (!f.alive) continue;
    const def = S.cfg.fish[f.kind];
    const big = S.mode === 'arcade' ? def.points >= 80 : def.reward >= 12;
    if (!big || f.x < 40 || f.x > 1240) continue;
    const label = S.mode === 'arcade' ? fmt(def.points) : fmt(def.reward * S.cost);
    const extra = def.wheel ? ' + spin' : '';
    ctx.font = `900 16px system-ui, sans-serif`;
    const tw = ctx.measureText(label + extra).width + (S.mode === 'reef' ? 22 : 0);
    const x = f.x - tw / 2 - 8, y = f.y + f.r + 10;
    roundRect(ctx, x, y, tw + 16, 24, 12); ctx.fillStyle = 'rgba(6,20,36,0.72)'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,201,60,0.7)'; ctx.stroke();
    let tx = x + 8;
    if (S.mode === 'reef') { drawCoin(ctx, tx + 8, y + 12, 7.5, 0); tx += 20; }
    T(ctx, label + extra, tx, y + 18, { size: 16, w: 900, fill: C.gold, stroke: null });
  }
}

function scorePanel(ctx, S, V) {
  frost(ctx, 96, 12, 300, 68, 18);
  if (S.mode === 'reef') drawCoin(ctx, 128, 46, 18, V.t * 0.6);
  else { starPath(ctx, 128, 46, 18, 0.45); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke(); }
  T(ctx, S.mode === 'reef' ? 'COINS' : 'SCORE', 156, 32, { size: 14, w: 900, fill: C.ice, stroke: null });
  goldText(ctx, fmt(V.shownScore), 156, 58, 34, 'left');
  if (V.best) T(ctx, `${S.mode === 'reef' ? 'PEAK' : 'BEST'} ${fmt(V.best)}`, 104, 104, { size: 16, w: 800, fill: C.ice, sw: 4 });
}

function luckyPanel(ctx, S, V, x, y, w) {
  const need = luckyNeed(S), ready = S.lucky.ready, frac = ready ? 1 : S.lucky.fill / need;
  frost(ctx, x, y, w, 68, 18, { glow: ready, glowColor: C.gold, border: ready ? C.gold : 'rgba(191,239,255,0.85)' });
  drawIcon(ctx, 'clover', x + 36, y + 34, 18, ready ? C.gold : '#7CFF6B');
  T(ctx, 'LUCKY METER', x + 66, y + 28, { size: 14, w: 900, fill: C.ice, stroke: null });
  const bx = x + 66, bw = w - 86;
  roundRect(ctx, bx, y + 38, bw, 16, 8); ctx.fillStyle = 'rgba(6,20,36,0.8)'; ctx.fill();
  if (frac > 0) {
    roundRect(ctx, bx, y + 38, Math.max(16, bw * frac), 16, 8);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#7CFF6B'); g.addColorStop(1, C.gold);
    ctx.fillStyle = g; ctx.fill();
  }
  if (ready) T(ctx, S.mode === 'reef' ? 'READY — next hit is a sure catch!' : 'READY — next catch spins!', bx + bw / 2, y + 51,
    { size: 13, w: 900, align: 'center', fill: C.ink, stroke: null });
}

export function drawHud(ctx, S, V) {
  // pause
  frost(ctx, BTN.pause.x, BTN.pause.y, BTN.pause.w, BTN.pause.h, 18);
  drawIcon(ctx, 'pause', BTN.pause.x + 34, BTN.pause.y + 34, 22, C.ice);
  scorePanel(ctx, S, V);
  if (S.mode === 'arcade') {
    const m = multiplier(S);
    frost(ctx, 460, 12, 360, 68, 18, { glow: S.combo.feverActive, glowColor: C.lime });
    const pop = 1 + V.comboPop * 0.35;
    ctx.save(); ctx.translate(524, 46); ctx.scale(pop, pop); goldText(ctx, 'x' + m.toFixed(1), 0, 0, 40); ctx.restore();
    T(ctx, S.combo.points ? `COMBO ${S.combo.points}` : 'COMBO', 592, 34, { size: 14, w: 900, fill: C.ice, stroke: null });
    roundRect(ctx, 592, 44, 208, 14, 7); ctx.fillStyle = 'rgba(6,20,36,0.8)'; ctx.fill();
    const chain = S.combo.feverActive ? S.combo.feverLeft / S.cfg.fever.durationTicks : S.combo.points ? S.combo.chainLeft / S.cfg.combo.chainTicks : 0;
    if (chain > 0) { roundRect(ctx, 592, 44, Math.max(14, 208 * chain), 14, 7); ctx.fillStyle = S.combo.feverActive ? C.lime : chain < 0.3 ? C.coral : C.glow; ctx.fill(); }
    if (S.combo.feverActive) {
      frost(ctx, 500, 86, 280, 34, 14, { glow: true, glowColor: C.lime });
      T(ctx, `HARVEST FEVER  ${Math.ceil(S.combo.feverLeft / 60)}s`, 640, 110, { size: 19, w: 900, align: 'center', fill: C.lime, sw: 4 });
    }
    // timer
    const low = S.remaining <= S.cfg.run.warningAtTicks;
    frost(ctx, 1088, 12, 176, 68, 18, { glow: low, glowColor: C.gold });
    const tp = low ? 1 + Math.max(0, Math.sin(V.t * Math.PI * 2)) * 0.1 : 1;
    ctx.save(); ctx.translate(1176, 47); ctx.scale(tp, tp);
    T(ctx, fmtTime(S.remaining), 0, 0, { size: 38, w: 900, align: 'center', base: 'middle', fill: low ? C.gold : C.white, sw: 7 });
    ctx.restore();
    // ammo
    frost(ctx, 290, 634, 230, 72, 18);
    T(ctx, S.reloadLeft > 0 ? 'RELOADING…' : 'AMMO', 308, 660, { size: 14, w: 900, fill: S.reloadLeft > 0 ? C.glow : C.ice, stroke: null });
    const clip = S.cfg.cannon.arcade.clipSize, shown = S.reloadLeft > 0 ? 0 : S.ammo;
    for (let i = 0; i < 12; i++) {
      roundRect(ctx, 308 + i * 13.5, 670, 9, 22, 3);
      ctx.fillStyle = i < Math.ceil(shown / 2) ? C.glow : 'rgba(191,239,255,0.18)'; ctx.fill();
    }
    T(ctx, `${shown}`, 506, 692, { size: 20, w: 900, align: 'right', sw: 4 });
    void clip;
  } else {
    luckyPanel(ctx, S, V, 450, 12, 380);
    // cannon level controls
    for (const [r, label, enabled] of [[BTN.levelDown, '−', S.levelChosen > 1], [BTN.levelUp, '+', S.levelChosen < S.cfg.reef.shotCost.length]]) {
      ctx.save(); ctx.globalAlpha = enabled ? 1 : 0.4;
      frost(ctx, r.x, r.y, r.w, r.h, 22, { glow: true });
      T(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 2, { size: 56, w: 900, align: 'center', base: 'middle' });
      ctx.restore();
    }
    T(ctx, 'LEVEL', BTN.levelDown.x + 52, BTN.levelDown.y - 8, { size: 13, w: 900, align: 'center', fill: C.ice, sw: 3 });
    T(ctx, 'LEVEL', BTN.levelUp.x + 52, BTN.levelUp.y - 8, { size: 13, w: 900, align: 'center', fill: C.ice, sw: 3 });
    frost(ctx, 545, 690, 190, 26, 12, { alpha: 0.8 });
    drawCoin(ctx, 566, 703, 8, 0);
    T(ctx, `${S.cost} per shot`, 580, 709, { size: 17, w: 900, fill: C.gold, stroke: null });
  }
  // power-ups
  const active = [S.power.freezeLeft > 0, S.power.lockonLeft > 0, false];
  BTN.power.forEach((r, i) => {
    const id = S.cfg.powerups.ids[i], n = S.power.uses[id];
    ctx.save(); ctx.globalAlpha = n > 0 || active[i] ? 1 : 0.42;
    frost(ctx, r.x, r.y, r.w, r.h, 24, { glow: active[i] || (n > 0 && V.tipPower), glowColor: POWER_COLORS[i] });
    drawPowerIcon(ctx, id, r.x + r.w / 2, r.y + 40, 22, POWER_COLORS[i]);
    T(ctx, POWER_NAMES[id], r.x + r.w / 2, r.y + r.h - 10, { size: 15, w: 900, align: 'center', fill: C.white, sw: 4 });
    const left = i === 0 ? S.power.freezeLeft / S.cfg.powerups.freezeTicks : i === 1 ? S.power.lockonLeft / S.cfg.powerups.lockonTicks : 0;
    if (left > 0) { ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 40, 34, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = POWER_COLORS[i]; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(r.x + r.w - 8, r.y + 8, 16, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.gold; ctx.stroke();
    T(ctx, String(n), r.x + r.w - 8, r.y + 9, { size: 18, w: 900, align: 'center', base: 'middle', fill: C.gold, stroke: null });
    ctx.restore();
  });
  // first sighting of a fish: what it is and what it is worth
  if (V.legend && V.t - V.legend.at < 3.2) {
    const k = V.legend.kind, f = S.cfg.fish[k];
    const a = Math.min(1, (3.2 - (V.t - V.legend.at)) / 0.4, (V.t - V.legend.at) / 0.2);
    ctx.save(); ctx.globalAlpha = a;
    frost(ctx, 16, 118, 330, 64, 18);
    drawFishIcon(ctx, k, 56, 150, 56, V.t);
    T(ctx, 'NEW: ' + fishName(k), 96, 143, { size: 19, w: 900, sw: 4 });
    const line = f.hazard ? 'Avoid — it stings your cannon' : f.capsule ? 'Hit it for a free power-up'
      : (S.mode === 'arcade' ? `${fmt(f.points)} points` : `${fmt(f.reward * S.cost)} coins`) + (f.wheel ? ' + prize wheel' : f.boss ? ' — boss!' : '');
    T(ctx, line, 96, 168, { size: 16, w: 800, fill: f.hazard ? C.coral : C.gold, sw: 4 });
    ctx.restore();
  }
}

/** Short status line under the top bar. */
export function drawCaption(ctx, V) {
  if (!V.caption) return;
  const age = V.t - V.caption.at;
  if (age > 1.5) { V.caption = null; return; }
  const a = age < 0.1 ? age / 0.1 : age > 1.2 ? (1.5 - age) / 0.3 : 1;
  T(ctx, V.caption.text, 640, 158, { size: 26, w: 900, align: 'center', fill: V.caption.color || C.white, sw: 7, a });
}
