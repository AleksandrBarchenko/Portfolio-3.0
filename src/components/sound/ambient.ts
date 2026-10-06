/* Super-soft background bed: an open sus2 chord of detuned sine pairs under a
   low lowpass. Each note breathes on its own slow swell and the filter drifts
   over half a minute, so the bed never repeats audibly and never asks for
   attention. Synthesized in Web Audio: no assets to load, no loop seam. */

export type Ambient = {
  /* Fade the bed in to `level` (peak gain). No-op if it's already playing. */
  start: (level: number) => void;
  /* Fade out over `fadeS` seconds and tear down. Safe to call when stopped. */
  stop: (fadeS?: number) => void;
};

/* A2, E3, B3, E4 — no third, so it reads as calm rather than happy or sad. */
const NOTES = [110, 164.81, 246.94, 329.63];
/* Each note is two sines pulled apart by this much, for a slow chorus. */
const DETUNE_CENTS = 5;
const FADE_IN_S = 6;
const FADE_OUT_S = 1.5;
/* Lowpass centre and how far its slow drift swings either side. */
const CUTOFF_HZ = 700;
const CUTOFF_SWING_HZ = 250;

export function createAmbient(
  ctx: BaseAudioContext,
  destination: AudioNode = ctx.destination,
): Ambient {
  let current: { out: GainNode; sources: AudioScheduledSourceNode[] } | null = null;

  const stop = (fadeS = FADE_OUT_S) => {
    if (!current) return;
    const { out, sources } = current;
    current = null;
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + fadeS);
    for (const s of sources) s.stop(now + fadeS + 0.05);
    setTimeout(() => out.disconnect(), (fadeS + 0.3) * 1000);
  };

  const start = (level: number) => {
    if (current) return;
    const t = ctx.currentTime;
    const sources: AudioScheduledSourceNode[] = [];

    // A slow sine nudging `target` by ±depth around its set value.
    const lfo = (hz: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = depth;
      osc.connect(g).connect(target);
      osc.start(t);
      sources.push(osc);
    };

    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(level, t + FADE_IN_S);
    out.connect(destination);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = CUTOFF_HZ;
    lowpass.Q.value = 0.3;
    lowpass.connect(out);
    lfo(1 / 34, CUTOFF_SWING_HZ, lowpass.frequency);

    // Normalised so every voice at its peak sums to 1 before `out`.
    const each = 1 / (NOTES.length * 2);
    NOTES.forEach((hz, i) => {
      const voice = ctx.createGain();
      voice.gain.value = each * 0.6;
      voice.connect(lowpass);
      // Unrelated periods (17 s, 23 s, 30 s, 36 s) so the swells never line up.
      lfo(1 / (17 + i * 6.3), each * 0.4, voice.gain);
      for (const cents of [-DETUNE_CENTS, DETUNE_CENTS]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = hz;
        osc.detune.value = cents;
        osc.connect(voice);
        osc.start(t);
        sources.push(osc);
      }
    });

    current = { out, sources };
  };

  return { start, stop };
}
