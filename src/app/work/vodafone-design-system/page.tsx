import type { Metadata } from "next";
import { SHELL } from "@/components/SiteHeader";
import { ContactSection } from "@/components/ContactSection";
import { Card } from "@/components/Projects";
import { PROJECTS } from "@/components/projects-data";
import { CaseStats, type CaseStat } from "@/components/CaseStats";

export const metadata: Metadata = {
  title: "Vodafone design system — reduced development resources by 30% · a.barchenko",
  description:
    "Case study: rebuilding the My Vodafone UI kit into a cross-platform design system for Vodafone Ukraine — cutting development resources by 30% and designer onboarding by 25%. Product design by Alex Barchenko.",
};

/* Typography — the same single type scale as the Vodafone app case studies so
   the series reads as one. */
const T = {
  display: "text-[clamp(32px,4vw,52px)] font-light leading-[1.1] text-sol",
  section: "font-serif text-[32px] italic text-accent",
  sub: "text-[clamp(22px,2.4vw,28px)] font-light leading-[1.2] text-sol",
  body: "text-[18px] leading-[1.6]",
  label: "text-[14px] uppercase tracking-wide",
};

/* Meta rows shown under the title (Company / Period / Product). */
const META = [
  { label: "Company", value: "Vodafone Ukraine" },
  { label: "Period", value: "2024" },
  { label: "Product", value: "Cross-platform design system" },
];

/* Intro lists — verbatim from the source case study. */
const INFO = [
  {
    label: "My Role",
    items: [
      "Product Designer (main contributor)",
      "Collaborated with Designer, Developers, PM",
    ],
  },
  {
    label: "Challenges",
    items: [
      "Inconsistent component usage",
      "Bridging design–development gaps",
      "Scaling without overcomplicating",
    ],
  },
  {
    label: "Process",
    items: [
      "Audited existing UI components",
      "Identified inconsistencies and redundant patterns",
      "Defined core principles, tokens, and naming conventions",
      "Documented usage guidelines for scalable adoption",
    ],
  },
];

/* Headline outcomes of the rebuild — each a percentage reduction. */
const IMPROVEMENTS: CaseStat[] = [
  { value: 30, prefix: "−", suffix: "%", label: "Reduced development resources", kind: "resources" },
  { value: 25, prefix: "−", suffix: "%", label: "Reduced designer onboarding time", kind: "time" },
];

/* Pain points of the old UI kit — "Why did the system need to be rebuilt?". */
const WHY = [
  "Complicated onboarding of new team members",
  "Confused designer–developer–team communication",
  "Lack of standardization and unification of components",
  "Lack of documentation",
];

/* The four core challenges, each paired with the delivered work. */
const CHALLENGES = [
  {
    n: "Challenge 1",
    title: "Unify the components and eliminate redundancies",
    paras: [
      "Previously, we used variants that appeared to work well but did not align with the parent component, preventing uniform usage parameters.",
      "This resulted in multiple elements of the same type with varying parameters, causing confusion during selection.",
      "We developed a parent constructor component for each element, enabling flexible parameter customization based on usage while maintaining consistent sizes, spacing, and styles.",
    ],
    image: "/projects/vodafone-ds/challenge-1.png",
  },
  {
    n: "Challenge 2",
    title: "Speed up the process and communication",
    paras: [
      "To work efficiently, it's essential to align communication between developers and designers.",
      "The main issue was inconsistent naming conventions between design and development, along with the absence of style usage guidelines.",
      "For instance, the color system is now synchronized with clear rules, making it easier for designers to select appropriate options. After Figma released tokens, the next step is to move our styles to object-oriented naming for easier usage.",
    ],
    image: "/projects/vodafone-ds/challenge-2.png",
  },
  {
    n: "Challenge 3",
    title: "Develop clear and user-friendly documentation",
    paras: [
      "Previously, the system consisted of isolated components, requiring designers to manually remember their usage contexts.",
      "We revised this approach by establishing a set of guidelines for developing and using each component.",
    ],
    image: "/projects/vodafone-ds/challenge-3.png",
  },
  {
    n: "Challenge 4",
    title: "Create a Vodafone ecosystem for cross-platform use",
    paras: [
      "Although not the initial goal, the system's success in the app prompted us to adapt it for multiple platforms and share it with other Vodafone Ukraine teams.",
      "We integrated the system across both design and development, synchronizing styles and leveraging Storybook software. A notable example is the ongoing redesign of a web resource.",
    ],
    image: "/projects/vodafone-ds/challenge-4.png",
  },
];

/* Other projects — the full home-page list (minus this case study itself),
   shown before the contact block so the study leads the reader onward
   instead of dead-ending. */
const OTHER_PROJECTS = PROJECTS.filter(
  (p) => p.href !== "/work/vodafone-design-system",
);

export default function VodafoneDesignSystemCaseStudy() {
  return (
    <main className="theme-fade min-h-screen bg-paper font-sans text-sol">
      {/* Lightweight case-study header — wordmark home link, back-to-work. */}
      <header className="sticky top-0 z-40 bg-paper theme-fade">
        <div className={SHELL}>
          <div className="flex items-center justify-between py-5">
            <a href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo.svg" alt="" className="h-10 w-10" aria-hidden />
              <span className="font-serif text-[20px] font-medium tracking-tight text-sol">
                a.barchenko
              </span>
            </a>
            <div className="flex items-center gap-6 sm:gap-10">
              <a
                href="/#projects"
                className={`whitespace-nowrap ${T.body} text-sol transition-colors hover:text-accent`}
              >
                [ back to work ]
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero — label row, title, overview, spec strip. */}
      <section className="pt-[70px] pb-[80px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2 lg:items-end">
            <div>
              <div className={`flex items-center gap-[19px] ${T.label} text-sol`}>
                <span>design system</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>2024</span>
              </div>

              <h1 className={`mt-6 ${T.display}`}>
                Reduced development resources by 30% with Design System rebuild
              </h1>
            </div>

            <p className={`${T.body} text-sol-dim`}>
              Changed the approach to managing and building the design system.
              Evolved from a UI kit to a comprehensive design system for Vodafone
              Ukraine products.
            </p>
          </div>

          {/* Spec strip — company / period / product. */}
          <dl className="mt-14 grid grid-cols-1 divide-y divide-sol/12 border-y border-sol/12 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {META.map((m) => (
              <div
                key={m.label}
                className="flex flex-col gap-3 py-7 sm:px-8 sm:first:pl-0"
              >
                <dt className={`${T.label} text-sol-dim`}>{m.label}</dt>
                <dd className={`${T.body} font-light uppercase text-sol`}>
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Full-bleed cover image — sits right after the product spec strip. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-ds/hero.png"
              alt="My Vodafone Design System"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Improvements — headline metrics, shown before the role/process intro
          so the outcomes lead. Animated reduction bars (client component). */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <CaseStats stats={IMPROVEMENTS} />
        </div>
      </section>

      {/* Role / Challenges / Process — label-left intro rows. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="flex flex-col divide-y divide-sol/12">
            {INFO.map((col) => (
              <div
                key={col.label}
                className="grid grid-cols-1 gap-x-16 gap-y-5 py-10 first:pt-0 last:pb-0 lg:grid-cols-2 lg:items-start"
              >
                <h2 className={`${T.label} text-sol-dim`}>{col.label}</h2>
                <ul className="flex flex-col gap-3">
                  {col.items.map((item) => (
                    <li key={item} className={`flex gap-3 ${T.body} text-sol`}>
                      <span
                        aria-hidden
                        className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why rebuild. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Why Rebuild</h2>
            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                The system had existed for some time and functioned primarily as
                a UI kit, which had the following disadvantages:
              </p>
              <ul className="flex flex-col gap-3">
                {WHY.map((item) => (
                  <li key={item} className={`flex gap-3 ${T.body} text-sol`}>
                    <span
                      aria-hidden
                      className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-ds/why-rebuild.png"
              alt="Vodafone brand, color and typography foundations"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Challenges — numbered, each with its delivered work. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="flex flex-col gap-[110px]">
            {CHALLENGES.map((c) => (
              <div key={c.n}>
                <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
                  <div className="flex flex-col gap-3">
                    <span className={`${T.label} text-accent`}>{c.n}</span>
                    <h3 className={T.sub}>{c.title}</h3>
                  </div>

                  <div className="flex flex-col gap-5">
                    {c.paras.map((p) => (
                      <p key={p} className={`${T.body} text-sol-dim`}>
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App redesign cross-link — mirrors the design-system card on the
          Vodafone app study, pointing back to where the system is used. */}
      <section className="pb-[120px]">
        <div className={SHELL}>
          <a
            href="/work/vodafone"
            className="group grid grid-cols-1 gap-8 rounded-[24px] border border-sol/15 p-8 transition-colors duration-300 ease-out hover:border-accent/50 sm:grid-cols-2 sm:items-start sm:gap-16 sm:p-12"
          >
            {/* Left — eyebrow + title. */}
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Where is it used?</span>
              <span className={T.sub}>
                See the system at work in the My Vodafone app redesign
              </span>
            </div>

            {/* Right — swatch dots, then the view-case-study affordance. */}
            <div className="flex flex-col gap-8 sm:items-start">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-accent" />
                <span className="h-7 w-7 rounded-full bg-sol" />
                <span className="h-7 w-7 rounded-full bg-sol-dim" />
              </div>

              <span className={`inline-flex items-center gap-2 ${T.label} text-accent`}>
                View case study
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  className="h-[18px] w-[18px] transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
                >
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* Other projects — sits on the surface-2 panel, matching the home page's
          video section background. */}
      <section className="bg-surface-2 pt-[100px] pb-[120px]">
        <div className={SHELL}>
          <h2 className={`mb-[70px] ${T.section}`}>Other projects</h2>
          <div className="flex flex-col gap-[140px]">
            {OTHER_PROJECTS.map((p) => (
              <Card key={p.title} project={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact — the same final block as the home page. */}
      <ContactSection />

      {/* Footer. */}
      <footer className="border-t border-line py-8">
        <div className={`${SHELL} flex items-center justify-between ${T.label} text-sol-dim`}>
          <a href="/" className="transition-colors hover:text-accent">
            Home
          </a>
          <span>© 2025</span>
        </div>
      </footer>
    </main>
  );
}
