"use client";

// import { ThemeToggle } from "./ThemeToggle";
import { TypeOnHover } from "./TypeOnHover";
import { SHELL } from "./shell";
import { useActiveSection, PAGE_BG, BG_TRANSITION } from "./ActiveSection";
import { useSound } from "./sound/SoundProvider";
import { SoundToggle } from "./sound/SoundToggle";

/* Only three destinations. `match` lists the section ids that light this item
   up as the active one (hero has none → no menu item is active on the hero). */
const NAV: {
  label: string;
  href: string;
  match: string[];
  external?: boolean;
}[] = [
  { label: "work", href: "#projects", match: ["video", "projects"] },
  { label: "contact", href: "#cta", match: ["cta"] },
  {
    label: "resume",
    href: "/alex-barchenko-resume.pdf",
    match: [] as string[],
    external: true,
  },
];

/* Shared page gutter, re-exported for existing client imports. Server
   components must import it from "@/components/shell" instead. */
export { SHELL };

export function SiteHeader() {
  // Same value that drives the page backdrop (see ActiveSection).
  const active = useActiveSection();
  const { playHover } = useSound();

  return (
    <header
      // Opaque, solid fill of the exact per-section colour — identical value and
      // identical transition as the backdrop, so the bar is indistinguishable
      // from the page behind it and there's never a seam. (No translucency/blur:
      // those sampled the content scrolling underneath and produced the faint
      // gradient edge.)
      className={`sticky top-0 z-40 ${BG_TRANSITION}`}
      style={{ backgroundColor: PAGE_BG[active] }}
    >
      <div className={SHELL}>
        <div className="flex items-center justify-between py-5">
          <a href="#top" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo.svg" alt="" className="h-10 w-10" aria-hidden />
            <span className="font-serif text-[20px] font-medium tracking-tight text-sol">
              a.barchenko
            </span>
          </a>
          <div className="flex items-center gap-6 sm:gap-10">
            <nav className="hidden items-center gap-10 text-[18px] sm:flex">
              {NAV.map((item) => {
                const isActive = item.match.includes(active);
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    aria-current={isActive ? "true" : undefined}
                    onPointerEnter={() => playHover()}
                    className={`whitespace-nowrap transition-colors hover:text-accent ${
                      isActive ? "text-accent" : "text-sol"
                    }`}
                  >
                    <TypeOnHover text={`[ ${item.label} ]`} />
                  </a>
                );
              })}
            </nav>
            {/* <ThemeToggle /> */}
            <SoundToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
