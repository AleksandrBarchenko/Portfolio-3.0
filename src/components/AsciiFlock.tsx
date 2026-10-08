"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* Home-page backdrop: a faint dot grid with a flock of ~800 boids swarming the
   cursor (or drifting on its own when there's no pointer). The flock is never
   drawn directly — each frame its density is rasterised onto the dot grid, so
   thin parts of the swarm read as small squares and the dense core resolves
   into ASCII glyphs. Colours come from the theme tokens (--sol / --accent) and
   the glyphs use the same typewriter face as the hero's decrypting "feelings". */

// Grid pitch in CSS px.
const CELL = 12;
// ASCII density ramp, light → heavy. Its heavy end is the symbol set the
// hero's "feelings" decrypts from, so the two effects speak the same language.
const RAMP = ".:-=+~*/\\<>?!%&$#@";

// Boids, tuned in px per 60fps frame.
const PERCEPTION = 96;
const SEPARATION = 42;
const MAX_SPEED = 6.2;
const MAX_FORCE = 0.68;
const W_SEP = 1.9;
const W_ALI = 1;
const W_COH = 0.45;
const W_ATTRACT = 0.8;
// Neighbours sampled per bird — enough for flocking, bounded cost in a clump.
const MAX_NEIGHBOURS = 18;

// Birds per cell that count as "full" density, and how quickly a cell lights
// up vs. fades back to a dot (the fade leaves a short trail behind the swarm).
const FULL = 2.2;
const ATTACK = 0.45;
const RELEASE = 0.06;
// Dots within this radius of the cursor brighten, like a torch over the grid.
const LIGHT_R = 170;

// Deterministic per-cell hash in [0, 1).
function hash(n: number) {
  let t = (n | 0) >>> 0;
  t ^= t >>> 15;
  t = Math.imul(t, 2246822519);
  t ^= t >>> 13;
  t = Math.imul(t, 3266489917);
  t ^= t >>> 16;
  return (t >>> 0) / 4294967296;
}

function readTheme() {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: css.getPropertyValue("--sol").trim() || "#252525",
    accent: css.getPropertyValue("--accent").trim() || "#926868",
    font: css.getPropertyValue("--font-serif").trim() || "monospace",
  };
}

// How long the flock keeps moving after `running` turns off, so it doesn't
// freeze mid-swarm while its layer is still fading out.
const STOP_DELAY = 800;

export function AsciiFlock({
  running = true,
  className,
}: {
  running?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const runningRef = useRef(running);
  const ctl = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let theme = readTheme();
    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let dens = new Float32Array(0);
    let dots: HTMLCanvasElement | null = null;

    // Birds (struct-of-arrays).
    let n = 0;
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let cruise = new Float32Array(0);
    // Spatial hash for neighbour lookup (counting sort into buckets).
    let hCols = 0;
    let hRows = 0;
    let starts = new Int32Array(0);
    let entries = new Int32Array(0);
    let bucket = new Int32Array(0);

    // Pointer, in canvas space. `light` eases after it for the dot torch.
    const pointer = { x: 0, y: 0, in: false };
    const light = { x: 0, y: 0, a: 0 };

    const seedBirds = (count: number) => {
      const nx = new Float32Array(count);
      const ny = new Float32Array(count);
      const nvx = new Float32Array(count);
      const nvy = new Float32Array(count);
      const nc = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        if (i < n) {
          nx[i] = px[i];
          ny[i] = py[i];
          nvx[i] = vx[i];
          nvy[i] = vy[i];
          nc[i] = cruise[i];
          continue;
        }
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 2;
        nx[i] = w * (0.25 + Math.random() * 0.5);
        ny[i] = h * (0.3 + Math.random() * 0.4);
        nvx[i] = Math.cos(a) * s;
        nvy[i] = Math.sin(a) * s;
        nc[i] = 0.6 + Math.random() * 0.4;
      }
      n = count;
      px = nx;
      py = ny;
      vx = nvx;
      vy = nvy;
      cruise = nc;
      entries = new Int32Array(count);
      bucket = new Int32Array(count);
    };

    const paintDots = () => {
      dots = document.createElement("canvas");
      dots.width = canvas.width;
      dots.height = canvas.height;
      const d = dots.getContext("2d")!;
      d.scale(dpr, dpr);
      d.fillStyle = theme.ink;
      d.globalAlpha = 0.11;
      const s = 1.5;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          d.fillRect(c * CELL + (CELL - s) / 2, r * CELL + (CELL - s) / 2, s, s);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      // Keep the swarm where it was, proportionally, across resizes.
      if (w && h) {
        for (let i = 0; i < n; i++) {
          px[i] *= nw / w;
          py[i] *= nh / h;
        }
      }
      w = nw;
      h = nh;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      heat = new Float32Array(cols * rows);
      dens = new Float32Array(cols * rows);
      hCols = Math.ceil(w / PERCEPTION);
      hRows = Math.ceil(h / PERCEPTION);
      starts = new Int32Array(hCols * hRows + 1);
      seedBirds(Math.min(w < 1024 ? 380 : 820, Math.round((w * h) / 1500)));
      paintDots();
    };

    const flock = (dt: number, t: number) => {
      // Target: the cursor while it's in the window, otherwise a slow drift.
      const tx = pointer.in ? pointer.x : w * (0.52 + 0.3 * Math.sin(t * 0.00019));
      const ty = pointer.in ? pointer.y : h * (0.5 + 0.24 * Math.sin(t * 0.00031 + 1.3));

      starts.fill(0);
      for (let i = 0; i < n; i++) {
        const c = Math.min(hCols - 1, Math.max(0, (px[i] / PERCEPTION) | 0));
        const r = Math.min(hRows - 1, Math.max(0, (py[i] / PERCEPTION) | 0));
        const b = c + r * hCols;
        bucket[i] = b;
        starts[b + 1]++;
      }
      for (let b = 0; b < hCols * hRows; b++) starts[b + 1] += starts[b];
      const fill = starts.slice(0, -1);
      for (let i = 0; i < n; i++) entries[fill[bucket[i]]++] = i;

      const P2 = PERCEPTION * PERCEPTION;
      const S2 = SEPARATION * SEPARATION;
      // Reynolds steering: head along (dx, dy) at full speed, force-limited.
      // Accumulates into fx/fy (declared per bird below) to stay allocation-free.
      let fx = 0;
      let fy = 0;
      const steer = (dx: number, dy: number, i: number, weight: number) => {
        const m = Math.hypot(dx, dy);
        if (!m) return;
        let sx = (dx / m) * MAX_SPEED - vx[i];
        let sy = (dy / m) * MAX_SPEED - vy[i];
        const f = Math.hypot(sx, sy);
        if (f > MAX_FORCE) {
          sx = (sx / f) * MAX_FORCE;
          sy = (sy / f) * MAX_FORCE;
        }
        fx += sx * weight;
        fy += sy * weight;
      };

      for (let i = 0; i < n; i++) {
        const x = px[i];
        const y = py[i];
        const bc = bucket[i] % hCols;
        const br = (bucket[i] / hCols) | 0;
        let count = 0;
        let ax = 0;
        let ay = 0;
        let cx = 0;
        let cy = 0;
        let sx = 0;
        let sy = 0;
        let sn = 0;
        scan: for (let r = Math.max(0, br - 1); r <= Math.min(hRows - 1, br + 1); r++) {
          for (let c = Math.max(0, bc - 1); c <= Math.min(hCols - 1, bc + 1); c++) {
            const b = c + r * hCols;
            for (let k = starts[b]; k < starts[b + 1]; k++) {
              const j = entries[k];
              if (j === i) continue;
              const dx = px[j] - x;
              const dy = py[j] - y;
              const d2 = dx * dx + dy * dy;
              if (d2 > P2) continue;
              count++;
              ax += vx[j];
              ay += vy[j];
              cx += dx;
              cy += dy;
              if (d2 < S2 && d2 > 0) {
                sx -= dx / d2;
                sy -= dy / d2;
                sn++;
              }
              if (count >= MAX_NEIGHBOURS) break scan;
            }
          }
        }

        fx = 0;
        fy = 0;
        if (count) {
          steer(ax, ay, i, W_ALI);
          steer(cx, cy, i, W_COH);
        }
        if (sn) steer(sx, sy, i, W_SEP);
        steer(tx - x, ty - y, i, W_ATTRACT);
        // Keep the swarm on the canvas with a soft push back from the edges.
        if (x < 0) fx += 0.3;
        else if (x > w) fx -= 0.3;
        if (y < 0) fy += 0.3;
        else if (y > h) fy -= 0.3;

        let nvx = vx[i] + fx * dt;
        let nvy = vy[i] + fy * dt;
        const sp = Math.hypot(nvx, nvy);
        const max = MAX_SPEED * cruise[i];
        if (sp > max) {
          nvx = (nvx / sp) * max;
          nvy = (nvy / sp) * max;
        }
        vx[i] = nvx;
        vy[i] = nvy;
        px[i] = x + nvx * dt;
        py[i] = y + nvy * dt;
      }
    };

    const draw = (dt: number, t: number) => {
      // Rasterise the flock: a bird counts fully in its own cell and a little
      // in the four around it, so the swarm's edge reads soft rather than blocky.
      dens.fill(0);
      for (let i = 0; i < n; i++) {
        const c = (px[i] / CELL) | 0;
        const r = (py[i] / CELL) | 0;
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        const k = c + r * cols;
        dens[k] += 1;
        if (c > 0) dens[k - 1] += 0.3;
        if (c < cols - 1) dens[k + 1] += 0.3;
        if (r > 0) dens[k - cols] += 0.3;
        if (r < rows - 1) dens[k + cols] += 0.3;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (dots) ctx.drawImage(dots, 0, 0, w, h);

      // Torch: brighten the plain dots around the cursor.
      light.a += ((pointer.in ? 1 : 0) - light.a) * Math.min(1, 0.06 * dt);
      light.x += (pointer.x - light.x) * Math.min(1, 0.18 * dt);
      light.y += (pointer.y - light.y) * Math.min(1, 0.18 * dt);
      ctx.fillStyle = theme.ink;
      if (light.a > 0.01) {
        const c0 = Math.max(0, ((light.x - LIGHT_R) / CELL) | 0);
        const c1 = Math.min(cols - 1, ((light.x + LIGHT_R) / CELL) | 0);
        const r0 = Math.max(0, ((light.y - LIGHT_R) / CELL) | 0);
        const r1 = Math.min(rows - 1, ((light.y + LIGHT_R) / CELL) | 0);
        for (let r = r0; r <= r1; r++)
          for (let c = c0; c <= c1; c++) {
            const d = Math.hypot(c * CELL + CELL / 2 - light.x, r * CELL + CELL / 2 - light.y);
            if (d >= LIGHT_R) continue;
            const f = 1 - d / LIGHT_R;
            ctx.globalAlpha = f * f * 0.22 * light.a;
            ctx.fillRect(c * CELL + CELL / 2 - 1, r * CELL + CELL / 2 - 1, 2, 2);
          }
      }

      ctx.font = `${CELL + 1}px ${theme.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const ease = (k: number) => Math.min(1, k * dt);
      for (let k = 0; k < heat.length; k++) {
        const target = Math.min(1, dens[k] / FULL);
        heat[k] += (target - heat[k]) * ease(target > heat[k] ? ATTACK : RELEASE);
        const v = heat[k];
        if (v < 0.07) continue;
        const c = k % cols;
        const r = (k / cols) | 0;
        const cxp = c * CELL + CELL / 2;
        const cyp = r * CELL + CELL / 2;
        const hk = hash(k);
        // Dense cells become glyphs (more of them the denser it gets); each
        // glyph re-rolls on its own slow clock so the core flickers like a
        // terminal rather than every cell changing in step.
        if (v > 0.55 && hk < (v - 0.5) * 1.1) {
          const slot = Math.floor(t / 170 + hk * 13);
          const jitter = (hash(k * 31 + slot) - 0.5) * 10;
          const idx = Math.max(0, Math.min(RAMP.length - 1, Math.round(v * 0.7 * (RAMP.length - 1) + jitter)));
          const hot = v > 0.86 && hk < 0.12;
          ctx.fillStyle = hot ? theme.accent : theme.ink;
          ctx.globalAlpha = hot ? 0.85 : 0.2 + v * 0.4;
          ctx.fillText(RAMP[idx], cxp, cyp + 1);
          ctx.fillStyle = theme.ink;
        } else {
          const s = 1.5 + v * CELL * 0.42;
          ctx.globalAlpha = 0.1 + v * 0.3;
          ctx.fillRect(cxp - s / 2, cyp - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();

    // Reduced motion: just the still dot grid, no flock.
    const paintStill = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (dots) ctx.drawImage(dots, 0, 0);
    };

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(2.5, (now - last) / (1000 / 60)) : 1;
      last = now;
      flock(dt, now);
      draw(dt, now);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduce) return paintStill();
      if (raf || !runningRef.current || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) paintStill();
    });
    ro.observe(canvas);

    // Only animate while `running` and the tab is visible.
    ctl.current = { start, stop };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // The canvas is pointer-events-none under the content, so track the
    // pointer on the window and map it into canvas space.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.in = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) pointer.in = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onLeave);

    // Re-read the palette when the theme flips.
    const mo = new MutationObserver(() => {
      theme = readTheme();
      paintDots();
      if (reduce) paintStill();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    start();
    return () => {
      stop();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onLeave);
      ctl.current = null;
    };
  }, [reduce]);

  useEffect(() => {
    runningRef.current = running;
    if (running) {
      ctl.current?.start();
      return;
    }
    const t = window.setTimeout(() => ctl.current?.stop(), STOP_DELAY);
    return () => window.clearTimeout(t);
  }, [running]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className ?? ""}`} />;
}
