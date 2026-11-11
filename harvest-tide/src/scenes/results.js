// Results over the frozen last frame. Buttons unlock after 1 s so a stray tap can't skip it.
import { C, T, goldText, button, hit, frost, fmt } from '../view/theme.js';
import { drawFishIcon } from '../view/fishart.js';
import { fishName } from '../view/hud.js';
import { writeSave, recordRun } from '../platform/storage.js';
import { createLeaderboardScene } from './leaderboard.js';

const ORDER = ['octopus_king', 'golden_koi', 'manta', 'turtle', 'lionfish', 'puffer', 'snapper', 'clownfish', 'sardine', 'capsule'];

export function createResultsScene(app, { summary, game }) {
  const s = app.save.stats, arcade = summary.mode === 'arcade';
  const prev = arcade ? s.bestArcade : s.bestReefPeak;
  const value = arcade ? summary.score : summary.peakCoins;
  const counts = arcade ? summary.reason === 'timer' : summary.shots > 0;
  const isBest = counts && value > prev && value > 0;
  if (isBest) { if (arcade) s.bestArcade = value; else s.bestReefPeak = value; }
  if (arcade) s.runsArcade++; else s.sessionsReef++;
  let rank = 0;
  if (counts) {
    rank = recordRun(app.save, summary.mode, value);
    if (rank) app.lastRecord = { mode: summary.mode, at: app.save.localRuns[summary.mode][rank - 1].at };
  }
  const saved = writeSave(app.save);
  let age = 0, retryR = null, boardR = null, menuR = null, cheered = false;

  const title = arcade ? (summary.reason === 'quit' ? 'RUN ENDED' : "TIME'S UP!")
    : summary.reason === 'empty' ? 'OUT OF COINS' : 'YOU LEFT THE REEF';
  const mins = Math.floor(summary.ticks / 3600), secs = Math.floor(summary.ticks / 60) % 60;

  return {
    tick() {},
    frame(dt) {
      age += dt;
      if (!cheered && age > 0.9) { cheered = true; if (isBest || (rank && rank <= 3)) app.audio.play('big'); }
    },
    draw(ctx) {
      game.draw(ctx, { hud: false });
      ctx.fillStyle = 'rgba(4,14,26,0.62)'; ctx.fillRect(0, 0, 1280, 720);
      frost(ctx, 240, 40, 800, 640, 28, { glow: true, alpha: 0.86 });
      T(ctx, title, 640, 100, { size: 40, w: 900, align: 'center' });
      const shown = Math.round(value * Math.min(1, age / 0.9));
      goldText(ctx, fmt(shown), 640, 172, 84);
      T(ctx, arcade ? 'SCORE' : 'MOST COINS THIS VISIT', 640, 222, { size: 16, w: 800, align: 'center', fill: C.ice, stroke: null });
      const badge = isBest ? 'NEW BEST!' : rank && rank <= 10 ? `#${rank} on your leaderboard` : prev ? `Best ${fmt(prev)}` : '';
      T(ctx, badge, 640, 256, { size: 24, w: 900, align: 'center', fill: isBest ? C.coral : rank && rank <= 10 ? C.gold : C.ice, sw: 5 });

      let y = 300;
      const row = (label, v) => {
        T(ctx, label, 300, y, { size: 22, w: 700, fill: C.ice, stroke: null });
        T(ctx, v, 980, y, { size: 22, w: 900, align: 'right', stroke: null });
        y += 34;
      };
      const b = summary.biggest;
      if (arcade) {
        row('Biggest catch', b.kind ? `${fishName(b.kind)}  ${fmt(b.amount)}` : '—');
        row('Best combo', '×' + summary.bestMultiplier.toFixed(1));
        row('Accuracy', `${Math.round(summary.accuracy * 100)}%` + (summary.accuracyBonus ? `  (+${fmt(summary.accuracyBonus)} bonus)` : ''));
      } else {
        row('Coins now', `${fmt(summary.coins)}  (started with ${fmt(summary.startCoins)})`);
        row('Biggest catch', b.kind ? `${fishName(b.kind)}  ${fmt(b.amount)}  (×${Math.round(b.x)})` : '—');
        row('Shots · time', `${fmt(summary.shots)}  ·  ${mins}m ${secs}s`);
      }
      if (summary.luckyCatches) row('Lucky catches', String(summary.luckyCatches));

      const caught = ORDER.filter(k => summary.catches[k]);
      caught.forEach((k, i) => {
        const col = i % 5, rowN = Math.floor(i / 5), x = 300 + col * 136, cy = y + 22 + rowN * 52;
        drawFishIcon(ctx, k, x + 22, cy, 44, 0);
        T(ctx, '×' + summary.catches[k], x + 50, cy + 8, { size: 20, w: 900, sw: 4 });
      });
      if (!saved) T(ctx, "Progress can't be saved on this device", 640, 560, { size: 16, w: 700, align: 'center', fill: C.coral, stroke: null });
      const ready = age >= 1;
      retryR = button(ctx, arcade ? 'PLAY AGAIN' : 'NEW VISIT', 270, 580, 300, 76, { primary: true, disabled: !ready, size: 30 });
      boardR = button(ctx, 'SCORES', 590, 580, 210, 76, { size: 26, disabled: !ready });
      menuR = button(ctx, 'MENU', 820, 580, 190, 76, { size: 26, disabled: !ready });
    },
    pointer(type, p) {
      if (type !== 'up' || age < 1) return;
      if (hit(retryR, p)) { app.audio.play('click'); app.go('game', { mode: summary.mode }); }
      else if (hit(boardR, p)) { app.audio.play('click'); app.open(createLeaderboardScene(app, { mode: summary.mode })); }
      else if (hit(menuR, p)) { app.audio.play('click'); app.go('title'); }
    },
  };
}
