// Game screen for both modes: runs the sim, turns its events into pictures, sound and haptics,
// handles HUD buttons, the pause menu and first-time tips.
import { createRun, step, input } from '../sim/runSim.js';
import { createBot } from '../dev/bot.js';
import { C, T, hit, frost, button, fmt } from '../view/theme.js';
import { createSea } from '../view/sea.js';
import { drawCreature, drawHitFlash } from '../view/fishart.js';
import { drawHud, drawCaption, drawValueTags, BTN, fishName, POWER_NAMES } from '../view/hud.js';
import { drawCannon, drawAimGuide, drawBullets } from '../view/cannon.js';
import { drawWheel, wheelRotation } from '../view/wheel.js';
import { createTips } from '../view/tips.js';
import { createFx, updateFx, drawFxWorld, drawFxOverlay, addNet, ring, burst, dying, coinFlight, popup, bolt,
         callout, banner, flash, shake } from '../view/fx.js';
import { createHowtoScene } from './howto.js';
import { createSettingsScene } from './settings.js';

let SEA = null, SEA_REDUCED = null;
const TAU = Math.PI * 2;

/**
 * @param {{mode: 'arcade'|'reef', seed: number, autoplay?: string|null, attract?: boolean, warp?: number}} opts
 */
export function createGameScene(app, { mode = 'arcade', seed, autoplay = null, attract = false, warp = 0 }) {
  const set = app.save.settings, reduced = set.reducedMotion;
  if (!SEA || SEA_REDUCED !== reduced) { SEA = createSea({ particles: reduced ? 20 : 60, reduced }); SEA_REDUCED = reduced; }
  const S = createRun({ config: app.config, seed, mode });
  const V = {
    t: 0, shownScore: mode === 'reef' ? S.coins : 0, comboPop: 0, recoil: 0, caption: null, legend: null,
    seen: new Set(), wheelEndAt: -1, wheelCopy: null, lastSeg: -1, lastSecond: 99, tipPower: false,
    best: mode === 'arcade' ? app.save.stats.bestArcade : app.save.stats.bestReefPeak,
  };
  const fx = createFx();
  const bot = autoplay ? createBot(seed, autoplay, { level: mode === 'reef' ? 3 : null }) : null;
  const tips = createTips(app.save, { enabled: !attract && !autoplay });
  const sfx = (name, o) => { if (!attract) app.audio.play(name, o); };
  const buzz = p => { if (!attract && !autoplay && set.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch { /* */ } } };
  const scoreAnchor = { x: 140, y: 46 };
  let paused = null, endAt = null, menuRects = {};

  const caption = (text, color) => { V.caption = { text, color, at: V.t }; };

  function handle(evs) {
    let stack = 0;
    for (const e of evs) {
      switch (e.type) {
        case 'shot': V.recoil = 1; sfx('shot', { level: mode === 'reef' ? e.level : 3, lucky: e.lucky }); break;
        case 'net': addNet(fx, e.x, e.y, e.r, e.lucky); sfx('net'); break;
        case 'fish:hit': sfx('hit'); break;
        case 'fish:spawn':
          if (!attract && !V.seen.has(e.kind)) {
            V.seen.add(e.kind);
            if (V.seen.size > 4 || ['golden_koi', 'octopus_king', 'jellyfish', 'capsule', 'manta', 'turtle', 'lionfish'].includes(e.kind)) V.legend = { kind: e.kind, at: V.t };
          }
          if (e.kind === 'golden_koi') tips.want('koi', V.t);
          if (e.kind === 'jellyfish') tips.want('jelly', V.t);
          break;
        case 'catch': {
          dying(fx, e.kind, e.x, e.y, e.dir || 1, e.uid);
          burst(fx, e.x, e.y, reduced ? 4 : 12, e.lucky ? C.gold : '#FFE58A');
          if (e.amount > 0 && e.kind !== 'golden_koi' && !(mode === 'arcade' && e.lucky)) {
            const big = mode === 'arcade' ? e.amount >= S.cfg.bigwin.arcade[0] : e.amount >= S.cost * S.cfg.bigwin.reef[0];
            popup(fx, e.x + (stack % 2 ? 24 : -12), e.y - 24 - stack * 28, '+' + fmt(e.amount), { size: big ? 42 : 30, big });
            stack++;
            coinFlight(fx, e.x, e.y, reduced ? 1 : Math.min(9, 1 + Math.floor(Math.log2(1 + e.amount / (mode === 'reef' ? S.cost * 2 : 20)))), scoreAnchor);
          }
          if (e.kind === 'capsule') { caption('Power Pearl! +1 power-up', C.glow); ring(fx, e.x, e.y, C.glow, 10, 80); }
          sfx('catch', { combo: S.combo.points });
          buzz(10);
          break;
        }
        case 'bigwin':
          if (e.tier >= 2) {
            banner(fx, e.tier, e.amount, (e.lucky ? 'Lucky ' : '') + fishName(e.kind), mode === 'reef');
            if (!reduced) { flash(fx, C.gold, e.tier === 3 ? 0.45 : 0.25); burst(fx, 640, 300, e.tier === 3 ? 50 : 26, C.gold, 460); shake(fx, e.tier === 3 ? 14 : 7); }
            coinFlight(fx, 640, 310, reduced ? 2 : e.tier === 3 ? 40 : 18, scoreAnchor);
            sfx(e.tier === 3 ? 'mega' : 'big');
            buzz(e.tier === 3 ? [50, 40, 50, 40, 120] : [40, 30, 60]);
          } else sfx('coin');
          break;
        case 'wheel:start': V.caption = null; V.wheelCopy = { ...e, base: e.base }; V.lastSeg = -1; sfx('power'); buzz([20, 20, 20]); break;
        case 'wheel:end':
          V.wheelCopy = { ...V.wheelCopy, index: e.index, mult: e.mult }; V.wheelEndAt = V.t;
          if (e.amount < (mode === 'arcade' ? S.cfg.bigwin.arcade[1] : S.cost * S.cfg.bigwin.reef[1])) popup(fx, 640, 620, '+' + fmt(e.amount), { size: 54, big: true });
          coinFlight(fx, 640, 330, reduced ? 2 : 16, scoreAnchor);
          sfx('wheelStop');
          break;
        case 'fever:enter':
          callout(fx, 'HARVEST FEVER!', C.lime, 'Bigger nets · faster shots');
          if (!reduced) { flash(fx, C.lime, 0.25); shake(fx, 5); }
          sfx('fever'); app.audio.fever(true); tips.want('fever', V.t); buzz([30, 30, 30]);
          break;
        case 'fever:exit': app.audio.fever(false); if (e.reason === 'expired') caption('Fever over', C.ice); break;
        case 'combo:tier_up': {
          V.comboPop = 1;
          const m = e.multiplier;
          if (m === 2) callout(fx, 'NICE!', C.glow, 'x2.0 combo');
          else if (m === 4) callout(fx, 'AMAZING!', C.gold, 'x4.0 combo');
          else if (m === 5) callout(fx, 'UNSTOPPABLE!', C.coral, 'x5.0 combo');
          if (m >= 1.5) tips.want('combo', V.t);
          sfx('combo', { tier: Math.round((m - 1) * 2) });
          break;
        }
        case 'combo:break': if (e.prev >= 4 && e.reason === 'timeout') caption('Combo lost — keep catching!', C.ice); break;
        case 'sting':
          caption('Stung! Avoid jellyfish', C.coral);
          if (!reduced) { flash(fx, C.coral, 0.3); shake(fx, 6); }
          sfx('sting'); buzz([60, 40, 60]);
          break;
        case 'lightning': {
          const pts = [{ x: S.cfg.cannon.pos.x, y: S.cfg.cannon.pos.y - 40 }, ...e.targets.map(t => ({ x: t.x, y: t.y }))];
          if (pts.length > 1) bolt(fx, pts);
          if (!reduced) { flash(fx, '#FFF59A', 0.3); shake(fx, 6); }
          sfx('lightning');
          break;
        }
        case 'power:use': caption(POWER_NAMES[e.id] + '!', C.glow); if (e.id !== 'lightning') sfx(e.id); break;
        case 'power:grant': if (e.id) { caption(`+1 ${POWER_NAMES[e.id]}`, C.gold); sfx('power'); } break;
        case 'boss:enter':
          callout(fx, 'BOSS!', C.coral, 'The Octopus King appears');
          if (!reduced) shake(fx, 8);
          sfx('boss'); tips.want('boss', V.t); buzz([80, 40, 80]);
          break;
        case 'reload:start': sfx('reload'); break;
        case 'timer:warning': caption('10 seconds left!', C.gold); break;
        case 'lucky:ready':
          callout(fx, 'LUCKY!', C.gold, mode === 'reef' ? 'Next hit is a sure big catch' : 'Next catch spins the wheel');
          sfx('luckyReady'); buzz([20, 20, 20, 20]);
          tips.want(mode === 'reef' ? 'luckyReady' : 'luckyArcade', V.t);
          break;
        case 'lucky:catch': callout(fx, 'LUCKY CATCH!', C.gold); sfx('luckyCatch'); ring(fx, e.x, e.y, C.gold, 10, 120, 0.7); break;
        case 'level:change': break;
        case 'shot:return': if (e.reason === 'miss') tips.want('reefMiss', V.t); break;
        case 'run:end': endAt = V.t + 0.9; sfx('end'); app.audio.fever(false); break;
      }
    }
  }

  function pause() {
    if (paused || S.over || attract) return;
    if (S.pointer.activeId !== null) input(S, 'up', 0, 0, S.pointer.activeId);   // no stuck trigger; recorded
    paused = { countdown: null };
    app.audio.fever(false);
  }

  function fishTilt(f) {
    const t = Math.min(1, f.age / f.path.ticks), u = 1 - t, p = f.path;
    const dx = 2 * u * (p.p1.x - p.p0.x) + 2 * t * (p.p2.x - p.p1.x);
    const dy = 2 * u * (p.p1.y - p.p0.y) + 2 * t * (p.p2.y - p.p1.y);
    return Math.max(-0.4, Math.min(0.4, Math.atan2(dy, Math.abs(dx) + 1e-6)));
  }

  const scene = {
    S, mode, fx,
    tick(n) {
      if (paused || S.over || app.overlay) return;
      for (let i = 0; i < n && !S.over; i++) {
        if (bot) bot.act(S);
        const evs = step(S);
        handle(evs);
        if (S.state === 'WHEEL' && S.wheel) {
          const el = S.wheel.total - S.wheel.left, nseg = S.cfg.wheel.segments.length;
          const seg = Math.floor(wheelRotation(nseg, S.wheel.index, el / (S.wheel.total * 0.8)) / (TAU / nseg));
          if (seg !== V.lastSeg) { V.lastSeg = seg; sfx('wheelTick'); }
        }
      }
    },
    frame(dt) {
      if (paused) {
        if (paused.countdown !== null) {
          const before = Math.ceil(paused.countdown);
          paused.countdown -= dt;
          if (Math.ceil(paused.countdown) !== before && paused.countdown > 0) sfx('tick');
          if (paused.countdown <= 0) { paused = null; app.clock.resync(); if (S.combo.feverActive) app.audio.fever(true); }
        }
        return;
      }
      if (app.overlay) return;
      V.t += dt;
      updateFx(fx, dt);
      const target = mode === 'arcade' ? S.score : S.coins;
      V.shownScore += (target - V.shownScore) * Math.min(1, dt * 8);
      if (Math.abs(target - V.shownScore) < 1) V.shownScore = target;
      V.comboPop = Math.max(0, V.comboPop - dt * 4);
      V.recoil = Math.max(0, V.recoil - dt * 9);
      // last five seconds tick
      if (mode === 'arcade' && S.state === 'PLAYING') {
        const sec = Math.ceil(S.remaining / 60);
        if (sec !== V.lastSecond) { if (sec <= 5 && sec > 0) sfx('tick'); V.lastSecond = sec; }
      }
      // tips that depend on time or state
      if (!attract) {
        if (V.t > 0.6 && S.shots === 0) tips.want('aim', V.t);
        if (mode === 'reef' && S.shots >= 6) tips.want('reefLevel', V.t);
        if (S.shots >= 40 && Object.values(S.power.uses).some(n => n > 0)) { tips.want('power', V.t); V.tipPower = true; }
        if (S.lucky.fill >= (mode === 'reef' ? S.cfg.lucky.reefShots : S.cfg.lucky.arcadeHits) / 2) tips.want('luckyHalf', V.t);
      }
      if (endAt !== null && V.t >= endAt && !attract) { endAt = null; app.go('results', { summary: S.summary, game: scene }); }
    },
    draw(ctx, { hud = true } = {}) {
      const fever = S.combo.feverActive, freeze = S.power.freezeLeft > 0, still = freeze || S.state === 'WHEEL';
      ctx.save();
      if (fx.shake > 0 && !reduced) ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);
      SEA.drawBack(ctx, V.t, { fever, freeze });
      const lock = S.power.lockonLeft > 0 ? S.power.lockTarget : null;
      const order = S.fish.filter(f => f.alive).sort((a, b) => b.r - a.r || a.uid - b.uid);
      for (const f of order) {
        const o = { dir: f.dirX, t: still ? 0 : V.t, seed: f.uid, tilt: fishTilt(f), puff: f.kind === 'puffer' && f.hp < f.maxHp };
        drawCreature(ctx, f.kind, f.x, f.y, o);
        if (f.hitTick >= 0 && S.tick - f.hitTick < 6) drawHitFlash(ctx, f.kind, f.x, f.y, o, 1 - (S.tick - f.hitTick) / 6);
        if (freeze) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 1.15, 0, TAU); ctx.fillStyle = 'rgba(200,240,255,0.22)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(230,250,255,0.7)'; ctx.stroke(); }
        if (f.maxHp > 1 && f.hp < f.maxHp && mode === 'arcade') {
          const w = Math.max(44, f.r * 2), x = f.x - w / 2, y = f.y - f.r - 20, frac = Math.max(0, f.hp / f.maxHp);
          ctx.fillStyle = 'rgba(6,20,36,0.8)'; ctx.fillRect(x, y, w, 8);
          ctx.fillStyle = frac > 0.4 ? C.lime : C.coral; ctx.fillRect(x + 1, y + 1, (w - 2) * frac, 6);
        }
        if (f.uid === lock) {
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(V.t * 2);
          ctx.strokeStyle = C.red; ctx.lineWidth = 3; const r = f.r + 16;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
          for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(r - 9, 0); ctx.lineTo(r + 9, 0); ctx.stroke(); }
          ctx.restore();
        }
      }
      if (set.showValues && hud) drawValueTags(ctx, S);
      drawFxWorld(ctx, fx, V.t);
      drawBullets(ctx, S, V.t);
      if (hud && S.power.lockonLeft === 0) drawAimGuide(ctx, S, V.t);
      if (!attract) drawCannon(ctx, S, V);
      ctx.restore();
      SEA.drawFrame(ctx, { fever, freeze, t: V.t });
      if (hud) { drawHud(ctx, S, V); drawCaption(ctx, V); }
      const wc = V.wheelCopy;
      if (wc) {
        if (S.state === 'WHEEL' && S.wheel) {
          const el = S.wheel.total - S.wheel.left, prog = el / (S.wheel.total * 0.8);
          drawWheel(ctx, S.cfg, S.wheel, prog, V.t, { resultAge: prog >= 1 ? (el - S.wheel.total * 0.8) / 60 : -1 });
        } else if (V.wheelEndAt >= 0 && V.t - V.wheelEndAt < 0.6) {
          ctx.save(); ctx.globalAlpha = 1 - (V.t - V.wheelEndAt) / 0.6;
          drawWheel(ctx, S.cfg, wc, 1, V.t, { resultAge: 1 });
          ctx.restore();
        }
      }
      if (!attract) drawFxOverlay(ctx, fx, V.t);
      if (hud && !attract) tips.draw(ctx, V.t);
      if (paused) drawPause(ctx, paused);
    },
    pointer(type, p, id) {
      if (attract) return;
      if (paused) {
        if (type !== 'up' || paused.countdown !== null) return;
        if (hit(menuRects.resume, p)) { sfx('click'); paused.countdown = 3; }
        else if (hit(menuRects.howto, p)) { sfx('click'); app.open(createHowtoScene(app, { mode })); }
        else if (hit(menuRects.settings, p)) { sfx('click'); app.open(createSettingsScene(app)); }
        else if (hit(menuRects.quit, p)) { sfx('click'); input(S, 'quit'); paused = null; }
        return;
      }
      if (type === 'down') {
        tips.dismiss(V.t);
        if (hit(BTN.pause, p)) { sfx('click'); pause(); return; }
        for (let i = 0; i < 3; i++) if (hit(BTN.power[i], p)) {
          const id = S.cfg.powerups.ids[i];
          if (S.power.uses[id] > 0 && S.state === 'PLAYING') input(S, 'power', i); else sfx('deny');
          return;
        }
        if (mode === 'reef') {
          if (hit(BTN.levelDown, p)) { if (S.levelChosen > 1) { input(S, 'level', -1); sfx('levelDown'); } else sfx('deny'); return; }
          if (hit(BTN.levelUp, p)) { if (S.levelChosen < S.cfg.reef.shotCost.length) { input(S, 'level', 1); sfx('levelUp'); } else sfx('deny'); return; }
        }
      }
      input(S, type, p.x, p.y, id);
    },
    blur() { pause(); },
    rotate() { pause(); },
  };

  function drawPause(ctx, P) {
    ctx.fillStyle = 'rgba(4,14,26,0.74)'; ctx.fillRect(0, 0, 1280, 720);
    if (P.countdown !== null) {
      T(ctx, String(Math.ceil(P.countdown)), 640, 360, { size: 170, w: 900, align: 'center', base: 'middle', fill: C.gold, sw: 12 });
      return;
    }
    frost(ctx, 400, 110, 480, 500, 30, { glow: true, alpha: 0.88 });
    T(ctx, 'PAUSED', 640, 186, { size: 58, w: 900, align: 'center' });
    T(ctx, mode === 'arcade' ? `Score ${fmt(S.score)}  ·  ${Math.ceil(S.remaining / 60)}s left` : `Coins ${fmt(S.coins)}`, 640, 228,
      { size: 22, w: 800, align: 'center', fill: C.ice, stroke: null });
    menuRects.resume = button(ctx, 'RESUME', 470, 256, 340, 84, { primary: true, size: 36 });
    menuRects.howto = button(ctx, 'HOW TO PLAY', 470, 356, 340, 66, { size: 26 });
    menuRects.settings = button(ctx, 'SETTINGS', 470, 436, 340, 66, { size: 26 });
    menuRects.quit = button(ctx, mode === 'reef' ? 'LEAVE THE REEF' : 'QUIT RUN', 470, 516, 340, 66, { size: 26, color: ['#FF9DB0', '#E0446A'] });
  }

  if (warp > 0) {
    scene.tick(warp);
    V.t = S.tick / 60;
    for (const k of ['nets', 'parts', 'coins', 'popups', 'banners', 'dying', 'callouts', 'rings', 'bolts']) fx[k].length = 0;
    fx.flash = null; fx.shake = 0;
  }
  return scene;
}
