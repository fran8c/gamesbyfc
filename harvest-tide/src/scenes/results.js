// Results over the frozen last frame. Retry after a 1 s guard (spec P4).
import { C, T, goldText, button, hit, frost } from '../view/theme.js';
import { drawFishIcon } from '../view/fishart.js';
import { fishName } from '../view/hud.js';
import { writeSave } from '../platform/storage.js';

const ORDER = ['octopus_king', 'golden_koi', 'manta', 'turtle', 'lionfish', 'puffer', 'snapper', 'clownfish', 'sardine'];

export function createResultsScene(app, { summary, game }) {
  const s = app.save.stats, arcade = summary.mode === 'arcade';
  const prev = arcade ? s.bestArcade : s.bestTablePeak;
  const value = arcade ? summary.score : summary.peakBank;
  const counts = !arcade || summary.reason === 'timer';
  const isBest = counts && value > prev && value > 0;
  if (isBest) { if (arcade) s.bestArcade = value; else s.bestTablePeak = value; }
  if (arcade) s.runsArcade++; else s.sessionsTable++;
  const runs = app.save.localRuns[arcade ? 'arcade' : 'table'];
  if (counts) { runs.push({ v: value, at: Date.now() }); runs.sort((a, b) => b.v - a.v || a.at - b.at); runs.length = Math.min(runs.length, 50); }
  const saved = writeSave(app.save);
  let age = 0, retryR = null, menuR = null;

  return {
    tick() {},
    frame(dt) { age += dt; },
    draw(ctx) {
      game.draw(ctx, { hud: false });
      ctx.fillStyle = 'rgba(4,14,26,0.62)'; ctx.fillRect(0, 0, 1280, 720);
      frost(ctx, 240, 50, 800, 620, 28, { glow: true, alpha: 0.85 });
      T(ctx, arcade ? (summary.reason === 'quit' ? 'RUN ENDED' : "TIME'S UP!") : (summary.reason === 'broke' ? 'OUT OF COINS' : 'CASHED OUT'),
        640, 112, { size: 40, w: 900, align: 'center' });
      const shown = Math.round(value * Math.min(1, age / 0.9));
      goldText(ctx, shown.toLocaleString('en-US'), 640, 182, 84);
      T(ctx, arcade ? 'SCORE' : 'PEAK BANK', 640, 236, { size: 16, w: 800, align: 'center', fill: C.ice, stroke: null });
      T(ctx, isBest ? 'NEW BEST!' : prev ? `Best ${prev.toLocaleString('en-US')}` : '', 640, 266,
        { size: 24, w: 900, align: 'center', fill: isBest ? C.coral : C.ice, sw: 5 });
      // stats rows
      let y = 312;
      const row = (label, v) => {
        T(ctx, label, 300, y, { size: 22, w: 700, fill: C.ice, stroke: null });
        T(ctx, v, 980, y, { size: 22, w: 900, align: 'right', stroke: null });
        y += 34;
      };
      const b = summary.biggest;
      if (arcade) {
        row('Biggest catch', b.kind ? `${fishName(b.kind)}  ${b.amount.toLocaleString('en-US')}` : '—');
        row('Best combo', 'x' + summary.bestMultiplier.toFixed(1));
        row('Accuracy', `${Math.round(summary.accuracy * 100)}%` + (summary.accuracyBonus ? `  (+${summary.accuracyBonus.toLocaleString('en-US')} bonus)` : ''));
      } else {
        row('Final bank', summary.bank.toLocaleString('en-US'));
        row('Biggest win', b.kind ? `${fishName(b.kind)}  ${b.amount.toLocaleString('en-US')}  (×${Math.round(b.x)})` : '—');
        row('Shots · time', `${summary.shots}  ·  ${Math.floor(summary.ticks / 3600)}m ${Math.floor(summary.ticks / 60) % 60}s`);
      }
      // catch icons
      const caught = ORDER.filter(k => summary.catches[k]);
      caught.forEach((k, i) => {
        const col = i % 5, rowN = Math.floor(i / 5);
        const x = 300 + col * 136, cy = y + 24 + rowN * 52;
        drawFishIcon(ctx, k, x + 22, cy, 44, 0);
        T(ctx, '×' + summary.catches[k], x + 50, cy + 8, { size: 20, w: 900, sw: 4 });
      });
      if (!saved) T(ctx, "Progress can't be saved on this device", 640, 546, { size: 16, w: 700, align: 'center', fill: C.coral, stroke: null });
      const ready = age >= 1;
      retryR = button(ctx, arcade ? 'PLAY AGAIN' : 'NEW SESSION', 330, 572, 340, 76, { primary: true, disabled: !ready, size: 32 });
      menuR = button(ctx, 'MENU', 700, 572, 250, 76, { size: 30 });
    },
    pointer(type, p) {
      if (type !== 'up') return;
      if (hit(retryR, p) && age >= 1) app.go('game', { mode: summary.mode });
      else if (hit(menuR, p)) app.go('title');
    },
  };
}
