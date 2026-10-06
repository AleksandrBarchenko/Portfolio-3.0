import { createUISFX, type UISFXPlayer } from "uisfx";
import { createRobotVoice, type RobotVoice } from "./robot-voice";
import { createAmbient, type Ambient } from "./ambient";

/* The one sound pack for the whole site. "scifi" — clean holographic pings with
   a restrained digital shimmer — is the coherent match for an AI-avatar
   portfolio: the orb / TV head that listens and replies, the Orbitron wordmark,
   and the spatial, snapped narrative all read as futuristic-but-tasteful, which
   is exactly this pack's lane (AI tools, spatial UI). */
export const SOUND_PACK = "scifi" as const;

/* Persist the mute/volume choice under this key (uisfx writes it to
   localStorage through its `preferences` option). */
const PREF_KEY = "ab:sound";

/* One shared, client-only player. Kept at module scope — not in React state —
   so React Strict Mode's double-mount and any remount reuse the same instance
   instead of spinning up a second player (and a second AudioContext). */
let player: UISFXPlayer | null = null;

/* One AudioContext for the whole site, shared by the uisfx cues and the robot
   voice, so a single gesture unlocks both and they mix on the same clock. */
let audioContext: AudioContext | null = null;

/* Returns the shared AudioContext, creating it lazily on the client. Null
   during SSR or in a browser without Web Audio. */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

/* Returns the shared player, creating it lazily on the client. Returns null
   during SSR so nothing ever instantiates audio on the server. */
export function getSoundPlayer(): UISFXPlayer | null {
  if (typeof window === "undefined") return null;
  if (!player) {
    player = createUISFX({
      pack: SOUND_PACK,
      volume: 0.7,
      // Default on for a first-time visitor; a stored preference (below)
      // overrides this. Nothing actually sounds until a gesture unlocks audio.
      enabled: true,
      preferences: { key: PREF_KEY },
      context: getAudioContext() ?? undefined,
    });
  }
  return player;
}

/* The head's babble voice, on the same shared context. Null during SSR. */
let voice: RobotVoice | null = null;

export function getRobotVoice(): RobotVoice | null {
  if (!voice) {
    const ctx = getAudioContext();
    if (!ctx) return null;
    voice = createRobotVoice(ctx);
  }
  return voice;
}

/* The background bed, on the same shared context. Null during SSR. */
let ambient: Ambient | null = null;

export function getAmbient(): Ambient | null {
  if (!ambient) {
    const ctx = getAudioContext();
    if (!ctx) return null;
    ambient = createAmbient(ctx);
  }
  return ambient;
}
