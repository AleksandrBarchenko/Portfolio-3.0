"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Section = "hero" | "video" | "projects" | "skills" | "cta";

// Whole-page background per section. The fixed backdrop AND the sticky header
// both read from this single map so they are always the exact same colour —
// there is no second source of truth that could drift out of sync.
export const PAGE_BG: Record<Section, string> = {
  hero: "var(--paper)",
  video: "var(--surface-2)",
  projects: "var(--paper)",
  skills: "var(--surface-2)",
  cta: "var(--paper)",
};

// Shared colour transition — MUST be identical everywhere it's applied so the
// header and backdrop ease in perfect lockstep (no visible seam, either way).
export const BG_TRANSITION = "transition-colors duration-700 ease-in-out";

const Ctx = createContext<Section>("hero");
export const useActiveSection = () => useContext(Ctx);

/* Single IntersectionObserver for the whole page: whichever section owns the
   centre of the viewport is "active". Every colour-changing surface reads this
   one value, so they all switch on the same React commit. */
export function ActiveSectionProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Section>("hero");

  useEffect(() => {
    const ids: Section[] = ["hero", "video", "projects", "skills", "cta"];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(e.target.id as Section);
      },
      { rootMargin: "-49% 0px -49% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return <Ctx.Provider value={active}>{children}</Ctx.Provider>;
}
