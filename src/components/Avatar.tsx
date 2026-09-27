"use client";

import type { OrbState } from "@/types/orb";
import { OrbCanvas } from "@/components/orb/OrbCanvas";
import { TvHead } from "@/components/face/TvHead";
import { useAvatarMode } from "@/components/AvatarMode";

/* Drop-in avatar: renders the orb ("1st" tab) or the TV head ("2nd" tab)
   depending on the active nav tab. Both take the same interaction `state` —
   OrbState and TvState are the same four-value union. */
export function Avatar({
  state,
  className,
  baseYaw,
  screenMediaSrc,
  screenMediaActive,
  screenShowPlay,
  onScreenActivate,
}: {
  state: OrbState;
  className?: string;
  /* TV-head-only screen/pose controls — ignored by the orb. */
  baseYaw?: number;
  screenMediaSrc?: string;
  screenMediaActive?: boolean;
  screenShowPlay?: boolean;
  onScreenActivate?: () => void;
}) {
  const { mode } = useAvatarMode();
  return mode === "face" ? (
    <TvHead
      state={state}
      className={className}
      baseYaw={baseYaw}
      screenMediaSrc={screenMediaSrc}
      screenMediaActive={screenMediaActive}
      screenShowPlay={screenShowPlay}
      onScreenActivate={onScreenActivate}
    />
  ) : (
    <OrbCanvas state={state} className={className} />
  );
}

export default Avatar;
