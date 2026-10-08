/* The "shh" of a card shifting under the cursor — like a sheet of paper sliding
   on a table. Not a pack cue: a short burst of noise through a band-pass that
   sweeps upward, so it reads as air and movement rather than a tone.
   Synthesized in Web Audio: no assets to load. */

/* One second of white noise, built once per context and reused; each shh reads
   from a random offset so repeats never sound identical. */
let noise: AudioBuffer | null = null;

export function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noise || noise.sampleRate !== ctx.sampleRate) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/* `level` is the peak gain (already scaled by the site volume). */
export function playShift(ctx: AudioContext, level: number) {
  const t = ctx.currentTime;
  // Small random drift in length and pitch keeps a run of hovers organic.
  const dur = 0.26 + Math.random() * 0.08;
  const from = 1400 + Math.random() * 400;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);

  // Cut the low rumble so only the airy "sh" band is left.
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;

  // The sweep: the band slides up as the card tilts, which is the "shift".
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(from, t);
  bp.frequency.exponentialRampToValueAtTime(from * 1.8, t + dur);

  // Soft swell in, longer tail out — a brush, not a click.
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(level, t + dur * 0.45);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(hp).connect(bp).connect(gain).connect(ctx.destination);
  src.start(t, Math.random() * 0.6);
  src.stop(t + dur + 0.02);
}

/* A softer cousin of the shh, for photos floating up over a word: lower, a
   little longer and rounder, with the top end rolled off so there's no hiss —
   more a breath of air than paper on a table. `level` as above. */
export function playSoftShift(ctx: AudioContext, level: number) {
  const t = ctx.currentTime;
  const dur = 0.42 + Math.random() * 0.1;
  const from = 520 + Math.random() * 160;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);

  // A gentle band, lifting less than the shh does, so it drifts rather than
  // swipes.
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.6;
  bp.frequency.setValueAtTime(from, t);
  bp.frequency.exponentialRampToValueAtTime(from * 1.4, t + dur);

  // Roll off everything bright — this is what makes it soft.
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1600;
  lp.Q.value = 0.3;

  // Slow swell to a mid-point peak, then an even fade: no edge on either end.
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(level, t + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(bp).connect(lp).connect(gain).connect(ctx.destination);
  src.start(t, Math.random() * 0.4);
  src.stop(t + dur + 0.02);
}
