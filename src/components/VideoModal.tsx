"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useOpenCloseSound } from "@/components/sound/SoundProvider";

const EASE = [0.22, 1, 0.36, 1] as const;

/* A YouTube video shown in a centred, dismissible modal — opened when the user
   clicks the TV head's screen (see Experience.tsx). The player only mounts while
   `open`, so nothing loads (or keeps playing) once the modal is closed. */
export default function VideoModal({
  open,
  onClose,
  videoId,
  start = 0,
  title = "Video",
}: {
  open: boolean;
  onClose: () => void;
  /* YouTube video id, e.g. "wAmmrrn-voc". */
  videoId: string;
  /* Start offset in seconds. */
  start?: number;
  title?: string;
}) {
  const reduce = useReducedMotion();
  // One cue when the overview player opens, one when it closes.
  useOpenCloseSound(open);

  // Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&rel=0&modestbranding=1${start ? `&start=${start}` : ""}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          {/* Dimming backdrop — also the click-catcher that closes the modal. */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />

          {/* Player panel — a standard 16:9 YouTube preview. */}
          <motion.div
            className="relative aspect-video w-full max-w-[1100px] overflow-hidden rounded-2xl bg-black shadow-2xl"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute -top-11 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white transition-colors hover:bg-white/20 sm:-right-2"
            >
              ×
            </button>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
