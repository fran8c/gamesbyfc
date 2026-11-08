// Fits the 1280 × 720 landscape canvas into the window (letterboxed) and maps pointer coordinates.
export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

export function createDisplay(canvas) {
  const ctx = canvas.getContext('2d');
  const d = { canvas, ctx, scale: 1, cssW: 0, cssH: 0, left: 0, top: 0, dpr: 1, onResize: null };

  function fit() {
    const W = window.innerWidth, H = window.innerHeight;
    const scale = Math.min(W / LOGICAL_W, H / LOGICAL_H);
    d.scale = scale;
    d.cssW = Math.round(LOGICAL_W * scale);
    d.cssH = Math.round(LOGICAL_H * scale);
    d.left = Math.round((W - d.cssW) / 2);
    d.top = Math.round((H - d.cssH) / 2);
    d.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = d.cssW + 'px';
    canvas.style.height = d.cssH + 'px';
    canvas.style.left = d.left + 'px';
    canvas.style.top = d.top + 'px';
    canvas.width = Math.round(d.cssW * d.dpr);
    canvas.height = Math.round(d.cssH * d.dpr);
    if (d.onResize) d.onResize();
  }

  /** Call at the start of each frame: maps logical units to backing pixels. */
  d.begin = () => {
    const k = (canvas.width / LOGICAL_W);
    ctx.setTransform(k, 0, 0, k, 0, 0);
  };

  /** Client (CSS px) → logical coordinates. */
  d.toLogical = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) * LOGICAL_W / r.width, y: (clientY - r.top) * LOGICAL_H / r.height };
  };

  /** Phone or tablet held upright (touch device taller than wide): ask to rotate. */
  d.isPortraitTouch = () => {
    const touch = (navigator.maxTouchPoints || 0) > 0 && window.matchMedia('(pointer: coarse)').matches;
    return touch && window.innerHeight > window.innerWidth;
  };

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 50));
  fit();
  return d;
}
