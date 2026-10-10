"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { SHELL } from "@/components/SiteHeader";
import { TypeOnHover } from "@/components/TypeOnHover";
import { LAST_CASE_KEY } from "@/components/nav-memory";
import { useSound } from "@/components/sound/SoundProvider";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { CUE } from "@/components/sound/sound-events";

/* Shared case-study header: wordmark home link, back-to-work, and a thin
   reading-progress bar along its bottom edge. (The short/full story switch
   lives in the page itself — see StorySwitch.) Pass `progress={false}` on
   pages that don't scroll (404), where the bar would just sit full. */
export function CaseHeader({ progress: showProgress = true }: { progress?: boolean }) {
  const reduce = useReducedMotion();
  const { play } = useSound();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.4 });

  return (
    <header className="case-bg sticky top-0 z-40">
      <div className={SHELL}>
        <div className="flex items-center justify-between py-5">
          <Link
            href="/"
            // Going home via the wordmark means "start over", not "back to the
            // card I came from" — drop the remembered card.
            onClick={() => {
              play(CUE.leaveCase);
              sessionStorage.removeItem(LAST_CASE_KEY);
            }}
            className="flex items-center gap-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo.svg" alt="" className="h-10 w-10" aria-hidden />
            {/* Below 430px the wordmark collides with "[ back to work ]"; the
                mark alone still reads as the home link. */}
            <span className="hidden font-sans text-[20px] text-sol min-[430px]:inline">
              a.barchenko
            </span>
          </Link>
          <div className="flex items-center gap-6 sm:gap-8">
            <Link
              href="/#projects"
              onClick={() => play(CUE.leaveCase)}
              className="whitespace-nowrap font-serif text-[20px] text-sol transition-colors hover:text-accent"
            >
              <TypeOnHover text="[ back to work ]" />
            </Link>
            <SoundToggle />
          </div>
        </div>
      </div>
      {/* Reading progress — scaled, never resized, so it stays on the compositor. */}
      {showProgress && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent"
          style={{ scaleX: reduce ? scrollYProgress : progress }}
        />
      )}
    </header>
  );
}

export default CaseHeader;
