"use client";

import { useRef, useState } from "react";

/* Retypes its text one character at a time whenever the pointer enters, with a
   blinking caret. A hidden copy of the full text reserves the width so nothing
   around it shifts while the visible copy types out. Respects reduced motion. */
export function TypeOnHover({
  text,
  className,
  speed = 45,
}: {
  text: string;
  className?: string;
  /* ms per character */
  speed?: number;
}) {
  const [shown, setShown] = useState(text);
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = () => {
    clear();
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setTyping(true);
    setShown("");
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clear();
        setTyping(false);
      }
    }, speed);
  };

  const stop = () => {
    clear();
    setTyping(false);
    setShown(text);
  };

  return (
    <span
      onMouseEnter={start}
      onMouseLeave={stop}
      className="relative inline-block whitespace-pre"
    >
      {/* reserves the full width so layout never jumps while typing. `className`
          (e.g. underline) is applied to both copies so the visible overlay —
          which is out of flow and doesn't inherit the anchor's underline —
          matches the placeholder exactly. */}
      <span className={`opacity-0 ${className ?? ""}`}>{text}</span>
      {/* the animated copy sits on top */}
      <span aria-hidden className={`absolute inset-0 ${className ?? ""}`}>
        {shown}
        {typing && (
          <span className="ml-px inline-block animate-pulse border-r-2 border-current align-baseline" />
        )}
      </span>
    </span>
  );
}
