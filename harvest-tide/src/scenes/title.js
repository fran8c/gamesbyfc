// Title: logo, two mode cards, bests, and an icon row. A robot Arcade game plays behind it.
import { C, T, goldText, button, iconButton, hit, frost, fmt, drawCoin, starPath } from '../view/theme.js';
import { drawCreature } from '../view/fishart.js';
import { createGameScene } from './game.js';
import { createHowtoScene } from './howto.js';
import { createLeaderboardScene } from './leaderboard.js';
import { createSettingsScene } from './settings.js';
import { writeSave } from '../platform/storage.js';

export function createTitleScene(app) {
  const newDemo = seed => createGameScene(app, { mode: 'arcade', seed, autoplay: 'expert', attract: true });
  let demo = newDemo(20261108);
  let arcadeR = null, icons = {}, t = 0, musicR = null, sfxR = null, backR = null;
  return {
    tick(n) {
      if (app.overlay) return;
      demo.tick(n);
      if (demo.S.over) demo = newDemo((Math.random() * 2 ** 32) >>> 0);
    },
    frame(dt) { t += dt; if (!app.overlay) demo.frame(dt); },
    draw(ctx) {
      demo.draw(ctx, { hud: false });
      const g = ctx.createLinearGradient(0, 0, 0, 720);
      g.addColorStop(0, 'rgba(4,14,26,0.55)'); g.addColorStop(0.5, 'rgba(4,14,26,0.25)'); g.addColorStop(1, 'rgba(4,14,26,0.7)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);

      // logo with a koi swimming past
      const bob = Math.sin(t * 1.8) * 5;
      ctx.save(); ctx.shadowColor = C.glow; ctx.shadowBlur = 40;
      goldText(ctx, 'HARVEST TIDE', 640, 140 + bob, 112);
      ctx.restore();
      drawCreature(ctx, 'golden_koi', 640 + Math.sin(t * 0.6) * 380, 60 + Math.cos(t * 1.2) * 8, { dir: Math.cos(t * 0.6) > 0 ? 1 : -1, t, scale: 0.8, alpha: 0.95 });
      T(ctx, 'Aim · Net · Chain · Spin', 640, 204, { size: 26, w: 800, align: 'center', fill: C.ice, sw: 6 });
      // how it works: three steps that light up in turn
      const step = Math.floor(t / 1.2) % 3;
      ['1 Aim', '2 Fire', '3 Catch!'].forEach((label, i) => {
        const on = i === step;
        frost(ctx, 470 + i * 110, 222, 100, 30, 12, { glow: on, glowColor: C.gold, alpha: on ? 0.95 : 0.45 });
        T(ctx, label, 520 + i * 110, 243, { size: 16, w: 900, align: 'center', fill: on ? C.gold : C.ice, stroke: null });
      });
      // back to the Games by FC arcade
      backR = button(ctx, '\u2190 All games', 30, 22, 150, 40, { size: 15 });
      // quick sound toggles (same settings as the Settings screen)
      const s0 = app.save.settings;
      musicR = button(ctx, s0.music ? 'Music on' : 'Music off', 1020, 22, 110, 40, { size: 15 });
      sfxR = button(ctx, s0.sfx ? 'Sound on' : 'Sound off', 1140, 22, 110, 40, { size: 15 });

      // mode cards
      const s = app.save.stats, pulse = 1 + Math.sin(t * 3) * 0.015;
      ctx.save(); ctx.translate(640, 345); ctx.scale(pulse, pulse); ctx.translate(-640, -345);
      arcadeR = button(ctx, 'PLAY', 450, 260, 380, 170, { primary: true, size: 58, sub: '60 seconds · chase a high score' });
      ctx.restore();
      starPath(ctx, 640, 470, 13, 0.45); ctx.fillStyle = C.gold; ctx.fill();
      T(ctx, s.bestArcade ? `Best ${fmt(s.bestArcade)}` : 'No score yet', 662, 478, { size: 22, w: 800, fill: C.gold, sw: 5 });

      // icon row
      const row = [['help', 'How to play'], ['trophy', 'Scores'], ['gear', 'Settings']];
      if (app.canFullscreen) row.push(['fullscreen', app.isFullscreen() ? 'Exit full' : 'Full screen']);
      const start = 640 - (row.length * 96 - 16) / 2;
      icons = {};
      row.forEach(([icon, label], i) => { icons[icon] = iconButton(ctx, icon, start + i * 96, 520, 80, { label }); });

      T(ctx, 'Just for fun — no real money, ever', 640, 650, { size: 17, w: 700, align: 'center', fill: C.ice, sw: 4 });
      T(ctx, 'A Game by FC', 640, 690, { size: 18, w: 800, align: 'center', fill: C.ice, sw: 4, a: 0.9 });
    },
    pointer(type, p) {
      if (type !== 'up') return;
      if (hit(backR, p)) { app.audio.play('click'); location.href = '../index.html'; }
      else if (hit(arcadeR, p)) { app.audio.play('click'); app.go('game', { mode: 'arcade' }); }
      else if (hit(musicR, p)) { const s = app.save.settings; s.music = !s.music; writeSave(app.save); app.audio.apply(); app.audio.music(s.music); app.audio.play('click'); }
      else if (hit(sfxR, p)) { const s = app.save.settings; s.sfx = !s.sfx; writeSave(app.save); app.audio.apply(); app.audio.play('click'); }
      else if (hit(icons.help, p)) { app.audio.play('click'); app.open(createHowtoScene(app, {})); }
      else if (hit(icons.trophy, p)) { app.audio.play('click'); app.open(createLeaderboardScene(app, {})); }
      else if (hit(icons.gear, p)) { app.audio.play('click'); app.open(createSettingsScene(app)); }
      else if (hit(icons.fullscreen, p)) { app.audio.play('click'); app.toggleFullscreen(); }
    },
  };
}
