"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { OrbCanvas } from "@/components/orb/OrbCanvas";
import type { OrbState } from "@/types/orb";
import { SHELL } from "@/components/SiteHeader";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import { TypeOnHover } from "@/components/TypeOnHover";
import { useActiveSection, PAGE_BG, BG_TRANSITION } from "@/components/ActiveSection";

// Fixed line breaks so each line reads in exactly three centred lines. The
// typing effect reveals the "\n"s as it goes (rendered with whitespace-pre-line).
const GREETING =
  "Hey, nice to meet you\nhere. I'm Alex Barchenko -\nDigital Product Designer";
const CASES =
  "Have no time to explore?\nGot you! Just watch case\nstudies overview.";
const CTA_LINE =
  "Have a project in mind\nyou need a help with?\nLet’s move it together";

/* Client logos (grey PNG lockups), laid out 3 across × 2 down. */
const LOGOS: Record<string, string> = {
  google: "/logos/l-google.png",
  vodafone: "/logos/l-vodafone.png",
  hilton: "/logos/l-hilton.png",
  elio: "/logos/l-elio.png",
  underarmour: "/logos/l-underarmour.png",
  cabei: "/logos/l-cabei.png",
};
const LOGO_GRID = ["google", "vodafone", "hilton", "elio", "underarmour", "cabei"];

type Page = "hero" | "video" | "projects" | "skills" | "cta";
// Symmetric ease-in-out cubic — accelerates and decelerates gently at both
// ends so moves feel smooth rather than snapping to a fast start.
const EASE = [0.65, 0, 0.35, 1] as const;

const SPEECH_W = 380;

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

function geom(vw: number, vh: number) {
  const orbW = Math.min(Math.round(vw * 0.4), 460);
  const shellPad = vw >= 1024 ? 56 : vw >= 640 ? 40 : 24;
  const shellLeft = Math.max(shellPad, (vw - 1240) / 2 + shellPad);
  // Vertically centre the orb+caption block: the square canvas is padded with a
  // lot of transparent space (the visible orb spans ~0.30–0.74 of the box) and
  // the caption hangs below, so the orb's top-left must sit above the viewport
  // middle by half the visible block's height.
  const blockY = vh / 2 - orbW * 0.56 - 48;
  return {
    orbW,
    leftX: shellLeft - 24,
    centerX: vw / 2 - orbW / 2,
    centerY: blockY,
    midY: blockY,
    ctaY: blockY,
  };
}

/* Speech box is always centred UNDER the orb (text stays centered even after the
   orb glides left). Returns the box's top-left x and its y. The 0.82 factor sits
   the caption close under the orb's visible bottom (~0.74 of the box). */
function speechXY(g: ReturnType<typeof geom>, orbX: number, orbY: number) {
  return { x: orbX + g.orbW / 2 - SPEECH_W / 2, y: orbY + g.orbW * 0.82 };
}

export default function Experience() {
  const reduce = useReducedMotion();
  const { w: vw, h: vh, desktop } = useViewport();

  const [phase, setPhase] = useState<"intro" | "ready">("intro");
  // Single shared source of truth for the active section (see ActiveSection) —
  // the same value drives the backdrop here and the sticky header, so their
  // colours can never fall out of sync during a transition.
  const active = useActiveSection();
  // Scroll stays locked through the intro: the orb greets from the viewport
  // centre, then glides to the left edge. Only once that glide finishes does
  // scrolling become available, so the user can't jump ahead of the script.
  const [scrollLocked, setScrollLocked] = useState(true);

  const [line, setLine] = useState(GREETING);
  const [typed, setTyped] = useState(reduce ? GREETING.length : 0);
  const [speaking, setSpeaking] = useState(!reduce);
  const spoken = useRef({ video: false, cta: false });

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

  // The intro glide is desktop-only (mobile shows a per-section orb), so there's
  // nothing to wait for on mobile — release the lock immediately there.
  useEffect(() => {
    if (!desktop) setScrollLocked(false);
  }, [desktop]);

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
  }, [speaking, line, reduce]);

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
  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const videoEl = sectionRefs.current.video;
        if (!videoEl) return;
        const past = Math.max(0, window.scrollY - videoEl.offsetTop);
        exitY.set(-past);
        exitOpacity.set(Math.max(0, 1 - past / (window.innerHeight * 0.5)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [desktop, exitY, exitOpacity]);

  // Orchestrate the orb + speech for the active page. Only reacts to page/phase
  // changes (geometry is read from a ref so a resize doesn't replay the anim).
  useEffect(() => {
    if (!desktop) return;
    const g = geom(vp.current.w, vp.current.h);
    const fromIntro = prev.current.phase === "intro";
    prev.current = { phase, active };
    let cancelled = false;

    const run = async () => {
      if (phase === "intro") {
        orb.set({ x: g.centerX, y: g.centerY, scale: 1, opacity: 1 });
        speech.set({ ...speechXY(g, g.centerX, g.centerY), opacity: 1 });
        return;
      }
      if (active === "hero") {
        const glide = orb.start(
          { x: g.leftX, y: g.midY, scale: 1, opacity: 1 },
          { duration: 1.15, ease: EASE },
        );
        const pos = speechXY(g, g.leftX, g.midY);
        if (fromIntro) {
          // Keep the greeting; just glide it (centred) under the moved orb, then
          // release the scroll lock once the orb has settled at the left edge.
          speech.start({ ...pos, opacity: 1 }, { duration: 1.15, ease: EASE });
          await glide;
          if (cancelled) return;
          setScrollLocked(false);
        } else {
          await speech.start({ opacity: 0 }, { duration: 0.4, ease: EASE });
          if (cancelled) return;
          setLine(GREETING);
          setSpeaking(false);
          setTyped(GREETING.length);
          speech.set(pos);
          speech.start({ opacity: 1 }, { duration: 0.4, ease: EASE });
        }
      } else if (active === "video") {
        orb.start({ x: g.leftX, y: g.midY, scale: 1, opacity: 1 }, { duration: 0.85, ease: EASE });
        // old text fades out, new text types in
        await speech.start({ opacity: 0 }, { duration: 0.4, ease: EASE });
        if (cancelled) return;
        speech.set(speechXY(g, g.leftX, g.midY));
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
  }, [phase, active, desktop, orb, speech]);

  // Reposition instantly on resize (no replay of the transition animation).
  useEffect(() => {
    if (!desktop) return;
    const g = geom(vw, vh);
    if (phase === "intro") {
      orb.set({ x: g.centerX, y: g.centerY, scale: 1, opacity: 1 });
      speech.set(speechXY(g, g.centerX, g.centerY));
    } else if (active === "hero" || active === "video") {
      orb.set({ x: g.leftX, y: g.midY, scale: 1, opacity: 1 });
      speech.set(speechXY(g, g.leftX, g.midY));
    }
    // `cta` has its own in-layout orb (see ContactOrb) — the overlay orb stays
    // hidden there, so nothing to reposition on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vw, vh]);

  const orbState: OrbState = speaking ? "replying" : "idle";
  const displayText = speaking ? line.slice(0, typed) : line;
  const g = geom(vw, vh);

  return (
    <>
      {/* Full-page backdrop — a single layer whose colour eases between the
          per-section values as you scroll, so the whole background changes. */}
      <div
        aria-hidden
        className={`fixed inset-0 -z-10 ${BG_TRANSITION}`}
        style={{ backgroundColor: PAGE_BG[active] }}
      />

      {desktop && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
          style={{ y: exitY, opacity: exitOpacity }}
        >
          <motion.div
            className="absolute left-0 top-0"
            style={{ width: g.orbW, height: g.orbW }}
            initial={{ opacity: 0 }}
            animate={orb}
          >
            <OrbCanvas state={orbState} />
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

      {/* Page 1 — hero */}
      <Page
        id="hero"
        refCb={(el) => (sectionRefs.current.hero = el)}
        mobileOrb={!desktop ? <MobileOrb line={GREETING} state={orbState} /> : null}
      >
        <motion.div
          initial={false}
          animate={{ opacity: phase === "ready" ? 1 : 0, y: phase === "ready" ? 0 : 24 }}
          transition={{ duration: 0.95, ease: EASE }}
          className="flex flex-col gap-16"
        >
          <h1 className="text-[clamp(38px,4.6vw,68px)] font-light leading-[1.18] tracking-[-0.01em] text-sol">
            Creating{" "}
            <span className="font-serif font-normal italic text-accent">feelings</span>
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
                  src={LOGOS[name]}
                  alt={name}
                  className="max-h-[58px] w-auto max-w-[168px] object-contain"
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
        className="relative flex min-h-[100svh] snap-start items-center py-28 lg:py-24"
      >
        <div className={`${SHELL} w-full`}>
          {!desktop && <MobileOrb line={CASES} state={orbState} />}
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
        </div>
      </section>

      {/* Page 3 — projects (free scroll, no orb) */}
      <section
        id="projects"
        ref={(el) => {
          sectionRefs.current.projects = el;
        }}
        className="snap-start"
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
        className="relative flex min-h-[100svh] snap-start items-center py-28 lg:py-24"
      >
        <Skills />
      </section>

      {/* Page 5 — cta. The orb here lives INSIDE the section's layout (not the
          fixed overlay), so it simply scrolls with the page — up as you scroll
          down into contact, down as you scroll up out of it. */}
      <section
        id="cta"
        ref={(el) => {
          sectionRefs.current.cta = el;
        }}
        className="relative flex min-h-[100svh] snap-start items-center py-28 lg:py-24"
      >
        <div className={`${SHELL} w-full`}>
          <div className="grid grid-cols-1 items-center gap-x-10 gap-y-10 lg:grid-cols-2">
            <div>
              {desktop ? (
                <ContactOrb />
              ) : (
                <MobileOrb line={CTA_LINE} state={orbState} />
              )}
            </div>
            <div>
        <div className="flex flex-col gap-14">
          <div className="flex flex-col gap-4 text-[clamp(26px,3vw,36px)] leading-[1.2] text-accent-2">
            <a href="mailto:alex.barcenko@gmail.com" className="w-fit">
              <TypeOnHover
                text="alex.barcenko@gmail.com"
                className="underline decoration-from-font"
              />
            </a>
            <a href="tel:+351910042087" className="w-fit">
              <TypeOnHover
                text="+351910042087"
                className="underline decoration-from-font"
              />
            </a>
          </div>
          <div className="flex flex-col gap-10 text-[16px] font-medium text-sol">
            <span>.based in Portugal</span>
            <a href="#" className="w-fit">
              <TypeOnHover text="{ behance }" />
            </a>
            <a href="#" className="w-fit">
              <TypeOnHover text="{ linkedin }" />
            </a>
          </div>
        </div>
            </div>
          </div>
        </div>
      </section>
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
      className="relative flex min-h-[100svh] snap-start items-center py-28 lg:py-24"
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

/* Desktop contact orb — a normal element in the CTA section's layout, so it
   scrolls with the page instead of being animated. Types its line once, the
   first time it scrolls into view. */
function ContactOrb() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [typed, setTyped] = useState(reduce ? CTA_LINE.length : 0);
  const [speaking, setSpeaking] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          setSpeaking(true);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (!speaking) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const n = Math.min(CTA_LINE.length, Math.floor((now - start) / 30));
      setTyped(n);
      if (n < CTA_LINE.length) raf = requestAnimationFrame(step);
      else setSpeaking(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speaking]);

  const state: OrbState = speaking ? "replying" : "idle";
  const text = speaking ? CTA_LINE.slice(0, typed) : CTA_LINE;

  return (
    <div ref={ref} className="flex -translate-y-[78px] flex-col items-center">
      <div className="relative aspect-square w-[min(44vw,520px)]">
        <OrbCanvas state={state} />
      </div>
      <p
        className="-mt-[88px] whitespace-pre-line text-center text-[22px] leading-8 text-sol-dim"
        style={{ width: SPEECH_W }}
      >
        {text}
        {speaking && <Caret />}
      </p>
    </div>
  );
}

function MobileOrb({ line, state }: { line: string; state: OrbState }) {
  return (
    <div className="mb-10 flex flex-col items-center lg:hidden">
      <div className="relative aspect-square w-[min(70vw,260px)]">
        <OrbCanvas state={state} />
      </div>
      <p className="-mt-[46px] max-w-[320px] whitespace-pre-line text-center text-[20px] leading-7 text-sol-dim">
        {line}
      </p>
    </div>
  );
}
