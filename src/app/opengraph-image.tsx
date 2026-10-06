import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadGoogleFont } from "./og-fonts";

/* The link-preview card shown when the site (or any page on it) is pasted
   into LinkedIn, Slack, iMessage, etc. Rendered once at build time. Mirrors
   the site's paper scheme: white, near-black Onest, red Redaction italics.
   Redaction is read from the .ttf twins of the site's woff2 files in
   app/fonts — Satori can't parse woff2. Re-export them if the font changes. */

export const alt = "a.barchenko — digital product designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SOL = "#252525";
const SOL_DIM = "#5d5d5d";
const ACCENT = "#e94245";

async function serifFont(file: string) {
  return (await readFile(join(process.cwd(), "src/app/fonts", file))).buffer as ArrayBuffer;
}

async function svgDataUrl(publicPath: string) {
  const svg = await readFile(join(process.cwd(), "public", publicPath));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export default async function OpengraphImage() {
  const [logo, arrow, onestLight, onest, serif, serifItalic] = await Promise.all([
    svgDataUrl("logos/logo.svg"),
    svgDataUrl("projects/arrow.svg"),
    loadGoogleFont("Onest", "Digital product designer", { weight: 300 }),
    // \u00a0: the &nbsp;s around "feelings" — without it in the subset
    // the words touching them fall back to the serif.
    loadGoogleFont("Onest", "Creating and making your business grow.\u00a0"),
    serifFont("redaction-35-400.ttf"),
    serifFont("redaction-35-400-italic.ttf"),
  ]);

  const fonts = [
    onestLight && { name: "Onest", data: onestLight, weight: 300 as const },
    onest && { name: "Onest", data: onest, weight: 400 as const },
    { name: "Redaction", data: serif, weight: 400 as const },
    // Own family name: sharing one with the upright, Satori kept picking the
    // upright face for the italic spans.
    { name: "RedactionItalic", data: serifItalic, style: "italic" as const },
  ].filter((f) => !!f);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          fontFamily: "Onest",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={64} height={64} alt="" />
          <span style={{ fontFamily: "Redaction", fontSize: 38, color: SOL }}>
            a.barchenko
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 92, fontWeight: 300, lineHeight: 1.05, color: SOL }}>
            Digital product designer
          </span>
          <span style={{ display: "flex", fontSize: 40, color: SOL_DIM }}>
            Creating&nbsp;
            <span style={{ fontFamily: "RedactionItalic", fontStyle: "italic", color: ACCENT }}>
              feelings
            </span>
            &nbsp;and making your business grow.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={arrow} width={29} height={38} alt="" />
          <span style={{ fontFamily: "RedactionItalic", fontStyle: "italic", fontSize: 38, color: ACCENT }}>
            View portfolio
          </span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
