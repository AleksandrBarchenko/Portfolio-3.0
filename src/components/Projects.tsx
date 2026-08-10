"use client";

import { useEffect, useRef, useState } from "react";
import { SHELL } from "@/components/SiteHeader";
import SideQuestModal, { HOBBIES, FAMILY, TRAVELS } from "@/components/SideQuestModal";

type Project = {
  image: string;
  /* Small caps line above the title, e.g. "mobile app redesign". */
  label: string;
  /* Year range shown after the accent dot. */
  period: string;
  title: string;
  body: string;
  tags: string[];
  /* Horizontal placement on wide screens — the frames stagger the cards. */
  align: "left" | "right" | "center";
};

/* The design still carries placeholder body copy on every card. */
const BODY =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled..";

const TAGS = ["User research", "Visual design", "Analytics"];

const PROJECTS: Project[] = [
  {
    image: "/projects/vodafone-flows.png",
    label: "mobile app redesign",
    period: "2021–2023",
    title: "Increased basic flows success rate by 17% for Vodafone app",
    body: BODY,
    tags: TAGS,
    align: "left",
  },
  {
    image: "/projects/vodafone-userbase.png",
    label: "mobile app redesign",
    period: "2023–2024",
    title: "Increased active user base by 12% for Vodafone app",
    body: BODY,
    tags: TAGS,
    align: "right",
  },
  {
    image: "/projects/electric-mobility.png",
    label: "website redesign",
    period: "2024–2025",
    title: "Comprehensive web experience for electric mobility solutions",
    body: BODY,
    tags: TAGS,
    align: "left",
  },
  {
    image: "/projects/construction-saas.png",
    label: "mobile app redesign",
    period: "2018–2020",
    title: "End-to-end redesign for construction SaaS",
    body: BODY,
    tags: TAGS,
    align: "center",
  },
  {
    image: "/projects/under-armour.png",
    label: "mobile app & web design",
    period: "2020–2021",
    title: "Cognitive training app & website for Under Armour partnership",
    body: BODY,
    tags: TAGS,
    align: "left",
  },
];

const ALIGN: Record<Project["align"], string> = {
  left: "lg:mr-auto",
  right: "lg:ml-auto",
  center: "lg:mx-auto",
};

function Card({
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
            <p className="text-[16px] font-medium leading-[1.3] text-sol-dim">
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

          <a href="#" className="group flex items-center gap-2.5">
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

/* "Some others projects gallery" — a full-bleed horizontal strip of cut-off
   photos at staggered heights, scrollable on narrow screens. */
type Shot = { src: string; w: number; h: number; top: number };

const GALLERY: Shot[] = [
  { src: "/projects/gallery/1.jpg", w: 460, h: 300, top: 0 },
  { src: "/projects/gallery/2.png", w: 362, h: 380, top: 60 },
  { src: "/projects/gallery/3.jpg", w: 460, h: 300, top: 30 },
  { src: "/projects/gallery/4.jpg", w: 362, h: 380, top: 0 },
  { src: "/projects/gallery/5.jpg", w: 460, h: 300, top: 60 },
  { src: "/projects/gallery/6.png", w: 362, h: 450, top: 30 },
];

/* Extra breathing room past the last card before the pin releases, so the end
   of the strip never butts against the viewport edge. */
const GALLERY_END_MARGIN = 40;

/* Desktop-only scroll-driven horizontal slider. The section is made taller than
   the viewport; the strip sticks while that extra height scrolls past, and the
   vertical scroll distance is mapped straight onto a horizontal translate — so
   scrolling down walks the strip toward its last card (+ margin), then the pin
   releases and it scrolls off screen. Scrolling back up reverses it exactly.
   Narrow screens fall back to a plain native horizontal scroll. */
function Gallery() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  /* Horizontal distance the strip has to travel; 0 disables the effect (mobile,
     reduced-motion, or a strip narrower than the viewport). */
  const [travel, setTravel] = useState(0);
  const [x, setX] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    const desktop = window.matchMedia("(min-width: 1024px)");

    /* How far the strip needs to slide to bring the last card fully in view.
       This is driven entirely by page scroll (not autoplay), so it stays on for
       reduced-motion users too — otherwise the strip falls back to a native
       horizontal scroll that only responds while the cursor is over it. */
    const distance = () =>
      desktop.matches
        ? Math.max(0, track.scrollWidth - window.innerWidth + GALLERY_END_MARGIN)
        : 0;

    let raf = 0;
    const update = () => {
      raf = 0;
      const t = distance();
      setTravel(t);
      if (t === 0) {
        setX(0);
        return;
      }
      /* wrap.top runs from 0 (pin starts) down to -t (pin ends); clamp to that
         window and mirror it onto the horizontal offset. */
      const scrolled = Math.min(Math.max(-wrap.getBoundingClientRect().top, 0), t);
      setX(-scrolled);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    desktop.addEventListener("change", update);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      desktop.removeEventListener("change", update);
    };
  }, []);

  const pinned = travel > 0;

  return (
    <div
      ref={wrapRef}
      style={pinned ? { height: `calc(100vh + ${travel}px)` } : undefined}
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

        <div
          className={
            pinned
              ? "mt-10"
              : "mt-10 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          }
        >
          <div
            ref={trackRef}
            style={pinned ? { transform: `translate3d(${x}px,0,0)` } : undefined}
            className="flex w-max items-start gap-[30px] px-6 will-change-transform sm:px-10 lg:px-14"
          >
            {GALLERY.map((shot, i) => (
              <div
                key={i}
                style={{ width: shot.w, height: shot.h, marginTop: shot.top }}
                className="shrink-0 overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
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
    <section className="relative pb-[68px] pt-[140px] font-sans text-sol">
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
