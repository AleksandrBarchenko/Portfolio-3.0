import type { CueName } from "uisfx";

/* Central event → semantic-cue map. One place so the mapping is auditable and
   unit-testable, and so every component reaches for the same name. Each value
   describes what HAPPENED (a view opened, a case was entered), never what the
   control looked like. */
export const CUE = {
  /* Fine-pointer discovery on a sparse, important control (header nav). */
  hover: "hover",
  /* A dialog / detail view appears or recedes. */
  open: "open",
  close: "close",
  /* A contact detail was copied to the clipboard. */
  copy: "copy",
  /* The case study reveals its full detail / returns to the short read. */
  storyFull: "expand",
  storyShort: "collapse",
  /* Route change into a case study, and back out of it. */
  enterCase: "forward",
  leaveCase: "back",
  /* Sound was switched back on — a one-off confirmation it's audible again. */
  soundOn: "toggle-on",
  /* Theme flip, keyed off the resulting state. */
  themeDark: "toggle-on",
  themeLight: "toggle-off",
} as const satisfies Record<string, CueName>;

export type Mode = "short" | "full";

/* Expand when opening the full story, collapse when folding back to the short
   read — chosen from the resulting state, not the button pressed. */
export function storyCue(next: Mode): CueName {
  return next === "full" ? CUE.storyFull : CUE.storyShort;
}

/* Open/close a dialog, chosen from the resulting visibility. */
export function openCloseCue(open: boolean): CueName {
  return open ? CUE.open : CUE.close;
}

/* Theme cue chosen from the state the toggle lands in. */
export function themeCue(nextIsDark: boolean): CueName {
  return nextIsDark ? CUE.themeDark : CUE.themeLight;
}
