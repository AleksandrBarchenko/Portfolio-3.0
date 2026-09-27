"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TypeOnHover } from "@/components/TypeOnHover";

const SHOW_MS = 1800;

/* A contact link (email / phone) that copies its value on click instead of
   navigating, then flashes a short confirmation. On desktop the note sits just
   right of the link; on narrow screens (where there's no room beside it) it
   pops up as a pill at the bottom of the viewport. */
export function CopyLink({
  href,
  value,
  message,
}: {
  href: string;
  value: string;
  message: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Without clipboard access fall through to the mailto:/tel: link.
    if (!navigator.clipboard) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.location.href = href;
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), SHOW_MS);
  };

  return (
    <span className="relative w-fit">
      <a href={href} onClick={onClick} className="w-fit">
        <TypeOnHover text={value} className="underline decoration-from-font" />
      </a>
      <span role="status" aria-live="polite">
        <AnimatePresence>
          {copied && (
            <motion.span
              key="copied"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-none z-50 whitespace-nowrap text-[14px] leading-none max-lg:fixed max-lg:bottom-6 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:rounded-full max-lg:bg-sol max-lg:px-4 max-lg:py-2.5 max-lg:text-paper lg:absolute lg:left-full lg:top-1/2 lg:ml-5 lg:-translate-y-1/2 lg:text-sol-dim"
            >
              {message}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}
