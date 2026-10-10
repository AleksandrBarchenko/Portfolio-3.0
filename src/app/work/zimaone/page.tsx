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
  title: "ZimaOne — end-to-end design for construction SaaS · a.barchenko",
  description:
    "Case study: end-to-end design of the ZimaOne mobile app, a multi-functional construction SaaS for file sharing and site observations. Product design by Alex Barchenko.",
};

/* Typography — the same single type scale as the Vodafone case studies so
   every study reads as one series. */
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
  { label: "Company", value: "ZimaOne" },
  { label: "Period", value: "2018–2020" },
  { label: "Product", value: "SaaS" },
];

/* Intro rows — verbatim from the source case study. */
const INFO = [
  {
    label: "Team",
    items: [
      "Worked together with iOS, Android and web developers, product owner and QA tester",
    ],
  },
  {
    label: "Responsibilities",
    items: [
      "2 parts architecture planning",
      "Design of new functionality for B2B and redesign of the B2C part",
    ],
  },
  {
    label: "Achievements",
    items: [
      "Gained teamwork experience",
      "Developed the first design system",
      "Created 20+ functionalities",
    ],
  },
];

/* Headline numbers — all taken from the source copy. */
const IMPROVEMENTS: CaseStat[] = [
  { value: 20, suffix: "+", label: "Functionalities created", kind: "count" },
  { value: 2, label: "Product parts — B2B and B2C", kind: "split" },
];

/* The extra functionalities delivered across the long-term project. */
const FUNCTIONS = [
  {
    title: "Chat",
    body: "Standard chat functionality that allows you to exchange messages and files.",
    image: "/projects/zimaone/fn-chat.png",
  },
  {
    title: "File manager",
    body: "File manager, which allows you to save, build hierarchies and share files.",
    image: "/projects/zimaone/fn-files.png",
  },
  {
    title: "Inspections",
    body: "This complex functionality enables inspections of the facility after its handover by workers. It allows users to create problem lists, attach files and messages, and track the status of each issue.",
    image: "/projects/zimaone/fn-inspections.png",
  },
  {
    title: "Milestones",
    body: "This functionality is tailored for managers, enabling them to create a project timeline and organize tasks within the context of the entire project.",
    image: "/projects/zimaone/fn-milestones.png",
  },
  {
    title: "Leave & Absence",
    body: "This functionality is designed for all employees and allows them to track their vacation and sick leave balances.",
    image: "/projects/zimaone/fn-leave.png",
  },
];

/* Retrospective — what I would do differently. */
const LESSONS = [
  { title: "User testing", body: "Less focus on the new functionality only." },
  { title: "Consistency", body: "I had a design system but didn't always follow it." },
  { title: "Don't reinvent the wheel", body: "Use things that already work well." },
];

/* "What was done" for the short version — one line per challenge. */
const SUMMARY: SummaryItem[] = [
  {
    title: "Understand start points and user needs",
    done: "Defined the navigation from the existing web version, cut an MVP-0 feature set for mobile and identified two key personas.",
    target: "before-design",
  },
  {
    title: "Clarify roles through the “Observation” flow",
    done: "Mapped how roles interact, then shipped issue tracking with statuses, photo, video and audio notes, map locations, deadlines and assignees.",
    target: "design-process",
  },
  {
    title: "Ship the core mobile toolset",
    done: "Chat, file manager, inspections, milestones and leave & absence.",
    target: "more",
  },
];

export default function ZimaOneCaseStudy() {
  return (
    <main className="case-bg min-h-screen font-sans text-sol">
      <CaseHeader />

      {/* Hero — label row, title, overview, spec strip. */}
      <section className="pt-[70px] pb-[80px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2 lg:items-end">
            <div>
              <div className={`flex items-center gap-[19px] ${T.label} text-sol`}>
                <span>mobile app design</span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>2018–2020</span>
              </div>

              <h1 className={`mt-6 ${T.display}`}>
                End-to-end design for construction SaaS
              </h1>
            </div>

            <p className={`${T.body} text-sol-dim`}>
              This is my first long-term mobile app project, offering a range of
              functionalities, including file sharing and creating construction
              observations for large-scale projects.
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
              src="/projects/zimaone/hero.png"
              alt="ZimaOne app — files, home, observations and floor-plan screens"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Team / Responsibilities / Achievements — label-left intro rows. */}
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

      {/* Headline numbers with their animated figures (title intentionally
          omitted). */}
      <section className="pb-[100px]">
        <div className={SHELL}>
          <CaseStats stats={IMPROVEMENTS} />
        </div>
      </section>

      {/* What was done — the short version's summary of the work. */}
      <CaseSummary items={SUMMARY} />

      {/* The fold — short version above, the full story opens below. */}
      <StorySwitch />

      {/* Mobile app goals. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Mobile App Goals</h2>
            <p className={`${T.body} text-sol-dim`}>
              I began working on the product at the outset of mobile app
              development. At that time, there was a web-based system that
              addressed the basic needs of construction managers but lacked
              essential communication between managers and employees.
            </p>
          </div>
        </div>
      </section>

      {/* Before design — navigation structure + personas. */}
      <section id="before-design" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Before design</span>
              <h3 className={T.sub}>Understand start points and user needs</h3>
            </div>

            <div className="flex flex-col gap-5">
              <p className={`${T.body} text-sol-dim`}>
                Before starting the design process, I defined a general
                navigation structure based on the existing web version. I
                excluded non-essential functionalities and created a list of
                MVP-0 features exclusive to the mobile app.
              </p>
              <p className={`${T.body} text-sol-dim`}>
                To facilitate this, I collaborated with the team to refine
                existing features and enhance them. Additionally, I identified
                two key personas for the application.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/zimaone/before-design.png"
              alt="Navigation structure and the two key personas — manager and employee"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Design process — the "Observation" functionality end to end. */}
      <section id="design-process" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-3">
              <span className={`${T.label} text-accent`}>Design process</span>
              <h3 className={T.sub}>&ldquo;Observation&rdquo; functional example</h3>
            </div>

            <p className={`${T.body} text-sol-dim`}>
              I implemented fundamental steps to clarify interactions between
              roles within the app, as these were not always straightforward.
              Clearly defining roles and their corresponding functionalities was
              essential.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-[30px]">
            {["/projects/zimaone/process-1.png", "/projects/zimaone/process-2.png"].map(
              (src) => (
                <div key={src} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="Business requirements, research, communication and user flows"
                    loading="lazy"
                    className="h-auto w-full"
                  />
                </div>
              ),
            )}
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h3 className={T.sub}>From flows to the final functionality</h3>
            <p className={`${T.body} text-sol-dim`}>
              After numerous iterations, we finalized the following
              functionalities: the ability to track a list of issues (tasks),
              create tasks with specified statuses, attach videos or photos, and
              use audio recordings for quick and convenient descriptions. Users
              can also add notes, mark exact locations on a map, set deadlines,
              and assign responsible individuals.
            </p>
          </div>

          <div className="mt-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/zimaone/observation.png"
              alt="Observation screens — list, create, assign, GPS position and history"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* A few more functionalities — same zig-zag as the Vodafone study. */}
      <section id="more" data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Also a few more functionalities</h2>
            <p className={`${T.body} text-sol-dim`}>
              This is a long-term project, so I&apos;ve worked on a few more
              interesting features.
            </p>
          </div>

          {/* Alternating rows — the phone (transparent PNG, circle baked in)
              sits on bare paper, the numbered copy beside it, swapping sides
              each row. */}
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

      {/* What I would do differently — short retrospective. */}
      <section data-detail className="pb-[100px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>What I would do differently</h2>
            <p className={`${T.body} text-sol-dim`}>
              A lot of things… but let&apos;s keep it short.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-y-10 border-y border-sol/12 py-12 lg:grid-cols-3">
            {LESSONS.map((l, i) => (
              <li key={l.title} className="flex flex-col gap-3 lg:px-8 lg:first:pl-0">
                <span className={`${T.label} text-accent`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={T.sub}>{l.title}</h3>
                <p className={`${T.body} text-sol-dim`}>{l.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Thankful for this experience — closing note + team photo. */}
      <section data-detail className="pb-[120px]">
        <div className={SHELL}>
          <div className="grid grid-cols-1 gap-x-16 gap-y-6 lg:grid-cols-2 lg:items-start">
            <h2 className={T.section}>Thankful for this experience</h2>
            <blockquote>
              <p className={T.sub}>
                This is my first big project and team, and it was fun!
              </p>
            </blockquote>
          </div>

          <div className="mt-12 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/projects/zimaone/team.png"
              alt="The ZimaOne team"
              loading="lazy"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Other projects — the home page's side-scrolling board, cases and
          stats only (this case left out). */}
      <section>
        <OtherProjects exclude="/work/zimaone" />
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
