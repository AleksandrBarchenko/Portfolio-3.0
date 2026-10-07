"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CueName, PlayOptions } from "uisfx";
import {
  getAmbient,
  getAudioContext,
  getRobotVoice,
  getSoundPlayer,
} from "./uisfx-client";
import { TYPE_MS_PER_CHAR } from "./robot-voice";
import { playShift as synthShift } from "./shift-sound";
import { CUE, openCloseCue } from "./sound-events";

type SoundContextValue = {
  /* Fire a one-shot cue. No-ops on the server, when muted, or before audio is
     unlocked by a gesture. Safe to call from any handler. */
  play: (cue: CueName, options?: PlayOptions) => void;
  /* Hover cue, but only on a fine pointer that actually hovers — silent on
     touch, where there is no hover. */
  playHover: (cue?: CueName) => void;
  /* The "shh" of a use-case card shifting under the cursor. Same gating as
     `playHover`. */
  playShift: () => void;
  /* Robo-babble along with a line typing out at `perCharMs`. Same gating as
     `play`: silent on the server, when muted, or before the audio unlock. */
  speak: (text: string, perCharMs?: number) => void;
  stopSpeaking: () => void;
  enabled: boolean;
  /* Sound is on AND the browser has let audio start (after the first
     gesture) — i.e. the site is actually audible right now. */
  audible: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

const noop = () => {};

/* Voice output level relative to the player volume. */
const VOICE_LEVEL = 0.45;
/* Shift "shh" peak relative to the player volume. */
const SHIFT_LEVEL = 0.22;
/* Gap below which a second shh is dropped, so sweeping across the board
   doesn't hiss continuously. */
const SHIFT_COOLDOWN_MS = 140;
/* Background bed peak relative to the player volume — felt more than heard. */
const AMBIENT_LEVEL = 0.06;
/* Mute must be immediate, so the bed is cut fast rather than faded. */
const AMBIENT_MUTE_FADE_S = 0.12;

/* Fade the background bed in, at the player's current volume. */
function startAmbient(volume: number) {
  getAmbient()?.start(AMBIENT_LEVEL * volume);
}
const SoundContext = createContext<SoundContextValue>({
  play: noop,
  playHover: noop,
  playShift: noop,
  speak: noop,
  stopSpeaking: noop,
  enabled: false,
  audible: false,
  setEnabled: noop,
  toggle: noop,
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  // Default matches the player's `enabled: true`; the effect below reconciles it
  // with any stored mute preference once we're on the client.
  const [enabled, setEnabledState] = useState(true);
  // Audio can't make a sound until a real gesture resumes the AudioContext.
  const unlocked = useRef(false);
  // Render-facing mirror of `unlocked`, for the header's playing indicator.
  const [unlockedState, setUnlockedState] = useState(false);
  const hoverCapable = useRef(false);
  const lastShift = useRef(0);

  // Sync UI state to the player's persisted preference, and arm a one-time
  // unlock on the first genuine pointer/key gesture so later cues can sound.
  useEffect(() => {
    const player = getSoundPlayer();
    if (!player) return;
    setEnabledState(player.isEnabled());

    hoverCapable.current = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    const unlock = () => {
      unlocked.current = true;
      setUnlockedState(true);
      void player.unlock();
      void getAudioContext()?.resume();
      if (player.isEnabled()) startAmbient(player.getVolume());
    };
    // `once` + capture: the very first gesture anywhere unlocks, then detaches.
    window.addEventListener("pointerdown", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true, capture: true });

    // Let the bed rest while the tab is in the background.
    const onVisibility = () => {
      if (document.hidden) getAmbient()?.stop();
      else if (unlocked.current && player.isEnabled()) {
        startAmbient(player.getVolume());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
      getAmbient()?.stop();
    };
  }, []);

  const play = useCallback((cue: CueName, options?: PlayOptions) => {
    // Player gates on `enabled` itself and returns null when muted/throttled;
    // we only skip when audio was never unlocked (so stale async/background
    // cues don't queue against a suspended context).
    const player = getSoundPlayer();
    if (!player || !unlocked.current) return;
    player.play(cue, options);
  }, []);

  const playHover = useCallback(
    (cue: CueName = CUE.hover) => {
      if (!hoverCapable.current) return;
      // Short cooldown so skimming along a nav row doesn't chatter.
      play(cue, { cooldownMs: 90 });
    },
    [play],
  );

  const playShift = useCallback(() => {
    const player = getSoundPlayer();
    const ctx = getAudioContext();
    if (!player || !ctx || !unlocked.current || !hoverCapable.current) return;
    if (!player.isEnabled()) return;
    const now = performance.now();
    if (now - lastShift.current < SHIFT_COOLDOWN_MS) return;
    lastShift.current = now;
    synthShift(ctx, SHIFT_LEVEL * player.getVolume());
  }, []);

  const speak = useCallback(
    (text: string, perCharMs = TYPE_MS_PER_CHAR) => {
      const player = getSoundPlayer();
      if (!player || !unlocked.current || !player.isEnabled()) return;
      // The voice sits a step under the UI cues so it never crowds the copy.
      getRobotVoice()?.speak(text, perCharMs, VOICE_LEVEL * player.getVolume());
    },
    [],
  );

  const stopSpeaking = useCallback(() => getRobotVoice()?.stop(), []);

  const setEnabled = useCallback((value: boolean) => {
    const player = getSoundPlayer();
    if (!player) return;
    if (value) {
      // Toggling on is itself a gesture — unlock, then confirm it's audible.
      unlocked.current = true;
      setUnlockedState(true);
      void player.unlock();
      player.setEnabled(true);
      player.play(CUE.soundOn);
      startAmbient(player.getVolume());
    } else {
      // Mute must be immediate: cut anything playing before disabling.
      player.stopAll();
      getRobotVoice()?.stop();
      getAmbient()?.stop(AMBIENT_MUTE_FADE_S);
      player.setEnabled(false);
    }
    setEnabledState(value);
  }, []);

  const toggle = useCallback(
    () => setEnabled(!getSoundPlayer()?.isEnabled()),
    [setEnabled],
  );

  return (
    <SoundContext.Provider
      value={{
        play,
        playHover,
        playShift,
        speak,
        stopSpeaking,
        enabled,
        audible: enabled && unlockedState,
        setEnabled,
        toggle,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);

/* Plays the open/close cue whenever a dialog's `open` flag flips. Centralising
   it here means every entry point (button, backdrop, Escape, programmatic
   close) is covered once, with no double-fire. Skips the initial mount so a
   dialog that starts closed stays silent. */
export function useOpenCloseSound(open: boolean) {
  const { play } = useSound();
  const prev = useRef(open);
  useEffect(() => {
    if (prev.current !== open) {
      prev.current = open;
      play(openCloseCue(open));
    }
  }, [open, play]);
}

/* Babbles while a typewriter line is `speaking`: starts when it begins (or the
   line changes mid-speech) and fades out the moment it stops. Bump
   `restartKey` to say the same line again from the top. */
export function useRobotVoice(
  speaking: boolean,
  text: string,
  restartKey: unknown = 0,
  perCharMs = TYPE_MS_PER_CHAR,
) {
  const { speak, stopSpeaking } = useSound();
  useEffect(() => {
    if (!speaking) return;
    speak(text, perCharMs);
    return stopSpeaking;
  }, [speaking, text, restartKey, perCharMs, speak, stopSpeaking]);
}
