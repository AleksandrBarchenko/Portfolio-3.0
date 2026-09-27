"use client";

import { useEffect, useRef, useState } from "react";
import { SHELL } from "@/components/SiteHeader";
import SideQuestModal, { HOBBIES, FAMILY, TRAVELS } from "@/components/SideQuestModal";
import { PROJECTS, type Project } from "@/components/projects-data";

/* Data lives in a plain module so server components (e.g. the ElioVP case
   study) can import it too; re-exported here for existing consumers. */
export { PROJECTS };
export type { Project };

const ALIGN: Record<Project["align"], string> = {
  left: "lg:mr-auto",
  right: "lg:ml-auto",
  center: "lg:mx-auto",
};

export function Card({
  project,
  children,
}: {
  project: Project;
  /* Optional floating side-quest photo, absolutely positioned in the empty
     margin left by this card's stagger. */
  children?: React.ReactNode;
}) {
  return (
    <article
      className={`relative flex w-full max-w-[950px] flex-col gap-4 ${ALIGN[project.align]}`}
    >
      {children}
      {/* label row */}
      <div className="flex items-center gap-[19px] text-[14px] uppercase tracking-wide text-sol">
        <span>{project.label}</span>
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
        <span>{project.period}</span>
      </div>

      <div className="flex flex-col gap-[30px] lg:flex-row lg:items-center">
        {/* project image */}
        <div className="relative aspect-[460/334] w-full shrink-0 lg:w-[460px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* copy */}
        <div className="flex flex-col gap-6 lg:w-[460px]">
          <div className="flex flex-col gap-4">
            <h3 className="text-[32px] font-light leading-[1.2] text-sol">
              {project.title}
            </h3>
            <p className="text-[18px] leading-[1.3] text-sol-dim">
              {project.body}
            </p>
          </div>

          <div className="flex flex-wrap gap-[9px]">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-pill px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-sol-dim"
              >
                {tag}
              </span>
            ))}
          </div>

          <a href={project.href ?? "#"} className="group flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/projects/arrow.svg" alt="" className="h-[34px] w-[26px]" aria-hidden />
            <span className="font-serif text-[32px] italic text-accent transition-opacity group-hover:opacity-70">
              View use case
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}

/* Floating cut-out photo that opens a "side quest". It does NOT sit in the card
   flow — it's absolutely positioned (via `pos`) into the empty margin a card's
   stagger leaves beside it, so it hangs off the card's side and never disturbs
   the 140px rhythm between cards. Desktop-only (needs the side margin).

   Two layers, exactly like the frame: the clipped photo, and a stroke overlay
   carrying the torn-paper white edge + grain, inset -7% so it rings the photo.
   CSS handles the resting tilt, the red-tinted drop shadow, and the hover that
   straightens + grows it and tints the photo shape with accent. */
function FloatingPhoto({
  photo,
  stroke,
  pos,
  rotate,
  scale = 1,
  ariaLabel,
  onClick,
}: {
  photo: string;
  stroke: string;
  /* Absolute-position utilities anchoring the 120px box to the card edge. */
  pos: string;
  rotate: number;
  /* Visual size only. Denser shapes are scaled down so their mass keeps the
     same breathing room from the card as the airier ones. */
  scale?: number;
  ariaLabel: string;
  /* Opens the "side quest" modal. */
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={
        { "--rot": `${rotate}deg`, "--scale": `${scale}` } as React.CSSProperties
      }
      className={`group absolute z-10 hidden h-[120px] w-[120px] cursor-pointer [transform:rotate(var(--rot))_scale(var(--scale))] drop-shadow-[0_8px_12px_rgba(255,0,0,0.15)] transition-[transform,filter] duration-300 ease-out hover:[transform:rotate(0deg)_scale(calc(var(--scale)*1.12))] hover:drop-shadow-[0px_2px_1px_rgba(255,0,0,0.25)] xl:block ${pos}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-contain" />
      {/* 10% accent overlay, masked to the photo's torn shape so only the
          photo (not its transparent edges) gets tinted on hover */}
      <div
        aria-hidden
        style={{
          WebkitMaskImage: `url(${photo})`,
          maskImage: `url(${photo})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
        className="pointer-events-none absolute inset-0 bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-10"
      />
      {/* torn-paper white edge + grain, ringing the photo */}
      <div className="absolute inset-[-7%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stroke} alt="" className="h-full w-full" />
      </div>
    </button>
  );
}

/* "Some others projects gallery" — the photos orbit on a tilted ellipse: the
   one at the front sits large and sharp, the rest recede along the ring getting
   smaller, dimmer and blurred the further back they travel. */
const GALLERY: string[] = [
  "/projects/gallery/1.png",
  "/projects/gallery/2.png",
  "/projects/gallery/3.png",
  "/projects/gallery/4.png",
  "/projects/gallery/5.png",
  "/projects/gallery/6.png",
];

/* Ellipse geometry, in px, relative to the ring centre. RX/RY are the half-axes
   the cards sweep through; RY is small so the path reads as a shallow, tilted
   ellipse rather than a full circle. */
const RING = {
  cardW: 620,
  cardH: 388,
  rx: 620,
  ry: 95,
  maxBlur: 18,
};

/* Vertical scroll distance (px) mapped onto one full revolution of the ring —
   scrolling this far past the pin start brings every photo to the front in turn
   and lands the strip back on its first card. */
const REVOLUTION = 1500;

/* Desktop-only scroll-driven elliptical carousel. The section is taller than the
   viewport; the ring sticks while that extra height scrolls past, and the
   vertical scroll distance drives the rotation — scrolling down walks each photo
   to the front, then the pin releases. Scrolling up reverses it exactly. Narrow
   screens fall back to a plain native horizontal scroll. */
function Gallery() {
  const wrapRef = useRef<HTMLDivElement>(null);
  /* Rotation of the ring, in turns (0 = first photo front, 1 = full loop). 0
     also disables the effect (mobile / reduced-motion → native scroll). */
  const [turn, setTurn] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const active = () => desktop.matches && !reduce.matches;

    let raf = 0;
    const update = () => {
      raf = 0;
      const on = active();
      setPinned(on);
      if (!on) {
        setTurn(0);
        return;
      }
      /* wrap.top runs from 0 (pin starts) down to -REVOLUTION (pin ends); map
         that window onto a 0→1 rotation of the ring. */
      const scrolled = Math.min(
        Math.max(-wrap.getBoundingClientRect().top, 0),
        REVOLUTION,
      );
      setTurn(scrolled / REVOLUTION);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    desktop.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      desktop.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  const n = GALLERY.length;

  return (
    <div
      ref={wrapRef}
      style={pinned ? { height: `calc(100vh + ${REVOLUTION}px)` } : undefined}
      className="mt-[120px]"
    >
      <div
        className={
          pinned
            ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden"
            : ""
        }
      >
        <div className={SHELL}>
          <h2 className="font-serif text-[32px] italic text-accent">
            Some others projects gallery
          </h2>
        </div>

        {pinned ? (
          <div className="relative mt-10 flex h-[520px] items-center justify-center [perspective:1600px]">
            {GALLERY.map((src, i) => {
              /* Angle of this card around the ring: its slot plus the scroll
                 rotation. a = 0 is dead front. */
              const a = (i / n - turn) * Math.PI * 2;
              const depth = Math.cos(a); // 1 = front, -1 = fully behind
              const norm = (depth + 1) / 2; // 0 (back) → 1 (front)

              const x = Math.sin(a) * RING.rx;
              /* Tilt the ellipse: cards to the right ride down, left ride up. */
              const y = Math.sin(a) * RING.ry;
              const scale = 0.5 + 0.5 * norm;
              /* Blur ramps hard toward the back — front stays crisp, rear cards
                 go heavily out of focus. */
              const blur = Math.pow(1 - norm, 1.6) * RING.maxBlur;
              const opacity = 0.3 + 0.7 * norm;

              return (
                <div
                  key={i}
                  style={{
                    width: RING.cardW,
                    height: RING.cardH,
                    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    opacity,
                    zIndex: Math.round(norm * 100),
                  }}
                  className="absolute overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] will-change-transform"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-center gap-[30px] px-6 sm:px-10">
              {GALLERY.map((src, i) => (
                <div
                  key={i}
                  style={{ width: RING.cardW, height: RING.cardH }}
                  className="shrink-0 overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  /* One shared modal drives the side quests. `open` toggles it; `quest` keeps
     the last-shown content so it stays put through the close animation. */
  const [open, setOpen] = useState(false);
  const [quest, setQuest] = useState<"hobbies" | "family" | "travels">("hobbies");
  const openQuest = (which: "hobbies" | "family" | "travels") => {
    setQuest(which);
    setOpen(true);
  };

  const QUESTS = { hobbies: HOBBIES, family: FAMILY, travels: TRAVELS } as const;

  return (
    <section className="relative pb-[41px] pt-[140px] font-sans text-sol">
      <div className={SHELL}>
        <h2 className="mb-[70px] font-serif text-[32px] italic text-accent">
          Selected works
        </h2>

        <div className="flex flex-col gap-[140px]">
          <Card project={PROJECTS[0]}>
            {/* right margin, low — hangs off the bottom-right of card 1 */}
            <FloatingPhoto
              photo="/projects/float-snow.png"
              stroke="/projects/stroke-snow.svg"
              pos="left-full top-[70%] ml-[56px]"
              rotate={-15}
              ariaLabel="Open side quest — my hobbies"
              onClick={() => openQuest("hobbies")}
            />
          </Card>
          <Card project={PROJECTS[1]}>
            {/* left margin, low — hangs off the bottom-left of card 2 */}
            <FloatingPhoto
              photo="/projects/float-beach.png"
              stroke="/projects/stroke-beach.svg"
              pos="right-full top-[64%] mr-[56px]"
              rotate={15}
              ariaLabel="Open side quest — my family"
              onClick={() => openQuest("family")}
            />
          </Card>
          <Card project={PROJECTS[2]} />
          <Card project={PROJECTS[3]} />
          <Card project={PROJECTS[4]}>
            {/* right margin, high — hangs off the top-right of card 5 */}
            <FloatingPhoto
              photo="/projects/float-waterfall.png"
              stroke="/projects/stroke-waterfall.svg"
              pos="left-full top-[-6%] ml-[56px]"
              rotate={-30}
              scale={0.9}
              ariaLabel="Open side quest — travels"
              onClick={() => openQuest("travels")}
            />
          </Card>
          {/* Remaining cards carry no side-quest photo. */}
          {PROJECTS.slice(5).map((p) => (
            <Card key={p.title} project={p} />
          ))}
        </div>
      </div>

      <Gallery />

      <SideQuestModal
        open={open}
        onClose={() => setOpen(false)}
        quest={QUESTS[quest]}
      />
    </section>
  );
}
