"use client";

import { SiteHeader } from "@/components/SiteHeader";
import Experience from "@/components/Experience";
import { TvLab } from "@/components/face/TvLab";
import { useAvatarMode } from "@/components/AvatarMode";

/* Top-level switch between the site and the TV head tuning page. The "3rd" tab
   sets AvatarMode to "lab", which takes the whole viewport over with <TvLab>
   (its own chrome, no site header); the other two tabs render the normal site
   with the orb or the TV head as the avatar. */
export function SiteShell() {
  const { mode } = useAvatarMode();

  if (mode === "lab") return <TvLab />;

  return (
    <main id="top" className="theme-fade min-h-screen overflow-x-clip">
      <SiteHeader />
      <Experience />
    </main>
  );
}
