"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OrbCanvas } from "@/components/orb/OrbCanvas";

const EASE = [0.22, 1, 0.36, 1] as const;

/* OrbCanvas crashes if it initialises against a 0×0 mount (its first WebGL
   frame draws a zero-size canvas). So we only mount it once the container has a
   real size — which also means the hidden (display:none) breakpoint layout
   never spins up a second, invisible orb. */
function ModalOrb({ className }: { className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) setReady(true);
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    check();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {ready && <OrbCanvas state="idle" />}
    </div>
  );
}

/* A scattered photo, positioned as a percentage of the panel to match the Figma
   "side quest" layout. Each PNG carries its own edge treatment baked in on a
   transparent background — a torn-paper cutout for hobbies/family, a torn white
   deckle frame (rotation included) for travels — so they all drop straight in
   through the same layer. `pos` places the box; travels frames add a -50%
   translate so `pos` reads as the box centre. */
type Photo = { src: string; alt: string; pos: string };

/* Content of a single "side quest" — the pieces that change between the panels
   (label, blurb, and scatter photos). The layout stays identical. */
export type SideQuest = {
  /* Header label, e.g. "[ side quest 1/3  - my hobbies ]". */
  label: string;
  /* Accessible name for the dialog. */
  ariaLabel: string;
  blurb: string;
  photos: Photo[];
};

/* Side quest 1 — my hobbies (Figma node 888:5191). */
export const HOBBIES: SideQuest = {
  label: "[ side quest 1/3  - my hobbies ]",
  ariaLabel: "Side quest — my hobbies",
  blurb:
    "Besides work, I like to spend my time actively — hiking, skiing, volleyball, padel, and some woodworking trials in my backyard :)",
  photos: [
    { src: "/sidequest/waterfall.png", alt: "Standing by a waterfall", pos: "left-[45.1%] top-[13.2%] w-[20%]" },
    { src: "/sidequest/woodworking.png", alt: "Woodworking in the backyard", pos: "left-[68.7%] top-[11.9%] w-[21%]" },
    { src: "/sidequest/volleyball.png", alt: "With the volleyball team", pos: "left-[43.3%] top-[47.4%] w-[20%]" },
    { src: "/sidequest/snow.png", alt: "Out in the snow", pos: "left-[66.9%] top-[59%] w-[19%]" },
  ],
};

/* Side quest 2 — my family (Figma node 891:5191). Same layout, new copy/photos. */
export const FAMILY: SideQuest = {
  label: "[ side quest 2/3  - my family ]",
  ariaLabel: "Side quest — my family",
  blurb:
    "This is me, my wife Anastasia and our dog Sydney, also my mom Natalia and Anastasia’s parents - Volodymyr and Alla",
  photos: [
    { src: "/sidequest2/helmets.png", alt: "Anastasia and me", pos: "left-[45.1%] top-[13.2%] w-[20%]" },
    { src: "/sidequest2/sydney.png", alt: "Our dog Sydney", pos: "left-[68.7%] top-[11.9%] w-[21%]" },
    { src: "/sidequest2/family.png", alt: "My family together", pos: "left-[43.3%] top-[47.4%] w-[20%]" },
    { src: "/sidequest2/portrait.png", alt: "Me and Sydney", pos: "left-[66.9%] top-[59%] w-[19%]" },
  ],
};

/* Side quest 3 — travels (Figma node 907:5568). Same orb + blurb layout; the
   scatter is torn-white-deckle travel photos (each PNG has its frame + tilt baked
   in). `pos` here is the photo's centre, so each carries a -50% translate. */
export const TRAVELS: SideQuest = {
  label: "[ side quest 3/3  - travels ]",
  ariaLabel: "Side quest — travels",
  blurb:
    "One of the best source of energy and inspiration is to observe the world by my own, so i like to travel a lot and in different ways",
  photos: [
    { src: "/sidequest3/osaka.png", alt: "Neon billboards in Osaka", pos: "left-[54.9%] top-[29.7%] w-[20.8%] -translate-x-1/2 -translate-y-1/2" },
    { src: "/sidequest3/singapore.png", alt: "Marina Bay Sands in Singapore", pos: "left-[78.3%] top-[34.3%] w-[21.9%] -translate-x-1/2 -translate-y-1/2" },
    { src: "/sidequest3/boat.png", alt: "On a ferry crossing", pos: "left-[53.2%] top-[68.1%] w-[20.9%] -translate-x-1/2 -translate-y-1/2" },
    { src: "/sidequest3/norway.png", alt: "A fjord landscape in Norway", pos: "left-[75.5%] top-[71.1%] w-[19.7%] -translate-x-1/2 -translate-y-1/2" },
  ],
};

/* Blinking cursor — matches the hero's typing effect (see Experience.tsx). */
function Caret() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-sol-dim align-middle" />
  );
}

/* The blurb, typed out. A full invisible copy reserves the final height and
   line wrapping so the surrounding layout never shifts as characters appear. */
function TypingBlurb({
  blurb,
  shown,
  typing,
  className,
}: {
  blurb: string;
  shown: string;
  typing: boolean;
  className: string;
}) {
  return (
    <div className={className}>
      <span className="opacity-0">{blurb}</span>
      <span aria-hidden className="absolute inset-0">
        {shown}
        {typing && <Caret />}
      </span>
    </div>
  );
}

export default function SideQuestModal({
  open,
  onClose,
  quest,
}: {
  open: boolean;
  onClose: () => void;
  quest: SideQuest;
}) {
  const reduce = useReducedMotion();
  const blurb = quest.blurb;

  // Type the blurb out each time the modal opens (skip if reduced motion).
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (!open) {
      setTyped(0);
      return;
    }
    if (reduce) {
      setTyped(blurb.length);
      return;
    }
    setTyped(0);
    let raf = 0;
    let startTs = 0;
    const delay = 260; // let the panel settle in before typing starts
    const perChar = 20;
    const step = (now: number) => {
      if (!startTs) startTs = now;
      const n = Math.max(
        0,
        Math.min(blurb.length, Math.floor((now - startTs - delay) / perChar)),
      );
      setTyped(n);
      if (n < blurb.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open, reduce, blurb]);

  const shown = blurb.slice(0, typed);
  const typing = !reduce && open && typed < blurb.length;

  // Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={quest.ariaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          {/* Click-catcher backdrop — leaves the page sharp behind the panel. */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
          />

          {/* Panel — translucent surface with a background blur, per the design
              (flips with the theme via the --panel token). */}
          <motion.div
            className="relative flex h-full max-h-[820px] w-full max-w-[1440px] flex-col overflow-hidden rounded-3xl bg-panel/50 font-sans text-sol shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
          >
            {/* Header row (shared across layouts) */}
            <p className="absolute left-6 top-5 z-10 whitespace-pre text-[16px] font-medium text-sol sm:left-8">
              {quest.label}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center transition-opacity hover:opacity-70 sm:right-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sidequest/close.svg" alt="" className="h-7 w-7" aria-hidden />
            </button>

            {/* Desktop scatter — faithful absolute layout. */}
            <div className="relative hidden flex-1 lg:block">
              {/* Live orb — same look/behaviour as the rest of the site (idle). */}
              <ModalOrb className="absolute left-[2.5%] top-[7%] aspect-square w-[34%]" />
              <TypingBlurb
                blurb={blurb}
                shown={shown}
                typing={typing}
                className="absolute left-[20%] top-[62%] w-[27%] -translate-x-1/2 text-center text-[22px] leading-[32px] text-sol-dim"
              />
              {quest.photos.map((p) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={p.src}
                  src={p.src}
                  alt={p.alt}
                  className={`pointer-events-none absolute h-auto drop-shadow-[0_12px_22px_rgba(0,0,0,0.12)] ${p.pos}`}
                />
              ))}
            </div>

            {/* Mobile / tablet — stacked and scrollable. */}
            <div className="flex flex-1 flex-col items-center gap-8 overflow-y-auto px-6 pb-10 pt-20 lg:hidden">
              <ModalOrb className="aspect-square w-52 max-w-[60%]" />
              <TypingBlurb
                blurb={blurb}
                shown={shown}
                typing={typing}
                className="relative w-full max-w-md text-center text-[18px] leading-[28px] text-sol-dim"
              />
              <div className="grid w-full max-w-md grid-cols-2 place-items-center gap-3">
                {quest.photos.map((p) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={p.src}
                    src={p.src}
                    alt={p.alt}
                    className="h-auto w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.12)]"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
