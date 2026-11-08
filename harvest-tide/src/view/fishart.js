// Draws every fish kind at the size in spec 3.4. Shared species come from art.js; new ones are here.
import { drawCreature } from './art.js';
import { C, roundRect, starPath, fillStroke } from './theme.js';

function clown(ctx) {
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-32, -12); ctx.lineTo(-32, 12); ctx.closePath(); fillStroke(ctx, '#FF7A1A', C.ink, 2.5);
  ctx.beginPath(); ctx.ellipse(0, 0, 23, 14, 0, 0, Math.PI * 2); ctx.fillStyle = '#FF8A1F'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = C.white; for (const bx of [-12, 4]) ctx.fillRect(bx, -15, 7, 30); ctx.restore();
  ctx.lineWidth = 2.5; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(14, -3, 3, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
}

function lion(ctx, t) {
  ctx.strokeStyle = '#E34B4B'; ctx.lineWidth = 3;
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(i * 5, -8); ctx.lineTo(i * 7 - 6 + Math.sin(t * 3 + i) * 2, -40 - Math.abs(i) * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-48, -12); ctx.lineTo(-48, 12); ctx.closePath(); fillStroke(ctx, '#FBE3D3', C.ink, 2.5);
  ctx.beginPath(); ctx.ellipse(0, 0, 38, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#FBE3D3'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = '#C93636'; ctx.lineWidth = 6;
  for (let i = -34; i < 40; i += 12) { ctx.beginPath(); ctx.moveTo(i, -20); ctx.lineTo(i - 6, 20); ctx.stroke(); }
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.ellipse(0, 0, 38, 18, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(24, -4, 3.5, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
}

function turtle(ctx, t) {
  const sw = Math.sin(t * 3) * 0.25;
  for (const [fx, fy, r] of [[-30, -34, 0.6 + sw], [30, -34, -0.6 - sw], [-34, 30, -0.5 - sw], [34, 30, 0.5 + sw]]) {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(r); ctx.beginPath(); ctx.ellipse(0, 0, 22, 9, 0, 0, 7); fillStroke(ctx, '#5DBB63', C.ink, 2.5); ctx.restore();
  }
  ctx.beginPath(); ctx.ellipse(56, 0, 15, 12, 0, 0, 7); fillStroke(ctx, '#7ED183', C.ink, 2.5);
  ctx.beginPath(); ctx.arc(62, -4, 3, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, 50, 40, 0, 0, 7); fillStroke(ctx, '#E8A33D', C.ink, 3);
  for (const [hx, hy] of [[0, 0], [-24, -14], [24, -14], [-24, 14], [24, 14]]) {
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(hx + Math.cos(a) * 11, hy + Math.sin(a) * 11); }
    ctx.closePath(); fillStroke(ctx, '#D7462F', C.ink, 2);
  }
}

const MANTA_DOTS = [[-20, -30, 5], [10, -36, 4], [-4, -14, 6], [22, -12, 4], [-26, 6, 5], [6, 10, 6], [24, 24, 4], [-10, 30, 5], [12, 40, 3], [-30, -10, 3]];
function manta(ctx, t) {
  const f = Math.sin(t * 2.4) * 10;
  ctx.beginPath(); ctx.moveTo(60, 0); ctx.quadraticCurveTo(10, -70 - f, -40, -60 - f); ctx.quadraticCurveTo(-20, -10, -70, 0);
  ctx.quadraticCurveTo(-20, 10, -40, 60 + f); ctx.quadraticCurveTo(10, 70 + f, 60, 0); ctx.closePath();
  const mg = ctx.createLinearGradient(-60, -60, 60, 60); mg.addColorStop(0, '#E0469B'); mg.addColorStop(1, '#8F2FB8');
  fillStroke(ctx, mg, C.ink, 3);
  ctx.fillStyle = 'rgba(255,220,250,0.75)';
  for (const [x, y, r] of MANTA_DOTS) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-130, 6 + Math.sin(t * 3) * 6); ctx.lineWidth = 4; ctx.strokeStyle = '#8F2FB8'; ctx.stroke();
}

function octopus(ctx, t) {
  ctx.save();
  ctx.shadowColor = '#FF3D6E'; ctx.shadowBlur = 30;
  ctx.strokeStyle = '#E2335A'; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const sx = -60 + i * 17, w = Math.sin(t * 2 + i) * 14;
    ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(sx, 30);
    ctx.bezierCurveTo(sx - 20 + i * 4 + w, 90, sx + 30 - w, 110, sx + (i % 2 ? 26 : -26) + w, 140); ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, -10, 80, 70, 0, 0, 7); fillStroke(ctx, '#F04468', C.ink, 4);
  for (const ex of [-28, 28]) {
    ctx.beginPath(); ctx.ellipse(ex, 0, 18, 22, 0, 0, 7); fillStroke(ctx, C.white, C.ink, 4);
    ctx.beginPath(); ctx.arc(ex + 4, 4, 8, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
  }
  ctx.beginPath(); ctx.moveTo(-44, -66); ctx.lineTo(-30, -104); ctx.lineTo(-12, -78); ctx.lineTo(0, -114); ctx.lineTo(12, -78); ctx.lineTo(30, -104); ctx.lineTo(44, -66); ctx.closePath();
  fillStroke(ctx, C.gold, C.ink, 3);
}

function capsule(ctx, t) {
  ctx.save(); ctx.shadowColor = C.gold; ctx.shadowBlur = 20 + Math.sin(t * 6) * 8;
  roundRect(ctx, -18, -18, 36, 36, 10);
  const g = ctx.createLinearGradient(0, -18, 0, 18); g.addColorStop(0, '#FFF2A8'); g.addColorStop(1, '#F29A00');
  fillStroke(ctx, g, C.ink, 3); ctx.restore();
  starPath(ctx, 0, 0, 10); fillStroke(ctx, C.white, C.ink, 1.5);
}

// Shared art (art.js) is drawn at its own size; scale it to the spec size.
const SHARED_SCALE = { sardine: 1.35, snapper: 1.3, puffer: 1.4, golden_koi: 1.6, jellyfish: 1.2 };

/** Draw a fish from sim state. Flashes white for a few frames after a hit. */
export function drawFish(ctx, f, t, tick, { frozen = false, locked = false } = {}) {
  const dir = f.dirX;
  const wob = frozen ? 0 : Math.sin(t * 3 + f.uid) * 3;
  ctx.save();
  ctx.translate(f.x, f.y + wob);
  if (SHARED_SCALE[f.kind]) {
    drawCreature(ctx, f.kind, 0, 0, dir, t + f.uid, { scale: SHARED_SCALE[f.kind], puff: f.kind === 'puffer' && f.hp < f.maxHp ? 1.15 : 1 });
  } else {
    ctx.save();
    if (f.kind !== 'capsule') ctx.scale(dir, 1);
    const tt = frozen ? 0 : t + f.uid;
    if (f.kind === 'clownfish') clown(ctx);
    else if (f.kind === 'lionfish') lion(ctx, tt);
    else if (f.kind === 'turtle') turtle(ctx, tt);
    else if (f.kind === 'manta') manta(ctx, tt);
    else if (f.kind === 'octopus_king') octopus(ctx, tt);
    else if (f.kind === 'capsule') capsule(ctx, tt);
    ctx.restore();
  }
  // hit flash
  if (tick - f.hitTick < 6 && f.hitTick >= 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath(); ctx.arc(0, 0, f.r * 1.1, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  if (frozen) { ctx.beginPath(); ctx.arc(0, 0, f.r * 1.05, 0, 7); ctx.fillStyle = 'rgba(191,239,255,0.28)'; ctx.fill(); }
  ctx.restore();
  // health bar after the first hit
  if (f.maxHp > 1 && f.hp < f.maxHp && f.alive) {
    const w = Math.max(40, f.r * 2), x = f.x - w / 2, y = f.y - f.r - 18;
    roundRect(ctx, x, y, w, 8, 4); ctx.fillStyle = 'rgba(8,21,33,0.75)'; ctx.fill();
    const frac = Math.max(0, f.hp / f.maxHp);
    roundRect(ctx, x + 1, y + 1, (w - 2) * frac, 6, 3); ctx.fillStyle = frac > 0.4 ? C.lime : C.coral; ctx.fill();
  }
  if (locked) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(t * 2);
    ctx.strokeStyle = C.red; ctx.lineWidth = 3;
    const r = f.r + 14;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(r - 8, 0); ctx.lineTo(r + 8, 0); ctx.stroke(); }
    ctx.restore();
  }
}

/** Small icon of a fish for legends and results (fixed size box). */
export function drawFishIcon(ctx, kind, x, y, box = 40, t = 0) {
  const sizes = { sardine: 44, clownfish: 46, snapper: 64, puffer: 52, lionfish: 84, turtle: 130, manta: 170, golden_koi: 92, octopus_king: 230, jellyfish: 48, capsule: 40 };
  const s = box / (sizes[kind] || 60);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  drawFish(ctx, { kind, x: 0, y: 0, dirX: 1, uid: 0, hp: 1, maxHp: 1, r: 10, hitTick: -99, alive: true }, t, 0, { frozen: true });
  ctx.restore();
}
