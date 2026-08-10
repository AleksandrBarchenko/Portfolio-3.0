import ParticleFace from "@/components/three/ParticleFace";

const NAV = [
  { label: "WORK", href: "#work" },
  { label: "ABOUT", href: "#about" },
  { label: "RESUME", href: "#resume" },
  { label: "CONTACT", href: "#contact" },
];

const STACKED = ["CREATING.", "FEELINGS.", "GROWTH."];

const SKILLS =
  "RESEARCH • PRODUCT DESIGN • LEADERSHIP • DESIGN SYSTEMS • DESIGN STRATEGY • USER TESTING • ANALYTICS • PROTOTYPING • ";

/** Corner bracket marks for the terminal-style CTA. */
function Brackets() {
  const corner = "absolute h-2 w-2 border-ink";
  return (
    <>
      <span className={`${corner} -left-1 -top-1 border-l border-t`} />
      <span className={`${corner} -right-1 -top-1 border-r border-t`} />
      <span className={`${corner} -bottom-1 -left-1 border-b border-l`} />
      <span className={`${corner} -bottom-1 -right-1 border-b border-r`} />
    </>
  );
}

/** Decorative HUD ruler with a highlighted cursor block. */
function Ruler() {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 41 }, (_, i) =>
        i === 20 ? (
          <span key={i} className="mx-1 h-4 w-8 shrink-0 bg-ink" />
        ) : (
          <span
            key={i}
            className={`w-px shrink-0 bg-dim ${i % 5 === 0 ? "h-3" : "h-1.5"}`}
          />
        ),
      )}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="flex min-h-screen flex-col p-2 sm:p-3">
      <div className="relative flex flex-1 flex-col border border-line">
        {/* Top bar: logo / coordinates / nav */}
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] sm:px-6">
          <a href="#" className="font-display font-bold tracking-[0.08em] text-ink">
            A.BARCHENKO
          </a>
          <span className="hidden text-dim lg:block">
            38.7223&deg;N&nbsp;/&nbsp;9.1393&deg;W&nbsp;&nbsp;PORTUGAL
          </span>
          <nav className="hidden items-center gap-5 sm:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-dim transition-colors hover:text-ink"
              >
                [&nbsp;{item.label}&nbsp;]
              </a>
            ))}
          </nav>
        </div>

        {/* Giant display name: solid + outline */}
        <h1 className="flex flex-wrap items-baseline justify-between overflow-hidden whitespace-nowrap border-b border-line px-2 pt-2 font-display font-black leading-[0.9] sm:px-3">
          <span className="text-[11vw] text-ink sm:text-[9vw]">ALEX</span>
          <span className="text-stroke text-[11vw] sm:text-[9vw]">
            BARCHENKO
          </span>
        </h1>

        {/* Main grid */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
          {/* Left: stacked statement words */}
          <div className="flex flex-col lg:col-span-5">
            {STACKED.map((word) => (
              <div
                key={word}
                className="border-b border-line px-4 py-3 sm:px-6"
              >
                <span className="font-display text-[9vw] font-bold leading-none text-ink lg:text-[4.3vw]">
                  {word}
                </span>
              </div>
            ))}
            <div className="flex flex-1 items-center border-b border-line px-4 py-8 sm:px-6">
              <a
                href="#work"
                className="relative inline-block border border-line bg-ink/5 px-5 py-3 font-mono text-xs tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-bg"
              >
                <Brackets />
                &gt;_VIEW_CASE_STUDIES
              </a>
            </div>

            {/* Skills ticker */}
            <div
              className="overflow-hidden whitespace-nowrap border-b border-line py-3 lg:border-b-0"
              aria-label="research, product design, leadership, design systems, design strategy, user testing, analytics, prototyping"
            >
              <div className="animate-marquee inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
                <span>{SKILLS}</span>
                <span aria-hidden>{SKILLS}</span>
              </div>
            </div>
          </div>

          {/* Middle: intro paragraph cell */}
          <div className="flex flex-col justify-between border-line lg:col-span-3 lg:border-x">
            <div className="border-b border-line p-4 sm:p-6 lg:border-b-0 lg:pt-10">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
                HI, I&rsquo;M DIGITAL PRODUCT DESIGNER
              </p>
              <p className="max-w-[46ch] text-[15px] leading-relaxed text-ink/85">
                Creating feelings and making your business grow. I turn
                research into product decisions and prototypes into shipped
                interfaces &mdash; product design, design systems, strategy,
                user testing and analytics, from first insight to measurable
                growth.
              </p>
            </div>
            <div className="hidden items-end justify-between p-6 font-mono text-[10px] uppercase tracking-[0.18em] text-dim lg:flex">
              <span>&#43;</span>
              <span>SIGNAL://LIVE</span>
              <span>&#43;</span>
            </div>
          </div>

          {/* Right: monochrome particle portrait */}
          <div className="relative min-h-[420px] lg:col-span-4">
            <ParticleFace />

            {/* Overlaid mask-style label */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-stroke font-display text-[16vw] font-black leading-none lg:text-[5.4vw]">
                HUMAN
              </span>
            </div>
            <span className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dim sm:left-6">
              DATA_PORTRAIT&nbsp;//&nbsp;LIVE
            </span>

            {/* HUD footer of the cell: ruler + version */}
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 sm:inset-x-6">
              <Ruler />
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
                VERSION: 2.0.26
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
