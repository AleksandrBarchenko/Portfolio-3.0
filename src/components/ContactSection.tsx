"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { useRobotVoice } from "@/components/sound/SoundProvider";
import type { OrbState } from "@/types/orb";
import { SHELL } from "@/components/SiteHeader";
import { TypeOnHover } from "@/components/TypeOnHover";
import { CopyLink } from "@/components/CopyLink";
import { useAvatarMode } from "@/components/AvatarMode";

/* The site's contact block — the orb that greets with its line on the left and
   the contact details on the right. This is the exact final block used on the
   home page (see Experience's `cta` section); it lives here so the case-study
   pages can end on the same note. */

const CTA_LINE =
  "Have a project in mind\nyou need a help with?\nLet’s move it together";
const SPEECH_W = 380;

function Caret() {
  return (
    <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-sol-dim align-middle" />
  );
}

function useViewport() {
  const [vp, setVp] = useState({ w: 1440, desktop: true });
  useEffect(() => {
    const on = () => setVp({ w: innerWidth, desktop: innerWidth >= 1024 });
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  return vp;
}

// Head/orb square size, mirroring the home page: capped at 460 (reached ~1150px
// wide), but the TV head keeps growing past 1400 so it doesn't look lost.
function headSize(vw: number, face: boolean) {
  const base = Math.min(Math.round(vw * 0.4), 460);
  return face && vw > 1400 ? Math.round(460 * (vw / 1400)) : base;
}
function headGrow(vw: number, face: boolean) {
  return headSize(vw, face) - Math.min(Math.round(vw * 0.4), 460);
}

/* A reply the orb types in response to the visitor (e.g. after copying the
   email). `n` changes on every reaction so repeating the same one retypes it. */
type Reply = { text: string; n: number };

const REPLIES = {
  email: "Email copied —\nI usually reply within\na day. Talk soon!",
  phone: "Number copied —\ncall or message me,\nI’m on Lisbon time",
};
// Text fade between lines, and how long a reply stays before the orb goes back
// to its invitation.
const FADE_MS = 250;
const HOLD_MS = 3200;

/* Desktop contact orb — a normal element in the layout, so it scrolls with the
   page. Types its line once, the first time it scrolls into view. It also
   reacts to the contact links next to it: it `listen`s while they're hovered or
   focused, and types a short reply when the email/phone is copied, then fades
   back to its invitation. The old line always fades out before a new one types
   in — never an abrupt swap. */
function ContactOrb({ listening, reply }: { listening: boolean; reply: Reply | null }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [line, setLine] = useState(CTA_LINE);
  const [typed, setTyped] = useState(reduce ? CTA_LINE.length : 0);
  const [speaking, setSpeaking] = useState(false);
  const [shown, setShown] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          setSpeaking(true);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useRobotVoice(speaking && !reduce, line);

  useEffect(() => {
    if (!speaking) return;
    if (reduce) {
      setTyped(line.length);
      setSpeaking(false);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const n = Math.min(line.length, Math.floor((now - start) / 30));
      setTyped(n);
      if (n < line.length) raf = requestAnimationFrame(step);
      else setSpeaking(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speaking, line, reduce]);

  // A reaction: fade the current line out, then type the reply.
  useEffect(() => {
    if (!reply) return;
    started.current = true;
    setShown(false);
    const t = window.setTimeout(() => {
      setLine(reply.text);
      setTyped(0);
      setShown(true);
      setSpeaking(true);
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [reply]);

  // Once a reply has been said, hold it, then fade back to the invitation.
  useEffect(() => {
    if (speaking || line === CTA_LINE) return;
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      setShown(false);
      t2 = window.setTimeout(() => {
        setLine(CTA_LINE);
        setTyped(CTA_LINE.length);
        setShown(true);
      }, FADE_MS);
    }, HOLD_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [speaking, line]);

  const state: OrbState = speaking ? "replying" : listening ? "listening" : "idle";
  const text = speaking ? line.slice(0, typed) : line;

  const { w: vw } = useViewport();
  const { mode } = useAvatarMode();
  const face = mode === "face";
  const size = headSize(vw, face);
  const grow = headGrow(vw, face);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center"
      style={{ transform: `translate(${-grow / 2}px, -78px)` }}
    >
      <div className="relative aspect-square" style={{ width: size }}>
        <Avatar state={state} />
      </div>
      <p
        aria-live="polite"
        className={`-mt-[8px] min-h-24 whitespace-pre-line text-center text-[22px] leading-8 text-sol-dim transition-opacity duration-[250ms] ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: SPEECH_W }}
      >
        {text}
        {speaking && <Caret />}
      </p>
    </div>
  );
}

function MobileOrb() {
  return (
    <div className="mb-10 flex flex-col items-center lg:hidden">
      <div className="relative aspect-square w-[min(70vw,260px)]">
        <Avatar state="idle" />
      </div>
      <p className="-mt-[3px] max-w-[320px] whitespace-pre-line text-center text-[20px] leading-7 text-sol-dim">
        {CTA_LINE}
      </p>
    </div>
  );
}

/* `id` / `className` let the home page mount this same block as its snapped
   `#cta` page; the case studies use it as a plain closing section. */
export function ContactSection({
  id,
  className = "",
}: {
  id?: string;
  className?: string;
}) {
  const { desktop } = useViewport();
  const [listening, setListening] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const react = (text: string) => setReply((r) => ({ text, n: (r?.n ?? 0) + 1 }));

  return (
    <section id={id} className={`relative flex items-center py-28 lg:py-24 ${className}`}>
      <div className={`${SHELL} w-full`}>
        <div className="grid grid-cols-1 items-center gap-x-10 gap-y-10 lg:grid-cols-2">
          <div>{desktop ? <ContactOrb listening={listening} reply={reply} /> : <MobileOrb />}</div>
          <div
            onPointerEnter={() => setListening(true)}
            onPointerLeave={() => setListening(false)}
            onFocus={() => setListening(true)}
            onBlur={() => setListening(false)}
          >
            <div className="flex flex-col gap-14">
              <div className="flex flex-col gap-4 text-[clamp(26px,3vw,36px)] leading-[1.2] text-accent-2">
                <CopyLink
                  href="mailto:alex.barcenko@gmail.com"
                  value="alex.barcenko@gmail.com"
                  message="email copied"
                  onCopy={() => react(REPLIES.email)}
                />
                <CopyLink
                  href="tel:+351910042087"
                  value="+351910042087"
                  message="phone copied"
                  onCopy={() => react(REPLIES.phone)}
                />
              </div>
              <div className="flex flex-col gap-10 text-[18px] text-sol">
                <span>.based in Portugal</span>
                <a href="#" className="w-fit">
                  <TypeOnHover text="{ behance }" />
                </a>
                <a href="#" className="w-fit">
                  <TypeOnHover text="{ linkedin }" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
