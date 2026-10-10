"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion, useSpring } from "framer-motion";
import { LAST_CASE_KEY } from "@/components/nav-memory";
import { PROJECTS, type Project } from "@/components/projects-data";
import { CountUp, Figure, type StatKind } from "@/components/CaseStats";
import { FloatingPhoto } from "@/components/FloatingPhoto";
import { SHELL } from "@/components/SiteHeader";
import { useSound } from "@/components/sound/SoundProvider";
import { CUE } from "@/components/sound/sound-events";

/* "Works and Life", layout 2 — a side-scrolling canvas. Case studies, other
   work and headline stats float on one wide board, loosely collaged like
   things pinned to a table, each at its own depth.

   Geometry is in board units: 1u = 1% of the board's height (a `cqh` on the
   size-contained scroller), so the whole composition scales with the viewport
   height and always fits the screen — on a short laptop and a tall monitor the
   layout is identical, just bigger or smaller.

   Desktop: the section pins and vertical scroll drives the board sideways
   (1px of scroll = 1px of travel). Items parallax by depth — nearer ones
   travel faster past the centre than the ones further back. Touch / narrow /
   reduced motion: the same board, natively scrolled sideways. */

type Quest = "hobbies" | "family" | "travels";

/* Shared placement: x/y/w in board units, resting tilt in degrees, and depth
   z ∈ [-1, 1] (−1 far back: slower parallax, low shadow; 1 near: faster, high
   shadow, on top). */
type Place = { x: number; y: number; w: number; rot: number; z: number };

type Item = Place &
  (
    /* `tag`: optional headline stat shown in the image's corner. */
    | { kind: "case"; project: number; tag?: string }
    | { kind: "work"; src: string; caption: string }
    | {
        kind: "stat";
        tone: "paper" | "accent";
        value: number;
        prefix?: string;
        suffix?: string;
        decimals?: number;
        label: string;
        from: string;
        figure?: StatKind;
        /* Case study the number comes from — dropped from that case's own
           "Other projects" board. */
        href: string;
      }
    | { kind: "quest"; quest: Quest; photo: string; label: string }
  );

type StatData = Omit<Extract<Item, { kind: "stat" }>, keyof Place | "kind">;

/* Headline numbers from the case studies, shared by both boards. */
const STATS = {
  callCenter: { tone: "accent", value: 23, prefix: "−", suffix: "%", label: "call center load", from: "Vodafone app", href: "/work/vodafone" },
  userBase: { tone: "paper", value: 12, prefix: "+", suffix: "%", label: "active user base", from: "Vodafone app", figure: "growth", href: "/work/vodafone-userbase" },
  devResources: { tone: "paper", value: 30, prefix: "−", suffix: "%", label: "development resources", from: "Design System", figure: "resources", href: "/work/vodafone-design-system" },
  features: { tone: "paper", value: 20, suffix: "+", label: "functionalities shipped", from: "ZimaOne", figure: "count", href: "/work/zimaone" },
} satisfies Record<string, StatData>;

/* Corner tags some case cards carry — a second headline number. */
const CASE_TAGS: Record<string, string> = {
  "/work/vodafone": "+0.5 ★ app store rating",
  "/work/vodafone-design-system": "−25% designer onboarding",
};

/* Board width in units — the right edge of the last item plus breathing room. */
const BOARD_W = 570;

/* Laid out in loose columns with clear gutters — nothing overlaps; depth reads
   from the shadows and the parallax alone. Gutters (≥8u) leave room for each
   item's tilt and for the parallax drift between neighbours. */
const ITEMS: Item[] = [
  { kind: "quest", quest: "hobbies", photo: "/projects/quest-hobbies-circle.png", label: "Open side quest — my hobbies", x: 15, y: 11, w: 15, rot: -15, z: 0.7 },
  { kind: "case", project: 0, tag: CASE_TAGS["/work/vodafone"], x: 0, y: 40, w: 48, rot: -3, z: 0.3 },
  { kind: "work", src: "/projects/gallery/1.png", caption: "CABEI investment portal", x: 56, y: 4, w: 40, rot: 5, z: -0.3 },
  { kind: "stat", ...STATS.callCenter, x: 63, y: 40, w: 26, rot: -4, z: 0.5 },
  { kind: "quest", quest: "family", photo: "/projects/quest-family-circle.png", label: "Open side quest — my family", x: 71, y: 75, w: 14, rot: 15, z: 0.7 },
  { kind: "case", project: 1, x: 104, y: 8, w: 48, rot: 3, z: 0.3 },
  { kind: "stat", ...STATS.userBase, x: 115, y: 66, w: 26, rot: 4, z: 0.5 },
  { kind: "work", src: "/projects/gallery/2.png", caption: "Events agency website", x: 165, y: 4, w: 38, rot: -4, z: -0.3 },
  { kind: "case", project: 2, x: 160, y: 39, w: 48, rot: -2, z: 0.3 },
  { kind: "stat", ...STATS.devResources, x: 216, y: 8, w: 26, rot: -4, z: 0.5 },
  { kind: "work", src: "/projects/gallery/3.png", caption: "Diaconia", x: 216, y: 46, w: 30, rot: 6, z: -0.3 },
  { kind: "case", project: 3, tag: CASE_TAGS["/work/vodafone-design-system"], x: 256, y: 12, w: 48, rot: 3, z: 0.3 },
  { kind: "quest", quest: "travels", photo: "/projects/quest-travels-circle.png", label: "Open side quest — travels", x: 321, y: 12, w: 14, rot: -30, z: 0.7 },
  { kind: "work", src: "/projects/gallery/4.png", caption: "B2B logistics platform", x: 312, y: 50, w: 40, rot: -5, z: -0.3 },
  { kind: "case", project: 4, x: 360, y: 6, w: 48, rot: -3, z: 0.3 },
  { kind: "work", src: "/projects/gallery/5.png", caption: "growth[period]", x: 367, y: 66, w: 34, rot: 4, z: -0.3 },
  { kind: "stat", ...STATS.features, x: 420, y: 10, w: 26, rot: -5, z: 0.5 },
  { kind: "work", src: "/projects/gallery/6.png", caption: "Hilton", x: 416, y: 50, w: 34, rot: -4, z: -0.3 },
  { kind: "case", project: 5, x: 458, y: 34, w: 48, rot: 2, z: 0.3 },
  { kind: "case", project: 6, x: 514, y: 8, w: 48, rot: -3, z: 0.3 },
];

/* How strongly depth bends the parallax: an item at z = 1 travels this much
   further than the board for every px it is away from the viewport centre. */
const PARALLAX = 0.06;

const u = (n: number) => `calc(var(--u) * ${n})`;

/* The case-study "Other projects" board: only the selected cases (minus the
   one being read) and their stats — no side quests, no non-clickable work.
   Generated rather than hand-placed so it holds for any excluded case: one
   column per case, zig-zagging high/low, with stats tucked into the free half
   of evenly spread columns. */
function caseBoard(exclude: string) {
  const cases = PROJECTS.map((p, i) => ({ p, i })).filter(({ p }) => p.href !== exclude);
  const stats = Object.values(STATS).filter((st) => st.href !== exclude);
  // Spread end to end (first and last column included) so stats land on both
  // high and low columns.
  const statAt = new Map(
    stats.map((st, k) => [
      stats.length > 1 ? Math.round((k * (cases.length - 1)) / (stats.length - 1)) : 0,
      st,
    ]),
  );
  const CASE_W = 48;
  const STAT_W = 26;
  const GAP = 10;
  const items: Item[] = [];
  cases.forEach(({ p, i }, col) => {
    const x = col * (CASE_W + GAP);
    const high = col % 2 === 1;
    const sign = col % 2 ? 1 : -1;
    items.push({
      kind: "case",
      project: i,
      tag: CASE_TAGS[p.href ?? ""],
      x,
      y: high ? 6 : 38,
      w: CASE_W,
      rot: sign * (2 + (col % 3) * 0.5),
      z: 0.3,
    });
    const st = statAt.get(col);
    if (st)
      items.push({
        kind: "stat",
        ...st,
        x: x + (CASE_W - STAT_W) / 2 + sign * 3,
        y: high ? 66 : 6,
        w: STAT_W,
        rot: -sign * 4,
        z: 0.5,
      });
  });
  return { items, width: cases.length * (CASE_W + GAP) - GAP };
}

/* "Other projects" at the foot of each case study. While it owns the centre of
   the viewport the whole page (and header — both `.case-bg`) eases to the warm
   surface, the same soft section-to-section fade as the home page. */
export function OtherProjects({ exclude }: { exclude: string }) {
  const { items, width } = caseBoard(exclude);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) root.style.setProperty("--case-bg", "var(--surface-2)");
        else root.style.removeProperty("--case-bg");
      },
      { rootMargin: "-49% 0px -49% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      root.style.removeProperty("--case-bg");
    };
  }, []);

  return (
    <div ref={ref}>
      <WorksBoard
        items={items}
        width={width}
        heading={
          <div className={`${SHELL} pb-2 pt-4`}>
            <h2 className="font-serif text-[32px] italic text-accent">Other projects</h2>
          </div>
        }
      />
    </div>
  );
}

export default function WorksBoard({
  heading,
  onQuest,
  items = ITEMS,
  width = BOARD_W,
}: {
  /* Section title (+ layout tabs on the home page), inside the pinned frame. */
  heading: React.ReactNode;
  onQuest?: (q: Quest) => void;
  items?: Item[];
  /* Board width in units. */
  width?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [distance, setDistance] = useState(0);
  /* Scroll → board mapping, refreshed on resize. Read by the per-frame update
     so scrolling never re-renders React. */
  const geo = useRef({ distance: 0, pad: 0, centres: [] as number[] });

  useEffect(() => {
    const wrap = wrapRef.current;
    const row = rowRef.current;
    const track = trackRef.current;
    if (!wrap || !row || !track) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    const on = () => desktop.matches && !reduce;
    const items = Array.from(track.querySelectorAll<HTMLElement>("[data-item]"));

    const measure = () => {
      const vw = window.innerWidth;
      const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
      const d = Math.max(0, Math.round(row.scrollWidth - vw));
      geo.current = {
        distance: d,
        pad,
        centres: items.map((el) => el.offsetLeft + el.offsetWidth / 2),
      };
      setPinned(on());
      setDistance(d);
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const { distance: d, pad, centres } = geo.current;
      const vw = window.innerWidth;
      const pin = on();
      const p = pin && d
        ? Math.min(Math.max(-wrap.getBoundingClientRect().top / d, 0), 1)
        : 0;
      const tx = -p * d;
      row.style.transform = pin ? `translate3d(${tx}px,0,0)` : "";
      if (dotsRef.current)
        dotsRef.current.style.backgroundPositionX = `${tx * 0.45}px`;
      items.forEach((el, i) => {
        const z = Number(el.dataset.z);
        const off = pin ? (pad + centres[i] + tx - vw / 2) * z * PARALLAX : 0;
        el.style.transform = off ? `translate3d(${off}px,0,0)` : "";
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(row);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    desktop.addEventListener("change", onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      desktop.removeEventListener("change", onResize);
    };
  }, [reduce]);

  /* Bring an item to the centre of the board. Pinned, that means scrolling the
     page to the point that slides it there — the browser can't do it itself
     because the board moves by transform. Used for keyboard focus and for
     landing a returning visitor on the case they opened (see Experience). */
  const focusItem = (el: HTMLElement) => {
    const wrap = wrapRef.current;
    const item = el.closest<HTMLElement>("[data-item]");
    if (!pinned || !wrap || !item) return;
    const { distance: d, pad, centres } = geo.current;
    const items = Array.from(trackRef.current?.querySelectorAll("[data-item]") ?? []);
    const c = centres[items.indexOf(item)];
    if (c === undefined) return;
    const along = Math.min(Math.max(pad + c - window.innerWidth / 2, 0), d);
    const top = wrap.getBoundingClientRect().top + window.scrollY + along;
    window.scrollTo({ top, behavior: "instant" });
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onFocusReq = (e: Event) => focusItem(e.target as HTMLElement);
    wrap.addEventListener("board:focus", onFocusReq);
    return () => wrap.removeEventListener("board:focus", onFocusReq);
  });

  /* Sideways trackpad swipes move the pinned board too. */
  const onWheel = (e: React.WheelEvent) => {
    if (!pinned || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    window.scrollBy({ top: e.deltaX, behavior: "instant" });
  };

  return (
    <div
      ref={wrapRef}
      data-board
      style={pinned ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div
        onWheel={onWheel}
        className={`flex h-[100svh] flex-col overflow-hidden pb-6 pt-[80px] ${pinned ? "sticky top-0" : ""}`}
      >
        {heading}

        {/* The board. Size-contained so its height defines the unit. */}
        <div
          style={{ containerType: "size" }}
          className={`relative min-h-0 flex-1 ${pinned ? "overflow-hidden" : "overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}`}
        >
          {/* Faint dot grid on the "table" — drifts at half speed, the farthest
              layer of the parallax. */}
          <div
            ref={dotsRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgb(0_0_0/0.13)_1px,transparent_1.3px)] [background-size:26px_26px] dark:[background-image:radial-gradient(rgb(255_255_255/0.1)_1px,transparent_1.3px)] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
          />

          <div
            ref={rowRef}
            className="flex h-full w-max px-6 will-change-transform sm:px-10 lg:px-[max(56px,calc((100vw-1240px)/2+56px))]"
          >
            <div
              ref={trackRef}
              style={{ ["--u" as string]: "1cqh", width: u(width) }}
              className="relative h-full shrink-0"
            >
              {items.map((it, i) => (
                <Placed
                  key={i}
                  item={it}
                  index={i}
                  tilt={!reduce}
                  onFocusItem={focusItem}
                >
                  {it.kind === "case" && (
                    <CaseCard project={PROJECTS[it.project]} tag={it.tag} />
                  )}
                  {it.kind === "work" && <WorkCard src={it.src} caption={it.caption} />}
                  {it.kind === "stat" && <StatCard item={it} seed={i} />}
                  {it.kind === "quest" && (
                    /* Bigger on mobile, grown about its centre so the board
                       layout around it stays put. */
                    <div className="max-lg:scale-125">
                      <FloatingPhoto
                        fill
                        photo={it.photo}
                        rotate={it.rot}
                        ariaLabel={it.label}
                        onClick={() => onQuest?.(it.quest)}
                      />
                    </div>
                  )}
                </Placed>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* Positions one item on the board and gives it its levitation: a slow idle bob,
   a depth-scaled shadow, and the hover "push" — the card tilts away under the
   cursor as if pressed on a floating sheet, swings a little about Z toward the
   side being pushed, and sinks closer to the table (tighter shadow). */
function Placed({
  item,
  index,
  tilt,
  onFocusItem,
  children,
}: {
  item: Item;
  index: number;
  tilt: boolean;
  onFocusItem: (el: HTMLElement) => void;
  children: React.ReactNode;
}) {
  const quest = item.kind === "quest";
  /* Selected cases push the most; plain work slightly less. Quest photos keep
     their own straighten-and-grow hover. */
  const strength = item.kind === "case" ? 9 : item.kind === "work" ? 6 : 8;
  const pushes = tilt && !quest;

  const spring = { stiffness: 170, damping: 18, mass: 0.6 };
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const rz = useSpring(quest ? 0 : item.rot, spring);
  const s = useSpring(1, spring);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pushes || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    // The point under the cursor sinks: rotateY(+) sends the right edge back,
    // rotateX(−) sends the bottom edge back.
    ry.set(nx * strength);
    rx.set(-ny * strength);
    rz.set(item.rot * 0.6 + nx * 2.5);
    s.set(0.975);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    rz.set(quest ? 0 : item.rot);
    s.set(1);
  };

  /* Depth → stacking and shadow lift (1 = barely off the table, 3 = high). */
  const lift = 1 + ((item.z + 1) / 2) * 2;

  return (
    <div
      data-item
      data-z={item.z}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onFocusCapture={(e) => {
        // Keyboard only — a mouse click also focuses, and must not jump.
        const t = e.target as HTMLElement;
        if (t.matches(":focus-visible")) onFocusItem(t);
      }}
      style={{
        left: u(item.x),
        top: u(item.y),
        width: u(item.w),
        zIndex: Math.round((item.z + 1) * 10),
        ["--lift" as string]: lift,
      }}
      className={`group/item absolute will-change-transform ${pushes ? "hover:!z-50" : ""}`}
    >
      <div
        className="levitate"
        style={{
          animationDelay: `${-index * 1.37}s`,
          animationDuration: `${6 + (index % 4) * 1.1}s`,
        }}
      >
        <motion.div
          style={{
            rotateX: rx,
            rotateY: ry,
            rotateZ: rz,
            scale: s,
            transformPerspective: 1100,
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function CaseCard({ project, tag }: { project: Project; tag?: string }) {
  const { play, playShift } = useSound();
  const imgRef = useRef<HTMLDivElement>(null);
  const href = project.href ?? "#";

  /* Same cursor-following "view case" pill as the list layout. */
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
    <Link
      href={href}
      data-case={href}
      aria-label={`View use case: ${project.title}`}
      onPointerEnter={playShift}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={() => {
        play(CUE.enterCase);
        sessionStorage.setItem(LAST_CASE_KEY, href);
      }}
      style={{ padding: `${u(2.2)} ${u(2.2)} ${u(2.6)}` }}
      className="lev-shadow group/case relative flex cursor-pointer flex-col rounded-[16px] bg-paper outline outline-1 outline-black/[0.04] transition-[outline-color,outline-width,box-shadow] duration-500 hover:outline-2 hover:outline-accent/70 focus-visible:outline-2 focus-visible:outline-accent dark:outline-white/[0.06]"
    >
      <div
        ref={imgRef}
        data-over="false"
        className="group/img relative aspect-[460/334] w-full overflow-hidden rounded-[8px] bg-surface-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/case:scale-[1.05]"
        />
        <span
          aria-hidden
          style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
          className="pointer-events-none absolute z-20 hidden -translate-x-1/2 -translate-y-1/2 scale-75 items-center gap-1.5 whitespace-nowrap rounded-full bg-paper/95 px-4 py-2 font-serif text-[18px] italic text-accent opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] transition-[opacity,scale] duration-200 ease-out group-data-[over=true]/img:scale-100 group-data-[over=true]/img:opacity-100 [@media(hover:hover)]:flex"
        >
          view case <span className="not-italic">→</span>
        </span>
        {tag && (
          <Tag className="absolute" style={{ top: u(1.4), left: u(1.4) }}>
            {tag}
          </Tag>
        )}
      </div>

      <h3
        style={{ fontSize: u(2.5), marginTop: u(2.1) }}
        className="font-light leading-[1.2] text-sol transition-colors duration-300 group-hover/case:text-accent"
      >
        {project.title}
      </h3>
      <div
        style={{ fontSize: u(1.3), marginTop: u(1.5), gap: u(1.6) }}
        className="flex items-center whitespace-nowrap uppercase tracking-wide text-sol"
      >
        <span>{project.label}</span>
        <span
          style={{ width: u(0.75), height: u(0.75) }}
          className="shrink-0 rounded-full bg-accent"
        />
        <span>{project.period}</span>
      </div>
    </Link>
  );
}

/* Other work — bare photo, no case behind it, so no frame, no link, no pill;
   only the push. */
function WorkCard({ src, caption }: { src: string; caption: string }) {
  return (
    <figure className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={caption}
        draggable={false}
        className="lev-shadow block aspect-[1380/900] w-full rounded-[16px] object-cover"
      />
      <figcaption>
        <Tag className="absolute" style={{ top: u(1.4), left: u(1.4) }}>
          {caption}
        </Tag>
      </figcaption>
    </figure>
  );
}

function StatCard({
  item,
  seed,
}: {
  item: Extract<Item, { kind: "stat" }>;
  seed: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const accent = item.tone === "accent";

  return (
    <div
      ref={ref}
      style={{ padding: u(2.2), gap: u(1.2) }}
      className={`lev-shadow flex flex-col rounded-[16px] ${accent ? "bg-accent text-white" : "bg-paper text-sol"}`}
    >
      <div className="flex items-start justify-between">
        <Tag>{item.from}</Tag>
        {item.figure && (
          <Figure
            kind={item.figure}
            value={item.value}
            play={inView}
            seed={seed}
            className="w-[calc(var(--u)*6.5)]"
          />
        )}
      </div>
      <div
        style={{ fontSize: u(7), marginTop: item.figure ? 0 : u(4) }}
        className={`whitespace-nowrap font-serif font-light leading-none ${accent ? "" : "text-accent"}`}
      >
        {item.prefix}
        <CountUp to={item.value} decimals={item.decimals} play={inView} />
        {item.suffix}
      </div>
      <p
        style={{ fontSize: u(1.6) }}
        className={`whitespace-nowrap leading-[1.3] ${accent ? "text-white/85" : "text-sol-dim"}`}
      >
        {item.label}
      </p>
    </div>
  );
}

/* The one tag style on the board: always in a card's top-left corner, dark
   glass over whatever is behind it, never wrapping. */
function Tag({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{ fontSize: u(1.25), padding: `${u(0.6)} ${u(1.2)}`, ...style }}
      className={`z-10 w-fit whitespace-nowrap rounded-full bg-black/40 font-medium uppercase tracking-wide text-white backdrop-blur-[20px] ${className}`}
    >
      {children}
    </span>
  );
}
