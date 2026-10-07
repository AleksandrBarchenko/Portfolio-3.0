"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const GLYPHS = "*#\\/%&@$!?<>";
// Glyphs re-roll at this rate (ms) — fast enough to read as "decoding", slow
// enough that each symbol is actually visible.
const TICK = 55;

// Deterministic so the server render and first client render match.
const cipher = (text: string) =>
  Array.from(text, (_, i) => GLYPHS[(i * 7 + 3) % GLYPHS.length]).join("");

const scramble = (text: string, from: number) =>
  text.slice(0, from) +
  Array.from(text.slice(from), () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join("");

/* A word that sits encrypted as a row of symbols, flickers for `hold` ms once
   `active`, then decodes left to right over `duration` ms. Goes back to the
   cipher whenever `active` turns off, so it replays on the next reveal. A hidden
   copy of the real word reserves the width so the line never shifts. */
export function DecryptText({
  text,
  active,
  className,
  hold = 700,
  duration = 900,
}: {
  text: string;
  active: boolean;
  className?: string;
  hold?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(() => cipher(text));

  useEffect(() => {
    if (reduce) {
      setShown(text);
      return;
    }
    if (!active) {
      setShown(cipher(text));
      return;
    }
    let raf = 0;
    // Time is accumulated per frame with a clamp, so if the main thread stalls
    // (the hero's 3D head loading) the effect pauses rather than skipping ahead.
    let t = 0;
    let sinceTick = TICK;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - prev, 50);
      prev = now;
      t += dt;
      sinceTick += dt;
      const revealed = Math.max(0, Math.floor(((t - hold) / duration) * text.length));
      if (revealed >= text.length) {
        setShown(text);
        return;
      }
      if (sinceTick >= TICK) {
        sinceTick = 0;
        setShown(scramble(text, revealed));
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, text, hold, duration, reduce]);

  return (
    <span className={`relative inline-block whitespace-pre ${className ?? ""}`}>
      <span className="opacity-0">{text}</span>
      <span aria-hidden className="absolute inset-0">
        {shown}
      </span>
    </span>
  );
}
