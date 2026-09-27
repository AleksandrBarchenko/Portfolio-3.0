import { SiteShell } from "@/components/SiteShell";
import { ActiveSectionProvider } from "@/components/ActiveSection";
import { AvatarModeProvider } from "@/components/AvatarMode";

export default function Home() {
  return (
    <AvatarModeProvider>
      <ActiveSectionProvider>
        <SiteShell />
      </ActiveSectionProvider>
    </AvatarModeProvider>
  );
}
