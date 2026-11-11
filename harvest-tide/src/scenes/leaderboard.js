// Local leaderboard overlay: top 10 per mode on this device.
import { C, T, frost, iconButton, hit, roundRect, fmt, drawCoin, starPath } from '../view/theme.js';

export function createLeaderboardScene(app, { mode = 'arcade' } = {}) {
  let tab = mode, tabR = {}, closeR = null;
  const MEDAL = ['#FFD54A', '#D8E3EE', '#E0965A'];
  return {
    frame() {},
    draw(ctx) {
      ctx.fillStyle = 'rgba(4,14,26,0.78)'; ctx.fillRect(0, 0, 1280, 720);
      frost(ctx, 290, 30, 700, 660, 30, { glow: true, alpha: 0.9 });
      T(ctx, 'LEADERBOARD', 640, 92, { size: 44, w: 900, align: 'center' });
      closeR = iconButton(ctx, 'close', 906, 46, 64);
      for (const [key, label, x] of [['arcade', 'ARCADE', 330], ['reef', 'TREASURE REEF', 650]]) {
        const on = tab === key;
        roundRect(ctx, x, 120, 300, 56, 18);
        ctx.fillStyle = on ? 'rgba(255,201,60,0.95)' : 'rgba(8,30,55,0.8)'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = on ? C.ink : 'rgba(191,239,255,0.7)'; ctx.stroke();
        T(ctx, label, x + 150, 156, { size: 22, w: 900, align: 'center', fill: on ? C.ink : C.white, stroke: null });
        tabR[key] = { x, y: 120, w: 300, h: 56 };
      }
      T(ctx, tab === 'arcade' ? 'Best 60-second scores' : 'Highest coins reached in a visit', 640, 206, { size: 18, w: 700, align: 'center', fill: C.ice, stroke: null });
      const list = app.save.localRuns[tab].slice(0, 10);
      if (!list.length) {
        T(ctx, 'No results yet — go play!', 640, 380, { size: 28, w: 800, align: 'center', fill: C.ice });
        return;
      }
      list.forEach((r, i) => {
        const y = 228 + i * 44, latest = app.lastRecord && app.lastRecord.mode === tab && app.lastRecord.at === r.at;
        roundRect(ctx, 340, y, 600, 38, 12);
        ctx.fillStyle = latest ? 'rgba(255,201,60,0.28)' : i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'; ctx.fill();
        if (i < 3) { ctx.beginPath(); ctx.arc(372, y + 19, 14, 0, 7); ctx.fillStyle = MEDAL[i]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke(); }
        T(ctx, String(i + 1), 372, y + 26, { size: 18, w: 900, align: 'center', fill: i < 3 ? C.ink : C.ice, stroke: null });
        if (tab === 'reef') drawCoin(ctx, 420, y + 19, 11, 0);
        else { starPath(ctx, 420, y + 19, 11, 0.45); ctx.fillStyle = C.gold; ctx.fill(); }
        T(ctx, fmt(r.v), 444, y + 28, { size: 24, w: 900, fill: C.white, stroke: null });
        const d = new Date(r.at);
        T(ctx, d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + '  ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          920, y + 26, { size: 17, w: 700, align: 'right', fill: C.ice, stroke: null });
        if (latest) T(ctx, 'NEW', 760, y + 26, { size: 16, w: 900, fill: C.gold, stroke: null });
      });
    },
    pointer(type, p) {
      if (type !== 'up') return;
      if (hit(closeR, p)) { app.audio.play('click'); app.close(); return; }
      for (const k of ['arcade', 'reef']) if (hit(tabR[k], p)) { tab = k; app.audio.play('click'); }
    },
  };
}
