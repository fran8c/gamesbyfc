// Optional painted art. Drop a PNG with the right name into the assets/ folder and the game uses it
// instead of the code-drawn version. Missing files are ignored. See assets/ART-PROMPTS.md.
//
// Every image is auto-trimmed (transparent edges removed) so it can be generated at any size.

export const ART_FILES = {
  background:   'assets/background.png',
  sardine:      'assets/fish/sardine.png',
  clownfish:    'assets/fish/clownfish.png',
  snapper:      'assets/fish/snapper.png',
  puffer:       'assets/fish/puffer.png',
  lionfish:     'assets/fish/lionfish.png',
  turtle:       'assets/fish/turtle.png',
  manta:        'assets/fish/manta.png',
  golden_koi:   'assets/fish/golden-koi.png',
  octopus_king: 'assets/fish/octopus-king.png',
  jellyfish:    'assets/fish/jellyfish.png',
  capsule:      'assets/fish/power-pearl.png',
  'cannon-1':   'assets/cannon/cannon-1.png',
  'cannon-2':   'assets/cannon/cannon-2.png',
  'cannon-3':   'assets/cannon/cannon-3.png',
  'cannon-arcade': 'assets/cannon/cannon-arcade.png',
  coin:         'assets/ui/coin.png',
  freeze:       'assets/ui/power-freeze.png',
  lockon:       'assets/ui/power-lockon.png',
  lightning:    'assets/ui/power-zap.png',
};

/** Loaded images by key (only the ones that exist). */
export const ART = {};

function trim(img) {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return null;
    const out = document.createElement('canvas');
    out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  } catch {
    return img;                       // e.g. opened from file:// — use the image untrimmed
  }
}

/** Start loading every optional image. Resolves when all have loaded or failed (never rejects). */
export function loadArt(base = '') {
  const jobs = Object.entries(ART_FILES).map(([key, path]) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => { ART[key] = key === 'background' ? img : (trim(img) || img); resolve(); };
    img.onerror = () => resolve();
    img.src = base + path;
  }));
  return Promise.all(jobs).then(() => Object.keys(ART));
}
