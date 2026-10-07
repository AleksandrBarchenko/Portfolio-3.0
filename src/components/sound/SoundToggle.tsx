"use client";

import { useSound } from "./SoundProvider";

/* Each bar's resting height (while sound is on but silent) and its bounce
   period/offset while playing — unrelated timings so it reads as live audio,
   not a metronome. */
const BARS = [
  { rest: 0.45, dur: "0.82s", delay: "-0.3s" },
  { rest: 0.85, dur: "1.06s", delay: "-0.7s" },
  { rest: 0.6, dur: "0.74s", delay: "-0.1s" },
  { rest: 0.35, dur: "0.95s", delay: "-0.5s" },
];
const MUTED = 0.18;

export type SoundState = "muted" | "idle" | "playing";

/* The site's sound state as the equalizer shows it: bouncing while audio is
   actually playing, still while sound is on but the browser hasn't let it start
   yet (no click so far), flat when muted. */
export function useSoundState(): SoundState {
  const { enabled, audible } = useSound();
  return !enabled ? "muted" : audible ? "playing" : "idle";
}

/* The equalizer bars alone, so other UI (the intro's sound hint) can show the
   exact icon the header toggle wears. Animates via the nearest `data-eq`. */
export function SoundBars({ state }: { state: SoundState }) {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[3px]">
      {BARS.map((b, i) => (
        <span
          key={i}
          className="eq-bar h-full w-[2px] rounded-full bg-current"
          style={
            {
              transform: `scaleY(${state === "muted" ? MUTED : b.rest})`,
              "--eq-dur": b.dur,
              "--eq-delay": b.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

/* Accessible mute switch, drawn as a little equalizer that shows the site's
   sound state at a glance (see `useSoundState`). Mirrors ThemeToggle's shape so
   it sits naturally in the header. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const { enabled, toggle, setEnabled } = useSound();
  const state = useSoundState();

  return (
    <button
      type="button"
      // Sound on but not started yet: a click should start it, not mute it.
      onClick={state === "idle" ? () => setEnabled(true) : toggle}
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Mute sounds" : "Unmute sounds"}
      title={state === "playing" ? "Sound on" : state === "idle" ? "Play sound" : "Sound off"}
      data-eq={state}
      className={`theme-fade grid h-10 w-10 place-items-center rounded-full border border-line text-sol transition-colors hover:bg-pill ${className}`}
    >
      <SoundBars state={state} />
    </button>
  );
}

export default SoundToggle;
