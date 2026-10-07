import type { Metadata } from "next";
import Link from "next/link";
import { SHELL } from "@/components/shell";
import { CaseHeader } from "@/components/CaseHeader";
import { ContactSection } from "@/components/ContactSection";
import { OtherProjects } from "@/components/WorksBoard";
import { ExternalArrowLink } from "@/components/ExternalArrowLink";

export const metadata: Metadata = {
  title: "ElioVP — comprehensive web experience · a.barchenko",
  description:
    "Case study: a comprehensive web experience for ElioVP, an electric mobility & photovoltaic energy company. Product design by Alex Barchenko.",
};

/* Meta rows shown under the title (Company / Period / Product). */
const META = [
  { label: "Company", value: "ElioVP" },
  { label: "Period", value: "March 2025" },
  { label: "Product", value: "B2B" },
];

/* Deliverables — "What was done" on the original case study. */
const DELIVERABLES = [
  "Research",
  "Discovery Presentation",
  "Wireframes",
  "Hi-Fi Designs",
  "Animated Prototype",
  "Adaptive Designs",
];

/* Delivered designs, in the order they ran on the original page. */
const DESIGNS = [
  "/projects/eliovp/design-1.jpg",
  "/projects/eliovp/design-2.png",
  "/projects/eliovp/design-3.png",
  "/projects/eliovp/design-4.png",
  "/projects/eliovp/design-5.jpg",
  "/projects/eliovp/design-6.png",
  "/projects/eliovp/design-7.png",
  "/projects/eliovp/design-8.png",
  "/projects/eliovp/design-9.png",
  "/projects/eliovp/design-10.png",
];

export default function EliovpCaseStudy() {
  return (
    <main className="case-bg min-h-screen font-sans text-sol">
      <CaseHeader />

      {/* Hero — label row, title, meta grid, company blurb. */}
      <section className="pt-[70px] pb-[80px]">
        <div className={SHELL}>
          {/* Title on the left, company blurb on the right — the paragraph sits
              at the title's baseline so the two columns read as one band. */}
          <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="flex items-center gap-[19px] text-[14px] uppercase tracking-wide text-sol">
                <span>website redesign</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>2024–2025</span>
              </div>

              <h1 className="mt-6 text-[clamp(25.5px,3.75vw,45px)] font-light leading-[1.1] text-sol">
                Comprehensive web experience for electric mobility solution
              </h1>
            </div>

            <div className="flex max-w-[560px] flex-col gap-8">
              <p className="text-[18px] leading-[1.5] text-sol-dim">
                ElioVP is a forward-thinking energy company focused on
                accelerating the transition to sustainable power through
                innovative photovoltaic (PV) technology. Their mission is to make
                solar energy more accessible, efficient, and integrated into
                everyday life. With a commitment to green innovation, ElioVP
                delivers cutting-edge solar solutions tailored for both
                residential and commercial markets.
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

          {/* Spec strip — a full-width row of facts, bounded by hairline rules
              with light dividers between cells (kept subtle on purpose). */}
          <dl className="mt-14 grid grid-cols-1 divide-y divide-sol/12 border-y border-sol/12 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {META.map((m) => (
              <div
                key={m.label}
                className="flex flex-col gap-3 py-7 sm:px-8 sm:first:pl-0"
              >
                <dt className="text-[12px] uppercase tracking-wide text-sol-dim">
                  {m.label}
                </dt>
                <dd className="text-[clamp(12px,1.2vw,17px)] font-light uppercase leading-none text-sol">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>

          <ExternalArrowLink href="https://eliovp.com" className="mt-14">
            View website
          </ExternalArrowLink>
        </div>
      </section>

      {/* Delivered designs — full-width screenshots. */}
      <section className="pb-[120px]">
        <div className={SHELL}>
          <div className="flex flex-col gap-[30px]">
            {DESIGNS.map((src) => (
              <div key={src} className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt="ElioVP web experience design"
                  loading="lazy"
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other projects — the home page's side-scrolling board, cases and
          stats only (this case left out). */}
      <section>
        <OtherProjects exclude="/work/eliovp" />
      </section>

      {/* Contact — the same final block as the home page. */}
      <ContactSection />

      {/* Footer. */}
      <footer className="border-t border-line py-8">
        <div className={`${SHELL} flex items-center justify-between text-[14px] text-sol-dim`}>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
          <span>© 2025</span>
        </div>
      </footer>
    </main>
  );
}
