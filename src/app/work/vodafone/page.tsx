import type { Metadata } from "next";
import Link from "next/link";
import { SHELL } from "@/components/shell";
import { CaseHeader } from "@/components/CaseHeader";
import { StorySwitch } from "@/components/StorySwitch";
import { CaseSummary, type SummaryItem } from "@/components/CaseSummary";
import { ContactSection } from "@/components/ContactSection";
import { OtherProjects } from "@/components/WorksBoard";
import { CaseStats, type CaseStat } from "@/components/CaseStats";

export const metadata: Metadata = {
  title: "Vodafone app redesign — increased basic flows success rate by 17% · a.barchenko",
  description:
    "Case study: redesigning the My Vodafone mobile app for millions of active users — raising basic-flow success rate by 17% and cutting call-center load by 23%. Product design by Alex Barchenko.",
};

/* Typography — a single type scale for the whole page, derived from the home
   page so the case study reads as part of the same site. The rules:
   • one body size everywhere (`body`, 16px);
   • one subheading size (`sub`); section titles (`section`) are the only other
     heading treatment — serif italic accent, exactly as on the home page;
   • `label` is the 14px caps eyebrow used for every small label.
   `body` and `label` omit colour so each use adds sol / sol-dim / accent. */
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
  { label: "Period", value: "2021–2023" },
  { label: "Product", value: "B2C" },
];

/* Intro lists — verbatim from the source case study. */
const INFO = [
  {
    label: "My Role",
    items: [
      "Product Designer (main contributor)",
      "Collaborated with Designer, Business Analytics, PM, PO, Developers, and QA",
      "Led UX research and prototyping",
    ],
  },
  {
    label: "Challenges",
    items: [
      "Complex interface with inconsistent UI patterns",
      "Users struggled with key flows",
    ],
  },
  {
    label: "Process",
    items: [
      "Ran user interviews and collected statistics",
      "Synthesized pain points using affinity mapping",
      "Created prototypes and tested early concepts",
      "Built scalable design system components",
    ],
  },
];

/* Headline outcomes of the redesign — source order, verbatim numbers. */
const IMPROVEMENTS: CaseStat[] = [
  { value: 14, prefix: "+", suffix: "%", label: "Increased active users base", kind: "growth" },
  { value: 0.5, prefix: "+", decimals: 1, label: "Boosted app store rating", kind: "rating" },
  { value: 17, prefix: "+", suffix: "%", label: "Increased basic flows success rate", kind: "success" },
  { value: 23, prefix: "−", suffix: "%", label: "Reduced call center load", kind: "load" },
];

/* The four core challenges, each paired with the delivered work.
   `intro` is an optional sub-question shown above the paragraphs. */
const CHALLENGES = [
  {
    n: "Challenge 1",
    title: "Help users achieve their goals faster",
    paras: [
      "Statistics indicate that the conversion rates for functionalities decline with each step in the process. To address this issue, we decided to implement a “1-click design” to streamline the process and reduce the drop-off rate before the final action.",
      "For instance, previously, users had to complete three steps to view the details of their own tariff. Now, this can be accomplished with just one click.",
    ],
    image: "/projects/vodafone/img-04.png",
  },
  {
    n: "Challenge 2",
    title: "Reduce the load on the call center and retail network",
    paras: [
      "After gathering support requests and analyzing statistics on the most-used features, we established a priority list for features. Based on this, we revamped the main page to display all key balance indicators simultaneously, provided quick access to priority functions, and created an FAQ section that enables users to find answers to basic questions without needing to contact an operator.",
    ],
    image: "/projects/vodafone/img-05.png",
  },
  {
    n: "Challenge 3",
    title: "Increase sales and become the main digital channel",
    paras: [
      "The previous version of the app only displayed information related to balances, top-ups, and tariff usage on the main screen, which did not encourage users to explore other features that were underutilized. These features were hidden within the main menu.",
      "In the redesign, we adopted a new approach for the main screen by incorporating dynamic cards that display different statuses based on whether the user is utilizing specific functionalities. This change has resulted in an increase in the conversion rate for using services and bonuses.",
    ],
    image: "/projects/vodafone/img-06.png",
  },
  {
    n: "Challenge 4",
    title: "Modernize the application to align with the times and global brand",
    intro: "The visuals are not the first priority?",
    paras: [
      "Perhaps not the first priority, but certainly not the least important. Visually, the application must stand out in the market against competitors, possess a modern design to attract new users, and reflect the brand identity consistently to ensure recognizability.",
      "Drawing from the global Vodafone brand, we completely revamped the style and component system to create a modern and relevant app. Additionally, we enhanced core usability through microinteractions, increased click areas, and improved feedback and status indicators for elements within the app.",
    ],
    image: "/projects/vodafone/img-07.png",
  },
];

/* "What was done" for the short version — one line per challenge. */
const SUMMARY: SummaryItem[] = [
  {
    title: "Help users achieve their goals faster",
    done: "A “1-click design” for key flows — checking your own tariff went from three steps to one.",
    target: "challenge-1",
  },
  {
    title: "Reduce the load on the call center and retail network",
    done: "Rebuilt the main page from a feature priority list: every balance at a glance, quick access to key actions and a self-serve FAQ.",
    target: "challenge-2",
  },
  {
    title: "Increase sales and become the main digital channel",
    done: "Dynamic cards on the main screen that surface underused services and bonuses based on what each user already has.",
    target: "challenge-3",
  },
  {
    title: "Modernize the app to match the global brand",
    done: "A new style and component system drawn from global Vodafone, plus microinteractions, bigger tap areas and clearer status feedback.",
    target: "challenge-4",
  },
  {
    title: "Validate with real users",
    done: "Interviews with 25 participants reshaped navigation — two main sections became four, bringing tariffs and add-ons into reach.",
    target: "research",
  },
];

export default function VodafoneCaseStudy() {
  return (
    <main className="case-bg min-h-screen font-sans text-sol">
      <CaseHeader />

      {/* Hero — label row, title, overview, spec strip. */}
      <section className="pt-[70px] pb-[80px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2 lg:items-end">
            <div>
              <div className={`flex items-center gap-[19px] ${T.label} text-sol`}>
                <span>mobile app redesign</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>2021–2023</span>
              </div>

              <h1 className={`mt-6 ${T.display}`}>
                Increased basic flows success rate by 17% for Vodafone App
              </h1>
            </div>

            {/* Intro fills the right column so its left edge (the shared content
                column) and right edge (the section/image edge) both line up
                with every body block below. */}
            <p className={`${T.body} text-sol-dim`}>
              Redesign for mobile communication management app for millions
              active users. App allows to track user data balances, top-up
              number, activate add-ons and much more.
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
              src="/projects/vodafone/img-03.png"
              alt="My Vodafone app — key screens"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Role / Challenges / Process — label-left intro rows, matching the
          rhythm used by Why Redesign / Challenges / Research below. */}
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

      {/* Improvements — the four headline metrics, each with its animated
          figure (title intentionally omitted). */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <CaseStats stats={IMPROVEMENTS} />
        </div>
      </section>

      {/* What was done — the short version's summary of the work. */}
      <CaseSummary items={SUMMARY} />

      {/* The fold — short version above, the full story opens below. */}
      <StorySwitch />

      {/* Why redesign. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Why Redesign</h2>
            <p className={`${T.body} text-sol-dim`}>
              The tasks for the redesign were based on key issues identified in
              the previous version of the app: a heavy load on the call center, a
              low daily active user count compared to the overall user base, and
              limited use of the mobile app&apos;s features to engage both
              existing and new customers. These problems were caused by outdated
              and unintuitive functionality.
            </p>
          </div>
        </div>
      </section>

      {/* Challenges — numbered, each with its delivered work. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="flex flex-col gap-[110px]">
            {CHALLENGES.map((c) => (
              <div key={c.n} id={c.n.toLowerCase().replace(" ", "-")}>
                <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
                  <div className="flex flex-col gap-3">
                    <span className={`${T.label} text-accent`}>{c.n}</span>
                    <h3 className={T.sub}>{c.title}</h3>
                  </div>

                  <div className="flex flex-col gap-5">
                    {c.intro && <p className={`${T.body} text-sol-dim`}>{c.intro}</p>}
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

      {/* Design System cross-link — the existing teaser, now wrapped in a
          bordered, clickable card. Sits before Research as a related-case-study
          teaser. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <Link
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
          </Link>
        </div>
      </section>

      {/* Research. */}
      <section id="research" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Research</h2>
            <div className={`flex flex-col gap-8 ${T.body} text-sol-dim`}>
              <div className="flex flex-col gap-4">
                <h3 className={T.sub}>
                  How we understand that we&apos;re doing right or wrong
                </h3>
                <p>
                  Throughout the process, we gathered feedback from various
                  sources, including markets, support, and statistics. The final
                  stage involved conducting user testing, which included
                  interviews with 25 participants from a focus group.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className={T.sub}>How it helped us?</h3>
                <p>
                  For instance, one of the key changes resulting from our
                  research was an adjustment to the navigation. In the initial
                  iteration, there were only two main navigation sections, making
                  it difficult for users to access tariffs or add-ons, which were
                  hidden. In the next iteration, we expanded the menu to four
                  items, significantly simplifying the entry points for users.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-[30px]">
            {[
              "/projects/vodafone/img-09.png",
              "/projects/vodafone/img-10.png",
            ].map((src) => (
              <div key={src} className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt="My Vodafone app redesign — research and delivery"
                  loading="lazy"
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we measure success — closing quote. */}
      <section data-detail className="pb-[120px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>How we measure success</h2>
            <blockquote>
              <p className={`${T.body} text-sol-dim`}>
                We have exceeded our annual targets for both monthly and daily
                active users, improved our marketplace rating, and increased
                overall user satisfaction based on qualitative research.
                Additionally, we received recognition for having the second-best
                user experience among all Ukrainian apps.
              </p>
            </blockquote>
          </div>

          {/* Award + team photo — closes the section after the quote. */}
          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone/img-11.png"
              alt="CX Excellence award for best UX and the Vodafone team"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Other projects — the home page's side-scrolling board, cases and
          stats only (this case left out). */}
      <section>
        <OtherProjects exclude="/work/vodafone" />
      </section>

      {/* Contact — the same final block as the home page. */}
      <ContactSection />

      {/* Footer. */}
      <footer className="border-t border-line py-8">
        <div className={`${SHELL} flex items-center justify-between ${T.label} text-sol-dim`}>
          <Link href="/" className="transition-colors hover:text-accent">
            Home
          </Link>
          <span>© 2025</span>
        </div>
      </footer>
    </main>
  );
}
