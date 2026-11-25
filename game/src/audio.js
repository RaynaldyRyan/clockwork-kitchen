// Clockwork Kitchen: tiny synthesized sounds — no audio files, no network.
// Everything is a short WebAudio oscillator blip, started on first gesture.
let ctx = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, gain, when) {
  if (!ctx) return;
  const t0 = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SOUNDS = {
  pick: () => tone(520, 0.07, 'triangle', 0.12),
  place: () => { tone(420, 0.06, 'triangle', 0.12); tone(640, 0.08, 'triangle', 0.1, 0.05); },
  boil: () => { tone(220, 0.12, 'sine', 0.1); tone(330, 0.12, 'sine', 0.08, 0.09); },
  fry: () => { tone(300, 0.1, 'sawtooth', 0.05); tone(450, 0.1, 'sawtooth', 0.04, 0.08); },
  take: () => tone(700, 0.07, 'triangle', 0.12),
  serve: () => { tone(660, 0.12, 'sine', 0.14); tone(880, 0.16, 'sine', 0.14, 0.1); tone(1320, 0.22, 'sine', 0.1, 0.2); },
  wrong: () => { tone(180, 0.18, 'square', 0.07); tone(140, 0.22, 'square', 0.07, 0.12); },
  raw: () => tone(240, 0.12, 'square', 0.06),
  dup: () => tone(300, 0.08, 'square', 0.05),
  trash: () => tone(200, 0.1, 'sawtooth', 0.06),
  tick: () => tone(980, 0.04, 'square', 0.05),
};

export function playSound(name) {
  if (!ctx) return;
  const fn = SOUNDS[name];
  if (fn) fn();
}
