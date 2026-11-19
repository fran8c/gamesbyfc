// How to play: six illustrated pages, drawn with the real game art.
import { C, T, frost, iconButton, hit, roundRect, drawCoin, drawPowerIcon, drawIcon, goldText, fmt } from '../view/theme.js';
import { drawCreature, drawFishIcon } from '../view/fishart.js';
import { fishName } from '../view/hud.js';

const TAU = Math.PI * 2;

function wrap(ctx, text, maxW, size) {
  ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const out = []; let line = '';
  for (const w of text.split(' ')) {
    const tryL = line ? line + ' ' + w : w;
    if (ctx.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL;
  }
  if (line) out.push(line);
  return out;
}

function bullets(ctx, lines, x = 660, y = 230) {
  let yy = y;
  for (const l of lines) {
    const parts = wrap(ctx, l, 500, 21);
    ctx.beginPath(); ctx.arc(x + 8, yy - 8, 7, 0, TAU); ctx.fillStyle = C.gold; ctx.fill();
    parts.forEach((pt, k) => T(ctx, pt, x + 28, yy + k * 28, { size: 21, w: 700, stroke: null }));
    yy += parts.length * 28 + 22;
  }
}

function illoBox(ctx) {
  roundRect(ctx, 100, 170, 520, 420, 24);
  const g = ctx.createLinearGradient(0, 170, 0, 590); g.addColorStop(0, '#13719F'); g.addColorStop(1, '#062744');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(191,239,255,0.6)'; ctx.stroke();
}

function miniCannon(ctx, x, y, ang) {
  ctx.beginPath(); ctx.arc(x, y + 10, 46, Math.PI, 0); ctx.fillStyle = '#1B3C5A'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ice; ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  roundRect(ctx, 0, -11, 64, 22, 8); ctx.fillStyle = '#A47BFF'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fillStyle = '#CFE9FF'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
}

const PAGES = [
  {
    title: 'Aim & fire',
    draw(ctx, t) {
      illoBox(ctx);
      for (let i = 0; i < 5; i++) drawCreature(ctx, 'sardine', 420 + (i % 3) * 30, 250 + Math.floor(i / 3) * 24, { dir: -1, t, seed: i, scale: 1.3 });
      // bounce path: cannon → right wall → school
      const pts = [[360, 540], [600, 380], [440, 262]];
      ctx.save(); ctx.setLineDash([6, 12]); ctx.lineDashOffset = -t * 40; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(220,250,255,0.85)';
      ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.shadowColor = C.glow; ctx.shadowBlur = 16; ctx.strokeStyle = 'rgba(200,245,255,0.95)'; ctx.lineWidth = 2;
      for (let j = 1; j <= 3; j++) { ctx.beginPath(); ctx.arc(440, 262, 44 * j / 3, 0, TAU); ctx.stroke(); }
      ctx.restore();
      miniCannon(ctx, 360, 556, Math.atan2(-160, 240));
      ctx.beginPath(); ctx.arc(250, 320, 26, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.white; ctx.stroke();
      T(ctx, 'touch', 250, 368, { size: 18, w: 800, align: 'center', fill: C.white, sw: 4 });
      bullets(ctx, ['Touch and hold anywhere to fire.', 'Slide your finger to aim — the dotted line shows the path.',
        'Shots bounce off the walls up to 3 times.', 'A hit throws a net that catches up to 5 fish at once.', 'Pause any time with the button top-left.']);
    },
  },
  {
    title: 'The fish',
    draw(ctx, t, mode) {
      const kinds = ['sardine', 'clownfish', 'snapper', 'puffer', 'lionfish', 'turtle', 'manta', 'golden_koi', 'octopus_king', 'jellyfish', 'capsule'];
      kinds.forEach((k, i) => {
        const col = i % 4, row = Math.floor(i / 4), x = 110 + col * 270, y = 180 + row * 140;
        frost(ctx, x, y, 250, 124, 18, { alpha: 0.45 });
        drawFishIcon(ctx, k, x + 62, y + 58, 92, t);
        T(ctx, fishName(k), x + 120, y + 42, { size: 18, w: 900, stroke: null, maxW: 125 });
        const f = { sardine: [10, 2], clownfish: [20, 3], snapper: [30, 5], puffer: [50, 8], lionfish: [80, 12], turtle: [150, 20], manta: [250, 30], golden_koi: [300, 40], octopus_king: [1500, 100] }[k];
        if (f) {
          T(ctx, `${fmt(f[0])} pts`, x + 120, y + 70, { size: 17, w: 800, fill: C.ice, stroke: null });
          drawCoin(ctx, x + 130, y + 92, 8, 0);
          T(ctx, `${f[1]} × shot`, x + 144, y + 98, { size: 17, w: 800, fill: C.gold, stroke: null });
        } else T(ctx, k === 'jellyfish' ? 'Avoid! Stings' : 'Free power-up', x + 120, y + 74, { size: 17, w: 800, fill: k === 'jellyfish' ? C.coral : C.glow, stroke: null, maxW: 125 });
      });
      T(ctx, 'Big fish take several hits — watch the health bar. Bigger fish score more.', 640, 606,
        { size: 18, w: 700, align: 'center', fill: C.ice, stroke: null, maxW: 880 });
      void mode;
    },
  },
  {
    title: 'Combo & Harvest Fever',
    draw(ctx, t) {
      illoBox(ctx);
      frost(ctx, 160, 220, 400, 80, 18);
      goldText(ctx, 'x' + (1 + 0.5 * (Math.floor(t * 1.5) % 9)).toFixed(1), 232, 260, 44);
      roundRect(ctx, 310, 252, 220, 16, 8); ctx.fillStyle = 'rgba(6,20,36,0.8)'; ctx.fill();
      roundRect(ctx, 310, 252, 220 * (1 - (t % 2) / 2), 16, 8); ctx.fillStyle = C.glow; ctx.fill();
      frost(ctx, 200, 340, 320, 52, 16, { glow: true, glowColor: C.lime });
      T(ctx, 'HARVEST FEVER', 360, 374, { size: 24, w: 900, align: 'center', fill: C.lime, sw: 5 });
      drawCreature(ctx, 'jellyfish', 360, 480, { t, scale: 1.6 });
      T(ctx, 'stings!', 440, 490, { size: 20, w: 900, fill: C.coral, sw: 4 });
      bullets(ctx, ['Arcade mode: keep catching to grow your combo.', 'Every 4 catches adds +0.5× (up to ×5).',
        'Stop catching for 2 seconds and the combo resets.', 'Reach ×3 for Harvest Fever: bigger nets and faster shots.', 'Jellyfish jam your cannon and break your combo.']);
    },
  },
  {
    title: 'Lucky meter & prize wheel',
    draw(ctx, t) {
      illoBox(ctx);
      frost(ctx, 150, 200, 420, 70, 18, { glow: true, glowColor: C.gold, border: C.gold });
      drawIcon(ctx, 'clover', 186, 235, 18, C.gold);
      roundRect(ctx, 220, 226, 320, 18, 9); ctx.fillStyle = 'rgba(6,20,36,0.8)'; ctx.fill();
      const f = (t * 0.4) % 1;
      roundRect(ctx, 220, 226, Math.max(18, 320 * f), 18, 9); ctx.fillStyle = C.gold; ctx.fill();
      const cx = 360, cy = 440, r = 110, segs = ['×3', '×2', '×5', '×3', '×8', '×2', '×5', '×10', '×3', '×5', '×20', '★'];
      const cols = ['#FF5E8A', '#3FE3FF', '#C6FF4A', '#FFC93C', '#9B6BFF', '#FF8A1F'];
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.8);
      segs.forEach((s, i) => {
        const a0 = -Math.PI / 2 + i * TAU / 12 - TAU / 24;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a0, a0 + TAU / 12); ctx.closePath();
        ctx.fillStyle = cols[i % 6]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.save(); ctx.rotate(a0 + TAU / 24); ctx.translate(r * 0.7, 0); ctx.rotate(Math.PI / 2);
        T(ctx, s, 0, 0, { size: 17, w: 900, align: 'center', base: 'middle', sw: 4 }); ctx.restore();
      });
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, 34, 0, TAU); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke();
      drawFishIcon(ctx, 'golden_koi', cx, cy, 52, t);
      bullets(ctx, ['Every shot that lands fills the lucky meter.', 'When the meter is full, your next catch spins the prize wheel.', 'A Golden Koi always spins the wheel: ×2 up to ×20.', '★ on the wheel also gives a free power-up.']);
    },
  },
  {
    title: 'Power-ups',
    draw(ctx, t) {
      const rows = [['freeze', '#8FEAFF', 'Freeze', 'All fish stop for 4 seconds — easy targets.'],
        ['lockon', '#FF7A7A', 'Lock-on', 'For 6 seconds your shots curve toward the most valuable fish.'],
        ['lightning', '#FFE15A', 'Zap', 'Lightning strikes the 6 most valuable fish on screen.']];
      rows.forEach(([id, col, name, text], i) => {
        const y = 180 + i * 130;
        frost(ctx, 140, y, 1000, 112, 22, { alpha: 0.5 });
        frost(ctx, 160, y + 10, 92, 92, 22, { glow: true, glowColor: col });
        drawPowerIcon(ctx, id, 206, y + 56, 24, col);
        T(ctx, name, 280, y + 48, { size: 30, w: 900, fill: col, sw: 5 });
        T(ctx, text, 280, y + 86, { size: 22, w: 700, stroke: null, maxW: 840 });
      });
      drawCreature(ctx, 'capsule', 200, 600, { t, scale: 1.2 });
      T(ctx, 'Hit a glowing Power Pearl for an extra use. You start with 2 of each.', 240, 608, { size: 20, w: 700, fill: C.ice, stroke: null, maxW: 900 });
    },
  },
  {
    title: 'The last 10 seconds',
    draw(ctx, t) {
      illoBox(ctx);
      // a clock ring that shrinks: 60 s, then the sprint starts at 10 s
      const cx = 360, cy = 380, r = 110, left = (t * 0.2) % 1;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(191,239,255,0.25)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - left)); ctx.lineWidth = 16;
      ctx.strokeStyle = left > 0.83 ? C.coral : C.glow; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      goldText(ctx, left > 0.83 ? '×1.5' : '×1', cx, cy + 14, 52);
      T(ctx, left > 0.83 ? 'FINAL SPRINT' : 'Warm-up', cx, cy + 150, { size: 22, w: 900, align: 'center', fill: C.ice, sw: 4 });
      bullets(ctx, ['Fish start slow and get faster as the minute goes on.', 'In the final 10 seconds every point you score is worth ×1.5.',
        'A "10 seconds left!" warning tells you when the sprint starts.', 'Accuracy at the end adds a bonus to your score.'], 660, 230);
    },
  },
];

export function createHowtoScene(app, { mode = 'arcade', page = 0 } = {}) {
  let i = page, t = 0, prevR = null, nextR = null, closeR = null;
  return {
    frame(dt) { t += dt; },
    draw(ctx) {
      ctx.fillStyle = 'rgba(4,14,26,0.82)'; ctx.fillRect(0, 0, 1280, 720);
      frost(ctx, 60, 30, 1160, 660, 30, { glow: true, alpha: 0.92 });
      T(ctx, 'HOW TO PLAY', 110, 92, { size: 22, w: 900, fill: C.ice, stroke: null });
      T(ctx, PAGES[i].title, 110, 140, { size: 40, w: 900 });
      closeR = iconButton(ctx, 'close', 1130, 46, 64);
      PAGES[i].draw(ctx, t, mode);
      prevR = i > 0 ? iconButton(ctx, 'back', 100, 610, 64) : null;
      nextR = i < PAGES.length - 1 ? iconButton(ctx, 'next', 1116, 610, 64) : null;
      for (let k = 0; k < PAGES.length; k++) {
        ctx.beginPath(); ctx.arc(640 - (PAGES.length - 1) * 14 + k * 28, 660, k === i ? 9 : 6, 0, TAU);
        ctx.fillStyle = k === i ? C.gold : 'rgba(191,239,255,0.5)'; ctx.fill();
      }
    },
    pointer(type, p) {
      if (type !== 'up') return;
      if (hit(closeR, p)) { app.audio.play('click'); app.close(); }
      else if (hit(prevR, p)) { i--; app.audio.play('click'); }
      else if (hit(nextR, p)) { i++; app.audio.play('click'); }
      else if (p.x > 640 && i < PAGES.length - 1 && p.y > 160 && p.y < 600) { i++; app.audio.play('click'); }
    },
  };
}
