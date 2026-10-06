"use client";

/* Floating cut-out photo that opens a "side quest". It does NOT sit in the card
   flow — it's absolutely positioned (via `pos`) into the empty margin a card's
   stagger leaves beside it, so it hangs off the card's side and never disturbs
   the 140px rhythm between cards. Desktop-only (needs the side margin).

   Two layers, exactly like the frame: the clipped photo, and a stroke overlay
   carrying the torn-paper white edge + grain, inset -7% so it rings the photo.
   CSS handles the resting tilt, the red-tinted drop shadow, and the hover that
   straightens + grows it and tints the photo shape with accent. */
export function FloatingPhoto({
  photo,
  stroke,
  pos = "",
  rotate,
  scale = 1,
  fill = false,
  ariaLabel,
  onClick,
}: {
  photo: string;
  /* Separate torn-paper edge overlay. Omit for photos with the edge baked in. */
  stroke?: string;
  /* Absolute-position utilities anchoring the 120px box to the card edge. */
  pos?: string;
  rotate: number;
  /* Visual size only. Denser shapes are scaled down so their mass keeps the
     same breathing room from the card as the airier ones. */
  scale?: number;
  /* Fill the parent instead of hanging off a card edge (the board layout
     positions and sizes the photo itself, at every breakpoint). */
  fill?: boolean;
  ariaLabel: string;
  /* Opens the "side quest" modal. */
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={
        { "--rot": `${rotate}deg`, "--scale": `${scale}` } as React.CSSProperties
      }
      className={`group cursor-pointer ${fill ? "relative block aspect-square w-full" : `absolute z-10 hidden h-[120px] w-[120px] xl:block ${pos}`} [transform:rotate(var(--rot))_scale(var(--scale))] drop-shadow-[0_8px_12px_rgba(255,0,0,0.15)] transition-[transform,filter] duration-300 ease-out hover:[transform:rotate(0deg)_scale(calc(var(--scale)*1.12))] hover:drop-shadow-[0px_2px_1px_rgba(255,0,0,0.25)]`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-contain" />
      {/* 10% accent overlay, masked to the photo's torn shape so only the
          photo (not its transparent edges) gets tinted on hover */}
      <div
        aria-hidden
        style={{
          WebkitMaskImage: `url(${photo})`,
          maskImage: `url(${photo})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
        className="pointer-events-none absolute inset-0 bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-10"
      />
      {/* torn-paper white edge + grain, ringing the photo */}
      {stroke && (
        <div className="absolute inset-[-7%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stroke} alt="" className="h-full w-full" />
        </div>
      )}
    </button>
  );
}
