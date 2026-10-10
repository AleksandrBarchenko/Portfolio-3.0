/* Slow, sunny background bed: a warm pad walking a simple major progression
   (C – F – C/E – G), each chord holding ~20 s and melting into the next, with
   the odd chime picked from the current chord and often answered a step up —
   rising intervals read as hopeful. Each pad note breathes on its own slow
   swell and the filter drifts over most of a minute, so the bed never repeats
   audibly and never asks for attention. Synthesized in Web Audio: no assets to
   load, no loop seam. */

export type Ambient = {
  /* Fade the bed in to `level` (peak gain). No-op if it's already playing. */
  start: (level: number) => void;
  /* Fade out over `fadeS` seconds and tear down. Safe to call when stopped. */
  stop: (fadeS?: number) => void;
};

/* Open voicings with the major third clearly in each, so every chord sounds
   bright rather than ambiguous. Bass walks C → F → E → G. */
const PROGRESSION = [
  [130.81, 196.0, 261.63, 329.63, 392.0], // C:   C3 G3 C4 E4 G4
  [174.61, 220.0, 261.63, 349.23, 440.0], // F:   F3 A3 C4 F4 A4
  [164.81, 196.0, 261.63, 329.63, 392.0], // C/E: E3 G3 C4 E4 G4
  [98.0, 196.0, 246.94, 293.66, 392.0], //   G:   G2 G3 B3 D4 G4
];
/* How long each chord holds, and how long the next one takes to melt in. */
const CHORD_HOLD_S = 20;
const CROSSFADE_S = 7;
/* A quiet triangle under each sine pair adds a little warmth and presence. */
const WARMTH = 0.25;
/* Each pad note is two sines pulled apart by this much, for a slow chorus. */
const DETUNE_CENTS = 4;
/* Random gap between chimes, and the chance one is answered a step up. */
const CHIME_GAP_MIN_S = 9;
const CHIME_GAP_MAX_S = 18;
const CHIME_ANSWER_CHANCE = 0.45;
const CHIME_ANSWER_DELAY_S = 0.7;
/* Chimes ease in (no ping) and ring out long. */
const CHIME_ATTACK_S = 0.3;
const CHIME_DECAY_S = 5.5;
/* Chime peak relative to the full pad. */
const CHIME_LEVEL = 0.15;
/* Chimes sit in this band, an octave or two above the pad. */
const CHIME_MIN_HZ = 500;
const CHIME_MAX_HZ = 1000;
/* Echo on the chimes only: time, feedback, and how much of it is heard. */
const ECHO_S = 0.9;
const ECHO_FEEDBACK = 0.3;
const ECHO_WET = 0.35;
const FADE_IN_S = 8;
const FADE_OUT_S = 1.5;
/* Lowpass centre and how far its slow drift swings either side. Open enough
   that the pad sounds airy and bright rather than muffled. */
const CUTOFF_HZ = 1500;
const CUTOFF_SWING_HZ = 350;

/* The chord's tones lifted into the chime band, low to high. */
function chimeTones(chord: number[]): number[] {
  const tones = new Set<number>();
  for (const hz of chord) {
    for (let f = hz; f <= CHIME_MAX_HZ; f *= 2) {
      // Whole-Hz rounding merges octaves of the same note (e.g. F3×4, F4×2).
      if (f >= CHIME_MIN_HZ) tones.add(Math.round(f));
    }
  }
  return [...tones].sort((a, b) => a - b);
}

export function createAmbient(
  ctx: BaseAudioContext,
  destination: AudioNode = ctx.destination,
): Ambient {
  let current: {
    out: GainNode;
    sources: Set<AudioScheduledSourceNode>;
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
    // Everything still running, so `stop` can end it; chord oscillators leave
    // the set once their crossfade is done.
    const sources = new Set<AudioScheduledSourceNode>();
    // Two re-armed slots: [0] the next chord, [1] the next chime.
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = (src: AudioScheduledSourceNode, at: number) => {
      src.start(at);
      sources.add(src);
      src.onended = () => sources.delete(src);
    };

    // A slow sine nudging `target` by ±depth around its set value.
    const lfo = (hz: number, depth: number, target: AudioParam) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = depth;
      osc.connect(g).connect(target);
      run(osc, ctx.currentTime);
      return osc;
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
    lfo(1 / 52, CUTOFF_SWING_HZ, lowpass.frequency);

    // One chord as its own group, so the next can crossfade over it. Returns a
    // function that fades the group out and lets its oscillators end.
    const playChord = (notes: number[], fadeS: number) => {
      const now = ctx.currentTime;
      const group = ctx.createGain();
      group.gain.setValueAtTime(0, now);
      group.gain.linearRampToValueAtTime(1, now + fadeS);
      group.connect(lowpass);

      const oscs: AudioScheduledSourceNode[] = [];
      // Normalised so every voice at its peak sums to ~1 before `out`.
      const each = 1 / (notes.length * (2 + WARMTH));
      notes.forEach((hz, i) => {
        const voice = ctx.createGain();
        voice.gain.value = each * 0.6;
        voice.connect(group);
        // Unrelated periods (19–47 s) so the swells never line up.
        oscs.push(lfo(1 / (19 + i * 7.1), each * 0.4, voice.gain));
        for (const [type, cents, gain] of [
          ["sine", -DETUNE_CENTS, 1],
          ["sine", DETUNE_CENTS, 1],
          ["triangle", 0, WARMTH],
        ] as const) {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.value = hz;
          osc.detune.value = cents;
          const g = ctx.createGain();
          g.gain.value = gain;
          osc.connect(g).connect(voice);
          run(osc, now);
          oscs.push(osc);
        }
      });

      return () => {
        const at = ctx.currentTime;
        group.gain.cancelScheduledValues(at);
        group.gain.setValueAtTime(group.gain.value, at);
        group.gain.linearRampToValueAtTime(0, at + CROSSFADE_S);
        for (const o of oscs) o.stop(at + CROSSFADE_S + 0.1);
      };
    };

    // The first chord rides the bed's own fade-in; later ones crossfade.
    let chord = 0;
    let release = playChord(PROGRESSION[0], 0.01);
    const next = () => {
      chord = (chord + 1) % PROGRESSION.length;
      release();
      release = playChord(PROGRESSION[chord], CROSSFADE_S);
      timers[0] = setTimeout(next, CHORD_HOLD_S * 1000);
    };
    timers[0] = setTimeout(next, CHORD_HOLD_S * 1000);

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

    const bell = (hz: number, at: number, peak: number) => {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(peak, at + CHIME_ATTACK_S);
      env.gain.exponentialRampToValueAtTime(0.0001, at + CHIME_DECAY_S);
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
        osc.start(at);
        osc.stop(at + CHIME_DECAY_S + 0.05);
      }
    };

    const chime = () => {
      const now = ctx.currentTime;
      const tones = chimeTones(PROGRESSION[chord]);
      // Leave room above the first note for the answer.
      const i = Math.floor(Math.random() * (tones.length - 1));
      bell(tones[i], now, CHIME_LEVEL);
      if (Math.random() < CHIME_ANSWER_CHANCE) {
        bell(tones[i + 1], now + CHIME_ANSWER_DELAY_S, CHIME_LEVEL * 0.8);
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
