// Title: logo, mode select, bests. A robot Arcade game plays behind it.
import { C, T, goldText, button, hit, frost } from '../view/theme.js';
import { createGameScene } from './game.js';

export function createTitleScene(app) {
  let demo = createGameScene(app, { mode: 'arcade', seed: 20261108, autoplay: 'expert', attract: true });
  let arcadeR = null, tableR = null, soundR = null, t = 0;
  return {
    tick(n) {
      demo.tick(n);
      if (demo.S.over) demo = createGameScene(app, { mode: 'arcade', seed: (Math.random() * 2 ** 32) >>> 0, autoplay: 'expert', attract: true });
    },
    frame(dt) { t += dt; demo.frame(dt); },
    draw(ctx) {
      demo.draw(ctx, { hud: false });
      ctx.fillStyle = 'rgba(4,14,26,0.5)'; ctx.fillRect(0, 0, 1280, 720);
      const bob = Math.sin(t * 1.8) * 5;
      ctx.save(); ctx.shadowColor = C.glow; ctx.shadowBlur = 40;
      goldText(ctx, 'HARVEST TIDE', 640, 150 + bob, 108);
      ctx.restore();
      T(ctx, 'Aim · Net · Chain · Spin', 640, 222, { size: 26, w: 800, align: 'center', fill: C.ice, sw: 6 });
      const s = app.save.stats;
      arcadeR = button(ctx, 'ARCADE', 250, 300, 360, 150, { primary: true, size: 46, sub: '60-second high score' });
      tableR = button(ctx, 'FISH TABLE', 670, 300, 360, 150, { size: 46, sub: 'Bet coins · play till they run out' });
      T(ctx, s.bestArcade ? `Best ${s.bestArcade.toLocaleString('en-US')}` : 'No score yet', 430, 486, { size: 22, w: 800, align: 'center', fill: C.gold, sw: 5 });
      T(ctx, s.bestTablePeak ? `Best peak bank ${s.bestTablePeak.toLocaleString('en-US')}` : 'Start with 1,000 coins', 850, 486, { size: 22, w: 800, align: 'center', fill: C.gold, sw: 5 });
      frost(ctx, 250, 530, 780, 92, 18, { alpha: 0.55 });
      T(ctx, 'Touch to aim and fire · shots bounce off the walls · nets catch whole schools', 640, 566, { size: 19, w: 700, align: 'center', fill: C.white, sw: 4 });
      T(ctx, 'Golden Koi spins the prize wheel · power-ups bottom right · no real money, ever', 640, 598, { size: 19, w: 700, align: 'center', fill: C.ice, sw: 4 });
      T(ctx, 'A Game by FC', 640, 690, { size: 18, w: 800, align: 'center', fill: C.ice, sw: 4, a: 0.9 });
      soundR = null;
    },
    pointer(type, p) {
      if (type !== 'up') return;
      if (hit(arcadeR, p)) app.go('game', { mode: 'arcade' });
      else if (hit(tableR, p)) app.go('game', { mode: 'table' });
      void soundR;
    },
  };
}
