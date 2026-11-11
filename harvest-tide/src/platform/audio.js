// Sound effects and music, synthesized with the Web Audio API (no sound files needed).
// Audio starts on the first touch or click (browsers block sound before that).

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);          // MIDI note → Hz
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];   // Am F C G
const BPM = 96, EIGHTH = 60 / BPM / 2;

export function createAudio(settings) {
  let ac = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let musicOn = false, fever = false, step = 0, nextTime = 0, timer = null, suspended = false;
  const last = {};

  function init() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = settings.sfx ? 1 : 0; sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = settings.music ? 0.55 : 0; musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.1, attack = 0.005, glide = null, delay = 0, bus = sfxBus } = {}) {
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noise(dur, { vol = 0.1, freq = 1000, type = 'bandpass', q = 1, glide = null, delay = 0, bus = sfxBus } = {}) {
    const t0 = ac.currentTime + delay;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (glide) f.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }

  function arp(notes, gap, opts) { notes.forEach((n, i) => tone(NOTE(n), opts.dur || 0.25, { ...opts, delay: (opts.delay || 0) + i * gap })); }

  const SFX = {
    shot: ({ level = 3, lucky = false } = {}) => {
      noise(0.07, { vol: 0.09, freq: 2400 - level * 180, q: 0.8 });
      tone(lucky ? 1200 : 760 - level * 40, 0.07, { type: 'square', vol: 0.035, glide: 260 });
    },
    net: () => noise(0.2, { vol: 0.12, freq: 900, type: 'lowpass', glide: 250 }),
    hit: () => tone(320, 0.05, { type: 'triangle', vol: 0.04, glide: 200 }),
    catch: ({ combo = 0 } = {}) => {
      const r = Math.pow(2, Math.min(combo, 24) / 24);
      tone(880 * r, 0.1, { type: 'triangle', vol: 0.08 });
      tone(1320 * r, 0.14, { type: 'sine', vol: 0.07, delay: 0.05 });
    },
    coin: () => tone(1568 + Math.random() * 200, 0.06, { type: 'triangle', vol: 0.035 }),
    big: () => { arp([72, 76, 79, 84], 0.08, { type: 'triangle', vol: 0.1, dur: 0.3 }); noise(0.5, { vol: 0.05, freq: 6000, type: 'highpass', delay: 0.2 }); },
    mega: () => {
      arp([72, 76, 79, 84, 88, 91, 96], 0.07, { type: 'triangle', vol: 0.1, dur: 0.35 });
      for (const n of [72, 76, 79]) tone(NOTE(n), 1.2, { type: 'sine', vol: 0.06, attack: 0.05, delay: 0.5 });
      noise(1.0, { vol: 0.05, freq: 7000, type: 'highpass', delay: 0.4 });
    },
    wheelTick: () => tone(1500, 0.025, { type: 'square', vol: 0.03 }),
    wheelStop: () => { tone(NOTE(84), 0.9, { vol: 0.09 }); tone(NOTE(91), 0.9, { vol: 0.06, delay: 0.02 }); },
    luckyReady: () => arp([79, 81, 84, 86, 88, 91], 0.05, { type: 'triangle', vol: 0.08, dur: 0.2 }),
    luckyCatch: () => { arp([67, 72, 76, 79, 84], 0.06, { type: 'square', vol: 0.05, dur: 0.25 }); tone(NOTE(84), 0.8, { vol: 0.08, delay: 0.32 }); },
    freeze: () => { noise(0.5, { vol: 0.08, freq: 6000, type: 'highpass' }); tone(1800, 0.5, { vol: 0.05, glide: 500 }); },
    lockon: () => { tone(1200, 0.06, { type: 'square', vol: 0.04 }); tone(1600, 0.08, { type: 'square', vol: 0.04, delay: 0.09 }); },
    lightning: () => { noise(0.35, { vol: 0.16, freq: 3000, q: 0.6, glide: 400 }); tone(220, 0.35, { type: 'sawtooth', vol: 0.06, glide: 55 }); },
    sting: () => { tone(110, 0.3, { type: 'sawtooth', vol: 0.08 }); tone(116, 0.3, { type: 'sawtooth', vol: 0.06 }); },
    reload: () => { noise(0.03, { vol: 0.1, freq: 3000 }); noise(0.03, { vol: 0.1, freq: 2000, delay: 0.12 }); },
    boss: () => { tone(70, 1.4, { vol: 0.16, glide: 40, attack: 0.1 }); noise(1.2, { vol: 0.08, freq: 200, type: 'lowpass' }); },
    fever: () => { noise(0.6, { vol: 0.1, freq: 400, glide: 4000, q: 2 }); arp([72, 79, 84], 0.06, { type: 'triangle', vol: 0.08, dur: 0.4, delay: 0.25 }); },
    combo: ({ tier = 1 } = {}) => arp([72 + tier * 2, 79 + tier * 2], 0.06, { type: 'triangle', vol: 0.07, dur: 0.18 }),
    tick: () => tone(1046, 0.06, { type: 'square', vol: 0.035 }),
    click: () => tone(660, 0.05, { type: 'triangle', vol: 0.06 }),
    levelUp: () => tone(620, 0.08, { type: 'triangle', vol: 0.07, glide: 880 }),
    levelDown: () => tone(620, 0.08, { type: 'triangle', vol: 0.07, glide: 440 }),
    deny: () => tone(150, 0.12, { type: 'square', vol: 0.04 }),
    power: () => arp([76, 83, 88], 0.05, { type: 'triangle', vol: 0.07, dur: 0.15 }),
    end: () => arp([79, 76, 72, 67], 0.12, { type: 'triangle', vol: 0.08, dur: 0.35 }),
  };
  const MIN_GAP = { shot: 0.045, coin: 0.035, catch: 0.03, hit: 0.03, net: 0.04, wheelTick: 0.02 };

  function schedule() {
    if (!ac || !musicOn) return;
    while (nextTime < ac.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 4, e = step % 8, ch = CHORDS[bar];
      if (e === 0) for (const n of ch) tone(NOTE(n), EIGHTH * 8.2, { type: 'sine', vol: 0.03, attack: 0.35, bus: musicBus, delay: nextTime - ac.currentTime });
      if (e === 0 || e === 4) tone(NOTE(ch[0] - 12), EIGHTH * 3.5, { type: 'triangle', vol: 0.06, attack: 0.02, bus: musicBus, delay: nextTime - ac.currentTime });
      const pat = [0, 1, 2, 1, 0, 2, 1, 2][e];
      tone(NOTE(ch[pat] + 12), EIGHTH * 0.9, { type: 'triangle', vol: fever ? 0.035 : 0.022, bus: musicBus, delay: nextTime - ac.currentTime });
      if (fever) {
        noise(0.04, { vol: 0.03, freq: 8000, type: 'highpass', bus: musicBus, delay: nextTime - ac.currentTime });
        tone(NOTE(ch[(pat + 1) % 3] + 24), EIGHTH * 0.45, { type: 'triangle', vol: 0.02, bus: musicBus, delay: nextTime - ac.currentTime + EIGHTH / 2 });
      }
      nextTime += EIGHTH; step++;
    }
  }

  return {
    /** Call on the first user gesture. */
    unlock() {
      if (!init()) return;
      if (ac.state === 'suspended' && !suspended) ac.resume();
      if (!timer) timer = setInterval(schedule, 60);
    },
    play(name, opts) {
      if (!ac || !settings.sfx || suspended || !SFX[name]) return;
      const now = ac.currentTime, gap = MIN_GAP[name] || 0;
      if (gap && last[name] && now - last[name] < gap) return;
      last[name] = now;
      SFX[name](opts);
    },
    music(on) {
      musicOn = on;
      if (on && ac) { nextTime = Math.max(nextTime, ac.currentTime + 0.05); }
    },
    fever(on) { fever = on; },
    apply() {
      if (!ac) return;
      sfxBus.gain.setTargetAtTime(settings.sfx ? 1 : 0, ac.currentTime, 0.05);
      musicBus.gain.setTargetAtTime(settings.music ? 0.55 : 0, ac.currentTime, 0.1);
    },
    suspend() { suspended = true; if (ac && ac.state === 'running') ac.suspend(); },
    resume() { suspended = false; if (ac && ac.state === 'suspended') ac.resume(); },
  };
}
