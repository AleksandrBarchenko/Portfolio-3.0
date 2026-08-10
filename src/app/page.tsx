import { SiteHeader } from "@/components/SiteHeader";
import Experience from "@/components/Experience";
import { ActiveSectionProvider } from "@/components/ActiveSection";

export default function Home() {
  return (
    <ActiveSectionProvider>
      <main id="top" className="theme-fade min-h-screen overflow-x-clip">
        <SiteHeader />
        <Experience />
      </main>
    </ActiveSectionProvider>
  );
}
