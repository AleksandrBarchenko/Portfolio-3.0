"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useSpring } from "framer-motion";

/* Headline metrics for the case studies. Borderless — each stat is a big serif
   number and label beside a small animated figure. Every figure is drawn from
   the same vocabulary (2px round-capped accent strokes, faint ghost strokes)
   but tells its own idea:

     time       clock dial — ticks sweep to 100%, the hand winds back to the cut
     resources  10×10 grid of "/" units — the cut share collapses to ghosts
     load       voice waveform — the cut share of the "calls" falls silent
     growth     tick spiral — a full lap (the base) plus the gain on a new lap
     success    10×10 grid of "\" — the gain rotates up into "/"
     rating     five-point star of spokes = one point — the gain share lights up
     count      ring of N ticks trailing off into faint ones — "N and more"
     split      one ring that parts into two halves
     pair       one ring that separates into two overlapping rings

   Each figure fills in, pauses, then plays its change; afterwards a soft glint
   keeps it alive. Numbers count up once the block scrolls into view. */
export type StatKind =
  | "time"
  | "resources"
  | "load"
  | "growth"
  | "success"
  | "rating"
  | "count"
  | "split"
  | "pair";

export type CaseStat = {
  /** Magnitude shown and fed to the figure, e.g. 30 for "−30%", 0.5 for "+0.5". */
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  kind: StatKind;
};

export function CountUp({
  to,
  decimals = 0,
  play,
}: {
  to: number;
  decimals?: number;
  play: boolean;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(to);
      return;
    }
    if (!play) return;
    let raf = 0;
    const dur = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setN(eased * to);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, reduce, to]);

  return <>{n.toFixed(decimals)}</>;
}

const STROKE = 2;

// Timeline (seconds from reveal): the figure fills in, pauses, then plays its
// change (a cut retracting, a gain appearing, a ring parting…).
const SWEEP = 1.2;
const HOLD = 0.35;
const CHANGE = 0.9;

const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Frame = {
  ctx: CanvasRenderingContext2D;
  size: number;
  accent: string;
  sol: string;
  value: number;
  /** Eased 0..1 progress of each phase. */
  sweep: number;
  change: number;
  idle: number;
  /** Seconds since reveal (+ seed); 0 under reduced motion. */
  el: number;
};

/* Staggered per-unit progress: unit `order` of `count` starts after the ones
   before it, so a 0..1 phase plays as a wave rather than all at once. */
const wave = (phase: number, order: number, count: number, soft = 1) =>
  clamp01((phase * (count + soft) - order) / soft);

/* Soft gaussian bump used by every idle glint. */
const bump = (d: number, width: number) => Math.exp(-(d * d) / width);

function line(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function setStroke(f: Frame, color: string, alpha: number) {
  f.ctx.strokeStyle = color;
  f.ctx.globalAlpha = alpha;
}

/* ── time: clock dial ─────────────────────────────────────────────────────
   100 radial ticks and a hand: the hand rides the sweep to 12 o'clock, then
   winds back with the cut to rest on it — time literally turned back. */
function paintDial(f: Frame) {
  const { ctx, size, accent, sol, sweep, change, idle } = f;
  const cut = Math.round(100 - f.value);
  const glint = ((f.el / 3.2) % 1) * cut;
  const c = size / 2;
  // Leave headroom past the rim for the glint to lengthen ticks into.
  const outer = (c - STROKE) * 0.92;
  const inner = outer * 0.74;

  for (let i = 0; i < 100; i++) {
    const on = clamp01(sweep * 100 - i);
    if (on <= 0) continue;
    const a = -Math.PI / 2 + (i / 100) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    let len = 1;
    let accentA = on;
    let ghostA = 0;
    if (i >= cut) {
      // Retract from the far end back toward the cut, one tick at a time.
      const k = wave(change, 99 - i, 100 - cut);
      len = 1 - 0.6 * k;
      accentA = on * (1 - k);
      ghostA = on * k * 0.18;
    } else if (idle > 0) {
      let d = Math.abs(i - glint);
      d = Math.min(d, cut - d);
      const g = bump(d, 18);
      accentA = on * (1 - idle * 0.3 * (1 - g));
      len = 1 + idle * 0.3 * g;
    }

    // Accent ticks grow outward from the inner radius; ghosts hug the rim.
    const reach = (outer - inner) * len;
    if (accentA > 0) {
      setStroke(f, accent, accentA);
      line(ctx, c + cos * inner, c + sin * inner, c + cos * (inner + reach), c + sin * (inner + reach));
    }
    if (ghostA > 0) {
      setStroke(f, sol, ghostA);
      line(ctx, c + cos * (outer - reach), c + sin * (outer - reach), c + cos * outer, c + sin * outer);
    }
  }

  if (sweep > 0) {
    const turn = sweep - change * (1 - cut / 100);
    const ha = -Math.PI / 2 + turn * Math.PI * 2;
    setStroke(f, accent, clamp01(sweep * 4));
    line(ctx, c, c, c + Math.cos(ha) * inner * 0.78, c + Math.sin(ha) * inner * 0.78);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(c, c, STROKE * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Shared 10×10 layout for the grid figures. */
const GRID = 10;
function gridCell(size: number, i: number) {
  const pad = STROKE * 2;
  const pitch = (size - pad * 2) / GRID;
  const row = Math.floor(i / GRID);
  const col = i % GRID;
  return {
    cx: pad + pitch * (col + 0.5),
    cy: pad + pitch * (row + 0.5),
    diag: row + col, // 0..18
    reach: pitch * 0.3, // half the stroke's extent along each axis
  };
}
// Glint travelling the grid diagonal and wrapping, one pass every ~3.2s.
const gridGlint = (el: number) => ((el / 3.2) % 1) * (GRID * 2 + 6) - 3;

/* ── resources: grid of units ─────────────────────────────────────────────
   One "/" per percent: strokes draw in along a diagonal wave, then the cut
   share collapses from the bottom into short faint ghosts. */
function paintGrid(f: Frame) {
  const { ctx, size, accent, sol, sweep, change, idle } = f;
  const cut = Math.round(100 - f.value);
  const glint = gridGlint(f.el);

  for (let i = 0; i < 100; i++) {
    const { cx, cy, diag, reach } = gridCell(size, i);
    const on = easeInOut(wave(sweep, diag, GRID * 2, 2));
    if (on <= 0) continue;

    const k = i < cut ? 0 : wave(change, 99 - i, 100 - cut);
    let len = on * (1 - 0.6 * k);
    let accentA = 1 - k;
    if (i < cut && idle > 0) {
      const g = bump(diag - glint, 3);
      accentA = 1 - idle * 0.35 * (1 - g);
      len *= 1 + idle * 0.3 * g;
    }

    if (accentA > 0) {
      setStroke(f, accent, accentA);
      const r = reach * len;
      line(ctx, cx - r, cy + r, cx + r, cy - r);
    }
    if (k > 0) {
      setStroke(f, sol, k * 0.18);
      const r = reach * 0.4;
      line(ctx, cx - r, cy + r, cx + r, cy - r);
    }
  }
}

/* ── success: strokes turning upward ──────────────────────────────────────
   Every unit starts as a faint "\"; the gain share — scattered across the
   grid — rotates up through flat into a bright "/". */
function scatterOrder(n: number, seed: number) {
  // Deterministic shuffle (LCG) so the scatter is stable across renders.
  const idx = Array.from({ length: n }, (_, i) => i);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const order = new Array<number>(n);
  idx.forEach((cell, rank) => (order[cell] = rank));
  return order;
}
const SUCCESS_ORDER = scatterOrder(100, 7);

function paintFlip(f: Frame) {
  const { ctx, size, accent, sweep, change, idle } = f;
  const gain = Math.round(f.value);
  const glint = gridGlint(f.el);

  for (let i = 0; i < 100; i++) {
    const { cx, cy, diag, reach } = gridCell(size, i);
    const on = easeInOut(wave(sweep, diag, GRID * 2, 2));
    if (on <= 0) continue;

    const rank = SUCCESS_ORDER[i];
    const k = rank < gain ? easeInOut(wave(change, rank, gain, 4)) : 0;
    // Angle of the stroke's "right" end: +45° is "\", −45° is "/".
    const ang = (Math.PI / 4) * (1 - 2 * k);
    let len = on;
    let alpha = 0.28 + 0.72 * k;
    if (k > 0 && idle > 0) {
      const g = bump(diag - glint, 3);
      alpha = 1 - idle * 0.3 * (1 - g);
      len *= 1 + idle * 0.3 * g;
    }

    const r = reach * Math.SQRT2 * len;
    const dx = Math.cos(ang) * r;
    const dy = Math.sin(ang) * r;
    setStroke(f, accent, alpha);
    line(ctx, cx - dx, cy - dy, cx + dx, cy + dy);
  }
}

/* ── load: voice waveform ─────────────────────────────────────────────────
   Bars mirrored about the midline, moving like live audio; the cut share of
   the bars (from the right) falls silent into flat ghosts. */
const BARS = 40;
function paintWave(f: Frame) {
  const { ctx, size, accent, sol, sweep, change } = f;
  const cut = Math.round(BARS * (1 - f.value / 100));
  const t = f.el;
  const pitch = (size - STROKE * 2) / (BARS - 1);
  const mid = size / 2;
  const maxHalf = size * 0.4;

  for (let i = 0; i < BARS; i++) {
    const on = easeInOut(wave(sweep, i, BARS, 8));
    if (on <= 0) continue;
    const u = i / (BARS - 1);
    const a = 0.5 + 0.5 * Math.sin(i * 0.45 - t * 2.2);
    const b = 0.5 + 0.5 * Math.sin(i * 0.13 + t * 0.9 + 1.7);
    const env = Math.pow(Math.sin(Math.PI * (0.08 + u * 0.84)), 0.6);
    const amp = (0.15 + 0.85 * a * b) * (0.35 + 0.65 * env) * on;
    const x = STROKE + i * pitch;

    const k = i < cut ? 0 : wave(change, BARS - 1 - i, BARS - cut);
    if (k < 1) {
      const half = Math.max(STROKE / 2, amp * maxHalf * (1 - k));
      setStroke(f, accent, (0.45 + 0.55 * a) * (1 - k));
      line(ctx, x, mid - half, x, mid + half);
    }
    if (k > 0) {
      setStroke(f, sol, 0.18 * k);
      line(ctx, x, mid - 3, x, mid + 3);
    }
  }
}

/* ── growth: tick spiral ──────────────────────────────────────────────────
   100 ticks make one full lap (the existing base, softly); the gain carries
   on around a second, outer lap in full accent. The spiral turns slowly. */
function paintSpiral(f: Frame) {
  const { ctx, size, accent, sweep, change, idle } = f;
  const gain = Math.round(f.value);
  const c = size / 2;
  const R = c - STROKE;
  const L = R * 0.13;
  const r0 = R * 0.56;
  const dr = L * 1.5; // radial step per lap — clears the tick length
  const rot = f.el * 0.06;
  const glint = ((f.el / 2.4) % 1) * (gain + 8) - 4;

  for (let i = 0; i < 100 + gain; i++) {
    const isGain = i >= 100;
    const on = isGain
      ? easeInOut(wave(change, i - 100, gain, 3))
      : clamp01(sweep * 100 - i);
    if (on <= 0) continue;

    const a = -Math.PI / 2 + (i / 100) * Math.PI * 2 + rot;
    const r = r0 + (i / 100) * dr;
    let len = on;
    let alpha = isGain ? 1 : 0.28 * on;
    if (isGain && idle > 0) {
      const g = bump(i - 100 - glint, 6);
      alpha = 1 - idle * 0.3 * (1 - g);
      len *= 1 + idle * 0.3 * g;
    }
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    setStroke(f, accent, alpha);
    line(ctx, c + cos * r, c + sin * r, c + cos * (r + L * len), c + sin * (r + L * len));
  }
}

/* ── rating: star of spokes ───────────────────────────────────────────────
   One five-point star drawn as radial spokes whose lengths trace the star's
   outline. The star stands for one rating point: the gain share of it (0.5 →
   half, clockwise from the top point) lights up; the rest stays faint. */
const STAR_SPOKES = 60;
function paintStar(f: Frame) {
  const { ctx, size, accent, sweep, change, idle } = f;
  const lit = Math.round(clamp01(f.value) * STAR_SPOKES);
  const c = size / 2;
  const R = (c - STROKE) * 0.96;
  const valley = R * 0.42; // radius between the points
  const hub = R * 0.22;
  const glint = ((f.el / 2.4) % 1) * (lit + 10) - 5;

  for (let i = 0; i < STAR_SPOKES; i++) {
    const on = clamp01(sweep * STAR_SPOKES - i);
    if (on <= 0) continue;
    const u = i / STAR_SPOKES;
    // Exact outline of a regular five-point star at this angle: distance to
    // the straight edge between the nearest point and valley.
    const seg = (u * 10) % 2; // 0 at a point, 1 at a valley
    const t = seg <= 1 ? seg : 2 - seg;
    const phi = (t * Math.PI) / 5; // angle away from the point
    const alpha0 = Math.atan2(valley * Math.sin(Math.PI / 5), R - valley * Math.cos(Math.PI / 5));
    const edge = (R * Math.sin(alpha0)) / Math.sin(alpha0 + phi);

    const k = i < lit ? easeInOut(wave(change, i, lit, 3)) : 0;
    let alpha = 0.28 + 0.72 * k;
    let len = on;
    if (k > 0 && idle > 0) {
      const g = bump(i - glint, 8);
      alpha = 1 - idle * 0.3 * (1 - g);
      len *= 1 + idle * 0.06 * g;
    }

    const a = -Math.PI / 2 + u * Math.PI * 2;
    const tip = hub + (edge - hub) * len;
    setStroke(f, accent, alpha);
    line(ctx, c + Math.cos(a) * hub, c + Math.sin(a) * hub, c + Math.cos(a) * tip, c + Math.sin(a) * tip);
  }
}

/* ── count: "N and more" ring ─────────────────────────────────────────────
   N long ticks spaced around a ring, then a trail of fading ticks for the
   "+", which appears with the change. */
function paintCount(f: Frame) {
  const { ctx, size, accent, sweep, change, idle } = f;
  const n = Math.round(f.value);
  const trail = Math.max(3, Math.round(n * 0.3));
  const slots = n + trail;
  const c = size / 2;
  const outer = (c - STROKE) * 0.92;
  const inner = outer * 0.58;
  const glint = ((f.el / 3.2) % 1) * n;

  for (let i = 0; i < slots; i++) {
    const isTrail = i >= n;
    const on = isTrail
      ? wave(change, i - n, trail, 2)
      : easeInOut(wave(sweep, i, n, 2));
    if (on <= 0) continue;
    let alpha = isTrail ? on * 0.5 * (1 - (i - n + 1) / (trail + 1)) : 1;
    let len = isTrail ? on * 0.5 : on;
    if (!isTrail && idle > 0) {
      let d = Math.abs(i - glint);
      d = Math.min(d, n - d);
      const g = bump(d, 2);
      alpha = 1 - idle * 0.3 * (1 - g);
      len *= 1 + idle * 0.2 * g;
    }
    const a = -Math.PI / 2 + (i / slots) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const r1 = inner + (outer - inner) * len;
    setStroke(f, accent, alpha);
    line(ctx, c + cos * inner, c + sin * inner, c + cos * r1, c + sin * r1);
  }
}

/* Draws a ring of radial ticks around (cx, cy); `from`/`to` in turns (0..1,
   starting at 12 o'clock) limit it to an arc. */
function tickRing(
  f: Frame,
  cx: number,
  cy: number,
  r: number,
  len: number,
  ticks: number,
  from: number,
  to: number,
  alphaAt: (u: number) => number,
) {
  for (let i = 0; i < ticks; i++) {
    const u = from + ((i + 0.5) / ticks) * (to - from);
    const alpha = alphaAt(u);
    if (alpha <= 0) continue;
    const a = -Math.PI / 2 + u * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    setStroke(f, f.accent, alpha);
    line(f.ctx, cx + cos * r, cy + sin * r, cx + cos * (r + len), cy + sin * (r + len));
  }
}

/* Idle glint alpha for a ring position `u` (turns), orbiting at `speed`. */
const ringGlint = (f: Frame, u: number, speed: number) => {
  if (f.idle <= 0) return 1;
  let d = Math.abs(u - ((f.el * speed) % 1 + 1) % 1);
  d = Math.min(d, 1 - d);
  return 1 - f.idle * 0.35 * (1 - bump(d * 20, 1.5));
};

/* ── split: one ring parting in two ───────────────────────────────────────
   A full tick ring that, with the change, opens at top and bottom and its
   halves drift apart — one product, two parts. */
function paintSplit(f: Frame) {
  const { size, sweep, change } = f;
  const c = size / 2;
  const R = (c - STROKE) * 0.62;
  const L = R * 0.36;
  const shift = change * R * 0.28;
  const gap = change * 0.035; // turns trimmed from each end of each half

  for (const side of [0, 1]) {
    const from = side * 0.5 + gap;
    const to = side * 0.5 + 0.5 - gap;
    const cx = c + (side === 0 ? shift : -shift);
    tickRing(f, cx, c, R, L, 36, from, to, (u) => {
      const on = clamp01(sweep * 72 - u * 72);
      return on * ringGlint(f, u, side === 0 ? 0.25 : -0.25);
    });
  }
}

/* ── pair: one ring becoming two ──────────────────────────────────────────
   A single tick ring that, with the change, separates into two overlapping
   rings — two people, one product. Each glint orbits the other way. */
function paintPair(f: Frame) {
  const { size, sweep, change } = f;
  const c = size / 2;
  const R = (c - STROKE) * 0.5;
  const L = R * 0.26;
  const shift = easeInOut(change) * R * 0.5;

  for (const side of [-1, 1]) {
    tickRing(f, c + side * shift, c, R, L, 48, 0, 1, (u) => {
      const on = clamp01(sweep * 48 - u * 48);
      // Before the change the two rings coincide — draw only one.
      const show = side === -1 ? 1 : clamp01(change * 4);
      return on * show * ringGlint(f, u, side * 0.2);
    });
  }
}

const PAINTERS: Record<StatKind, (f: Frame) => void> = {
  time: paintDial,
  resources: paintGrid,
  load: paintWave,
  growth: paintSpiral,
  success: paintFlip,
  rating: paintStar,
  count: paintCount,
  split: paintSplit,
  pair: paintPair,
};

/* Canvas shell shared by every figure: DPR sizing, theme colours, the reveal
   timeline, and an rAF loop that only runs while on screen. */
export function Figure({
  kind,
  value,
  play,
  seed,
  className,
  accentColor,
  solColor,
}: {
  kind: StatKind;
  value: number;
  play: boolean;
  seed: number;
  className: string;
  /* Override the theme colours — used by accent-toned cards, where the figure
     must draw in white instead of the (now invisible) accent red. */
  accentColor?: string;
  solColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();
  const visible = useInView(canvasRef, { amount: 0 });
  // Survives effect re-runs (scrolling away and back) so the reveal plays once.
  const introStart = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let size = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const root = document.documentElement;
    const paint = PAINTERS[kind];
    let raf = 0;

    const draw = (now: number) => {
      const css = getComputedStyle(root);
      if (play && introStart.current === null) introStart.current = now;
      const el = reduce
        ? Infinity
        : introStart.current === null
          ? 0
          : (now - introStart.current) / 1000;

      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = "round";
      ctx.lineWidth = STROKE;
      paint({
        ctx,
        size,
        accent: accentColor ?? (css.getPropertyValue("--accent").trim() || "#926868"),
        sol: solColor ?? (css.getPropertyValue("--sol").trim() || "#252525"),
        value,
        sweep: easeInOut(clamp01(el / SWEEP)),
        change: easeInOut(clamp01((el - SWEEP - HOLD) / CHANGE)),
        idle: reduce ? 0 : clamp01((el - SWEEP - HOLD - CHANGE) / 0.8),
        el: reduce ? 0 : el + seed,
      });
      ctx.globalAlpha = 1;

      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [kind, value, play, reduce, seed, visible, accentColor, solColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`block aspect-square shrink-0 ${className}`}
    />
  );
}

/* Resting tilts and a gentle vertical stagger, cycled by index, so a row of
   cards reads as a loose collage pinned to the page rather than a rigid grid —
   the same "floating on a table" language as the home-page works board. */
const TILTS = [-3, 2.5, -2, 3];
const OFFSETS = ["lg:mt-0", "lg:mt-10", "lg:mt-4", "lg:mt-12"];

/* One headline metric as a floating card: a paper tile with the red-tinted
   levitation shadow and idle bob, a resting tilt, and a 3D "push" toward the
   cursor — lifted straight from the works-board StatCard so the case studies
   and the home page share one vocabulary. The card is a size container: narrow,
   the figure sits above a big serif number; wide enough (two-up rows), the
   figure moves to the right and grows. Numbers count up on scroll-in. */
function FloatingStat({
  stat,
  index,
  play,
}: {
  stat: CaseStat;
  index: number;
  play: boolean;
}) {
  const tilt = useReducedMotion();
  const rot = TILTS[index % TILTS.length];
  // Mix accent-red tiles into the white ones — roughly one in three, matching
  // the works board's blend of paper and accent stat cards.
  const accent = index % 3 === 1;

  const spring = { stiffness: 170, damping: 18, mass: 0.6 };
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const rz = useSpring(rot, spring);
  const s = useSpring(1, spring);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tilt || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    // The point under the cursor sinks toward the table.
    ry.set(nx * 8);
    rx.set(-ny * 8);
    rz.set(rot * 0.6 + nx * 2.5);
    s.set(0.975);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    rz.set(rot);
    s.set(1);
  };

  return (
    <div
      // --u / --lift scale the levitation shadow and bob for this standalone
      // context (off the board's container-query unit).
      style={{ ["--u" as string]: "9px", ["--lift" as string]: 2.2 }}
      className={`group/item @container w-full [perspective:1100px] ${OFFSETS[index % OFFSETS.length]}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div
        className="levitate"
        style={{
          animationDelay: `${-index * 1.37}s`,
          animationDuration: `${6 + (index % 4) * 1.1}s`,
        }}
      >
        <motion.div
          style={{ rotateX: rx, rotateY: ry, rotateZ: rz, scale: s }}
          className={`lev-shadow flex flex-col gap-5 rounded-[20px] p-7 sm:p-8 @[480px]:flex-row @[480px]:items-center @[480px]:justify-between @[480px]:gap-8 @[480px]:p-10 ${
            accent
              ? "bg-accent text-white"
              : "bg-paper outline outline-1 outline-black/[0.04] dark:outline-white/[0.06]"
          }`}
        >
          <Figure
            kind={stat.kind}
            value={stat.value}
            play={play}
            seed={index * 1.3}
            className="w-[60px] sm:w-[72px] @[480px]:order-last @[480px]:w-[150px] @[600px]:w-[190px]"
            accentColor={accent ? "#ffffff" : undefined}
            solColor={accent ? "#ffffff" : undefined}
          />
          <div className="flex flex-col gap-2">
            <div
              className={`whitespace-nowrap font-serif text-[clamp(44px,5.5vw,72px)] font-light leading-none ${accent ? "" : "text-accent"}`}
            >
              {stat.prefix}
              <CountUp to={stat.value} decimals={stat.decimals} play={play} />
              {stat.suffix}
            </div>
            <p className={`text-[16px] leading-[1.4] ${accent ? "text-white/85" : "text-sol-dim"}`}>
              {stat.label}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function CaseStats({ stats }: { stats: CaseStat[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  // Cards float two-up on small screens; three or four stats open out to their
  // own column on wide ones.
  const cols = stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : "";

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 ${cols}`}
    >
      {stats.map((s, i) => (
        <FloatingStat key={s.label} stat={s} index={i} play={inView} />
      ))}
    </div>
  );
}

export default CaseStats;
