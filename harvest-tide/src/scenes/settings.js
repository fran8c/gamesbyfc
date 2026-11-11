// Settings overlay: music, sound, vibration, reduced motion, value tags, tips, fullscreen.
import { C, T, frost, toggle, button, iconButton, hit } from '../view/theme.js';
import { writeSave } from '../platform/storage.js';

export function createSettingsScene(app) {
  const s = app.save.settings;
  const ROWS = [
    ['music', 'Music'], ['sfx', 'Sound effects'], ['haptics', 'Vibration (phones)'],
    ['reducedMotion', 'Reduced motion (less flashing and shaking)'], ['showValues', 'Show values on big fish'],
  ];
  let rects = [], tipsR = null, fullR = null, closeR = null, tipsDone = 0;
  return {
    frame(dt) { if (tipsDone > 0) tipsDone -= dt; },
    draw(ctx) {
      ctx.fillStyle = 'rgba(4,14,26,0.78)'; ctx.fillRect(0, 0, 1280, 720);
      frost(ctx, 290, 40, 700, 640, 30, { glow: true, alpha: 0.9 });
      T(ctx, 'SETTINGS', 640, 104, { size: 46, w: 900, align: 'center' });
      closeR = iconButton(ctx, 'close', 906, 56, 64);
      rects = ROWS.map(([key, label], i) => ({ key, r: toggle(ctx, label, !!s[key], 340, 140 + i * 76, 600) }));
      tipsR = button(ctx, tipsDone > 0 ? 'TIPS WILL SHOW AGAIN' : 'SHOW TIPS AGAIN', 340, 530, 290, 66, { size: 22 });
      fullR = app.canFullscreen ? button(ctx, app.isFullscreen() ? 'EXIT FULLSCREEN' : 'FULLSCREEN', 650, 530, 290, 66, { size: 22 }) : null;
      T(ctx, 'Settings are saved on this device.', 640, 640, { size: 18, w: 700, align: 'center', fill: C.ice, stroke: null });
    },
    pointer(type, p) {
      if (type !== 'up') return;
      if (hit(closeR, p)) { app.audio.play('click'); app.close(); return; }
      for (const { key, r } of rects) {
        if (hit(r, p)) {
          s[key] = !s[key];
          writeSave(app.save);
          app.audio.apply();
          if (key === 'music') app.audio.music(s.music);
          app.audio.play('click');
          return;
        }
      }
      if (hit(tipsR, p)) { app.save.tips.seen = {}; writeSave(app.save); tipsDone = 2; app.audio.play('click'); }
      else if (hit(fullR, p)) { app.toggleFullscreen(); app.audio.play('click'); }
    },
  };
}
