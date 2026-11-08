// Boot: config, display, input, clock, and a tiny screen manager.
import { loadConfig } from './config/loader.js';
import { createDisplay } from './platform/display.js';
import { createClock } from './platform/clock.js';
import { loadSave } from './platform/storage.js';
import { createTitleScene } from './scenes/title.js';
import { createGameScene } from './scenes/game.js';
import { createResultsScene } from './scenes/results.js';
import { T } from './view/theme.js';

/** ?cfg.reel.releaseLoss=70 → { reel: { releaseLoss: 70 } } (dev tuning). */
function overridesFromUrl(params) {
  const out = {};
  for (const [k, v] of params) {
    if (!k.startsWith('cfg.')) continue;
    const path = k.slice(4).split('.');
    let o = out;
    for (let i = 0; i < path.length - 1; i++) o = o[path[i]] = o[path[i]] || {};
    const num = Number(v);
    o[path[path.length - 1]] = v === 'true' ? true : v === 'false' ? false : Number.isNaN(num) ? v : num;
  }
  return out;
}

function randomSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

/** Safe-area insets (notches) in logical px, minimum 0. */
function measureInsets(display) {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;' +
    'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const topCss = parseFloat(cs.paddingTop) || 0, botCss = parseFloat(cs.paddingBottom) || 0;
  probe.remove();
  const bottomGap = window.innerHeight - display.top - display.cssH;
  return {
    top: Math.max(0, topCss - display.top) / display.scale,
    bottom: Math.max(0, botCss - bottomGap) / display.scale,
  };
}

export async function boot(canvas) {
  const params = new URLSearchParams(location.search);
  const dev = params.has('dev') || ['localhost', '127.0.0.1'].includes(location.hostname);
  const { config, problems } = loadConfig(overridesFromUrl(params), { dev });
  if (problems.length) console.warn('Config adjusted:', problems);

  const display = createDisplay(canvas);
  const { data: save } = loadSave();
  const debug = params.has('debug');
  const seedParam = params.get('seed');
  const autoplay = params.get('autoplay');                  // dev: novice | mid | expert robot plays
  const modeParam = params.get('mode');                     // dev: arcade | table

  const app = {
    config, display, save, insets: { top: 0, bottom: 0 }, scene: null, clock: null,
    go(name, arg = {}) {
      if (name === 'title') app.scene = createTitleScene(app);
      else if (name === 'game') app.scene = createGameScene(app, {
        mode: arg.mode || modeParam || 'arcade', seed: seedParam ? Number(seedParam) >>> 0 : randomSeed(), autoplay,
        warp: dev || debug ? Number(params.get('warp') || 0) : 0,
      });
      else if (name === 'results') app.scene = createResultsScene(app, arg);
    },
  };
  app.insets = measureInsets(display);
  display.onResize = () => {
    app.insets = measureInsets(display);
    if (display.isPortraitTouch() && app.scene && app.scene.rotate) app.scene.rotate();
  };

  // Input: pointer events → logical coordinates → current screen.
  const send = (type, e) => {
    if (!app.scene || !app.scene.pointer) return;
    app.scene.pointer(type, display.toLogical(e.clientX, e.clientY), e.pointerId);
  };
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    send('down', e);
  });
  canvas.addEventListener('pointermove', e => send('move', e));
  canvas.addEventListener('pointerup', e => send('up', e));
  canvas.addEventListener('pointercancel', e => send('up', e));
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  const blur = () => { if (app.scene && app.scene.blur) app.scene.blur(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); });
  window.addEventListener('blur', blur);

  let fps = 60;
  app.clock = createClock(
    n => { if (app.scene) app.scene.tick(n); },
    dt => {
      fps += (1000 / Math.max(1, dt) - fps) * 0.05;
      display.begin();
      const ctx = display.ctx;
      app.scene.frame(dt / 1000);
      app.scene.draw(ctx);
      if (debug && app.scene.S) {
        const S = app.scene.S;
        const line = `fps ${fps.toFixed(0)}  tick ${S.tick}  ${S.state}  fish ${S.fish.length}  bullets ${S.bullets.length}  combo ${S.combo.points}  seed ${S.seed}`;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 720 - 24, 1280, 24);
        T(ctx, line, 8, 720 - 7, { size: 14, w: 600, stroke: null });
      }
    },
  );

  if (dev || debug) window.__harvesttide = app;           // dev hook for automated browser tests
  if (display.isPortraitTouch()) setTimeout(() => app.scene && app.scene.rotate && app.scene.rotate(), 0);
  app.go(autoplay || params.has('play') ? 'game' : 'title', {});
  app.clock.start();
  return app;
}
