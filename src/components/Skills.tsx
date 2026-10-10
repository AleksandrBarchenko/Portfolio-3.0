"use client";

import { SHELL } from "@/components/SiteHeader";
import { useSound } from "@/components/sound/SoundProvider";

/* The "what I can help with" page (Figma nodes 899:5223 / 899:5247). A serif
   italic intro over a big list of skill words separated by accent dots.
   Hovering a word dims the rest to 20%. Words that have a matching torn-paper
   photo (named after the word) float it over the word on hover: the word stays
   dark, the photo gets a dark tint, and the letters that fall over the photo
   invert to white, with a soft airy whoosh (a gentler cousin of the work
   cards' "shh"). Words without a matching image just dim the rest. */
const INTRO =
  "I’m Digital Product Designer with 8+ years crafting impactful user experiences for B2C, SaaS, Mobile & Web, so i can help you with:";

/* `rot` is a literal Tailwind class (kept literal so the JIT picks it up) that
   tilts the torn photo a random 10–15° in a random direction. */
type Skill = { word: string; img?: string; rot?: string };

/* Only words whose name matches an image file get a hover photo. */
const SKILLS: Skill[] = [
  { word: "research", img: "/skills/research.png", rot: "rotate-[-12deg]" },
  { word: "product design" },
  { word: "leadership", img: "/skills/leadership.png", rot: "rotate-[11deg]" },
  { word: "design systems", img: "/skills/design-systems.png", rot: "rotate-[-14deg]" },
  { word: "design strategy" },
  { word: "user testing", img: "/skills/user-testing.png", rot: "rotate-[13deg]" },
  { word: "analytics", img: "/skills/analytics.png", rot: "rotate-[-10deg]" },
  { word: "prototyping" },
];

/* Everything dims to 20% only while a word that actually has a photo is
   hovered — driven by `:has()` on the container so hovering the plain words
   (no image) has no effect at all. */
const DIM = "group-has-[[data-photo]:hover]/skills:opacity-20";

function Dot() {
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full bg-accent transition-opacity duration-300 ${DIM}`}
    />
  );
}

function Word({ word, img, rot }: Skill) {
  const { playSoftShift } = useSound();

  /* Clip the tint + white text to the torn photo's exact shape (contain +
     centred = same box the photo is drawn in), so both line up with the img. */
  const clip: React.CSSProperties = img
    ? {
        WebkitMaskImage: `url(${img})`,
        maskImage: `url(${img})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }
    : {};

  /* Plain words (no image) get no hover behaviour at all — they still dim while
     a photo word is hovered, but hovering them does nothing. Photo words pull
     back to full opacity and lift above their siblings so the photo can cover
     them; their own hover (`!`) overrides the container dim. */
  return (
    <span
      {...(img ? { "data-photo": "", onPointerEnter: playSoftShift } : {})}
      className={`group/word relative inline-flex items-center transition-opacity duration-300 ${DIM} ${
        img ? "hover:!opacity-100 hover:z-20" : ""
      }`}
    >
      {/* The word stays dark; letters over the photo invert to white below. */}
      <span className="relative z-0 whitespace-nowrap">{word}</span>

      {/* Torn-paper photo + inverted text, revealed on hover, centred on the
          word so the white copy lines up with the dark one underneath. Only
          rendered for words that have a matching image. Only the photo tilts
          (via `rot`) — the white overlay word stays horizontal so it keeps
          lining up with the dark base word. */}
      {img && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[300px] w-[340px] -translate-x-1/2 -translate-y-1/2 scale-90 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover/word:scale-100 group-hover/word:opacity-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.14)] ${rot ?? ""}`}
          />
          {/* Dark tint over the photo (masked to its torn shape). Tilts with the
              photo via the same `rot` so its torn silhouette lines up with the
              image instead of showing an extra background at a different angle. */}
          <span style={clip} className={`absolute inset-0 bg-black/25 ${rot ?? ""}`} />
          {/* White copy of the word, masked to the photo — the "inverted" letters. */}
          <span
            style={clip}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-white"
          >
            {word}
          </span>
        </span>
      )}
    </span>
  );
}

export default function Skills() {
  return (
    <div className={`${SHELL} w-full`}>
      <div className="flex flex-col gap-12 lg:gap-16">
        <p className="mx-auto max-w-[890px] text-center font-serif lg:max-w-[980px] lg:text-balance text-[clamp(22px,2.6vw,32px)] italic leading-[1.2] text-accent">
          {INTRO}
        </p>

        <div className="group/skills flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-[clamp(20px,5.6vw,22px)] font-normal leading-none text-sol sm:justify-start sm:gap-x-5 sm:gap-y-4 sm:text-[clamp(34px,6.4vw,64px)]">
          {SKILLS.map((skill, i) => (
            /* Each dot is glued to the word before it so a wrap never leaves
               a stray dot at the start of a line. */
            <span key={skill.word} className="inline-flex items-center gap-x-2 sm:gap-x-5">
              <Word {...skill} />
              {i < SKILLS.length - 1 && <Dot />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
