import type { Metadata } from "next";
import { SHELL } from "@/components/SiteHeader";
import { ContactSection } from "@/components/ContactSection";
import { Card } from "@/components/Projects";
import { PROJECTS } from "@/components/projects-data";

export const metadata: Metadata = {
  title:
    "Vodafone web platform — divided enterprise system into two targeted solutions · a.barchenko",
  description:
    "Case study: splitting Vodafone Ukraine's enterprise web platform into targeted B2B and B2C solutions — new B2B functionality and a full B2C redesign aligned to the design system. Product design by Alex Barchenko.",
};

/* Typography — the same single type scale as the other Vodafone case studies so
   the whole series reads as one site.
   • one body size everywhere (`body`, 18px);
   • one subheading size (`sub`); section titles (`section`) are the only other
     heading treatment — serif italic accent, exactly as on the home page;
   • `label` is the caps eyebrow used for every small label. */
const T = {
  display: "text-[clamp(32px,4vw,52px)] font-light leading-[1.1] text-sol",
  section: "font-serif text-[32px] italic text-accent",
  sub: "text-[clamp(22px,2.4vw,28px)] font-light leading-[1.2] text-sol",
  body: "text-[18px] leading-[1.6]",
  label: "text-[14px] uppercase tracking-wide",
  stat: "font-serif text-[clamp(40px,5vw,64px)] font-light leading-none text-accent",
};

/* Meta rows shown under the title (Company / Period / Product). */
const META = [
  { label: "Company", value: "Vodafone Ukraine" },
  { label: "Period", value: "2023–2024" },
  { label: "Product", value: "B2B / B2C" },
];

/* Intro lists — verbatim from the source case study. */
const INFO = [
  {
    label: "My Role",
    items: [
      "Product Designer",
      "Collaborated with Developers, Business Analytics, Project Manager",
    ],
  },
  {
    label: "Challenges",
    items: [
      "Outdated and inconsistent UI",
      "Use of non-standard components across the platform",
      "Inconsistent behavior in similar features across sections",
    ],
  },
  {
    label: "Process",
    items: [
      "Planned and structured a 2-part architecture for B2B and B2C flows",
      "Designed new B2B functionality and fully redesigned the B2C experience",
    ],
  },
];

/* The four core challenges, each paired with the delivered work.
   `intro` is an optional sub-question shown above the paragraphs. */
const CHALLENGES = [
  {
    n: "Challenge 1",
    title: "Separate B2C from B2B to make managing your own goals easier",
    paras: [
      "The system was a combination of functionalities that cater to business needs and those that address users' personal issues. Our analysis of the statistics shows that the main audience tends to engage with either the business features or the personal ones, but rarely both simultaneously.",
    ],
    image: "/projects/vodafone-webplatform/challenge-1.png",
  },
  {
    n: "Challenge 2",
    title: "Make it a part of the Vodafone Ukraine ecosystem",
    paras: [
      "The current design adhered to the brand's color palette but featured entirely custom elements. Additionally, there was no existing design for the system, and each new functionality was developed based on previous ones or customized individually. As a result, the new approach incorporated the overall design system of Vodafone Ukraine.",
    ],
    image: "/projects/vodafone-webplatform/challenge-2.png",
  },
  {
    n: "Challenge 3",
    title: "Improve user experience. Make users learn faster",
    paras: [
      "Almost each feature had unique user interaction patterns, requiring users to repeatedly learn how each feature functioned. This issue was addressed by employing a hierarchical approach to organising the content based on its essence (list, details, target action). This not only expedited the user's familiarity with the information but also made the interface intuitive and consistent across all sections.",
      "Some functions can be accessed from different points within the application and may have varying interaction patterns, components, and usage approaches. They may be similar in essence and action yet differ significantly in their design — for instance, one of the primary functions is account top-up. We aligned these on one consistent set of rules.",
    ],
    image: "/projects/vodafone-webplatform/challenge-3.png",
  },
  {
    n: "Challenge 4",
    title: "Make the brand recognisable and easy to reach for mobile users",
    paras: [
      "Some of our users utilize both the mobile and desktop versions, making it essential to ensure a seamless switching process between the two. I believe we achieved this by establishing an effective content hierarchy.",
      "This approach significantly simplified the adaptation of the web version for mobile devices, catering to conservative users who prefer using browsers over mobile applications. The previous version of the site did not support mobile adaptation at all.",
    ],
    image: "/projects/vodafone-webplatform/challenge-4.png",
  },
];

/* Extra B2B functionalities delivered alongside the split — verbatim copy. */
const FUNCTIONS = [
  {
    title: "Geosearch",
    body: "Using a Vodafone SIM card, a business could track all the necessary facilities that used this card. For example, security facilities or ATMs.",
    image: "/projects/vodafone-webplatform/fn-geosearch.png",
  },
  {
    title: "Connection Status",
    body: "Functionality that is similar in essence, enabling users to determine the status of the device within the network.",
    image: "/projects/vodafone-webplatform/fn-connection.png",
  },
  {
    title: "Administration",
    body: "This functionality enables the administrator to manage the numbers easily without delving into the details.",
    image: "/projects/vodafone-webplatform/fn-administration.png",
  },
];

/* Sources the team pulled feedback from — verbatim list. */
const RESEARCH_SOURCES = [
  "Firebase statistics and conversions",
  "Telegram channel with beta testers and regular users",
  "Telecommunications operator call center",
  "And most importantly — direct interviews with business owners",
];

/* Other projects — the full home-page list (minus this case study itself),
   shown before the contact block so the study leads the reader onward
   instead of dead-ending. */
const OTHER_PROJECTS = PROJECTS.filter(
  (p) => p.href !== "/work/vodafone-webplatform",
);

export default function VodafoneWebPlatformCaseStudy() {
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
                <span>web platform redesign</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>2023–2024</span>
              </div>

              <h1 className={`mt-6 ${T.display}`}>
                Divided enterprise system into two targeted solutions
              </h1>
            </div>

            {/* Intro fills the right column so its left edge (the shared content
                column) and right edge (the section/image edge) both line up
                with every body block below. */}
            <p className={`${T.body} text-sol-dim`}>
              Comprehensive work on support and creation of new functionalities
              for the B2B part and a complete redesign of B2C for Vodafone
              Ukraine&apos;s web platform.
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

      {/* Full-bleed cover image — the platform, right after the product spec
          strip. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-webplatform/hero.png"
              alt="Vodafone Ukraine web platform — key screens"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Improvements — single headline outcome of the split. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 border-y border-sol/12 py-12 lg:grid-cols-2 lg:items-start">
            <h2 className={`${T.label} text-sol-dim`}>Improvements</h2>
            <p className={`${T.sub}`}>
              The separation of platforms helped to speed up the interaction with
              the platform for two categories of users.
            </p>
          </div>
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

      {/* Why redesign — the challenges framing. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>The Challenges</h2>
            <p className={`${T.body} text-sol-dim`}>
              The B2C system offers functionality similar to our mobile
              application, but it is outdated, relies on non-standard components,
              and exhibits different behavioral models for sections with
              comparable features. Consequently, we decided to initiate a
              redesign to ensure it becomes a part of the system that is both
              visually and functionally recognizable.
            </p>
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

      {/* Design System cross-link — the platform adopts the Vodafone Ukraine
          design system; point readers to that related case study. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <a
            href="/work/vodafone-design-system"
            className="group grid grid-cols-1 gap-8 rounded-[24px] border border-sol/15 p-8 transition-colors duration-300 ease-out hover:border-accent/50 sm:grid-cols-2 sm:items-start sm:gap-16 sm:p-12"
          >
            {/* Left — eyebrow + title. */}
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>
                How do we use Design System?
              </span>
              <span className={T.sub}>
                Learn more about Design System rebuild process
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

      {/* A few more functionalities — the extra B2B work shipped alongside the
          split. Alternating rows so the list reads as a zig-zag. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Also a few more functionalities</h2>
            <p className={`${T.body} text-sol-dim`}>
              We also invested considerable effort into the B2B part. Along with
              separating it from B2C functionality and simplifying the main
              workflows, we accomplished the following:
            </p>
          </div>

          <div className="mt-16 flex flex-col gap-16 lg:gap-6">
            {FUNCTIONS.map((fn, i) => (
              <div
                key={fn.title}
                className="grid grid-cols-1 items-center gap-x-16 gap-y-8 lg:grid-cols-2"
              >
                <div className={`flex justify-center ${i % 2 ? "lg:order-2" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fn.image}
                    alt={fn.title}
                    loading="lazy"
                    className="h-auto w-full max-w-[420px]"
                  />
                </div>
                <div className="flex max-w-[460px] flex-col gap-4">
                  <span className={T.stat}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={`mt-2 ${T.sub}`}>{fn.title}</h3>
                  <p className={`${T.body} text-sol-dim`}>{fn.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we measure success — closing quote + award / team photo. */}
      <section className="pb-[120px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>How we measure success</h2>
            <div className="flex flex-col gap-5">
              <h3 className={T.sub}>
                How we understand that we&apos;re doing right or wrong
              </h3>
              <p className={`${T.body} text-sol-dim`}>
                We collect quantitative and qualitative information from several
                sources:
              </p>
              <ul className="flex flex-col gap-3">
                {RESEARCH_SOURCES.map((item) => (
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

          {/* Team photo — the people who create the big products. */}
          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-webplatform/success.png"
              alt="People who create the big products — the Vodafone team"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
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
