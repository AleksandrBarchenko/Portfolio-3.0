/* The case studies' outbound "View website" link — the brand arrow + a Special
   Elite label. On hover/focus the arrow swings from ↙ round to ↗ ("this leaves
   the site"), the label nudges after it and an underline draws in from the left
   (and retracts to the right on leave). */
export function ExternalArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2.5 outline-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/projects/arrow.svg"
        alt=""
        aria-hidden
        // Origin sits on the arrow's own centre (it's drawn low in its viewBox),
        // so the swing pivots in place instead of drifting up.
        className="h-[34px] w-[26px] origin-[52%_58%] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:group-hover:rotate-180 motion-safe:group-focus-visible:rotate-180"
      />
      <span className="relative font-serif text-[32px] italic text-accent transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1">
        {children}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-[0.3em] h-px origin-right scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100"
        />
      </span>
    </a>
  );
}
