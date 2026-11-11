// First-time tips: short, non-blocking hints that appear once each (spec 8.4).
// "Show tips again" in Settings clears save.tips.seen.
import { C, T, frost } from './theme.js';

export const TIPS = {
  aim:        { text: 'Touch and hold to fire. Shots bounce off the walls!', x: 640, y: 470 },
  reefLevel:  { text: 'Use − and + to change cannon level. Higher levels cost more per shot and win more.', x: 640, y: 548, arrow: 'down' },
  reefMiss:   { text: 'Missed shots cost nothing — you only pay when you hit.', x: 640, y: 470 },
  power:      { text: 'Power-ups! Freeze stops fish, Lock-on aims for you, Zap hits the 6 best fish.', x: 1046, y: 548, arrow: 'down', w: 520 },
  luckyHalf:  { text: 'The lucky meter fills as your shots land. When it is full, something great happens!', x: 640, y: 548, arrow: 'down' },
  luckyReady: { text: 'Lucky meter full! Your next hit is a guaranteed big catch.', x: 640, y: 548, arrow: 'down' },
  luckyArcade:{ text: 'Lucky meter full! Your next catch spins the prize wheel.', x: 640, y: 548, arrow: 'down' },
  koi:        { text: 'A Golden Koi! Catch it to spin the prize wheel.', x: 640, y: 236 },
  boss:       { text: 'The Octopus King! It takes many hits but is worth a fortune.', x: 640, y: 236 },
  jelly:      { text: 'Jellyfish sting your cannon and break your combo. Avoid them!', x: 640, y: 236 },
  fever:      { text: 'Harvest Fever: bigger nets and faster shots for 6 seconds!', x: 640, y: 236 },
  combo:      { text: 'Keep catching to build your combo multiplier. Stop for 2 seconds and it resets.', x: 640, y: 128, arrow: 'up' },
};

export function createTips(save, { enabled = true } = {}) {
  const queue = [];
  let cur = null;
  return {
    /** Ask for a tip; shown once ever (per device). */
    want(id, now) {
      if (!enabled || save.tips.seen[id] || queue.includes(id) || (cur && cur.id === id)) return;
      queue.push(id);
      if (!cur) this.next(now);
    },
    next(now) {
      const id = queue.shift();
      if (!id) { cur = null; return; }
      save.tips.seen[id] = true;
      cur = { id, at: now };
    },
    dismiss(now) { if (cur && now - cur.at > 0.5) this.next(now); },
    draw(ctx, now) {
      if (!cur) return;
      const age = now - cur.at, life = 4.5;
      if (age > life) { this.next(now); return; }
      const tip = TIPS[cur.id];
      const a = Math.min(1, age / 0.25, (life - age) / 0.4);
      const w = tip.w || 640, h = 64, x = Math.max(20, Math.min(1260 - w, tip.x - w / 2)), y = tip.y - h / 2;
      ctx.save(); ctx.globalAlpha = a;
      frost(ctx, x, y, w, h, 20, { glow: true, glowColor: C.gold, border: C.gold, alpha: 0.88 });
      if (tip.arrow) {
        const ax = tip.x, dir = tip.arrow === 'down' ? 1 : -1, ay = dir > 0 ? y + h : y;
        const bob = Math.sin(age * 8) * 4;
        ctx.beginPath(); ctx.moveTo(ax - 14, ay); ctx.lineTo(ax + 14, ay); ctx.lineTo(ax, ay + dir * (18 + bob)); ctx.closePath();
        ctx.fillStyle = C.gold; ctx.fill();
      }
      T(ctx, tip.text, x + w / 2, y + h / 2 + 1, { size: 21, w: 800, align: 'center', base: 'middle', sw: 4, maxW: w - 40 });
      ctx.restore();
    },
    get active() { return !!cur; },
  };
}
