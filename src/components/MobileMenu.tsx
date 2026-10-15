"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useActiveSection,
  PAGE_BG,
  BG_TRANSITION,
  type Section,
} from "./ActiveSection";
import { useSound } from "./sound/SoundProvider";

/* Every page of the home scroll, so a phone can jump anywhere in one tap
   instead of swiping through full-viewport snap pages. `match` lights an item
   up while its section owns the viewport (same idea as the desktop nav). */
const ITEMS: { label: string; href: string; match: Section[] }[] = [
  { label: "intro", href: "#hero", match: ["hero"] },
  { label: "work", href: "#projects", match: ["video", "projects"] },
  { label: "skills", href: "#skills", match: ["skills"] },
  { label: "contact", href: "#cta", match: ["cta"] },
];

const LINKS = [
  { label: "[ resume ]", href: "/alex-barchenko-resume.pdf" },
  {
    label: "/ linkedin",
    href: "https://www.linkedin.com/in/aleksandr-barchenko",
  },
  { label: "/ behance", href: "https://www.behance.net/aleksandrb0778" },
];

/* Mobile-only (below `sm`) menu: a round toggle that matches the sound button,
   and a full-screen sheet that slides in UNDER the sticky header (z-35 vs the
   header's z-40), so the logo and the toggle — now a close "×" — stay put on
   top. It's portalled to <body>: rendered inside the header it would share the
   header's stacking context and paint over the bar. The sheet wears the
   current section's page colour, so it reads as the page itself rather than a
   popup. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const reduce = useReducedMotion();
  const { playSoftShift } = useSound();
  const firstLink = useRef<HTMLAnchorElement>(null);
  // Portal target only exists after mount (no document during SSR).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggle = () => {
    playSoftShift();
    setOpen((o) => !o);
  };

  // While open: Escape closes, the page behind can't scroll, and growing past
  // the mobile breakpoint closes it (the sheet is hidden there anyway).
  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 640px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.45,
            delay: 0.06 + i * 0.05,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="theme-fade relative grid h-10 w-10 place-items-center rounded-full border border-line text-sol transition-colors hover:bg-pill sm:hidden"
      >
        {/* Two bars that fold into an "×". */}
        <span
          aria-hidden
          className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-300 ${
            open ? "rotate-45" : "-translate-y-[3px]"
          }`}
        />
        <span
          aria-hidden
          className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-300 ${
            open ? "-rotate-45" : "translate-y-[3px]"
          }`}
        />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.25 }}
                className={`fixed inset-0 z-[35] flex flex-col overflow-y-auto px-6 pb-10 pt-28 sm:hidden ${BG_TRANSITION}`}
                style={{ backgroundColor: PAGE_BG[active] }}
              >
                <nav className="flex flex-col gap-2">
                  {ITEMS.map((item, i) => {
                    const isActive = item.match.includes(active);
                    return (
                      <motion.a
                        key={item.label}
                        ref={i === 0 ? firstLink : undefined}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex items-baseline gap-4 py-1 font-sans text-[48px] leading-[1.1] transition-colors ${
                          isActive ? "text-accent" : "text-sol"
                        }`}
                        {...rise(i)}
                      >
                        <span className="font-serif text-[16px] text-accent">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {item.label}
                      </motion.a>
                    );
                  })}
                </nav>

                <motion.div
                  className="mt-auto flex flex-col gap-5 pt-12 font-serif text-[20px] text-sol"
                  {...rise(ITEMS.length)}
                >
                  {LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit transition-colors hover:text-accent"
                    >
                      {link.label}
                    </a>
                  ))}
                  <a
                    href="mailto:alex.barcenko@gmail.com"
                    className="w-fit text-accent"
                  >
                    alex.barcenko@gmail.com
                  </a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

export default MobileMenu;
