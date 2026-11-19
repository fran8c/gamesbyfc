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
  let age = 0, retryR = null, boardR = null, menuR = null, shareR = null, cheered = false;
  let restartIn = arcade ? 6 : null, copied = 0;   // Arcade: auto play again after a countdown, cancelled by any tap
  const cancelRestart = () => { restartIn = null; };
  const share = () => {
    const text = `I scored ${fmt(summary.score)} in Harvest Tide. Can you beat me?`;
    try { navigator.clipboard.writeText(text).then(() => { copied = 2; }).catch(() => { copied = 2; }); } catch { copied = 2; }
  };

  const title = arcade ? (summary.reason === 'quit' ? 'RUN ENDED' : "TIME'S UP!")
    : summary.reason === 'empty' ? 'OUT OF COINS' : 'YOU LEFT THE REEF';
  const mins = Math.floor(summary.ticks / 3600), secs = Math.floor(summary.ticks / 60) % 60;

  return {
    tick() {},
    frame(dt) {
      if (app.overlay) return;
      age += dt;
      if (copied > 0) copied -= dt;
      if (restartIn !== null && age >= 1) {
        restartIn -= dt;
        if (restartIn <= 0) { restartIn = null; app.go('game', { mode: summary.mode }); return; }
      }
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

      const b0 = summary.biggest;
      if (arcade && b0.kind) T(ctx, `Best catch: ${fishName(b0.kind)} for ${fmt(b0.amount)} points`, 640, 284, { size: 20, w: 800, align: 'center', fill: C.gold, sw: 4 });
      let y = 306;
      const row = (label, v) => {
        T(ctx, label, 300, y, { size: 22, w: 700, fill: C.ice, stroke: null });
        T(ctx, v, 980, y, { size: 22, w: 900, align: 'right', stroke: null });
        y += 34;
      };
      const b = summary.biggest;
      if (arcade) {
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
      const again = restartIn !== null ? `PLAY AGAIN (${Math.ceil(restartIn)})` : arcade ? 'PLAY AGAIN' : 'NEW VISIT';
      retryR = button(ctx, again, 262, 580, 250, 76, { primary: true, disabled: !ready, size: 24 });
      shareR = button(ctx, copied > 0 ? 'COPIED!' : 'SHARE', 528, 580, 150, 76, { size: 22, disabled: !ready });
      boardR = button(ctx, 'SCORES', 694, 580, 150, 76, { size: 22, disabled: !ready });
      menuR = button(ctx, 'MENU', 858, 580, 150, 76, { size: 22, disabled: !ready });
    },
    pointer(type, p) {
      if (type !== 'up' || age < 1) return;
      cancelRestart();
      if (hit(retryR, p)) { app.audio.play('click'); app.go('game', { mode: summary.mode }); }
      else if (hit(shareR, p)) { app.audio.play('click'); share(); }
      else if (hit(boardR, p)) { app.audio.play('click'); app.open(createLeaderboardScene(app, { mode: summary.mode })); }
      else if (hit(menuR, p)) { app.audio.play('click'); app.go('title'); }
    },
  };
}
