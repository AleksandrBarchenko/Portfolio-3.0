import { describe, expect, it } from "vitest";
import { planBabble } from "./robot-voice";
import { getAudioContext, getRobotVoice } from "./uisfx-client";

/* Deterministic stand-in for Math.random. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("planBabble", () => {
  it("says nothing for empty or punctuation-only text", () => {
    expect(planBabble("")).toEqual([]);
    expect(planBabble("   ")).toEqual([]);
    expect(planBabble("— … !?")).toEqual([]);
  });

  it("stays inside the typewriter's timeline, in order", () => {
    const text = "Hi, I'm Alex. Want to see what I build?";
    const blips = planBabble(text, 30, seeded());
    expect(blips.length).toBeGreaterThan(0);
    let prev = -1;
    for (const b of blips) {
      expect(b.atMs).toBeGreaterThanOrEqual(0);
      expect(b.atMs).toBeGreaterThan(prev);
      expect(b.atMs + b.durMs).toBeLessThanOrEqual(text.length * 30);
      prev = b.atMs;
    }
  });

  it("emits one blip per syllable", () => {
    // hello(2) robot(2) make(1, silent e) things(1)
    expect(planBabble("hello robot make things", 30, seeded())).toHaveLength(6);
  });

  it("lifts a question and settles a statement", () => {
    const q = planBabble("are you there?", 30, seeded(7));
    expect(q[q.length - 1].semitone).toBeGreaterThan(q[q.length - 2].semitone);
    const s = planBabble("we are here.", 30, seeded(7));
    expect(s[s.length - 1].semitone).toBeLessThan(s[s.length - 2].semitone);
  });
});

describe("robot voice SSR safety", () => {
  it("never creates an AudioContext or voice without a window", () => {
    expect(typeof window).toBe("undefined");
    expect(getAudioContext()).toBeNull();
    expect(getRobotVoice()).toBeNull();
  });
});
