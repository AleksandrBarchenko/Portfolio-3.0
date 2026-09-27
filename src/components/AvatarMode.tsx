"use client";

import { createContext, useContext, useState } from "react";

/* Which avatar the site renders. The nav tabs switch this: "1st" is the
   original orb, "2nd" is the TV head (see components/face/TvHead.tsx).
   Everything else on the page is identical between the two — only the avatar
   swaps. "3rd" ("lab") is different: it takes over the whole screen with the
   TV head tuning page (see components/face/TvLab.tsx) instead of the site. */
export type AvatarMode = "orb" | "face" | "lab";

const Ctx = createContext<{
  mode: AvatarMode;
  setMode: (m: AvatarMode) => void;
}>({ mode: "face", setMode: () => {} });

export const useAvatarMode = () => useContext(Ctx);

export function AvatarModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AvatarMode>("face");
  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}
