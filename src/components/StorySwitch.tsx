"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SHELL } from "@/components/SiteHeader";
import { useSound } from "@/components/sound/SoundProvider";
import { storyCue } from "@/components/sound/sound-events";

/* Short-read / full-story switch for the case studies. Pages open as the short
   version (hero · metrics · role · what was done) — globals.css hides every
   `[data-detail]` section until this sets `data-full` on <html>, which in turn
   folds away the short-only `[data-short]` summary.

   It sits in the story itself, at the fold: right where the short version's
   summary ends and the detail sections would begin, laid out on the same
   two-column grid as the rows around it. So a reader meets it exactly when
   they've had the headline and are deciding whether to go deeper — and the
   detail opens directly beneath it. */

type Mode = "short" | "full";

const WPM = 220;
const minutes = (words: number) => Math.max(1, Math.round(words / WPM));
const words = (el: Element) => (el.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;

export function StorySwitch() {
  const reduce = useReducedMotion();
  const { play } = useSound();
  const [mode, setMode] = useState<Mode>("short");
  // Read times, measured from the page itself so they stay honest per study.
  const [times, setTimes] = useState<{ short: number; full: number } | null>(null);
  const rowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = rowRef.current?.closest("main");
    if (!main) return;
    // Count the story only — stop at the "Other projects" list (the first
    // section holding case cards) so it and the contact block don't pad it.
    // Shared sections count for both; the short summary only for the short
    // read, the detail sections only for the full one.
    let shared = 0;
    let summary = 0;
    let detail = 0;
    for (const el of main.querySelectorAll(":scope > section")) {
      if (el.querySelector("[data-case]")) break;
      if (el === rowRef.current) continue;
      if (el.hasAttribute("data-detail")) detail += words(el);
      else if (el.hasAttribute("data-short")) summary += words(el);
      else shared += words(el);
    }
    setTimes({ short: minutes(shared + summary), full: minutes(shared + detail) });
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (mode === "full") el.dataset.full = "";
    else delete el.dataset.full;
    return () => {
      delete el.dataset.full;
    };
  }, [mode]);

  // The detail sections' images are lazy and reserve no height, so the ones
  // above a jump target load *after* we scroll and push it down the page. Keep
  // the target under the header while the page settles; let go as soon as the
  // reader scrolls themselves.
  const pinWhileLoading = (el: HTMLElement) => {
    const keep = () =>
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 104, behavior: "instant" });
    // Skip the observer's initial callback so the smooth scroll isn't cut short.
    let primed = false;
    const ro = new ResizeObserver(() => {
      if (primed) keep();
      primed = true;
    });
    const release = () => {
      ro.disconnect();
      window.clearTimeout(t);
      removeEventListener("wheel", release);
      removeEventListener("touchstart", release);
      removeEventListener("keydown", release);
    };
    const t = window.setTimeout(release, 2500);
    ro.observe(document.body);
    addEventListener("wheel", release, { passive: true });
    addEventListener("touchstart", release, { passive: true });
    addEventListener("keydown", release);
  };

  // `target`: id of a full-story section to land on (from a summary card).
  const choose = (next: Mode, target?: string) => {
    if (next === mode && !target) return;
    // Only when the read length actually flips: expand reveals the full story,
    // collapse folds back to the short read. A same-mode jump to a section
    // (target) is navigation, not a reveal, so it stays silent here.
    if (next !== mode) play(storyCue(next));
    const row = rowRef.current;
    const before = row?.getBoundingClientRect().top ?? 0;
    const apply = () => {
      flushSync(() => setMode(next));
      // Apply the attribute now (the effect mirrors it) so the sections it
      // reveals have real geometry before we measure where to scroll.
      document.documentElement.toggleAttribute("data-full", next === "full");
      if (!row) return;
      if (next === "full") {
        // Land on the section the reader picked, or else bring the switch up
        // under the header so the story that just opened below it is next.
        const el = (target && document.getElementById(target)) || row;
        const top = el.getBoundingClientRect().top + window.scrollY - 104;
        window.scrollTo({ top, behavior: reduce ? "instant" : "smooth" });
        if (el !== row) pinWhileLoading(el);
      } else {
        // Collapsing removes content above wherever the reader was — keep the
        // switch pinned at the same spot on screen instead of jumping.
        window.scrollBy({ top: row.getBoundingClientRect().top - before, behavior: "instant" });
      }
    };
    if (!reduce && document.startViewTransition) document.startViewTransition(apply);
    else apply();
  };

  // "What was done" cards (CaseSummary) are anchors into the full story.
  const chooseRef = useRef(choose);
  chooseRef.current = choose;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a[data-story-target]") : null;
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      chooseRef.current("full", a.getAttribute("href")?.slice(1));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const full = mode === "full";

  return (
    <section ref={rowRef} className="pb-[100px]">
      <div className={SHELL}>
        <div className="grid grid-cols-1 gap-x-16 gap-y-8 rounded-[24px] border border-sol/15 p-6 sm:p-12 lg:grid-cols-2 lg:items-center">
          <h2 className="text-[clamp(22px,2.4vw,28px)] font-light leading-[1.2] text-sol">
            {full ? "The whole process, start to finish" : "Want the thinking behind the numbers?"}
          </h2>

          <div className="flex">
            <div
              role="radiogroup"
              aria-label="Case study length"
              className="relative grid w-full max-w-[440px] grid-cols-2 rounded-full border border-sol/15 bg-paper p-1"
            >
              {(["short", "full"] as const).map((m) => {
                const on = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(m)}
                    className={`relative flex flex-col items-center justify-center whitespace-nowrap rounded-full px-3 py-2.5 text-[16px] transition-colors duration-300 sm:flex-row sm:gap-2 sm:px-5 sm:py-3 ${
                      on ? "text-paper" : "text-sol hover:text-accent"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="story-switch-thumb"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-sol"
                        transition={
                          reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                        }
                      />
                    )}
                    <span className="relative">{m === "short" ? "Short read" : "Full story"}</span>
                    {times && (
                      <span className={`relative text-[14px] ${on ? "text-paper/60" : "text-sol-dim"}`}>
                        <span className="hidden sm:inline">· </span>
                        {times[m]} min
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StorySwitch;
