import { SHELL } from "@/components/shell";

/* "What was done" — the short version's account of the work, laid out exactly
   like the My Role / Challenges / Process rows: small caps label on the left,
   accent-dot list on the right. Each item is the challenge title with one line
   on what shipped beneath it.

   Titles are anchors into the full story: clicking one opens the long version
   and scrolls to that challenge (StorySwitch handles `a[data-story-target]`).
   Tagged `data-short`, so it folds away once the full story is open. */
export type SummaryItem = {
  title: string;
  done: string;
  /* Id of the full-story section the title opens. */
  target: string;
};

export function CaseSummary({ items }: { items: SummaryItem[] }) {
  return (
    <section data-short className="pb-[100px]">
      <div className={SHELL}>
        <div className="grid grid-cols-1 gap-x-16 gap-y-5 lg:grid-cols-2 lg:items-start">
          <h2 className="text-[14px] uppercase tracking-wide text-sol-dim">What was done</h2>
          <ul className="flex flex-col gap-5">
            {items.map((item) => (
              <li key={item.title} className="flex gap-3 text-[18px] leading-[1.6]">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="flex flex-col gap-1">
                  <a
                    href={`#${item.target}`}
                    data-story-target
                    className="w-fit text-sol transition-colors hover:text-accent"
                  >
                    {item.title}
                  </a>
                  <span className="text-sol-dim">{item.done}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CaseSummary;
