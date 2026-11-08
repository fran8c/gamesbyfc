// Game screen for both modes: runs the sim, turns events into visuals, handles buttons and pause.
import { createRun, step, input } from '../sim/runSim.js';
import { createBot } from '../dev/bot.js';
import { C, T, hit, frost } from '../view/theme.js';
import { createSea } from '../view/sea.js';
import { drawFish } from '../view/fishart.js';
import { drawHud, drawCannon, drawBullets, drawCaption, BTN, fishName } from '../view/hud.js';
import { drawWheel } from '../view/wheel.js';
import { createFx, updateFx, drawFxWorld, drawFxOverlay, addNet, burst, coinFlight, popup, bolt, banner, flash } from '../view/fx.js';

let SEA = null;                                    // shared offscreen background

function vibrate(app, p) { if (app.save.settings.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch { /* */ } } }

/**
 * @param {{mode: 'arcade'|'table', seed: number, autoplay?: string|null, attract?: boolean, warp?: number}} opts
 */
export function createGameScene(app, { mode = 'arcade', seed, autoplay = null, attract = false, warp = 0 }) {
  if (!SEA) SEA = createSea({ particles: app.save.settings.reducedMotion ? 20 : 60 });
  const S = createRun({ config: app.config, seed, mode });
  const V = { t: 0, shownScore: mode === 'table' ? S.bank : 0, comboPop: 0, recoil: 0, caption: null, legend: null,
              seen: new Set(), wheelEndAt: -1, wheelCopy: null, best: mode === 'arcade' ? app.save.stats.bestArcade : app.save.stats.bestTablePeak };
  const fx = createFx();
  const bot = autoplay ? createBot(seed, autoplay, { bet: mode === 'table' ? 10 : null }) : null;
  const reduced = app.save.settings.reducedMotion;
  let paused = null, endAt = null;
  const scoreAnchor = { x: 200, y: 44 };

  const caption = (text, color) => { V.caption = { text, color, at: V.t }; };

  function handle(evs) {
    let stack = 0;
    for (const e of evs) {
      switch (e.type) {
        case 'shot': V.recoil = 1; break;
        case 'net': addNet(fx, e.x, e.y, e.r); break;
        case 'fish:spawn':
          if (!attract && !V.seen.has(e.kind)) {
            V.seen.add(e.kind);
            if (V.seen.size > 4 || ['golden_koi', 'octopus_king', 'jellyfish', 'capsule', 'manta', 'turtle'].includes(e.kind)) V.legend = { kind: e.kind, at: V.t };
          }
          break;
        case 'catch':
          burst(fx, e.x, e.y, reduced ? 4 : 10, C.gold);
          if (e.amount > 0 && e.kind !== 'golden_koi') {
            const big = mode === 'arcade' ? e.amount >= S.cfg.bigwin.arcade[0] : e.amount >= S.bet * S.cfg.bigwin.table[0];
            popup(fx, e.x + (stack % 2 ? 22 : -10), e.y - 20 - stack * 26, '+' + e.amount.toLocaleString('en-US'), { size: big ? 40 : 28, big });
            stack++;
            coinFlight(fx, e.x, e.y, reduced ? 1 : Math.min(8, 1 + Math.floor(Math.log2(1 + e.amount / 20))), scoreAnchor);
          }
          if (e.kind === 'capsule') caption('Power-up!', C.gold);
          vibrate(app, 12);
          break;
        case 'bigwin':
          if (e.tier >= 2) {
            banner(fx, e.tier, e.amount, fishName(e.kind));
            if (!reduced) { flash(fx, C.gold, e.tier === 3 ? 0.4 : 0.25); burst(fx, 640, 260, e.tier === 3 ? 40 : 20, C.gold, 420); }
            coinFlight(fx, 640, 300, reduced ? 2 : e.tier === 3 ? 30 : 14, scoreAnchor);
            vibrate(app, e.tier === 3 ? [40, 30, 40, 30, 80] : [40, 30, 40]);
          }
          break;
        case 'wheel:start': V.caption = null; vibrate(app, [20, 20, 20]); break;
        case 'wheel:end':
          V.wheelCopy = { ...V.wheelCopy, index: e.index, mult: e.mult }; V.wheelEndAt = V.t;
          popup(fx, 640, 600, '+' + e.amount.toLocaleString('en-US'), { size: 48, big: true });
          coinFlight(fx, 640, 330, reduced ? 2 : 16, scoreAnchor);
          break;
        case 'fever:enter': caption('HARVEST FEVER!', C.lime); if (!reduced) flash(fx, C.lime, 0.25); vibrate(app, [30, 30, 30]); break;
        case 'fever:exit': if (e.reason === 'expired') caption('Fever over', C.ice); break;
        case 'combo:tier_up': V.comboPop = 1; break;
        case 'combo:break': if (e.prev >= 4 && e.reason === 'timeout') caption('Combo lost', C.ice); break;
        case 'sting': caption('Stung! Avoid jellyfish', C.coral); if (!reduced) flash(fx, C.coral, 0.3); vibrate(app, [60, 40, 60]); break;
        case 'lightning': {
          const pts = [{ x: S.cfg.cannon.pos.x, y: S.cfg.cannon.pos.y - 40 }, ...e.targets.map(t => ({ x: t.x, y: t.y }))];
          if (pts.length > 1) bolt(fx, pts);
          if (!reduced) flash(fx, '#FFF59A', 0.3);
          break;
        }
        case 'power:use': caption({ freeze: 'Freeze!', lockon: 'Lock-on!', lightning: 'Zap!' }[e.id], C.glow); break;
        case 'power:grant': if (e.id) caption(`+1 ${{ freeze: 'Freeze', lockon: 'Lock-on', lightning: 'Zap' }[e.id]}`, C.gold); break;
        case 'boss:enter': caption('The Octopus King appears!', C.coral); break;
        case 'reload:start': break;
        case 'timer:warning': caption('10 seconds left!', C.gold); break;
        case 'bet:change': break;
        case 'run:end': endAt = V.t + 0.8; break;
      }
    }
  }

  function pause(reason) {
    if (paused || S.over || attract) return;
    if (S.pointer.activeId !== null) input(S, 'up', 0, 0, S.pointer.activeId);   // no stuck trigger; recorded
    paused = { reason, countdown: null };
  }

  const scene = {
    S, mode, fx,
    tick(n) {
      if (paused || S.over) return;
      for (let i = 0; i < n && !S.over; i++) {
        if (bot) bot.act(S);
        const wasWheel = S.state === 'WHEEL';
        const evs = step(S);
        if (!wasWheel && S.state === 'WHEEL') V.wheelCopy = { ...S.wheel };
        handle(evs);
      }
    },
    frame(dt) {
      if (paused) {
        if (paused.countdown !== null) { paused.countdown -= dt; if (paused.countdown <= 0) { paused = null; app.clock.resync(); } }
        if (paused && paused.reason === 'rotate' && !app.display.isPortraitTouch()) paused.reason = 'blur';
        return;
      }
      V.t += dt;
      updateFx(fx, dt);
      const target = mode === 'arcade' ? S.score : S.bank;
      V.shownScore += (target - V.shownScore) * Math.min(1, dt * 8);
      if (Math.abs(target - V.shownScore) < 1) V.shownScore = target;
      V.comboPop = Math.max(0, V.comboPop - dt * 4);
      V.recoil = Math.max(0, V.recoil - dt * 10);
      if (endAt !== null && V.t >= endAt && !attract) { endAt = null; app.go('results', { summary: S.summary, game: scene }); }
    },
    draw(ctx, { hud = true } = {}) {
      const fever = S.combo.feverActive, freeze = S.power.freezeLeft > 0;
      SEA.drawBack(ctx, reduced ? 0 : V.t, { fever, freeze });
      const lock = S.power.lockonLeft > 0 ? S.power.lockTarget : null;
      // big fish first so schools draw on top
      const order = S.fish.slice().sort((a, b) => b.r - a.r || a.uid - b.uid);
      for (const f of order) if (f.alive) drawFish(ctx, f, V.t, S.tick, { frozen: freeze || S.state === 'WHEEL', locked: f.uid === lock });
      drawFxWorld(ctx, fx);
      drawBullets(ctx, S);
      if (!attract) drawCannon(ctx, S, V);
      SEA.drawFrame(ctx, { fever, freeze });
      if (hud) { drawHud(ctx, S, V); drawCaption(ctx, V); }
      // wheel
      const wc = V.wheelCopy;
      if (wc) {
        if (S.state === 'WHEEL') {
          const el = S.wheel.total - S.wheel.left;
          const prog = el / (S.wheel.total * 0.8);
          drawWheel(ctx, S.cfg, S.wheel, prog, V.t, { resultAge: prog >= 1 ? (el - S.wheel.total * 0.8) / 60 : -1 });
        } else if (V.wheelEndAt >= 0 && V.t - V.wheelEndAt < 0.6) {
          ctx.save(); ctx.globalAlpha = 1 - (V.t - V.wheelEndAt) / 0.6;
          drawWheel(ctx, S.cfg, wc, 1, V.t, { resultAge: 1 });
          ctx.restore();
        }
      }
      drawFxOverlay(ctx, fx);
      if (!attract && S.shots === 0 && S.tick < 600) {
        T(ctx, 'Touch the water to aim and fire', 640, 520, { size: 30, w: 900, align: 'center', sw: 7 });
        T(ctx, mode === 'arcade' ? 'Big fish take more hits · chain catches for a bigger multiplier'
                                 : 'Choose your bet with − and +   ·   bigger bets pay more', 640, 556, { size: 20, w: 700, align: 'center', fill: C.ice, sw: 5 });
      }
      if (paused) drawPause(ctx, paused, mode);
    },
    pointer(type, p, id) {
      if (attract) return;
      if (paused) {
        if (type === 'down' && paused.countdown === null && paused.reason !== 'rotate') {
          if (hit({ x: 470, y: 470, w: 340, h: 64 }, p)) { input(S, 'quit'); paused = null; return; }
          paused.countdown = 3;
        }
        return;
      }
      if (type === 'down') {
        if (hit(BTN.pause, p)) { pause('button'); return; }
        for (let i = 0; i < 3; i++) if (hit(BTN.power[i], p)) { input(S, 'power', i); return; }
        if (mode === 'table') {
          if (hit(BTN.betDown, p)) { input(S, 'bet', -1); return; }
          if (hit(BTN.betUp, p)) { input(S, 'bet', 1); return; }
        }
      }
      input(S, type, p.x, p.y, id);
    },
    blur() { pause('blur'); },
    rotate() { if (!paused) pause('rotate'); else { paused.reason = 'rotate'; paused.countdown = null; } },
  };
  if (warp > 0) { scene.tick(warp); V.t = S.tick / 60; fx.nets.length = 0; fx.parts.length = 0; fx.coins.length = 0; fx.popups.length = 0; fx.banners.length = 0; fx.flash = null; }
  return scene;
}

function drawPause(ctx, P, mode) {
  ctx.fillStyle = 'rgba(4,14,26,0.72)'; ctx.fillRect(0, 0, 1280, 720);
  if (P.reason === 'rotate') {
    T(ctx, 'Rotate to landscape', 640, 340, { size: 48, w: 900, align: 'center' });
    T(ctx, 'Harvest Tide plays sideways', 640, 390, { size: 24, w: 700, align: 'center', fill: C.ice });
    return;
  }
  if (P.countdown !== null) {
    T(ctx, String(Math.ceil(P.countdown)), 640, 360, { size: 160, w: 900, align: 'center', base: 'middle', fill: C.gold, sw: 10 });
    return;
  }
  frost(ctx, 400, 220, 480, 340, 26, { glow: true, alpha: 0.85 });
  T(ctx, 'PAUSED', 640, 300, { size: 56, w: 900, align: 'center' });
  T(ctx, 'Tap anywhere to resume', 640, 360, { size: 26, w: 700, align: 'center', fill: C.ice });
  T(ctx, '3-2-1 countdown, then go', 640, 396, { size: 18, w: 600, align: 'center', fill: C.ice, a: 0.8 });
  frost(ctx, 470, 470, 340, 64, 18);
  T(ctx, mode === 'table' ? 'CASH OUT & QUIT' : 'QUIT RUN', 640, 512, { size: 26, w: 900, align: 'center', fill: C.coral });
}
