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
  title: "Vodafone app — increased active user base by 12% · a.barchenko",
  description:
    "Case study: designing new functionalities for the My Vodafone app — growing the active user base by 12% and lifting the app store rating. Product design by Alex Barchenko.",
};

/* Typography — the same single type scale as the first Vodafone case study so
   the two studies read as one series.
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
  { label: "Product", value: "B2C" },
];

/* Intro lists — verbatim from the source case study. */
const INFO = [
  {
    label: "My Role",
    items: [
      "Product Designer",
      "Collaborated with Designer, Business Analytics, PM, PO, Developers, and QA",
    ],
  },
  {
    label: "Challenges",
    items: ["Low engagement", "Weak usability for complex solutions"],
  },
  {
    label: "Process",
    items: [
      "Ran user research and behavioral analysis",
      "Built and scaled a unified design system across products",
      "Directed the end-to-end design lifecycle",
    ],
  },
];

/* Headline outcomes of the release — source order, verbatim numbers. */
const IMPROVEMENTS: CaseStat[] = [
  { value: 12, prefix: "+", suffix: "%", label: "Increased active user base", kind: "growth" },
  { value: 0.2, prefix: "+", decimals: 1, label: "Boosted app store rating", kind: "rating" },
];

/* Sources the team pulled feedback from — verbatim list. */
const RESEARCH_SOURCES = [
  "Firebase statistics and conversions",
  "Telegram channel with beta testers and regular users",
  "Reviews of Google and Apple markets",
  "In-app functionality to leave reviews directly",
  "In-app live support",
  "Telecommunications operator call center",
  "And most importantly — direct interviews with users, both online and offline",
];

/* The extra functionalities delivered across the long-term project. */
const FUNCTIONS = [
  {
    title: "Onboarding",
    body: "The user's first introduction to the application, which describes and demonstrates its main functions.",
    image: "/projects/vodafone-userbase/fn-onboarding.png",
  },
  {
    title: "Offers in Expenses",
    body: "To keep the user engaged, help him spend balances with benefit. By determining what the user spends the most money on, the personal assistant offers the appropriate service to save money.",
    image: "/projects/vodafone-userbase/fn-offers.png",
  },
  {
    title: "Geosearch",
    body: "To make users less worried about their relatives, created a contact geosearch tracking based on the location of the mobile operator card.",
    image: "/projects/vodafone-userbase/fn-geosearch.png",
  },
  {
    title: "New account",
    body: "Part of a series of developments that greatly simplified users' lives. Previously, adding a new user required visiting a physical store; now it can be done directly within the application.",
    image: "/projects/vodafone-userbase/fn-account.png",
  },
  {
    title: "Gift for a friend",
    body: "Created a functionality that allows making gifts for yourself or sometimes from Vodafone, such as gigabytes of Internet, minutes for calls and SMS packages.",
    image: "/projects/vodafone-userbase/fn-gift.png",
  },
];

/* "What was done" for the short version — one line per challenge. */
const SUMMARY: SummaryItem[] = [
  {
    title: "Increase users engagement",
    done: "Introduced Stories to surface features without pulling users away from their balances — daily active users grew 3% after release.",
    target: "challenge-1",
  },
  {
    title: "Make top-up easier to use",
    done: "One linear picker for sub-numbers, recent and phone-book numbers, with sub-numbers explained right after a top-up.",
    target: "challenge-2",
  },
  {
    title: "Make complex look easy: auto payment",
    done: "Cut the “do everything” scope with a single user survey, then turned a complex build into one simple flow.",
    target: "challenge-3",
  },
  {
    title: "Ship new functionality across the app",
    done: "Onboarding, offers in expenses, geosearch, opening a new account in-app and gifts for a friend.",
    target: "more",
  },
];

export default function VodafoneUserbaseCaseStudy() {
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
                <span>2023–2024</span>
              </div>

              <h1 className={`mt-6 ${T.display}`}>
                Increased active user base by 12% for Vodafone app
              </h1>
            </div>

            {/* Intro fills the right column so its left edge (the shared content
                column) and right edge (the section/image edge) both line up
                with every body block below. */}
            <p className={`${T.body} text-sol-dim`}>
              New functionalities design for the mobile communication management
              app for millions of active users. App allows to track user data
              balances, top-up number, activate add-ons and much more.
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

      {/* Full-bleed cover image — the key screens of the app, right after
          the product spec strip. */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <div className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/hero.png"
              alt="My Vodafone app — key screens"
              loading="lazy"
              className="h-auto w-full"
            />
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

      {/* Improvements — the headline metrics with their animated figures
          (title intentionally omitted). */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <CaseStats stats={IMPROVEMENTS} />
        </div>
      </section>

      {/* What was done — the short version's summary of the work. */}
      <CaseSummary items={SUMMARY} />

      {/* The fold — short version above, the full story opens below. */}
      <StorySwitch />

      {/* The Process — closing method statement + flow diagram. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>The Process</h2>
            <div className="flex flex-col gap-4">
              <h3 className={T.sub}>Research. Create. Validate. Repeat.</h3>
              <p className={`${T.body} text-sol-dim`}>
                At every stage, from concept to release, the team reviewed the
                results and made adjustments as needed.
              </p>
            </div>
          </div>

          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/process.png"
              alt="Design process flow — from idea to beta release"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Redesign cross-link — the new functionalities build on a full redesign
          of the existing features; point readers to that first case study. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <Link
            href="/work/vodafone"
            className="group grid grid-cols-1 gap-8 rounded-[24px] border border-sol/15 p-8 transition-colors duration-300 ease-out hover:border-accent/50 sm:grid-cols-2 sm:items-start sm:gap-16 sm:p-12"
          >
            {/* Left — eyebrow + title. */}
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Before new features</span>
              <span className={T.sub}>Redesign stage and global update release</span>
            </div>

            {/* Right — context line, then the view-case-study affordance. */}
            <div className="flex flex-col gap-8 sm:items-start">
              <p className={`${T.body} text-sol-dim`}>
                Before designing the new functionalities, we focused extensively
                on a comprehensive redesign of the existing features. Don&apos;t
                forget to come back then.
              </p>

              <span className={`inline-flex items-center gap-2 ${T.label} text-accent`}>
                View redesign case study
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

      {/* Challenge 1 — engagement / Stories. */}
      <section id="challenge-1" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Challenge 1</span>
              <h3 className={T.sub}>Increase users engagement</h3>
            </div>

            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                This is not a dynamic content-based app; the primary function
                users engage in is tracking their balances. However, the app
                provides many additional features that benefit both users and the
                business.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                We considered several methods for communicating with users:
                traditional &ldquo;What&apos;s New&rdquo; onboarding, TOBi — the
                app assistant, push and in-app notifications. All these methods
                can distract users from their primary objectives.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                One of the most useful features found in other apps is Stories.
                Users are familiar with how it works, enjoy viewing stories, and
                appreciate the ability to share them.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/challenge-1a.png"
              alt="Stories, quick access and What's new — engagement concepts"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h3 className={T.sub}>
              After &ldquo;Stories&rdquo; has been released, we found a place for
              improvements
            </h3>
            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                After the release, we received a lot of positive feedback
                regarding its usefulness, and our daily active user base
                increased by 3%.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                Based on typical screen sizes of users, the offer card was
                positioned outside the active zone, negatively impacting
                conversions. We modified the layout: Offers and Stories placed in
                the same area, prioritized accordingly. As a result, Story
                activity remained unchanged, users scrolled more, leading to
                additional positive engagement.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/challenge-1b.png"
              alt="Offers and Stories placed in the main screen's active zone"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Challenge 2 — usability, top-up example. */}
      <section id="challenge-2" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Challenge 2</span>
              <h3 className={T.sub}>
                Usability improvements. Top-up example.
              </h3>
            </div>

            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                Shortly about how it worked: users can top up both their own
                numbers and sub-numbers previously added to their list, as well
                as top up other numbers from their phone book or by entering them
                manually.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/challenge-2a.png"
              alt="Original top-up flow — choose number, enter amount, confirm"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h3 className={T.sub}>
              But users aren&apos;t using it the way the team expected
            </h3>
            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                <span className="text-accent">67%</span> of users top up a number
                from the phone book or manually, but don&apos;t use the
                sub-numbers functionality.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                Statistics revealed the majority of users looking to top up
                numbers other than their own do not recharge sub-numbers as
                anticipated; they prefer entering other numbers manually. While
                the sub-number base is small, it remains interesting from a
                business and user-engagement perspective.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                Users may not understand the purpose of the sub-number feature.
                Additionally, users do not recognize the &ldquo;phone book&rdquo;
                icon in the phone field.
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h3 className={T.sub}>Let&apos;s make the flow more linear.</h3>
            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                When a user wants to top up a number that isn&apos;t their own,
                display a modal with all available options. If the user has
                sub-numbers, these are shown first, followed by recently
                topped-up numbers, simplifying the search process, and finally
                all phone book numbers.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                After a top-up, the system checks if the user has any
                sub-numbers. If not, it automatically adds the topped-up number
                and provides a brief explanation of the sub-number
                functionality.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/challenge-2b.png"
              alt="New linear top-up flow with sub-number suggestions"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Challenge 3 — complexity, auto payment example. */}
      <section id="challenge-3" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Challenge 3</span>
              <h3 className={T.sub}>
                Make complex look easy. Auto payment example.
              </h3>
            </div>

            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                <span className="font-medium text-sol">
                  Debates with stakeholders.
                </span>{" "}
                The stakeholder was the internal team at Vodafone, aiming to
                implement everything simultaneously, creating a
                &ldquo;transformer&rdquo; solution. We debated extensively about
                which payment methods would be relevant for users, ultimately
                resolved through a single survey. The survey revealed that the
                low-balance auto-payment option was not appealing to users and
                could be excluded, at least for the first iteration.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/challenge-3a.png"
              alt="Survey results on preferred auto-payment options"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h3 className={T.sub}>From a complex build to a simple flow</h3>
            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                After aligning on the general concept with the stakeholder, we
                faced challenges with the backend team responsible for
                implementing the functionality. The implementation proved to be
                quite complex.
              </p>
              <blockquote className={`border-l-2 border-accent pl-5 ${T.body} text-sol`}>
                According to the backend team, users could access the
                functionality without Google Pay or Apple Pay, even though these
                payment methods were used by 80% of our user base.
              </blockquote>
              <p className={`${T.body} text-sol-dim`}>
                After around 4 iterations, we identified the most straightforward
                solution for users, balancing limitations with potential benefits
                for both users and the company.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/challenge-3b.png"
              alt="Simplified auto-payment setup flow"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Research — how the team validated the work. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Research</h2>
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

          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/research.png"
              alt="User interviews, in-app polls and analytics dashboards"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* A few more functionalities — the additional work shipped over the
          long-term project. */}
      <section id="more" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Also a few more functionalities</h2>
            <p className={`${T.body} text-sol-dim`}>
              This is a long-term project, so I worked on several additional
              functionalities that contributed to increasing the user base,
              overall satisfaction, and engagement.
            </p>
          </div>

          {/* Alternating rows — the phone (transparent PNG, circle baked in)
              sits on bare paper, the numbered copy beside it, swapping sides
              each row so the list reads as a zig-zag rather than a grid. */}
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
      <section data-detail className="pb-[120px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>How we measure success</h2>
            <blockquote>
              <p className={`${T.body} text-sol-dim`}>
                Every new feature was measured against our yearly goals — and
                both monthly and daily active users came in above target. Store
                ratings went up, qualitative research showed people were more
                satisfied with the app overall, and the work helped keep its
                place among the best user experiences in Ukraine, recognized as
                the second-best of all local apps.
              </p>
            </blockquote>
          </div>

          {/* Award + team photo — closes the section after the quote. */}
          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/vodafone-userbase/success.png"
              alt="Ukrainian CX Excellence award for best UX and the Vodafone team"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Other projects — the home page's side-scrolling board, cases and
          stats only (this case left out). */}
      <section>
        <OtherProjects exclude="/work/vodafone-userbase" />
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
