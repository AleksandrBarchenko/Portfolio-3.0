"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { useRobotVoice, useSound } from "@/components/sound/SoundProvider";
import { SoundBars, useSoundState } from "@/components/sound/SoundToggle";
import type { OrbState } from "@/types/orb";
import { SHELL } from "@/components/SiteHeader";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import VideoModal from "@/components/VideoModal";
import { ContactSection } from "@/components/ContactSection";
import { DecryptText } from "@/components/DecryptText";
import { AsciiFlock } from "@/components/AsciiFlock";
import { INTRO_SEEN_KEY, LAST_CASE_KEY } from "@/components/nav-memory";
import { useActiveSection, PAGE_BG, BG_TRANSITION } from "@/components/ActiveSection";
import { useAvatarMode } from "@/components/AvatarMode";

// Fixed line breaks so each line reads in exactly three centred lines. The
// typing effect reveals the "\n"s as it goes (rendered with whitespace-pre-line).
const GREETING =
  "Hey, nice to meet you\nhere. I'm Alex Barchenko -\nDigital Product Designer";
const CASES =
  "Have no time to explore?\nGot you! Just watch case\nstudies overview.";

/* Right-edge pager for the snapped pages — where you are, and a jump to any. */
const PAGER: { id: Page; label: string }[] = [
  { id: "hero", label: "hello" },
  { id: "video", label: "overview" },
  { id: "projects", label: "work" },
  { id: "skills", label: "skills" },
  { id: "cta", label: "contact" },
];

/* Client logos, laid out 3 across × 2 down. Each has a light- and dark-mode
   lockup; the pair is swapped by the `dark:` variant (driven by data-theme). */
const LOGOS: Record<string, { light: string; dark: string }> = {
  google: { light: "/logos/google-light.svg", dark: "/logos/google-dark.svg" },
  vodafone: { light: "/logos/vodafone-light.svg", dark: "/logos/vodafone-dark.svg" },
  hilton: { light: "/logos/hilton-light.svg", dark: "/logos/hilton-dark.svg" },
  elio: { light: "/logos/elio-light.svg", dark: "/logos/elio-dark.svg" },
  underarmour: { light: "/logos/underarmour-light.svg", dark: "/logos/underarmour-dark.svg" },
  cabei: { light: "/logos/cabei-light.svg", dark: "/logos/cabei-dark.svg" },
};
const LOGO_GRID = ["google", "vodafone", "hilton", "elio", "underarmour", "cabei"];

type Page = "hero" | "video" | "projects" | "skills" | "cta";
// Symmetric ease-in-out cubic — accelerates and decelerates gently at both
// ends so moves feel smooth rather than snapping to a fast start.
const EASE = [0.65, 0, 0.35, 1] as const;

const SPEECH_W = 380;

// Intro glide to the left edge: normal pace, and the hurried pace used once the
// visitor tries to scroll (or navigates) before the intro has finished.
const GLIDE = 1.15;
const RUSH_GLIDE = 0.45;
// After a hurried intro, the scroll lock only releases once wheel/key input has
// been quiet this long — so the trackpad momentum of the gesture that hurried
// the intro doesn't also fling the page. The *next* scroll moves the page.
const INPUT_QUIET_MS = 220;
const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"]);

// TV-head-only: the still shown inside the screen for the video section, the
// resting three-quarter turn on the hero, and how much the head grows when it
// centres for the video page.
const VIDEO_POSTER = "/video/frame.png";
// 0 so the head's resting turn is driven entirely by the per-state `yaw` in
// DEFAULT_TV_SETTINGS (the tuning lab's single source of truth), not layered on.
const HERO_YAW = 0;
// The video section features the head large — 3× the size it is on the hero — so
// it dominates as the "watch the overview" moment. This is the single knob for
// the video head's size (videoSpeechXY moves the caption to clear it).
const VIDEO_SCALE = 1.2;

// Case-studies overview shown in the video modal (opened by clicking the TV
// head's screen, or the standalone play button in orb mode).
const VIDEO_ID = "wAmmrrn-voc";
const VIDEO_START = 1;

function Caret() {
  return (
    <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-sol-dim align-middle" />
  );
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1440, h: 800, desktop: true });
  useEffect(() => {
    const on = () =>
      setVp({ w: innerWidth, h: innerHeight, desktop: innerWidth >= 1024 });
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  return vp;
}

// Head/orb square size. Capped at 460 (reached ~1150px wide, so it's 100% by
// 1400). In TV-head mode it keeps growing proportionally with the viewport past
// 1400 so it doesn't look lost on large screens; the orb stays capped.
function headSize(vw: number, face: boolean) {
  const base = Math.min(Math.round(vw * 0.4), 460);
  return face && vw > 1400 ? Math.round(460 * (vw / 1400)) : base;
}
// Pixels the head has grown beyond its 460 cap. This surplus is absorbed by the
// empty left margin (the "side space") — the head slides left as it grows so its
// right edge stays put and never rides over the copy sitting to its right.
function headGrow(vw: number, face: boolean) {
  return headSize(vw, face) - Math.min(Math.round(vw * 0.4), 460);
}

function geom(vw: number, vh: number, face = false) {
  const orbW = headSize(vw, face);
  const grow = headGrow(vw, face);
  const shellPad = vw >= 1024 ? 56 : vw >= 640 ? 40 : 24;
  const shellLeft = Math.max(shellPad, (vw - 1240) / 2 + shellPad);
  // Vertically centre the orb+caption block: the square canvas is padded with a
  // lot of transparent space (the visible orb spans ~0.30–0.74 of the box) and
  // the caption hangs below, so the orb's top-left must sit above the viewport
  // middle by half the visible block's height.
  const blockY = vh / 2 - orbW * 0.56 - 48;
  return {
    orbW,
    // Anchor the head's right edge where the 460 cap put it and let any surplus
    // grow left into the margin, so the enlarged head clears the heading to its
    // right instead of riding over it (see the hero overlap this fixes).
    leftX: shellLeft - 24 - grow,
    centerX: vw / 2 - orbW / 2,
    centerY: blockY,
    midY: blockY,
    ctaY: blockY,
    // Video page (face mode): identical framing to the hero-centred intro — same
    // box position and (via videoSpeechXY) the same caption offset — so the head
    // and its caption sit exactly where they do on the hero, no state-to-state
    // margin drift now that the head is the same size in both (VIDEO_SCALE = 1).
    videoX: vw / 2 - orbW / 2,
    videoY: blockY,
  };
}

/* Caption centred under the video-page head. The head is scaled up (VIDEO_SCALE)
   about the box centre, so its visible bottom drops well below the box — the
   caption sits past that so the head→caption gap still reads like the hero's. */
function videoSpeechXY(g: ReturnType<typeof geom>) {
  return { x: g.videoX + g.orbW / 2 - SPEECH_W / 2, y: g.videoY + g.orbW * 1.0 };
}

/* Speech box is always centred UNDER the orb (text stays centered even after the
   orb glides left). Returns the box's top-left x and its y. The 0.82 factor sits
   the caption close under the orb's visible bottom (~0.74 of the box). */
function speechXY(g: ReturnType<typeof geom>, orbX: number, orbY: number) {
  return { x: orbX + g.orbW / 2 - SPEECH_W / 2, y: orbY + g.orbW * 0.93 };
}

/* A hard reload of the home page is a fresh start, not a return visit: forget
   the session's "intro seen" / last-case memory and ignore any section hash, so
   the intro plays again from the centred head. Decided once per document load
   at module evaluation (so React Strict Mode's double effects agree), only when
   the reloaded page IS home, and cleared once that intro has played — later
   in-app returns (e.g. "back to work" → /#projects) skip as usual. */
let reloadedHome = false;
if (typeof window !== "undefined" && location.pathname === "/") {
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  reloadedHome = nav?.type === "reload";
  if (reloadedHome) {
    sessionStorage.removeItem(INTRO_SEEN_KEY);
    sessionStorage.removeItem(LAST_CASE_KEY);
  }
}

export default function Experience() {
  const reduce = useReducedMotion();
  const { w: vw, h: vh, desktop } = useViewport();
  // The TV head has a screen the video can play inside; the orb does not. In
  // face mode the video section centres the head and shows the still in its
  // screen — in orb mode we fall back to the standalone torn-photo frame.
  const { mode } = useAvatarMode();
  const face = mode === "face";

  const [phase, setPhase] = useState<"intro" | "ready">("intro");
  // The case-studies video modal, opened by clicking the TV head's screen.
  const [videoOpen, setVideoOpen] = useState(false);
  // Single shared source of truth for the active section (see ActiveSection) —
  // the same value drives the backdrop here and the sticky header, so their
  // colours can never fall out of sync during a transition.
  const active = useActiveSection();
  // Scroll stays locked through the intro: the orb greets from the viewport
  // centre, then glides to the left edge. Only once that glide finishes does
  // scrolling become available, so the user can't jump ahead of the script.
  // Scrolling (or navigating) during the intro doesn't just bounce off the lock:
  // it fast-forwards the rest of the script instead (see `rushIntro`).
  const [scrollLocked, setScrollLocked] = useState(true);
  // Set when the intro glide has landed; the lock then releases as soon as the
  // visitor's scroll input goes quiet (immediately if they never scrolled).
  const [glideDone, setGlideDone] = useState(false);
  const rushed = useRef(false);
  const lastInput = useRef(0);
  // The hero's right block (heading + logos) reveals off its own flag rather
  // than `scrollLocked`, so it can start fading in slightly before the head has
  // fully landed — the two states then read as one continuous motion instead of
  // a lock-step hand-off with a perceptible gap.
  const [heroContentIn, setHeroContentIn] = useState(false);

  const [line, setLine] = useState(GREETING);
  const [typed, setTyped] = useState(0);
  const [speaking, setSpeaking] = useState(true);
  const spoken = useRef({ video: false, cta: false });
  // Browsers keep audio silent until a click, so the greeting always types
  // mute on load. The intro offers a hint; clicking (anywhere) turns sound on and says
  // the greeting again (`take` restarts the typing + voice) — out loud.
  const [take, setTake] = useState(0);
  const [heard, setHeard] = useState(false);
  const { enabled: soundOn, setEnabled: setSoundOn } = useSound();
  const hearGreeting = () => {
    if (!soundOn) setSoundOn(true);
    setHeard(true);
    setLine(GREETING);
    setTake((n) => n + 1);
    setSpeaking(true);
  };
  const soundHint = phase === "intro" && !heard && !reduce;
  const soundState = useSoundState();

  // While the hint is up, a click anywhere on the page counts as "yes, sound" —
  // except on links and controls (nav, theme/sound toggles, the hint itself),
  // which do their own thing.
  useEffect(() => {
    if (!soundHint) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("a, button, input, textarea, select, label, [role='switch']")) return;
      hearGreeting();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundHint, soundOn]);

  const orb = useAnimationControls();
  const speech = useAnimationControls();
  // Scroll-linked exit for the fixed orb overlay. The video frame lives in
  // normal flow, so it rides the page scroll 1:1 as you leave the video page.
  // The orb is `fixed`, so to leave "together" with the frame it must translate
  // up by the exact number of pixels the page has scrolled past the video
  // section — same motion, same speed, driven by the same scroll.
  const exitY = useMotionValue(0);
  const exitOpacity = useMotionValue(1);
  const prev = useRef<{ phase: string; active: Page }>({ phase: "", active: "hero" });
  const vp = useRef({ w: vw, h: vh });
  vp.current = { w: vw, h: vh };

  const sectionRefs = useRef<Record<Page, HTMLElement | null>>({
    hero: null,
    video: null,
    projects: null,
    skills: null,
    cta: null,
  });

  // Returning visitors skip the script. Once the greeting has played this
  // session — or when they arrive on a deep link / back from a case study —
  // replaying it (and locking scroll for it) is friction, not charm: jump
  // straight to the landed hero state and, below, to where they left off.
  // Layout effect so the skip lands before the first paint of the intro.
  const skipIntro = useRef(false);
  const returnTo = useRef<string | null>(null);
  useLayoutEffect(() => {
    const lastCase = sessionStorage.getItem(LAST_CASE_KEY);
    if (reloadedHome && location.hash) {
      // Drop the stale section hash so the URL matches the hero we're showing.
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    const hash = !reloadedHome && location.hash.length > 1 ? location.hash : null;
    if (!sessionStorage.getItem(INTRO_SEEN_KEY) && !hash && !lastCase) return;
    skipIntro.current = true;
    rushed.current = true;
    returnTo.current = lastCase ? `[data-case="${CSS.escape(lastCase)}"]` : hash;
    setSpeaking(false);
    setTyped(GREETING.length);
    setHeroContentIn(true);
    setPhase("ready");
    setScrollLocked(false);
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    reloadedHome = false;
  }, [phase]);

  // Reload safety. This is a scripted top-down narrative and the intro pins the
  // fixed orb to the viewport centre for the greeting. If the browser restores a
  // deep scroll position on reload, that centred intro orb gets stranded over a
  // later section (e.g. Skills) before the scroll-linked fade can catch it. Force
  // manual restoration and start at the hero so the orb only ever appears where
  // the script places it.
  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      const prevRestoration = history.scrollRestoration;
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      return () => {
        history.scrollRestoration = prevRestoration;
      };
    }
  }, []);

  // Hold scroll while locked. overflow:hidden on <html> blocks wheel, touch and
  // keyboard scrolling without disturbing the fixed overlay or the snap setup.
  useEffect(() => {
    if (!scrollLocked) return;
    const el = document.documentElement;
    const prevOverflow = el.style.overflow;
    el.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      el.style.overflow = prevOverflow;
    };
  }, [scrollLocked]);

  // Skip straight to the end of the greeting. With `phase` → "ready" the
  // orchestration below runs the (now hurried) glide to the left edge.
  const finishGreeting = () => {
    rushed.current = true;
    setSpeaking(false);
    setTyped(GREETING.length);
    setPhase("ready");
  };

  // Scroll attempts during the intro fast-forward it rather than being ignored.
  // In-page nav links (e.g. "work") and focus jumps must never leave the page
  // stuck behind the lock, so those finish the intro and release immediately.
  useEffect(() => {
    if (!desktop || !scrollLocked) return;
    // overflow:hidden alone doesn't stop Chrome's snap-aware key scrolling, so
    // swallow the input too — this gesture hurries the intro, it doesn't scroll.
    const rushIntro = (e: Event) => {
      e.preventDefault();
      lastInput.current = performance.now();
      if (rushed.current) return;
      if (phase === "intro") {
        finishGreeting();
        return;
      }
      // Glide already under way — hurry it the rest of the way.
      rushed.current = true;
      const g = geom(vp.current.w, vp.current.h, face);
      setHeroContentIn(true);
      speech.start(
        { ...speechXY(g, g.leftX, g.midY), opacity: 1 },
        { duration: RUSH_GLIDE, ease: EASE },
      );
      orb
        .start({ x: g.leftX, y: g.midY, scale: 1, opacity: 1 }, { duration: RUSH_GLIDE, ease: EASE })
        .then(() => setGlideDone(true));
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, button, [contenteditable]")) return;
      if (SCROLL_KEYS.has(e.key)) rushIntro(e);
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest('a[href^="#"]')) return;
      if (phase === "intro") finishGreeting();
      setHeroContentIn(true);
      setScrollLocked(false);
    };
    window.addEventListener("wheel", rushIntro, { passive: false });
    window.addEventListener("touchmove", rushIntro, { passive: false });
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("wheel", rushIntro);
      window.removeEventListener("touchmove", rushIntro);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, scrollLocked, phase, face, orb, speech]);

  // Safety net: if the page moves off the hero while still locked (any
  // programmatic scroll the click handler didn't catch), never trap the visitor.
  useEffect(() => {
    if (!scrollLocked || active === "hero") return;
    if (phase === "intro") finishGreeting();
    setHeroContentIn(true);
    setScrollLocked(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, scrollLocked]);

  // Release the lock once the glide has landed and scroll input has gone quiet.
  useEffect(() => {
    if (!glideDone || !scrollLocked) return;
    let t = 0;
    const check = () => {
      const idle = performance.now() - lastInput.current;
      if (idle >= INPUT_QUIET_MS) setScrollLocked(false);
      else t = window.setTimeout(check, INPUT_QUIET_MS - idle);
    };
    check();
    return () => window.clearTimeout(t);
  }, [glideDone, scrollLocked]);

  // The intro glide is desktop-only (mobile shows a per-section orb), so there's
  // nothing to wait for on mobile — release the lock immediately there.
  useEffect(() => {
    if (!desktop) {
      setScrollLocked(false);
      setHeroContentIn(true);
    }
  }, [desktop]);

  // Robo-babble along with the typing (silent under reduced motion, which
  // skips the typing).
  useRobotVoice(speaking && !reduce, line, take);

  // Type the current line while `speaking`.
  useEffect(() => {
    if (!speaking) return;
    if (reduce) {
      setTyped(line.length);
      setSpeaking(false);
      return;
    }
    setTyped(0);
    let raf = 0;
    const start = performance.now();
    const perChar = 30;
    const step = (now: number) => {
      const n = Math.min(line.length, Math.floor((now - start) / perChar));
      setTyped(n);
      if (n < line.length) raf = requestAnimationFrame(step);
      else setSpeaking(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speaking, line, reduce, take]);

  // Intro → reveal page 1 once the greeting is spoken.
  useEffect(() => {
    if (phase !== "intro" || speaking) return;
    const t = window.setTimeout(() => setPhase("ready"), reduce ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [phase, speaking, reduce]);

  // One scroll = one page for the full-viewport pages, but let the tall projects
  // list scroll freely (mandatory snap there feels sticky/card-by-card).
  useEffect(() => {
    const el = document.documentElement;
    el.style.scrollSnapType =
      reduce || active === "projects" ? "none" : "y mandatory";
    return () => {
      el.style.scrollSnapType = "";
    };
  }, [active, reduce]);

  // Glue the fixed orb + text to the page scroll as you leave the video page,
  // so they lift to the top in lockstep with the (in-flow) video frame instead
  // of doing a separate timed hop. `past` = pixels scrolled below the video
  // section's snapped position; 0 while hero/video are the active page.
  const syncExit = () => {
    const videoEl = sectionRefs.current.video;
    if (!videoEl) return;
    const past = Math.max(0, window.scrollY - videoEl.offsetTop);
    exitY.set(-past);
    exitOpacity.set(Math.max(0, 1 - past / (window.innerHeight * 0.5)));
  };
  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncExit);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, exitY, exitOpacity]);

  // Land a returning visitor where they left off: on the case card they opened
  // (settling it in so the eye finds it), or on the linked section. Runs once
  // the skip has released the scroll lock; synchronous, and it syncs the orb's
  // scroll-linked exit in the same frame so the orb never flashes over the list.
  useEffect(() => {
    const target = returnTo.current;
    if (!skipIntro.current || scrollLocked || !target) return;
    returnTo.current = null;
    sessionStorage.removeItem(LAST_CASE_KEY);
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;
    const isCard = el.hasAttribute("data-case");
    if (isCard) {
      // The card sits mid-way down the free-scrolling list — don't let
      // mandatory snap yank it to a page edge (the snap effect restores it).
      document.documentElement.style.scrollSnapType = "none";
      if (el.closest("[data-board]")) {
        // Side-scrolling works board: it knows how far down the page slides
        // this card to the centre, so let it do the scrolling.
        el.dispatchEvent(new Event("board:focus", { bubbles: true }));
      } else {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY - Math.max(96, (window.innerHeight - r.height) / 2);
        window.scrollTo({ top, behavior: "instant" });
      }
      if (!reduce)
        el.animate(
          [
            { opacity: 0.3, transform: "translateY(24px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
    } else {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }
    syncExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollLocked]);

  // Orchestrate the orb + speech for the active page. Only reacts to page/phase
  // changes (geometry is read from a ref so a resize doesn't replay the anim).
  useEffect(() => {
    if (!desktop) return;
    const g = geom(vp.current.w, vp.current.h, face);
    const fromIntro = prev.current.phase === "intro";
    prev.current = { phase, active };
    let cancelled = false;

    const run = async () => {
      if (phase === "intro") {
        orb.set({ x: g.centerX, y: g.centerY, scale: 1, opacity: 1 });
        speech.set({ ...speechXY(g, g.centerX, g.centerY), opacity: 1 });
        return;
      }
      if (fromIntro && skipIntro.current) {
        // Returning visitor: no greeting, no glide — the hero is already landed.
        orb.set({ x: g.leftX, y: g.midY, scale: 1, opacity: 1 });
        speech.set({ ...speechXY(g, g.leftX, g.midY), opacity: 1 });
        setGlideDone(true);
        return;
      }
      if (active === "hero") {
        // Hurried when the visitor scrolled/navigated before the intro ended.
        const dur = fromIntro && rushed.current ? RUSH_GLIDE : GLIDE;
        const glide = orb.start(
          { x: g.leftX, y: g.midY, scale: 1, opacity: 1 },
          { duration: dur, ease: EASE },
        );
        const pos = speechXY(g, g.leftX, g.midY);
        if (fromIntro) {
          // Keep the greeting; just glide it (centred) under the moved orb, then
          // release the scroll lock once the orb has settled at the left edge.
          speech.start({ ...pos, opacity: 1 }, { duration: dur, ease: EASE });
          // Start revealing the right block a touch before the glide ends — the
          // head is already most of the way left, so the two motions overlap
          // and read as one beat instead of a gapped hand-off.
          const revealT = window.setTimeout(() => {
            if (!cancelled) setHeroContentIn(true);
          }, dur * 700);
          await glide;
          if (cancelled) {
            window.clearTimeout(revealT);
            return;
          }
          setHeroContentIn(true);
          setGlideDone(true);
        } else {
          setHeroContentIn(true);
          await speech.start({ opacity: 0 }, { duration: 0.4, ease: EASE });
          if (cancelled) return;
          setLine(GREETING);
          setSpeaking(false);
          setTyped(GREETING.length);
          speech.set(pos);
          speech.start({ opacity: 1 }, { duration: 0.4, ease: EASE });
        }
      } else if (active === "video") {
        // Face mode: the head glides to centre and grows, its screen carries the
        // video, and the caption sits centred beneath it. Orb mode: the head
        // stays at the left edge next to the standalone video frame.
        if (face) {
          orb.start(
            { x: g.videoX, y: g.videoY, scale: VIDEO_SCALE, opacity: 1 },
            { duration: 0.95, ease: EASE },
          );
        } else {
          orb.start({ x: g.leftX, y: g.midY, scale: 1, opacity: 1 }, { duration: 0.85, ease: EASE });
        }
        // old text fades out, new text types in
        await speech.start({ opacity: 0 }, { duration: 0.4, ease: EASE });
        if (cancelled) return;
        speech.set(face ? videoSpeechXY(g) : speechXY(g, g.leftX, g.midY));
        const first = !spoken.current.video;
        spoken.current.video = true;
        setLine(CASES);
        if (first) setSpeaking(true);
        else {
          setSpeaking(false);
          setTyped(CASES.length);
        }
        speech.start({ opacity: 1 }, { duration: 0.35, ease: EASE });
      }
      // `projects` is intentionally NOT animated here. The orb + caption keep
      // their video-page position (leftX / midY) and are carried up by the
      // scroll-linked `exitY` / `exitOpacity` on the overlay wrapper, so they
      // leave the top in perfect step with the in-flow video frame.
      // The `cta` page's orb + speech are NOT animated here — they are
      // scroll-linked (glued to the contact section) by the effect below, so the
      // orb rises from the bottom on scroll-down and sinks back on scroll-up.
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [phase, active, desktop, face, orb, speech]);

  // Reposition instantly on resize (no replay of the transition animation).
  useEffect(() => {
    if (!desktop) return;
    const g = geom(vw, vh, face);
    if (phase === "intro") {
      orb.set({ x: g.centerX, y: g.centerY, scale: 1, opacity: 1 });
      speech.set(speechXY(g, g.centerX, g.centerY));
    } else if (active === "video" && face) {
      orb.set({ x: g.videoX, y: g.videoY, scale: VIDEO_SCALE, opacity: 1 });
      speech.set(videoSpeechXY(g));
    } else if (active === "hero" || active === "video") {
      orb.set({ x: g.leftX, y: g.midY, scale: 1, opacity: 1 });
      speech.set(speechXY(g, g.leftX, g.midY));
    }
    // `cta` has its own in-layout orb (see ContactSection) — the overlay orb stays
    // hidden there, so nothing to reposition on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vw, vh]);

  const orbState: OrbState = speaking ? "replying" : "idle";
  const flockOn = active === "hero" || active === "video" || active === "cta";
  const displayText = speaking ? line.slice(0, typed) : line;
  const g = geom(vw, vh, face);

  return (
    <>
      {/* Full-page backdrop — a single layer whose colour eases between the
          per-section values as you scroll, so the whole background changes. */}
      <div
        aria-hidden
        className={`fixed inset-0 -z-10 ${BG_TRANSITION}`}
        style={{ backgroundColor: PAGE_BG[active] }}
      />

      {/* Cursor-following ASCII flock: ONE fixed layer just above the page
          backdrop and below every page, so the same swarm carries on from the
          hero into the video page instead of each page having its own. It
          fades out (and pauses) over the work and skills pages, and picks up
          again on the closing contact page. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-[5] transition-opacity duration-700 ease-in-out ${
          flockOn ? "opacity-25" : "opacity-0"
        }`}
      >
        {/* Softened at the top and bottom so the grid melts into the header
            and the viewport edge rather than ending on a hard line. */}
        <AsciiFlock
          running={flockOn}
          className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]"
        />
      </div>

      {desktop && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
          style={{ y: exitY, opacity: exitOpacity }}
        >
          {/* The overlay is pointer-events-none so it never blocks the page. Re-
              enable events on just the head's box while it's the clickable video
              head, so clicking its screen opens the modal. */}
          <motion.div
            className={`absolute left-0 top-0 ${
              face && active === "video" ? "pointer-events-auto" : ""
            }`}
            style={{ width: g.orbW, height: g.orbW }}
            initial={{ opacity: 0 }}
            animate={orb}
          >
            <Avatar
              state={orbState}
              baseYaw={active === "video" ? 0 : HERO_YAW}
              screenMediaSrc={VIDEO_POSTER}
              screenMediaActive={face && active === "video"}
              screenShowPlay={face && active === "video"}
              onScreenActivate={() => setVideoOpen(true)}
            />
          </motion.div>
          <motion.p
            className="absolute left-0 top-0 whitespace-pre-line text-center text-[22px] leading-8 text-sol-dim"
            style={{ width: SPEECH_W }}
            initial={{ opacity: 0 }}
            animate={speech}
          >
            {displayText}
            {speaking && <Caret />}
          </motion.p>
        </motion.div>
      )}

      <AnimatePresence>
        {soundHint && (
          <motion.button
            type="button"
            onClick={hearGreeting}
            className="fixed bottom-10 left-1/2 z-30 flex -translate-x-1/2 w-max max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full px-4 py-2 text-center text-[15px] text-sol-dim transition-colors hover:text-sol"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.5, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            To allow the sound - click anywhere. Control it in the top right corner
            {/* Same equalizer as the header's sound switch, so the visitor
                knows what to look for up there. */}
            <span data-eq={soundState} className="flex">
              <SoundBars state={soundState} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Page 1 — hero */}
      <Page
        id="hero"
        refCb={(el) => (sectionRefs.current.hero = el)}
        mobileOrb={!desktop ? <MobileOrb line={GREETING} state={orbState} /> : null}
      >
        <motion.div
          initial={false}
          animate={{
            // Reveal on intro (rising from below), but only once the head has
            // finished gliding to the left edge — `scrollLocked` releases at that
            // moment (immediately on mobile, where there's no glide) — so the
            // right section never crosses over the still-moving head. Once the
            // user scrolls off the hero, fade the heading + logos out and lift
            // them so the centred video head never sits on top of them.
            opacity:
              phase === "ready" && active === "hero" && heroContentIn ? 1 : 0,
            y:
              phase === "ready" && heroContentIn
                ? active === "hero"
                  ? 0
                  : -40
                : 24,
          }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-col gap-16"
        >
          <h1 className="text-[clamp(38px,4.6vw,68px)] font-light leading-[1.18] tracking-[-0.01em] text-sol">
            Creating{" "}
            <DecryptText
              text="feelings"
              active={phase === "ready" && active === "hero" && heroContentIn}
              className="font-serif font-normal italic text-accent"
            />
            <br />
            and making your
            <br />
            business growth
          </h1>
          <div className="grid max-w-[620px] grid-cols-3 items-center gap-x-6 gap-y-10 lg:-translate-x-10">
            {LOGO_GRID.map((name, i) => (
              <div key={i} className="flex h-[62px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOGOS[name].light}
                  alt={name}
                  className="max-h-[58px] w-auto max-w-[168px] object-contain dark:hidden"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOGOS[name].dark}
                  alt={name}
                  className="hidden max-h-[58px] w-auto max-w-[168px] object-contain dark:block"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </Page>

      {/* Page 2 — video (right-aligned, sized to clear the orb) */}
      <section
        id="video"
        ref={(el) => {
          sectionRefs.current.video = el;
        }}
        className="relative flex min-h-[100svh] snap-start snap-always items-center py-28 lg:py-24"
      >
        <div className={`${SHELL} w-full`}>
          {!desktop && (
            <MobileOrb
              line={CASES}
              state={orbState}
              screenMediaSrc={face ? VIDEO_POSTER : undefined}
              screenMediaActive={face}
              screenShowPlay={face}
              onScreenActivate={() => setVideoOpen(true)}
            />
          )}
          {/* Orb mode has no screen for the video, so it keeps the standalone
              torn-photo frame; face mode plays the video inside the TV head. */}
          {!face && (
            <motion.figure
              initial={false}
              animate={{
                opacity: active === "video" ? 1 : 0,
                y: active === "video" ? 0 : active === "projects" ? -90 : 60,
              }}
              transition={{ duration: 0.85, ease: EASE }}
              className="relative aspect-[823/540] w-full lg:ml-auto lg:w-[min(50vw,700px)]"
            >
              {/* Frame + play share ONE rotation so the play tilts with the frame. */}
              <div className="absolute inset-0 rotate-[-3.73deg]">
                {/* Exact Figma render: rounded photo + torn white deckle border.
                    The red offset is recreated with a red drop shadow. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/video/frame.png"
                  alt="Case studies overview"
                  className="absolute inset-0 h-full w-full object-contain drop-shadow-[6px_9px_0_rgba(233,66,69,0.28)]"
                />
                <button
                  type="button"
                  aria-label="Play case studies overview"
                  onClick={() => setVideoOpen(true)}
                  className="absolute bottom-[16%] right-[9%] transition hover:scale-110 focus-visible:scale-110"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/video/play-icon.svg"
                    alt=""
                    className="h-[58px] w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                    aria-hidden
                  />
                </button>
              </div>
            </motion.figure>
          )}
        </div>
      </section>

      {/* Page 3 — projects (free scroll, no orb) */}
      <section
        id="projects"
        ref={(el) => {
          sectionRefs.current.projects = el;
        }}
        className="snap-start snap-always"
      >
        <Projects />
      </section>

      {/* Page 4 — skills ("what I can help with"). A full-viewport snap page
          like hero/video, but with no orb (the overlay orb is already hidden
          from the projects exit and nothing repositions it here). */}
      <section
        id="skills"
        ref={(el) => {
          sectionRefs.current.skills = el;
        }}
        className="relative flex min-h-[100svh] snap-start snap-always items-center py-[67px] lg:py-[58px]"
      >
        <Skills />
      </section>

      {/* Page 5 — cta. The shared contact block (also closes every case study).
          Its orb lives INSIDE the section's layout (not the fixed overlay), so
          it simply scrolls with the page; it reacts to the contact links. */}
      <ContactSection id="cta" className="min-h-[100svh] snap-start snap-always" />

      <SectionPager active={active} visible={desktop && phase === "ready" && heroContentIn} />

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        videoId={VIDEO_ID}
        start={VIDEO_START}
        title="Case studies overview"
      />
    </>
  );
}

function Page({
  id,
  refCb,
  mobileOrb,
  children,
}: {
  id: Page;
  refCb: (el: HTMLElement | null) => void;
  mobileOrb: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      ref={refCb}
      className="relative flex min-h-[100svh] snap-start snap-always items-center py-28 lg:py-24"
    >
      <div className={`${SHELL} w-full`}>
        <div className="grid grid-cols-1 items-center gap-x-10 gap-y-10 lg:grid-cols-2">
          <div>{mobileOrb}</div>
          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}

function MobileOrb({
  line,
  state,
  screenMediaSrc,
  screenMediaActive,
  screenShowPlay,
  onScreenActivate,
}: {
  line: string;
  state: OrbState;
  screenMediaSrc?: string;
  screenMediaActive?: boolean;
  screenShowPlay?: boolean;
  onScreenActivate?: () => void;
}) {
  return (
    <div className="mb-10 flex flex-col items-center lg:hidden">
      <div className="relative aspect-square w-[min(70vw,260px)]">
        <Avatar
          state={state}
          screenMediaSrc={screenMediaSrc}
          screenMediaActive={screenMediaActive}
          screenShowPlay={screenShowPlay}
          onScreenActivate={onScreenActivate}
        />
      </div>
      <p className="-mt-[3px] max-w-[320px] whitespace-pre-line text-center text-[20px] leading-7 text-sol-dim">
        {line}
      </p>
    </div>
  );
}

/* Right-edge pager for the snapped pages. Snap paging hides how long the page
   is and where you are in it, so a thin rail of ticks marks every page — the
   active one long and accent. Labels stay out of the content's way: they show
   while the rail is hovered/focused, and the new page's label whispers in for a
   moment each time the page changes. Anchors, so the intro's nav handling and
   the smooth/snap scroll behave exactly like the header links. */
function SectionPager({ active, visible }: { active: Page; visible: boolean }) {
  const [flash, setFlash] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1400);
    return () => window.clearTimeout(t);
  }, [active]);

  return (
    <nav
      aria-label="Page sections"
      className={`group/rail fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end transition-opacity duration-700 lg:flex xl:right-6 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {PAGER.map((item, i) => {
        const on = item.id === active;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={on ? "true" : undefined}
            className="group/tick -mr-4 flex items-center gap-3 py-[7px] pl-3 pr-4 outline-none xl:-mr-6 xl:pr-6"
          >
            <span
              className={`pointer-events-none whitespace-nowrap rounded-full bg-paper/90 px-2 py-0.5 text-[12px] uppercase tracking-wide transition-[opacity,transform] group-hover/rail:pointer-events-auto duration-300 ease-out group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 ${
                on ? "text-accent" : "text-sol-dim group-hover/tick:text-sol"
              } ${on && flash ? "translate-x-0 opacity-100" : "translate-x-1 opacity-0"}`}
            >
              {String(i + 1).padStart(2, "0")} {item.label}
            </span>
            <span
              aria-hidden
              className={`h-[2px] rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                on ? "w-7 bg-accent" : "w-3.5 bg-sol/25 group-hover/tick:w-5 group-hover/tick:bg-sol/60"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
