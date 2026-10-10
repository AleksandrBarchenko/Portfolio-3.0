import type { Metadata } from "next";
import Link from "next/link";
import { SHELL } from "@/components/shell";
import { CaseHeader } from "@/components/CaseHeader";
import { ContactSection } from "@/components/ContactSection";
import { OtherProjects } from "@/components/WorksBoard";
import { ExternalArrowLink } from "@/components/ExternalArrowLink";

export const metadata: Metadata = {
  title: "Reflexion × Under Armour — cognitive training app & website · a.barchenko",
  description:
    "Case study: website and web-oriented mobile app for Reflexion's AI-driven cognitive sports training, built in partnership with Under Armour. Product design by Alex Barchenko.",
};

/* Typography — the same single type scale as the other case studies so every
   study reads as one series. */
const T = {
  display: "text-[clamp(32px,4vw,52px)] font-light leading-[1.1] text-sol",
  section: "font-serif text-[32px] italic text-accent",
  sub: "text-[clamp(22px,2.4vw,28px)] font-light leading-[1.2] text-sol",
  body: "text-[18px] leading-[1.6]",
  label: "text-[14px] uppercase tracking-wide",
};

/* Meta rows shown under the title (Company / Period / Product). */
const META = [
  { label: "Company", value: "Reflexion / Under Armour" },
  { label: "Period", value: "2020–2021" },
  { label: "Product", value: "Website & mobile app" },
];

/* Deliverables — "What was done" on the original case study. */
const DELIVERABLES = [
  "Research",
  "Discovery Presentation",
  "Sitemap",
  "Wireframes",
  "Hi-Fi Designs",
  "Adaptive Designs",
  "Animated Prototypes",
  "Mobile App Design",
];

/* Interior website pages — shown as two equal columns below the full-width
   home page, matching the original case study layout. */
const WEBSITE_PAGES = [
  {
    src: "/projects/reflexion/website-page-2.png",
    alt: "Reflexion website — how it works page",
  },
  {
    src: "/projects/reflexion/website-page-3.png",
    alt: "Reflexion website — equipment page",
  },
];

export default function ReflexionCaseStudy() {
  return (
    <main className="case-bg min-h-screen font-sans text-sol">
      <CaseHeader />

      {/* Hero — label row, title, overview + deliverables, spec strip. */}
      <section className="pt-[70px] pb-[80px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2 lg:items-end">
            <div>
              <div className={`flex items-center gap-[19px] ${T.label} text-sol`}>
                <span>mobile app &amp; web design</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>2020–2021</span>
              </div>

              <h1 className={`mt-6 ${T.display}`}>
                Cognitive training app &amp; website for Under Armour partnership
              </h1>
            </div>

            <div className="flex flex-col gap-8">
              <p className={`${T.body} text-sol-dim`}>
                Reflexion offers AI-driven cognitive sports training to enhance
                physical and mental performance. Using a touchscreen lightboard,
                it improves decision-making, reaction time, and hand-eye
                coordination for athletes, professionals, and rehab patients.
              </p>

              <div className="flex flex-wrap gap-[9px]">
                {DELIVERABLES.map((d) => (
                  <span
                    key={d}
                    className="rounded-full bg-pill px-4 py-2 text-[12px] font-medium uppercase tracking-wide text-sol-dim"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
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

          <ExternalArrowLink href="https://reflexion.co/" className="mt-14">
            View website
          </ExternalArrowLink>
        </div>
      </section>

      {/* Website — the home page full width, then the two interior pages side
          by side, matching the original case study layout. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="flex flex-col gap-[30px]">
            {/* Home page — full width. */}
            <div className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/projects/reflexion/website-home.png"
                alt="Reflexion website — home page"
                loading="lazy"
                className="h-auto w-full"
              />
            </div>

            {/* Interior pages — two equal columns. */}
            <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 sm:items-start">
              {WEBSITE_PAGES.map((img) => (
                <div key={img.src} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="h-auto w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile app — text block on top (title left, copy in the shared right
          column), then the screen grid at full width below. */}
      <section className="pb-[120px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-6">
              <h2 className={T.section}>Mobile App</h2>
              <h3 className={T.sub}>Web-oriented mobile application for drills</h3>
            </div>
            <p className={`${T.body} text-sol-dim`}>
              Reflexion&apos;s primary offerings include TV-based training and
              Virtual Reality drills designed to enhance cognitive skills.
              Additionally, together with Under Armour they provide a mobile app
              that enables athletes to develop similar skills using their
              advanced drill technology.
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/projects/reflexion/mobile-app.png"
            alt="Train Your Mind mobile app — score, drills and training screens"
            loading="lazy"
            className="mt-12 h-auto w-full"
          />
        </div>
      </section>

      {/* Other projects — the home page's side-scrolling board, cases and
          stats only (this case left out). */}
      <section>
        <OtherProjects exclude="/work/reflexion" />
      </section>

      {/* Contact — the same final block as the home page. */}
      <ContactSection />

      {/* Footer. */}
      <footer className="border-t border-line py-8">
        <div className={`${SHELL} flex items-center justify-between ${T.label} text-sol-dim`}>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
          <span>© 2026</span>
        </div>
      </footer>
    </main>
  );
}
