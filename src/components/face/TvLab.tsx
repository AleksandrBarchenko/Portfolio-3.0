"use client";

/* ────────────────────────────────────────────────────────────────────────────
 * TV Head — tuning page ("3rd" tab)
 *
 * A full-screen lab for the TV head: pick a state on the left, watch the head
 * live in the centre, and dial in that state's colours and parameters on the
 * right. Editing writes into a local copy of DEFAULT_TV_SETTINGS and passes it
 * straight to <TvHead settings=...>, so the head cross-fades every change in
 * real time. "Copy JSON" hands the whole tuned object back to paste over
 * DEFAULT_TV_SETTINGS in TvHead.tsx.
 *
 * Reached via the "3rd" header tab (AvatarMode "lab"); the ✕ returns to the
 * TV head site ("2nd" / "face").
 * ──────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TvHead,
  DEFAULT_TV_SETTINGS,
  TV_STATES,
  useTextMouth,
  type TvSettings,
  type TvState,
  type TvStateParams,
} from "@/components/face/TvHead";
import { useAvatarMode } from "@/components/AvatarMode";
import { useSound } from "@/components/sound/SoundProvider";
import { CUE } from "@/components/sound/sound-events";

/* The reply the head "speaks" while the Replying state is selected, so the
   mouth animates and you can tune it against real motion. */
const REPLY_TEXT =
  "Sure — I can help you with that. The main reception is just to the left of the elevators on the ground floor.";

const STATE_LABEL: Record<TvState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  replying: "Replying",
};

/* ── Control definitions ─────────────────────────────────────────────────── */

type ColorKey = Extract<
  keyof TvStateParams,
  | "shellColor"
  | "shellDark"
  | "grilleColor"
  | "screenA"
  | "screenB"
  | "faceColor"
  | "cableColor"
  | "backdropColor"
>;

const COLOR_CONTROLS: { key: ColorKey; label: string }[] = [
  { key: "shellColor", label: "Shell" },
  { key: "shellDark", label: "Bezel / hood" },
  { key: "grilleColor", label: "Speaker mesh" },
  { key: "screenA", label: "Panel — deep" },
  { key: "screenB", label: "Panel — bright" },
  { key: "faceColor", label: "Eyes / mouth" },
  { key: "cableColor", label: "Cables" },
];

type NumKey = Exclude<keyof TvStateParams, ColorKey>;
type Slider = { key: NumKey; label: string; min: number; max: number; step: number };

const SCREEN_SLIDERS: Slider[] = [
  { key: "drift", label: "Gradient drift", min: 0, max: 2, step: 0.01 },
  { key: "screenGlow", label: "Screen glow", min: 0.4, max: 2.5, step: 0.01 },
  { key: "pixelGrid", label: "Pixel grid", min: 0, max: 1, step: 0.01 },
];

const FACE_SLIDERS: Slider[] = [
  { key: "eyeW", label: "Eye width", min: 0.01, max: 0.2, step: 0.002 },
  { key: "eyeH", label: "Eye height", min: 0.01, max: 0.25, step: 0.002 },
  { key: "eyeSpacing", label: "Eye spacing", min: 0.03, max: 0.3, step: 0.005 },
  { key: "eyeHeight", label: "Eye line", min: -0.3, max: 0.3, step: 0.005 },
  { key: "eyeRound", label: "Eye rounding", min: 0, max: 0.2, step: 0.002 },
  { key: "mouthW", label: "Mouth width", min: 0.01, max: 0.3, step: 0.002 },
  { key: "mouthH", label: "Mouth height", min: 0.005, max: 0.15, step: 0.002 },
  { key: "mouthY", label: "Mouth position", min: -0.4, max: 0.2, step: 0.005 },
  { key: "mouthCurve", label: "Mouth curve", min: -1, max: 1, step: 0.01 },
  { key: "voiceMouth", label: "Voice open", min: 0, max: 3, step: 0.05 },
  { key: "blinkRate", label: "Blink rate", min: 0, max: 1, step: 0.01 },
  { key: "gaze", label: "Gaze wander", min: 0, max: 1, step: 0.01 },
];

/* Resting rotation of the head, per state. Turn/Tilt/Roll = yaw/pitch/roll. */
const ROTATION_SLIDERS: Slider[] = [
  { key: "yaw", label: "Turn (Y)", min: -0.8, max: 0.8, step: 0.01 },
  { key: "pitch", label: "Tilt (X)", min: -0.6, max: 0.6, step: 0.01 },
  { key: "lean", label: "Roll (Z)", min: -0.5, max: 0.5, step: 0.01 },
];

const POSE_SLIDERS: Slider[] = [
  { key: "bob", label: "Idle bob", min: 0, max: 1.5, step: 0.01 },
  { key: "scale", label: "Scale", min: 0.5, max: 1.4, step: 0.01 },
];

const LENS_SLIDERS: Slider[] = [
  { key: "bloom", label: "Bloom", min: 0, max: 2, step: 0.01 },
  { key: "aberration", label: "Aberration", min: 0, max: 1, step: 0.01 },
  { key: "filmGrain", label: "Film grain", min: 0, max: 1, step: 0.01 },
  { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01 },
];

/* The soft shadow / studio sweep behind the head. Colour is a ColorRow (below);
   these tune its strength, spread and edge softness. */
const SHADOW_SLIDERS: Slider[] = [
  { key: "backdrop", label: "Strength", min: 0, max: 1, step: 0.01 },
  { key: "shadowDepth", label: "Depth", min: 0.2, max: 1.5, step: 0.01 },
  { key: "shadowBlur", label: "Blur", min: 0, max: 1, step: 0.01 },
];

/* Trim trailing zeros so 0.80 → 0.8, 0.050 → 0.05 (matches the design). */
const fmt = (v: number) => parseFloat(v.toFixed(3)).toString();

/* Deep-ish clone so edits never mutate the shared DEFAULT_TV_SETTINGS constant. */
function cloneSettings(s: TvSettings): TvSettings {
  return {
    transition: s.transition,
    states: TV_STATES.reduce((acc, st) => {
      acc[st] = { ...s.states[st] };
      return acc;
    }, {} as Record<TvState, TvStateParams>),
  };
}

export function TvLab() {
  const { setMode } = useAvatarMode();
  const { play } = useSound();
  const [settings, setSettings] = useState<TvSettings>(() =>
    cloneSettings(DEFAULT_TV_SETTINGS),
  );
  const [active, setActive] = useState<TvState>("replying");
  const [copied, setCopied] = useState(false);

  const params = settings.states[active];

  // Speak the sample line while Replying so the mouth moves; loop it as long as
  // Replying stays selected. Stable ref (GOTCHA 2 in TvHead).
  const speechLevelRef = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const { speak, stop } = useTextMouth(speechLevelRef, {
    onDone: () => {
      if (activeRef.current === "replying") speak(REPLY_TEXT);
    },
  });
  useEffect(() => {
    if (active === "replying") speak(REPLY_TEXT);
    else stop();
    return stop;
  }, [active, speak, stop]);

  const setParam = (key: keyof TvStateParams, value: string | number) =>
    setSettings((s) => ({
      ...s,
      states: {
        ...s.states,
        [active]: { ...s.states[active], [key]: value },
      },
    }));

  const setTransition = (value: number) =>
    setSettings((s) => ({ ...s, transition: value }));

  const copyJson = async () => {
    const json = `export const DEFAULT_TV_SETTINGS: TvSettings = ${JSON.stringify(
      settings,
      null,
      2,
    )}`;
    try {
      await navigator.clipboard.writeText(json);
      play(CUE.copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const stateName = STATE_LABEL[active].toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-surface-2 p-3 text-sol">
      <div className="relative flex h-full w-full overflow-hidden rounded-[28px] bg-paper">
        {/* Close — back to the TV head site */}
        <button
          type="button"
          onClick={() => {
            play(CUE.leaveCase);
            setMode("face");
          }}
          aria-label="Close tuning page"
          className="absolute right-6 top-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-pill text-2xl text-sol-dim transition-colors hover:text-accent"
        >
          ✕
        </button>

        {/* State picker */}
        <div className="absolute left-6 top-1/2 z-10 -translate-y-1/2">
          <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-2 text-[15px] font-medium">
            {TV_STATES.map((st) => {
              const selected = st === active;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActive(st)}
                  aria-pressed={selected}
                  className={`rounded-xl px-6 py-2.5 text-left transition-colors ${
                    selected
                      ? "bg-[#2f6bff] text-white"
                      : "text-sol-dim hover:text-accent"
                  }`}
                >
                  {STATE_LABEL[st]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage — the live head + its caption */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="aspect-square h-[min(64vh,600px)] max-w-full">
            <TvHead
              state={active}
              settings={settings}
              speechLevelRef={speechLevelRef}
            />
          </div>
          <p className="mt-2 max-w-[560px] px-6 text-center text-[22px] leading-8 text-sol-dim">
            {active === "replying" ? REPLY_TEXT : ""}
          </p>
        </div>

        {/* Control panel */}
        <div className="m-4 flex w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl bg-surface-2">
          <div className="flex-1 overflow-y-auto p-6">
            <Section title={`Colors — ${stateName}`}>
              {COLOR_CONTROLS.map((c) => (
                <ColorRow
                  key={c.key}
                  label={c.label}
                  value={params[c.key]}
                  onChange={(v) => setParam(c.key, v)}
                />
              ))}
            </Section>

            <Section title="Transitions">
              <SliderRow
                label="Transition speed"
                min={0.01}
                max={0.2}
                step={0.005}
                value={settings.transition ?? 0.05}
                onChange={setTransition}
              />
            </Section>

            <Section title={`Screen — ${stateName}`}>
              {SCREEN_SLIDERS.map((s) => (
                <ParamSlider key={s.key} slider={s} value={params[s.key]} onChange={setParam} />
              ))}
            </Section>

            <Section title={`Face — ${stateName}`}>
              {FACE_SLIDERS.map((s) => (
                <ParamSlider key={s.key} slider={s} value={params[s.key]} onChange={setParam} />
              ))}
            </Section>

            <Section title={`Rotation — ${stateName}`}>
              {ROTATION_SLIDERS.map((s) => (
                <ParamSlider key={s.key} slider={s} value={params[s.key]} onChange={setParam} />
              ))}
            </Section>

            <Section title={`Pose — ${stateName}`}>
              {POSE_SLIDERS.map((s) => (
                <ParamSlider key={s.key} slider={s} value={params[s.key]} onChange={setParam} />
              ))}
            </Section>

            <Section title={`Shadow — ${stateName}`}>
              <ColorRow
                label="Color"
                value={params.backdropColor}
                onChange={(v) => setParam("backdropColor", v)}
              />
              {SHADOW_SLIDERS.map((s) => (
                <ParamSlider key={s.key} slider={s} value={params[s.key]} onChange={setParam} />
              ))}
            </Section>

            <Section title={`Lens & film — ${stateName}`}>
              {LENS_SLIDERS.map((s) => (
                <ParamSlider key={s.key} slider={s} value={params[s.key]} onChange={setParam} />
              ))}
            </Section>
          </div>

          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={copyJson}
              className="w-full rounded-xl bg-[#2f6bff] py-2.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {copied ? "Copied ✓" : "Copy JSON"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Panel primitives ────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-sol-dim">
        {title}
      </h3>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
          }}
          spellCheck={false}
          className="w-[68px] bg-transparent text-right font-mono text-[13px] text-sol-dim outline-none"
        />
        <label className="relative h-6 w-9 cursor-pointer overflow-hidden rounded-md border border-line">
          <span className="block h-full w-full" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[15px] font-medium">{label}</span>
        <span className="font-mono text-[13px] text-sol-dim">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-pill accent-[#2f6bff]"
      />
    </div>
  );
}

function ParamSlider({
  slider,
  value,
  onChange,
}: {
  slider: Slider;
  value: number;
  onChange: (key: keyof TvStateParams, v: number) => void;
}) {
  return (
    <SliderRow
      label={slider.label}
      min={slider.min}
      max={slider.max}
      step={slider.step}
      value={value}
      onChange={(v) => onChange(slider.key, v)}
    />
  );
}
