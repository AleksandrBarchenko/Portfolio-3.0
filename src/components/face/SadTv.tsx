"use client";

import { useState } from "react";
import {
  TvHead,
  DEFAULT_TV_SETTINGS,
  type TvSettings,
  type TvStateParams,
} from "@/components/face/TvHead";
import { useSound } from "@/components/sound/SoundProvider";
import { CUE } from "@/components/sound/sound-events";

/* The 404 mood: the regular TV head with its screen gone blue, eyes at
   half-mast, mouth bent into a frown and the head hung low. Only `idle` is
   ever shown, but every state carries it so nothing cross-fades back to
   the happy face. */
const SAD: TvStateParams = {
  ...DEFAULT_TV_SETTINGS.states.idle,
  screenA: "#1d3fa8",
  screenB: "#7fb2ff",
  backdropColor: "#2f5fd0",
  cableColor: "#4f7fe6",
  drift: 0.35,
  screenGlow: 1.15,
  eyeW: 0.07,
  eyeH: 0.045,
  eyeSpacing: 0.13,
  eyeHeight: 0.07,
  eyeRound: 0.045,
  mouthW: 0.09,
  mouthH: 0.012,
  mouthY: -0.2,
  mouthCurve: -1.8,
  blinkRate: 0.12,
  gaze: 0.12,
  yaw: -0.22,
  pitch: -0.34,
  lean: 0.14,
  bob: 0.06,
};

const SAD_SETTINGS: TvSettings = {
  transition: 0.05,
  states: { idle: SAD, listening: SAD, thinking: SAD, replying: SAD },
};

/* What the TV mumbles when you poke it. */
const QUIPS = [
  "no signal. no page. no joy.",
  "i checked every channel. twice.",
  "please stop poking me, i'm fragile.",
  "it's not you, it's the url.",
  "have you tried turning it off and on again?",
  "fine. i'm fine. everything is fine.",
];

export function SadTv() {
  const [quip, setQuip] = useState(0);
  const { play } = useSound();

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-label="Poke the sad TV"
        onClick={() => {
          play(CUE.open);
          setQuip((q) => (q + 1) % QUIPS.length);
        }}
        className="relative aspect-square w-[min(78vw,440px)] cursor-pointer"
      >
        <TvHead state="idle" settings={SAD_SETTINGS} />
      </button>
      <p className="mt-2 font-mono text-[14px] uppercase tracking-wide text-sol-dim">
        <span className="text-accent">error 404</span> ·{" "}
        <span key={quip} aria-live="polite" className="inline-block animate-[quip-in_0.35s_ease-out]">
          {QUIPS[quip]}
        </span>
      </p>
    </div>
  );
}

export default SadTv;
