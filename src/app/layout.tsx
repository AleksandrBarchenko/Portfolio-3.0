import type { Metadata } from "next";
import { Onest, Orbitron, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SoundProvider } from "@/components/sound/SoundProvider";

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

// Special Elite — the wordmark, the italic "feelings"/"View use case" accents.
// Its glyphs are much wider than Onest's, so size-adjust scales it across every
// `font-serif` usage. 83% is the most it can take while the hero keeps
// "Creating feelings" on one line and the skills intro stays at two lines
// (it needs 879px of its 890px max-width; 84% would leave 1px).
const specialElite = localFont({
  src: "./fonts/special-elite-400.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-serif",
  display: "swap",
  declarations: [{ prop: "size-adjust", value: "83%" }],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute base for the share-preview image URLs. Swap for the custom domain
  // once there is one.
  metadataBase: new URL("https://portfolio30-aleksandrbarcenko-5456s-projects.vercel.app"),
  title: "a.barchenko — digital product designer",
  description:
    "Portfolio of Alex Barchenko, digital product designer. Creating feelings and making your business grow.",
  // No title/description here on purpose: previews fall back to each page's
  // own <title> and description, so case-study links read as that case. The
  // image comes from app/opengraph-image.tsx and is shared by every route.
  openGraph: { siteName: "a.barchenko", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${onest.variable} ${orbitron.variable} ${plexMono.variable} ${specialElite.variable}`}
    >
      <head>
        {/* Resolve the theme before first paint so there's no flash. Falls back
            to the OS preference when the user hasn't chosen one yet. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
