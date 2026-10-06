/* Soft robo-babble: the head's "voice" while a line types out. Not speech —
   one short pitched blip per syllable, coloured by two vowel formants and a
   faint amplitude buzz, so it reads as a small friendly machine mumbling
   along with the text. Synthesized in Web Audio: no assets to load.

   Two halves: `planBabble` (pure, unit-tested) turns text into a timeline that
   tracks the typewriter, and `createRobotVoice` plays that timeline. */

export type Vowel = "a" | "e" | "i" | "o" | "u";

export type Blip = {
  /* Start, relative to the first typed character. */
  atMs: number;
  durMs: number;
  /* Pitch offset from the base voice, in semitones. */
  semitone: number;
  vowel: Vowel;
  /* 0–1, stressed syllables a touch louder. */
  gain: number;
};

/* The site's typewriters reveal one character every 30 ms. */
export const TYPE_MS_PER_CHAR = 30;

/* How far the melody may wander, and how big the end-of-sentence inflection. */
const PITCH_RANGE = 4;
const PITCH_STEP = 2;
const INFLECTION = 3;
/* A blip fills most of its syllable slot, leaving a hair of air between. */
const BLIP_FILL = 0.85;
const MAX_BLIP_MS = 170;

/* Vowel-group syllable count — same heuristic as the head's text mouth
   (face/TvHead.tsx), copied rather than imported so this module doesn't pull
   three.js into the layout bundle. */
function vowelGroups(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];
  const groups = w.match(/[aeiouy]+/g) ?? [w];
  if (groups.length > 1 && w.length > 3 && /[^aeiouy]e$/.test(w)) groups.pop();
  return groups;
}

function toVowel(group: string | undefined, rand: () => number): Vowel {
  const c = group?.[0];
  if (c === "a" || c === "e" || c === "i" || c === "o" || c === "u") return c;
  if (c === "y") return "i";
  return "aeiou"[Math.floor(rand() * 5)] as Vowel;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/* Text → blips aligned to the typewriter: each word sounds while its own
   characters are being typed, its syllables spread evenly across them. */
export function planBabble(
  text: string,
  perCharMs = TYPE_MS_PER_CHAR,
  rand: () => number = Math.random,
): Blip[] {
  const blips: Blip[] = [];
  let pitch = 0;
  for (const m of text.matchAll(/\S+/g)) {
    const token = m[0];
    const groups = vowelGroups(token);
    if (!groups.length) continue;
    const start = (m.index ?? 0) * perCharMs;
    const slot = (token.length * perCharMs) / groups.length;
    const durMs = Math.min(slot * BLIP_FILL, MAX_BLIP_MS);
    groups.forEach((group, i) => {
      pitch = clamp(pitch + (rand() * 2 - 1) * PITCH_STEP, -PITCH_RANGE, PITCH_RANGE);
      blips.push({
        atMs: start + i * slot,
        durMs,
        semitone: pitch,
        vowel: toVowel(group, rand),
        gain: (i === 0 ? 1 : 0.8) * (0.85 + rand() * 0.15),
      });
    });
    // Questions lift on their last syllable, statements settle down.
    const last = blips[blips.length - 1];
    const before = blips[blips.length - 2]?.semitone ?? 0;
    if (/\?["')\]]?$/.test(token)) last.semitone = before + INFLECTION;
    else if (/[.!…]["')\]]?$/.test(token)) last.semitone = before - INFLECTION;
  }
  return blips;
}

/* ── Synth ──────────────────────────────────────────────────────────────── */

/* A voice's timbre. Every blip is a tone (plus an optional octave partial)
   with a pitch glide, a gentle vibrato and a soft envelope; the "robot" presets
   add vowel formants and an amplitude buzz on top. */
export type VoicePreset = {
  wave: OscillatorType;
  /* Base pitch (Hz) and the glide through each blip, in semitones. */
  baseHz: number;
  glideFrom: number;
  glideTo: number;
  /* Quiet partial an octave up — adds a little "voice" to a pure tone. */
  octave: number;
  /* Vowel colour: 0 = none, 1 = fully formant-filtered. */
  formants: number;
  /* Amplitude buzz depth (0 = none) — the mechanical edge. */
  buzz: number;
  /* Vibrato depth in cents — a living wobble instead of a flat beep. */
  vibrato: number;
  attackMs: number;
  releaseMs: number;
  /* Top-end ceiling. Lower = softer, more muffled. */
  lowpassHz: number;
  /* Loudness trim so presets sit at the same level. */
  gain: number;
};

export const VOICE_PRESETS = {
  /* Pure sine hum with a slow wobble — a sleepy little "mm-mm". */
  hum: {
    wave: "sine",
    baseHz: 230,
    glideFrom: 0.6,
    glideTo: -0.9,
    octave: 0.18,
    formants: 0,
    buzz: 0,
    vibrato: 18,
    attackMs: 28,
    releaseMs: 90,
    lowpassHz: 1800,
    gain: 0.4,
  },
  /* Rounded triangle through soft vowels — a warm murmur with a faint hint of
     machine. */
  murmur: {
    wave: "triangle",
    baseHz: 185,
    glideFrom: 0.8,
    glideTo: -0.7,
    octave: 0,
    formants: 0.6,
    buzz: 0.08,
    vibrato: 10,
    attackMs: 20,
    releaseMs: 75,
    lowpassHz: 1700,
    gain: 1.3,
  },
  /* Round sine "bloops" that drop into each note, like soft bubbles. */
  bubble: {
    wave: "sine",
    baseHz: 330,
    glideFrom: 4,
    glideTo: -1,
    octave: 0,
    formants: 0,
    buzz: 0,
    vibrato: 0,
    attackMs: 10,
    releaseMs: 70,
    lowpassHz: 2200,
    gain: 0.13,
  },
  /* The first version: buzzy square through formants. Brightest of the set. */
  robot: {
    wave: "square",
    baseHz: 190,
    glideFrom: 0.8,
    glideTo: -0.7,
    octave: 0,
    formants: 0.88,
    buzz: 0.3,
    vibrato: 0,
    attackMs: 12,
    releaseMs: 60,
    lowpassHz: 3200,
    gain: 0.61,
  },
} as const satisfies Record<string, VoicePreset>;

export type VoicePresetName = keyof typeof VOICE_PRESETS;
export const DEFAULT_VOICE: VoicePresetName = "hum";

/* First/second formant per vowel (Hz). */
const FORMANTS: Record<Vowel, [number, number]> = {
  a: [730, 1090],
  e: [530, 1840],
  i: [300, 2290],
  o: [570, 840],
  u: [320, 870],
};
const BUZZ_HZ = 52;
const VIBRATO_HZ = 5.5;

export type RobotVoice = {
  /* Babble along with `text` as it types at `perCharMs`. Replaces whatever
     was being said. */
  speak: (text: string, perCharMs?: number, volume?: number) => void;
  /* Fade out and silence immediately. */
  stop: () => void;
};

export function createRobotVoice(
  ctx: BaseAudioContext,
  destination: AudioNode = ctx.destination,
  preset: VoicePreset = VOICE_PRESETS[DEFAULT_VOICE],
): RobotVoice {
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = preset.lowpassHz;
  lowpass.Q.value = 0.5;
  lowpass.connect(destination);

  let current: { out: GainNode; sources: AudioScheduledSourceNode[] } | null = null;

  const stop = () => {
    if (!current) return;
    const { out, sources } = current;
    current = null;
    const now = ctx.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.setTargetAtTime(0, now, 0.04);
    for (const s of sources) {
      try {
        s.stop(now + 0.25);
      } catch {
        // already stopped
      }
    }
    setTimeout(() => out.disconnect(), 450);
  };

  const speak = (text: string, perCharMs = TYPE_MS_PER_CHAR, volume = 1) => {
    stop();
    const blips = planBabble(text, perCharMs);
    if (!blips.length) return;

    const t0 = ctx.currentTime + 0.02;
    const last = blips[blips.length - 1];
    const end = t0 + (last.atMs + last.durMs + preset.releaseMs) / 1000 + 0.1;

    // Utterance chain: blips → buzz (AM) → output level → shared lowpass.
    const out = ctx.createGain();
    out.gain.value = volume * preset.gain;
    out.connect(lowpass);
    const buzz = ctx.createGain();
    buzz.gain.value = 1 - preset.buzz;
    buzz.connect(out);

    // One clock for the utterance's modulators; its end also tidies up.
    const clock = ctx.createConstantSource();
    clock.offset.value = 0;
    clock.connect(out);
    clock.start(t0);
    clock.stop(end);
    const sources: AudioScheduledSourceNode[] = [clock];

    if (preset.buzz > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = BUZZ_HZ;
      const depth = ctx.createGain();
      depth.gain.value = preset.buzz;
      lfo.connect(depth).connect(buzz.gain);
      lfo.start(t0);
      lfo.stop(end);
      sources.push(lfo);
    }

    let vibrato: GainNode | null = null;
    if (preset.vibrato > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = VIBRATO_HZ;
      vibrato = ctx.createGain();
      vibrato.gain.value = preset.vibrato;
      lfo.connect(vibrato);
      lfo.start(t0);
      lfo.stop(end);
      sources.push(lfo);
    }

    for (const b of blips) {
      const t = t0 + b.atMs / 1000;
      const dur = b.durMs / 1000;
      const f0 = preset.baseHz * 2 ** (b.semitone / 12);

      // Envelope: soft rise, short hold, release that may ring a little past
      // the slot so neighbouring syllables blend instead of clicking.
      const env = ctx.createGain();
      const attack = Math.min(preset.attackMs / 1000, dur * 0.4);
      const release = preset.releaseMs / 1000;
      const holdEnd = t + Math.max(attack, dur - release * 0.5);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(b.gain, t + attack);
      env.gain.setValueAtTime(b.gain, holdEnd);
      env.gain.setTargetAtTime(0, holdEnd, release / 3);
      env.connect(buzz);
      const stopAt = holdEnd + release + 0.02;

      const partials: [number, number][] = [[1, 1]];
      if (preset.octave > 0) partials.push([2, preset.octave]);
      for (const [mult, level] of partials) {
        const osc = ctx.createOscillator();
        osc.type = preset.wave;
        osc.frequency.setValueAtTime(f0 * mult * 2 ** (preset.glideFrom / 12), t);
        osc.frequency.exponentialRampToValueAtTime(
          f0 * mult * 2 ** (preset.glideTo / 12),
          t + dur,
        );
        if (vibrato) vibrato.connect(osc.detune);

        const tone = ctx.createGain();
        tone.gain.value = level;
        osc.connect(tone);

        // Vowel colour: two formant bands blended with the plain tone.
        if (preset.formants > 0) {
          const [f1, f2] = FORMANTS[b.vowel];
          for (const [freq, q, lvl] of [
            [f1, 5, 1],
            [f2, 7, 0.5],
          ] as const) {
            const band = ctx.createBiquadFilter();
            band.type = "bandpass";
            band.frequency.value = freq;
            band.Q.value = q;
            const g = ctx.createGain();
            g.gain.value = lvl * preset.formants;
            tone.connect(band).connect(g).connect(env);
          }
        }
        const dry = ctx.createGain();
        dry.gain.value = 1 - preset.formants;
        tone.connect(dry).connect(env);

        osc.start(t);
        osc.stop(stopAt);
        sources.push(osc);
      }
    }

    const utterance = { out, sources };
    current = utterance;
    clock.onended = () => {
      if (current === utterance) current = null;
      out.disconnect();
    };
  };

  return { speak, stop };
}
