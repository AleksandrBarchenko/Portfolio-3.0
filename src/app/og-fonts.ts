/* Fonts for the generated share images (next/og). Satori can't use next/font
   or woff2, so pull TTFs straight from Google Fonts at build time — only the
   glyphs in `text`, which keeps each request tiny. Returns null if the fetch
   fails so the image still builds in the default font rather than breaking
   the deploy. */
export async function loadGoogleFont(
  family: string,
  text: string,
  { weight = 400, italic = false }: { weight?: number; italic?: boolean } = {},
): Promise<ArrayBuffer | null> {
  try {
    const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
    const url =
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${axis}` +
      `&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}
