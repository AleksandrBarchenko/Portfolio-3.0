"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SHELL } from "@/components/SiteHeader";
import { LAST_CASE_KEY, WORKS_LAYOUT_KEY } from "@/components/nav-memory";
import WorksBoard from "@/components/WorksBoard";
import { FloatingPhoto } from "@/components/FloatingPhoto";
import SideQuestModal, { HOBBIES, FAMILY, TRAVELS } from "@/components/SideQuestModal";
import { PROJECTS, type Project } from "@/components/projects-data";
import { useSound } from "@/components/sound/SoundProvider";
import { CUE } from "@/components/sound/sound-events";

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
  const imgRef = useRef<HTMLDivElement>(null);
  const { play, playShift } = useSound();
  const href = project.href ?? "#";

  /* The whole card is one link (a stretched ::after on "View use case"), so the
     pointer is tracked on the article and the "view case" pill follows it only
     while it's over the image. Written straight to CSS vars — no re-renders. */
  const onPointerMove = (e: React.PointerEvent) => {
    const el = imgRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
    el.dataset.over = String(x >= 0 && y >= 0 && x <= r.width && y <= r.height);
  };
  const onPointerLeave = () => {
    if (imgRef.current) imgRef.current.dataset.over = "false";
  };

  return (
    <article
      data-case={href}
      onPointerEnter={playShift}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`group/card relative flex w-full max-w-[950px] flex-col gap-4 ${ALIGN[project.align]}`}
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
        <div
          ref={imgRef}
          data-over="false"
          className="group/img relative aspect-[460/334] w-full shrink-0 overflow-hidden lg:w-[460px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/card:scale-[1.04]"
          />
          {/* Cursor-following "view case" pill (mouse only). */}
          <span
            aria-hidden
            style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
            className="pointer-events-none absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 scale-75 items-center gap-1.5 whitespace-nowrap rounded-full bg-paper/95 px-4 py-2 font-serif text-[18px] italic text-accent opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] transition-[opacity,scale] duration-200 ease-out group-data-[over=true]/img:scale-100 group-data-[over=true]/img:opacity-100 [@media(hover:hover)]:flex"
          >
            view case <span className="not-italic">→</span>
          </span>
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

          {/* Stretched link: its ::after covers the whole article, so the image,
              title and copy are all clickable. Side-quest photos sit above it
              (z-10) and keep their own click. */}
          <Link
            href={href}
            aria-label={`View use case: ${project.title}`}
            onClick={() => {
              // Moving forward into the case study.
              play(CUE.enterCase);
              sessionStorage.setItem(LAST_CASE_KEY, href);
            }}
            className="flex w-fit items-center gap-2.5 after:absolute after:inset-0 after:content-['']"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/arrow.svg"
              alt=""
              className="h-[34px] w-[26px] transition-transform duration-300 ease-out motion-safe:group-hover/card:translate-x-1.5"
              aria-hidden
            />
            <span className="font-serif text-[32px] italic text-accent transition-opacity group-hover/card:opacity-70">
              View use case
            </span>
          </Link>
        </div>
      </div>
    </article>
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

type Layout = "list" | "board";

/* `hidden` drops a layout from the tabs (and from the restored choice) while
   keeping its code around — flip it back to compare again. With one layout
   left the switcher hides entirely and the board (the default) shows. */
const LAYOUTS: { id: Layout; n: string; label: string; hidden?: boolean }[] = [
  { id: "list", n: "01", label: "list", hidden: true },
  { id: "board", n: "02", label: "board" },
];
const VISIBLE = LAYOUTS.filter((l) => !l.hidden);

/* "Works and Life" title + the layout tabs used to compare the two designs. */
function WorksHeading({
  layout,
  onLayout,
  className = "",
}: {
  layout: Layout;
  onLayout: (l: Layout) => void;
  className?: string;
}) {
  const { playHover } = useSound();
  return (
    <div className={`${SHELL} flex items-center justify-between gap-6 ${className}`}>
      <h2 className="whitespace-nowrap font-serif text-[26px] italic text-accent sm:text-[32px]">Works and Life</h2>
      {/* A single remaining layout needs no switcher. */}
      {VISIBLE.length > 1 && (
        <div
          role="tablist"
          aria-label="Works layout"
          className="flex items-center gap-1 rounded-full bg-pill p-1"
        >
          {VISIBLE.map((l) => {
            const on = l.id === layout;
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={on}
                onPointerEnter={() => playHover()}
                onClick={() => onLayout(l.id)}
                className={`flex items-baseline gap-1.5 rounded-full px-4 py-1.5 text-[14px] transition-[background-color,color,box-shadow] duration-300 ${
                  on
                    ? "bg-paper text-accent shadow-[0_4px_14px_-6px_rgba(0,0,0,0.25)]"
                    : "text-sol-dim hover:text-sol"
                }`}
              >
                <span className="font-mono text-[11px] opacity-60">{l.n}</span>
                <span className="font-serif italic">{l.label}</span>
              </button>
            );
          })}
        </div>
      )}
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

  /* Layout under comparison — restored after hydration so SSR stays stable. */
  const [layout, setLayout] = useState<Layout>("board");
  useEffect(() => {
    const saved = localStorage.getItem(WORKS_LAYOUT_KEY);
    const restore = VISIBLE.find((l) => l.id === saved);
    if (restore) setLayout(restore.id);
  }, []);
  const switchLayout = (l: Layout) => {
    if (l === layout) return;
    localStorage.setItem(WORKS_LAYOUT_KEY, l);
    setLayout(l);
    // The two layouts differ wildly in height — re-anchor on the section top
    // so the switch doesn't strand the visitor mid-page.
    requestAnimationFrame(() =>
      document.getElementById("projects")?.scrollIntoView({ behavior: "instant", block: "start" }),
    );
  };

  const modal = (
    <SideQuestModal open={open} onClose={() => setOpen(false)} quest={QUESTS[quest]} />
  );

  if (layout === "board")
    return (
      <section className="relative font-sans text-sol">
        <WorksBoard
          heading={
            <WorksHeading layout={layout} onLayout={switchLayout} className="pb-2 pt-4" />
          }
          onQuest={openQuest}
        />
        {modal}
      </section>
    );

  return (
    <section className="relative pb-[41px] pt-[140px] font-sans text-sol">
      <WorksHeading layout={layout} onLayout={switchLayout} className="mb-[70px]" />
      <div className={SHELL}>

        <div className="flex flex-col gap-[140px]">
          <Card project={PROJECTS[0]}>
            {/* right margin, low — hangs off the bottom-right of card 1 */}
            <FloatingPhoto
              photo="/projects/quest-hobbies-circle.png"
              pos="left-full top-[70%] ml-[56px]"
              rotate={-15}
              scale={1.14}
              ariaLabel="Open side quest — my hobbies"
              onClick={() => openQuest("hobbies")}
            />
          </Card>
          <Card project={PROJECTS[1]}>
            {/* left margin, low — hangs off the bottom-left of card 2 */}
            <FloatingPhoto
              photo="/projects/quest-family-circle.png"
              pos="right-full top-[64%] mr-[56px]"
              rotate={15}
              scale={1.14}
              ariaLabel="Open side quest — my family"
              onClick={() => openQuest("family")}
            />
          </Card>
          <Card project={PROJECTS[2]} />
          <Card project={PROJECTS[3]} />
          <Card project={PROJECTS[4]}>
            {/* right margin, high — hangs off the top-right of card 5 */}
            <FloatingPhoto
              photo="/projects/quest-travels-circle.png"
              pos="left-full top-[-6%] ml-[56px]"
              rotate={-30}
              scale={1.03}
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

      {modal}
    </section>
  );
}
