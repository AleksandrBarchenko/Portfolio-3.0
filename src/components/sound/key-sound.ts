/* One soft typewriter key, for text that types itself out on hover. A tiny
   tick of band-passed noise (the type bar striking) over a short low knock
   (the body of the machine), both gone in a few tens of milliseconds so a run
   of them reads as gentle clatter, not a drumroll. Synthesized in Web Audio:
   no assets to load. */

import { noiseBuffer } from "./shift-sound";

/* `level` is the peak gain (already scaled by the site volume). */
export function playKey(ctx: AudioContext, level: number) {
  const t = ctx.currentTime;
  // Every key a little different in pitch and weight, like a real keyboard.
  const tickHz = 2400 + Math.random() * 1400;
  const knockHz = 140 + Math.random() * 60;
  const amp = level * (0.75 + Math.random() * 0.25);

  // The tick: a few ms of noise through a narrow band, rolled off above.
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = tickHz;
  bp.Q.value = 1.4;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 5000;
  const tick = ctx.createGain();
  tick.gain.setValueAtTime(0.0001, t);
  tick.gain.exponentialRampToValueAtTime(amp, t + 0.002);
  tick.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  src.connect(bp).connect(lp).connect(tick).connect(ctx.destination);
  src.start(t, Math.random() * 0.9);
  src.stop(t + 0.04);

  // The knock: a short sine that drops in pitch, felt more than heard.
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(knockHz, t);
  osc.frequency.exponentialRampToValueAtTime(knockHz * 0.6, t + 0.04);
  const knock = ctx.createGain();
  knock.gain.setValueAtTime(0.0001, t);
  knock.gain.exponentialRampToValueAtTime(amp * 0.5, t + 0.003);
  knock.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  osc.connect(knock).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}
