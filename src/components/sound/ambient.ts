/* Slow, sunny background bed: a warm major pad of detuned sine pairs that
   leans between I and IV every half minute, with a rare pentatonic note
   blooming over the top through a long, soft echo. Each pad note breathes on its own slow swell and the
   filter drifts over half a minute, so the bed never repeats audibly and
   never asks for attention. Synthesized in Web Audio: no assets to load, no
   loop seam. */

export type Ambient = {
  /* Fade the bed in to `level` (peak gain). No-op if it's already playing. */
  start: (level: number) => void;
  /* Fade out over `fadeS` seconds and tear down. Safe to call when stopped. */
  stop: (fadeS?: number) => void;
};

/* C(add9) ⇄ F6/C. A pedal C underneath, and only two voices step (G→A,
   E→F) so the sway reads as a lift rather than a chord change. */
const CHORDS = [
  [130.81, 196.0, 293.66, 329.63],
  [130.81, 220.0, 293.66, 349.23],
];
/* How long each chord holds, and how slowly voices glide into the next. */
const CHORD_HOLD_S = 32;
const CHORD_GLIDE_TC = 4;
/* C major pentatonic, an octave above the pad — every note fits both
   chords, so chimes can land anywhere. */
const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];
/* Random gap between chimes. They swell in and fade out slowly, so they
   bloom rather than ping. */
const CHIME_GAP_MIN_S = 11;
const CHIME_GAP_MAX_S = 22;
const CHIME_ATTACK_S = 1.4;
const CHIME_DECAY_S = 7;
/* Chime peak relative to the full pad. */
const CHIME_LEVEL = 0.16;
/* Echo on the chimes only: time, feedback, and how much of it is heard. */
const ECHO_S = 0.9;
const ECHO_FEEDBACK = 0.3;
const ECHO_WET = 0.35;
/* Each pad note is two sines pulled apart by this much, for a slow chorus. */
const DETUNE_CENTS = 4;
const FADE_IN_S = 8;
const FADE_OUT_S = 1.5;
/* Lowpass centre and how far its slow drift swings either side. Opener than
   a dark drone, so the pad sounds airy rather than muffled. */
const CUTOFF_HZ = 1100;
const CUTOFF_SWING_HZ = 300;

export function createAmbient(
  ctx: BaseAudioContext,
  destination: AudioNode = ctx.destination,
): Ambient {
  let current: {
    out: GainNode;
    sources: AudioScheduledSourceNode[];
    timers: ReturnType<typeof setTimeout>[];
  } | null = null;

  const stop = (fadeS = FADE_OUT_S) => {
    if (!current) return;
    const { out, sources, timers } = current;
    current = null;
    for (const id of timers) clearTimeout(id);
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
    // Two re-armed slots: [0] the chord sway, [1] the next chime.
    const timers: ReturnType<typeof setTimeout>[] = [];

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
    lfo(1 / 48, CUTOFF_SWING_HZ, lowpass.frequency);

    // Normalised so every voice at its peak sums to 1 before `out`.
    const each = 1 / (CHORDS[0].length * 2);
    const voices: OscillatorNode[][] = CHORDS[0].map((hz, i) => {
      const voice = ctx.createGain();
      voice.gain.value = each * 0.6;
      voice.connect(lowpass);
      // Unrelated periods (23 s, 32 s, 41 s, 50 s) so the swells never line up.
      lfo(1 / (23 + i * 9.1), each * 0.4, voice.gain);
      return [-DETUNE_CENTS, DETUNE_CENTS].map((cents) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = hz;
        osc.detune.value = cents;
        osc.connect(voice);
        osc.start(t);
        sources.push(osc);
        return osc;
      });
    });

    let chord = 0;
    const sway = () => {
      chord = (chord + 1) % CHORDS.length;
      const now = ctx.currentTime;
      voices.forEach((pair, i) => {
        for (const osc of pair) {
          osc.frequency.setTargetAtTime(CHORDS[chord][i], now, CHORD_GLIDE_TC);
        }
      });
      timers[0] = setTimeout(sway, CHORD_HOLD_S * 1000);
    };
    timers[0] = setTimeout(sway, CHORD_HOLD_S * 1000);

    // Chimes go dry to `out` and through a feedback echo for a bit of space.
    const chimeBus = ctx.createGain();
    chimeBus.connect(out);
    const echo = ctx.createDelay(1);
    echo.delayTime.value = ECHO_S;
    const feedback = ctx.createGain();
    feedback.gain.value = ECHO_FEEDBACK;
    const wet = ctx.createGain();
    wet.gain.value = ECHO_WET;
    chimeBus.connect(echo);
    echo.connect(feedback).connect(echo);
    echo.connect(wet).connect(out);

    const chime = () => {
      const now = ctx.currentTime;
      const hz = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(CHIME_LEVEL, now + CHIME_ATTACK_S);
      env.gain.exponentialRampToValueAtTime(0.0001, now + CHIME_DECAY_S);
      env.connect(chimeBus);
      // A fundamental plus a faint octave, for a glassy tone rather than a beep.
      for (const [mult, gain] of [
        [1, 1],
        [2, 0.08],
      ]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = hz * mult;
        const g = ctx.createGain();
        g.gain.value = gain;
        osc.connect(g).connect(env);
        osc.start(now);
        osc.stop(now + CHIME_DECAY_S + 0.05);
      }
      const gap =
        CHIME_GAP_MIN_S + Math.random() * (CHIME_GAP_MAX_S - CHIME_GAP_MIN_S);
      timers[1] = setTimeout(chime, gap * 1000);
    };
    // Let the pad settle before the first chime.
    timers[1] = setTimeout(chime, FADE_IN_S * 1000);

    current = { out, sources, timers };
  };

  return { start, stop };
}
