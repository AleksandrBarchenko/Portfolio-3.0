import { describe, expect, it } from "vitest";
import { cueNames } from "uisfx";
import { CUE, openCloseCue, storyCue, themeCue } from "./sound-events";
import { getSoundPlayer } from "./uisfx-client";

describe("semantic cue mapping", () => {
  it("expands for the full story, collapses for the short read", () => {
    expect(storyCue("full")).toBe("expand");
    expect(storyCue("short")).toBe("collapse");
  });

  it("maps a dialog's resulting visibility to open/close", () => {
    expect(openCloseCue(true)).toBe("open");
    expect(openCloseCue(false)).toBe("close");
  });

  it("chooses the theme cue from the state it lands in", () => {
    expect(themeCue(true)).toBe("toggle-on");
    expect(themeCue(false)).toBe("toggle-off");
  });

  it("only references cue names that exist in the catalog", () => {
    const valid = new Set<string>(cueNames);
    for (const cue of Object.values(CUE)) {
      expect(valid.has(cue)).toBe(true);
    }
  });
});

describe("SSR safety", () => {
  it("never instantiates a player without a window (server render)", () => {
    // Vitest runs in the node environment here, so `window` is undefined.
    expect(typeof window).toBe("undefined");
    expect(getSoundPlayer()).toBeNull();
  });
});
